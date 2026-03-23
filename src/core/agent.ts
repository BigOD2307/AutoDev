import { loadConfig, type RepoConfig } from '../config.js'
import { cloneOrPull, createBranch, commitAndPush, discardChanges, writeRepoFile } from './git.js'
import { verifyBuild, installDeps } from './builder.js'
import { type Improvement, type ImprovementModule } from './analyzer.js'
import { notifyImprovement, notifyStatus } from './notifier.js'
import { log, saveImprovement, getHistory, type ImprovementRecord } from '../utils/logger.js'

// Module runners
import { runSEOModule } from '../modules/seo.js'
import { runContentModule } from '../modules/content.js'
import { runPerformanceModule } from '../modules/performance.js'
import { runSecurityModule } from '../modules/security.js'
import { runQualityModule } from '../modules/quality.js'

const MODULE_RUNNERS: Record<ImprovementModule, (repo: RepoConfig) => Promise<Improvement | null>> = {
  seo: runSEOModule,
  content: runContentModule,
  performance: runPerformanceModule,
  security: runSecurityModule,
  quality: runQualityModule,
}

// Rotation order for modules
const MODULE_ORDER: ImprovementModule[] = ['security', 'performance', 'seo', 'content', 'quality']

/**
 * Get the next module to run based on history.
 * Rotates through modules, prioritizing those that haven't run recently.
 */
function getNextModule(): ImprovementModule {
  const history = getHistory()
  const recentModules = history
    .filter(h => h.status === 'success')
    .slice(-10)
    .map(h => h.module)

  // Find the module that was used least recently
  for (const mod of MODULE_ORDER) {
    if (!recentModules.includes(mod)) return mod
  }

  // If all have been used recently, pick the one that was used longest ago
  for (const mod of MODULE_ORDER) {
    const lastIdx = recentModules.lastIndexOf(mod)
    if (lastIdx === -1 || lastIdx < recentModules.length - MODULE_ORDER.length) {
      return mod
    }
  }

  // Default: round-robin based on total runs
  const totalRuns = history.filter(h => h.status === 'success').length
  return MODULE_ORDER[totalRuns % MODULE_ORDER.length]
}

/**
 * Run a single improvement cycle for a repo.
 */
async function runCycle(repo: RepoConfig, module: ImprovementModule): Promise<ImprovementRecord> {
  const runId = `${repo.name}-${module}-${Date.now().toString(36)}`
  const startTime = Date.now()

  log('info', 'agent', `=== Starting cycle: ${repo.name} / ${module} ===`)

  try {
    // Step 1: Clone/pull latest
    await cloneOrPull(repo)

    // Step 2: Install deps if needed
    await installDeps(repo)

    // Step 3: Analyze and generate improvement
    const runner = MODULE_RUNNERS[module]
    const improvement = await runner(repo)

    if (!improvement) {
      log('info', 'agent', `No improvement found for ${repo.name}/${module}`)
      return {
        id: runId,
        timestamp: new Date().toISOString(),
        project: repo.name,
        module,
        branch: '',
        status: 'skipped',
        summary: 'No improvement found',
        filesChanged: [],
        buildPassed: false,
      }
    }

    // Step 4: Create branch
    const branchName = await createBranch(repo, module)

    // Step 5: Apply changes
    for (const change of improvement.changes) {
      writeRepoFile(repo, change.filePath, change.newContent)
      log('info', 'agent', `Applied change to ${change.filePath}`)
    }

    // Step 6: Verify build
    const buildResult = await verifyBuild(repo)

    if (!buildResult.success) {
      log('warn', 'agent', `Build failed after applying improvement`, {
        errors: buildResult.errors.slice(0, 5),
      })

      // Discard changes
      await discardChanges(repo)

      const record: ImprovementRecord = {
        id: runId,
        timestamp: new Date().toISOString(),
        project: repo.name,
        module,
        branch: branchName,
        status: 'failed',
        summary: `${improvement.title} — BUILD FAILED: ${buildResult.errors[0] || 'Unknown error'}`,
        filesChanged: improvement.changes.map(c => c.filePath),
        buildPassed: false,
        error: buildResult.errors.join('\n').slice(0, 500),
      }
      saveImprovement(record)

      // Notify about failure (optional — only for high impact)
      if (improvement.impact === 'high') {
        await notifyImprovement(repo, improvement, branchName, false)
      }

      return record
    }

    // Step 7: Build passed — commit and push
    await commitAndPush(
      repo,
      branchName,
      improvement.commitMessage,
      improvement.changes.map(c => c.filePath)
    )

    // Step 8: Notify via WhatsApp
    await notifyImprovement(repo, improvement, branchName, true)

    const record: ImprovementRecord = {
      id: runId,
      timestamp: new Date().toISOString(),
      project: repo.name,
      module,
      branch: branchName,
      status: 'success',
      summary: improvement.title,
      filesChanged: improvement.changes.map(c => c.filePath),
      buildPassed: true,
    }
    saveImprovement(record)

    log('success', 'agent', `=== Cycle complete: ${improvement.title} (${Date.now() - startTime}ms) ===`)
    return record

  } catch (err) {
    log('error', 'agent', `Cycle failed for ${repo.name}/${module}`, { error: String(err) })

    // Try to clean up
    try { await discardChanges(repo) } catch { /* ignore */ }

    const record: ImprovementRecord = {
      id: runId,
      timestamp: new Date().toISOString(),
      project: repo.name,
      module,
      branch: '',
      status: 'failed',
      summary: `Error: ${String(err).slice(0, 200)}`,
      filesChanged: [],
      buildPassed: false,
      error: String(err).slice(0, 500),
    }
    saveImprovement(record)
    return record
  }
}

/**
 * Main agent loop — runs one full improvement cycle.
 * Called by the cron scheduler in index.ts.
 */
export async function runAgent(): Promise<void> {
  const config = loadConfig()
  const module = getNextModule()

  log('info', 'agent', `\n${'='.repeat(60)}`)
  log('info', 'agent', `AutoDev Agent starting — Module: ${module} — DryRun: ${config.dryRun}`)
  log('info', 'agent', `${'='.repeat(60)}`)

  const results: ImprovementRecord[] = []

  // Run for ZeroName (primary target)
  try {
    const znRepo = config.repos.zeroname
    if (znRepo) {
      const result = await runCycle(znRepo, module)
      results.push(result)
    }
  } catch (err) {
    log('error', 'agent', `ZeroName cycle crashed`, { error: String(err) })
  }

  // Run for InsideAI (secondary — only quality and security modules)
  try {
    const iaRepo = config.repos.insideai
    if (iaRepo && (module === 'quality' || module === 'security')) {
      const result = await runCycle(iaRepo, module)
      results.push(result)
    }
  } catch (err) {
    log('error', 'agent', `InsideAI cycle crashed`, { error: String(err) })
  }

  // Summary
  const successes = results.filter(r => r.status === 'success').length
  const failures = results.filter(r => r.status === 'failed').length
  const skipped = results.filter(r => r.status === 'skipped').length

  log('info', 'agent', `Run complete: ${successes} success, ${failures} failed, ${skipped} skipped`)
}
