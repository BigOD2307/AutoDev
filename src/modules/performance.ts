import type { RepoConfig } from '../config.js'
import { analyzeForImprovement, type Improvement } from '../core/analyzer.js'
import { readRepoFile, listRepoFiles } from '../core/git.js'
import { log } from '../utils/logger.js'

/**
 * Performance improvement module.
 *
 * Targets:
 * - Dynamic imports / lazy loading for heavy components
 * - next/image usage instead of <img>
 * - Bundle size reduction (tree-shaking)
 * - API route optimization (parallel requests, caching)
 * - Unnecessary re-renders
 * - Heavy dependencies that could be replaced
 */

interface PerfIssue {
  file: string
  type: string
  detail: string
}

export async function runPerformanceModule(repo: RepoConfig): Promise<Improvement | null> {
  log('info', 'performance', `Starting performance analysis for ${repo.name}`)

  // Quick scan for common performance anti-patterns
  const issues = await quickPerfScan(repo)
  if (issues.length > 0) {
    log('info', 'performance', `Found ${issues.length} potential perf issues`, issues.slice(0, 5))
  }

  return analyzeForImprovement(repo, 'performance')
}

async function quickPerfScan(repo: RepoConfig): Promise<PerfIssue[]> {
  const issues: PerfIssue[] = []

  try {
    const tsxFiles = await listRepoFiles(repo, 'app/**/*.tsx')
    const componentFiles = await listRepoFiles(repo, 'components/**/*.tsx')
    const allFiles = [...tsxFiles, ...componentFiles]

    for (const file of allFiles.slice(0, 30)) { // Limit scan
      const content = readRepoFile(repo, file)
      if (!content) continue

      // Check for <img> without next/image
      if (content.includes('<img ') && !content.includes('next/image')) {
        issues.push({ file, type: 'no-next-image', detail: 'Uses <img> instead of next/image' })
      }

      // Check for heavy imports that could be dynamic
      if (content.includes("import { motion") || content.includes("from 'framer-motion'")) {
        if (!content.includes('dynamic(') && !content.includes("import('")) {
          issues.push({ file, type: 'heavy-import', detail: 'framer-motion imported statically' })
        }
      }

      // Check for large icon library imports
      if (content.match(/import\s*\{[^}]{200,}\}\s*from\s*['"]lucide-react['"]/)) {
        issues.push({ file, type: 'large-import', detail: 'Many icons imported from lucide-react' })
      }

      // Check for missing Suspense on dynamic imports
      if (content.includes('dynamic(') && !content.includes('Suspense') && !content.includes('loading:')) {
        issues.push({ file, type: 'missing-suspense', detail: 'Dynamic import without loading state' })
      }
    }

    // Check API routes for sequential awaits that could be parallel
    const apiFiles = await listRepoFiles(repo, 'app/api/**/route.ts')
    for (const file of apiFiles.slice(0, 15)) {
      const content = readRepoFile(repo, file)
      if (!content) continue

      const awaitCount = (content.match(/await\s+/g) || []).length
      if (awaitCount > 5 && !content.includes('Promise.all')) {
        issues.push({ file, type: 'sequential-awaits', detail: `${awaitCount} sequential awaits, consider Promise.all` })
      }
    }
  } catch (err) {
    log('warn', 'performance', 'Quick scan failed', { error: String(err) })
  }

  return issues
}
