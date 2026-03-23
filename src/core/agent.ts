import { loadConfig, getRepoConfigs, type RepoConfig } from '../config.js'
import { cloneOrPull, createBranch, commitAndPush, discardChanges, writeRepoFile } from './git.js'
import { verifyBuild, installDeps } from './builder.js'
import { type Improvement, type ImprovementModule } from './analyzer.js'
import { notifyImprovement, notifyStatus } from './notifier.js'
import { log, saveImprovement, getHistory, type ImprovementRecord } from '../utils/logger.js'
import { getMemory, recordOutcome } from '../memory/index.js'

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

const ALL_MODULES: ImprovementModule[] = ['security', 'performance', 'seo', 'content', 'quality']

/**
 * Pick the next module to run for a project.
 * Uses memory + history to avoid repeating recent modules.
 * Learns from past failures to skip problematic modules.
 */
function pickNextModule(repo: RepoConfig): ImprovementModule {
  const enabledModules = repo.modules.filter(m =>
    ALL_MODULES.includes(m as ImprovementModule)
  ) as ImprovementModule[]

  if (enabledModules.length === 0) return 'security'

  // Check memory for module that failed too many times recently
  const memory = getMemory()
  const recentFailures = memory.getRecentFailures(repo.name, 5)
  const failedModules = new Set(recentFailures.map(f => f.module))

  // Get history of recent successes
  const history = getHistory()
  const recentSuccesses = history
    .filter(h => h.project === repo.name && h.status === 'success')
    .slice(-10)
    .map(h => h.module)

  // Prioritize: enabled + not recently failed + not recently succeeded
  for (const mod of enabledModules) {
    if (!failedModules.has(mod) && !recentSuccesses.includes(mod)) {
      return mod
    }
  }

  // All have been tried recently — pick least recently used
  for (const mod of enabledModules) {
    if (!recentSuccesses.includes(mod)) {
      return mod
    }
  }

  // Round-robin fallback
  const total = history.filter(h => h.project === repo.name).length
  return enabledModules[total % enabledModules.length]
}

/**
 * Run a single improvement cycle for a project.
 */
async function runCycle(repo: RepoConfig, module: ImprovementModule): Promise<ImprovementRecord> {
  const runId = `${repo.name}-${module}-${Date.now().toString(36)}`

  log('info', 'agent', `=== Cycle: ${repo.name} / ${module} ===`)

  try {
    // Step 1: Clone/pull
    await cloneOrPull(repo)

    // Step 2: Install deps
    await installDeps(repo)

    // Step 3: Analyze
    const runner = MODULE_RUNNERS[module]
    if (!runner) {
      log('warn', 'agent', `Unknown module: ${module}`)
      return makeRecord(runId, repo.name, module, 'skipped', 'Unknown module')
    }

    const improvement = await runner(repo)
    if (!improvement) {
      return makeRecord(runId, repo.name, module, 'skipped', 'No improvement found')
    }

    // Step 4: Create branch
    const config = loadConfig()
    const branchName = await createBranch(repo, module)

    // Step 5: Apply changes
    for (const change of improvement.changes) {
      writeRepoFile(repo, change.filePath, change.newContent)
    }

    // Step 6: Verify build
    const buildResult = await verifyBuild(repo)

    if (!buildResult.success) {
      log('warn', 'agent', `Build failed`, { errors: buildResult.errors.slice(0, 3) })
      await discardChanges(repo)

      // Record failure in memory so the agent learns
      recordOutcome({
        project: repo.name,
        module,
        success: false,
        reason: buildResult.errors[0] || 'Build failed',
        filesChanged: improvement.changes.map(c => c.filePath),
      })

      const record = makeRecord(runId, repo.name, module, 'failed',
        `${improvement.title} — BUILD FAILED: ${buildResult.errors[0] || 'Unknown'}`,
        improvement.changes.map(c => c.filePath), false, buildResult.errors.join('\n').slice(0, 500))

      saveImprovement(record)
      return record
    }

    // Step 7: Commit and push
    await commitAndPush(repo, branchName, improvement.commitMessage, improvement.changes.map(c => c.filePath))

    // Step 8: Notify
    await notifyImprovement(repo, improvement, branchName, true)

    // Record success in memory
    recordOutcome({
      project: repo.name,
      module,
      success: true,
      reason: improvement.title,
      filesChanged: improvement.changes.map(c => c.filePath),
    })

    const record = makeRecord(runId, repo.name, module, 'success',
      improvement.title, improvement.changes.map(c => c.filePath), true, undefined, branchName)

    saveImprovement(record)
    log('success', 'agent', `=== Done: ${improvement.title} ===`)
    return record

  } catch (err) {
    log('error', 'agent', `Cycle crashed: ${err}`)
    try { await discardChanges(repo) } catch { /* ignore */ }

    recordOutcome({
      project: repo.name,
      module,
      success: false,
      reason: String(err).slice(0, 200),
      filesChanged: [],
    })

    const record = makeRecord(runId, repo.name, module, 'failed',
      `Error: ${String(err).slice(0, 200)}`, [], false, String(err).slice(0, 500))
    saveImprovement(record)
    return record
  }
}

/**
 * Main agent loop — iterates over all configured projects.
 */
export async function runAgent(): Promise<void> {
  const repos = getRepoConfigs()
  const config = loadConfig()

  if (repos.length === 0) {
    log('error', 'agent', 'No projects configured. Create autodev.config.json or set AUTODEV_REPO_URL.')
    return
  }

  log('info', 'agent', `\n${'='.repeat(60)}`)
  log('info', 'agent', `${config.agent.name} starting — ${repos.length} project(s) — DryRun: ${config.agent.dryRun}`)
  log('info', 'agent', `${'='.repeat(60)}`)

  const results: ImprovementRecord[] = []

  for (const repo of repos) {
    const module = pickNextModule(repo)
    log('info', 'agent', `Project: ${repo.name} — Module: ${module}`)

    try {
      const result = await runCycle(repo, module)
      results.push(result)
    } catch (err) {
      log('error', 'agent', `${repo.name} crashed: ${err}`)
    }
  }

  const successes = results.filter(r => r.status === 'success').length
  const failures = results.filter(r => r.status === 'failed').length
  const skipped = results.filter(r => r.status === 'skipped').length

  log('info', 'agent', `Run complete: ${successes} success, ${failures} failed, ${skipped} skipped`)
}

function makeRecord(
  id: string, project: string, module: string, status: 'success' | 'failed' | 'skipped',
  summary: string, filesChanged: string[] = [], buildPassed = false, error?: string, branch = ''
): ImprovementRecord {
  return { id, timestamp: new Date().toISOString(), project, module, branch, status, summary, filesChanged, buildPassed, error }
}
