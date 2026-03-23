import type { RepoConfig } from '../config.js'
import { analyzeForImprovement, type Improvement } from '../core/analyzer.js'
import { readRepoFile } from '../core/git.js'
import { webSearch } from '../utils/llm.js'
import { log } from '../utils/logger.js'

export async function runContentModule(repo: RepoConfig): Promise<Improvement | null> {
  log('info', 'content', `Starting content generation for ${repo.name}`)

  const project = repo.project
  if (!project.content.enabled || !project.content.blogFile) {
    log('info', 'content', 'Content generation not configured — skipping')
    return null
  }

  const blogFile = readRepoFile(repo, project.content.blogFile)
  if (!blogFile) {
    log('warn', 'content', `Blog file ${project.content.blogFile} not found`)
    return null
  }

  const existingSlugs = [...blogFile.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map(m => m[1])
  log('info', 'content', `Found ${existingSlugs.length} existing articles`)

  // Pick a topic from configured topics that hasn't been covered
  const availableTopics = project.content.topics.filter(t =>
    !existingSlugs.some(s => s.includes(t.split('-').slice(0, 3).join('-')))
  )

  if (availableTopics.length > 0) {
    const topic = availableTopics[0]
    const query = topic.replace(/-/g, ' ')
    const results = await webSearch(query, 5)
    if (results.length > 0) {
      log('info', 'content', `Web research: ${results.length} results for "${query}"`)
    }
  }

  return analyzeForImprovement(repo, 'content')
}
