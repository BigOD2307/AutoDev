import type { RepoConfig } from '../config.js'
import { analyzeForImprovement, type Improvement } from '../core/analyzer.js'
import { readRepoFile } from '../core/git.js'
import { log } from '../utils/logger.js'

export async function runSEOModule(repo: RepoConfig): Promise<Improvement | null> {
  log('info', 'seo', `Starting SEO analysis for ${repo.name}`)

  const project = repo.project
  const layout = project.paths.pages ? readRepoFile(repo, `${project.paths.pages}layout.tsx`) : null
  const missing: string[] = []

  if (layout) {
    if (!layout.includes('application/ld+json') && !layout.includes('jsonLd')) missing.push('JSON-LD')
    if (!layout.includes('hreflang')) missing.push('hreflang')
  }

  const hasSitemap = readRepoFile(repo, 'app/sitemap.ts') !== null ||
                     readRepoFile(repo, 'public/sitemap.xml') !== null
  const hasRobots = readRepoFile(repo, 'app/robots.ts') !== null ||
                    readRepoFile(repo, 'public/robots.txt') !== null

  if (!hasSitemap) missing.push('sitemap')
  if (!hasRobots) missing.push('robots.txt')

  if (missing.length > 0) log('info', 'seo', `Missing: ${missing.join(', ')}`)

  return analyzeForImprovement(repo, 'seo')
}
