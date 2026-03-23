import type { RepoConfig } from '../config.js'
import { analyzeForImprovement, type Improvement } from '../core/analyzer.js'
import { readRepoFile, listRepoFiles } from '../core/git.js'
import { log } from '../utils/logger.js'

interface PerfIssue { file: string; type: string; detail: string }

export async function runPerformanceModule(repo: RepoConfig): Promise<Improvement | null> {
  log('info', 'perf', `Starting performance analysis for ${repo.name}`)

  const issues = await quickPerfScan(repo)
  if (issues.length > 0) {
    log('info', 'perf', `Found ${issues.length} potential issues`, issues.slice(0, 5))
  }

  return analyzeForImprovement(repo, 'performance')
}

async function quickPerfScan(repo: RepoConfig): Promise<PerfIssue[]> {
  const issues: PerfIssue[] = []
  try {
    const patterns = ['**/*.tsx', '**/*.jsx', '**/*.vue', '**/*.svelte']
    let allFiles: string[] = []
    for (const pat of patterns) {
      allFiles = allFiles.concat(await listRepoFiles(repo, pat))
    }

    for (const file of allFiles.slice(0, 40)) {
      const content = readRepoFile(repo, file)
      if (!content) continue

      if (content.includes('<img ') && !content.includes('next/image') && !content.includes('Image')) {
        issues.push({ file, type: 'no-optimized-image', detail: 'Uses raw <img> tag' })
      }
      if ((content.includes("from 'framer-motion'") || content.includes('from "framer-motion"')) && !content.includes('dynamic(')) {
        issues.push({ file, type: 'heavy-import', detail: 'framer-motion imported statically' })
      }
      if (content.includes('dynamic(') && !content.includes('Suspense') && !content.includes('loading:')) {
        issues.push({ file, type: 'missing-loading', detail: 'Dynamic import without loading state' })
      }
    }

    const apiFiles = await listRepoFiles(repo, '**/api/**/route.ts')
    for (const file of apiFiles.slice(0, 20)) {
      const content = readRepoFile(repo, file)
      if (!content) continue
      const awaitCount = (content.match(/await\s+/g) || []).length
      if (awaitCount > 5 && !content.includes('Promise.all')) {
        issues.push({ file, type: 'sequential-awaits', detail: `${awaitCount} sequential awaits` })
      }
    }
  } catch { /* ignore */ }
  return issues
}
