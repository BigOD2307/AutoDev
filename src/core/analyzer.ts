import { type RepoConfig } from '../config.js'
import { readRepoFile, listRepoFiles } from './git.js'
import { chatJSON } from '../utils/llm.js'
import { log } from '../utils/logger.js'
import { moduleToTaskType } from '../utils/router.js'
import { getMemory } from '../memory/index.js'

export type ImprovementModule = 'seo' | 'content' | 'performance' | 'security' | 'quality'

export interface FileChange {
  filePath: string
  oldContent: string
  newContent: string
}

export interface Improvement {
  module: ImprovementModule
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  changes: FileChange[]
  commitMessage: string
}

/**
 * Module prompts are intentionally generic — they work for ANY project.
 * The LLM adapts based on the code context it receives.
 */
const MODULE_PROMPTS: Record<ImprovementModule, string> = {
  seo: `You are an expert SEO engineer. Analyze the code and propose ONE concrete SEO improvement.
Focus on: meta tags, Open Graph, JSON-LD structured data, generateMetadata(), alt tags, sitemap, canonical URLs, hreflang.
DO NOT touch business logic — only SEO.`,

  content: `You are an expert content strategist and writer.
Generate ONE complete blog article (~1500 words) optimized for SEO.
The article must be added to the blog system found in the codebase.
Match the EXACT format of existing blog entries. Content should be useful, concrete, and relevant to the project's audience.
Write in the same language as the existing content.`,

  performance: `You are an expert web performance engineer. Analyze the code and propose ONE performance improvement.
Focus on: dynamic imports (lazy loading), image optimization, bundle reduction, caching, parallel API calls, tree-shaking.
DO NOT break functionality. The improvement must be safe.`,

  security: `You are an expert web security engineer. Analyze the code and propose ONE security improvement.
Focus on: input validation (zod), rate limiting, CSP headers, XSS/CSRF protection, auth checks, API key exposure, dependency vulnerabilities.
DO NOT break functionality. The improvement must be safe and backward-compatible.`,

  quality: `You are an expert in AI and prompt engineering. Analyze the system prompts and propose ONE improvement.
Focus on: clarity, structure, examples, format instructions, edge cases, language consistency.
DO NOT change business logic or output format. Only improve prompt quality.`,
}

/**
 * Analyze a repo for improvements in a specific module.
 * Injects memory context so the LLM learns from past mistakes.
 */
export async function analyzeForImprovement(
  repo: RepoConfig,
  module: ImprovementModule
): Promise<Improvement | null> {
  log('info', 'analyzer', `Analyzing ${repo.name} for ${module} improvements`)

  const context = await buildContext(repo, module)
  if (!context) {
    log('warn', 'analyzer', `No context available for ${repo.name}/${module}`)
    return null
  }

  // Inject memory: past errors, fragile files, successful strategies
  const memory = getMemory()
  const memoryContext = memory.getContextForLLM(repo.name, module)

  const systemPrompt = `${MODULE_PROMPTS[module]}

## PROJECT INFO
- Name: ${repo.name}
- Framework: ${repo.framework}
- Build command: ${repo.buildCmd}

${memoryContext ? `## AGENT MEMORY (learn from past runs)\n${memoryContext}\n` : ''}
## CRITICAL RULES
1. Return VALID JSON only, nothing else
2. Each change must include the COMPLETE file content (no "..." or truncation)
3. DO NOT create new files unless the module is 'content'
4. Changes must be MINIMAL and TARGETED — one improvement at a time
5. Modified code MUST compile and pass the build
6. IMPORTANT: this code is in PRODUCTION — do NOT break anything
${memory.getFragileFiles(repo.name).length > 0
    ? `7. FRAGILE FILES — be extra careful with: ${memory.getFragileFiles(repo.name).join(', ')}\n` : ''}
## RESPONSE FORMAT (JSON)
{
  "title": "Short improvement title",
  "description": "What was improved and why",
  "impact": "low|medium|high",
  "changes": [
    {
      "filePath": "relative/path/to/file.ts",
      "newContent": "COMPLETE FILE CONTENT"
    }
  ],
  "commitMessage": "type(scope): short description"
}

If you find NO valid improvement, return: { "skip": true, "reason": "..." }`

  const userPrompt = `Here is the source code of ${repo.name}:\n\n${context}`

  try {
    const result = await chatJSON<{
      skip?: boolean; reason?: string; title?: string; description?: string
      impact?: string; changes?: { filePath: string; newContent: string }[]
      commitMessage?: string
    }>([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { maxTokens: 16000, temperature: 0.4, taskType: moduleToTaskType(module) })

    if (result.skip) {
      log('info', 'analyzer', `No improvement found: ${result.reason}`)
      return null
    }

    if (!result.title || !result.changes || result.changes.length === 0) {
      log('warn', 'analyzer', `Invalid LLM response`, result)
      return null
    }

    const changes: FileChange[] = result.changes.map(change => ({
      filePath: change.filePath,
      oldContent: readRepoFile(repo, change.filePath) || '',
      newContent: change.newContent,
    }))

    const config = await import('../config.js').then(m => m.loadConfig())
    const improvement: Improvement = {
      module,
      title: result.title,
      description: result.description || '',
      impact: (result.impact as 'low' | 'medium' | 'high') || 'medium',
      changes,
      commitMessage: result.commitMessage || `${config.git.commitPrefix}(${module}): ${result.title}`,
    }

    log('success', 'analyzer', `Found: ${improvement.title}`, {
      files: changes.map(c => c.filePath), impact: improvement.impact,
    })
    return improvement
  } catch (err) {
    log('error', 'analyzer', `LLM analysis failed`, { error: String(err) })
    return null
  }
}

async function buildContext(repo: RepoConfig, module: ImprovementModule): Promise<string | null> {
  const parts: string[] = []
  let totalChars = 0
  const MAX_CHARS = 80_000

  // Get target files based on module + project config
  const targetFiles = getTargetFiles(repo, module)

  for (const filePath of targetFiles) {
    if (totalChars > MAX_CHARS) break
    const content = readRepoFile(repo, filePath)
    if (!content) continue
    const block = `\n--- FILE: ${filePath} ---\n${content}\n--- END: ${filePath} ---\n`
    parts.push(block)
    totalChars += block.length
  }

  if (parts.length === 0) return null

  try {
    const allFiles = await listRepoFiles(repo, '**/*.{ts,tsx,js,jsx,py,dart,vue,svelte}')
    parts.unshift(`\n--- PROJECT FILE TREE (${allFiles.length} files) ---\n${allFiles.slice(0, 100).join('\n')}\n`)
  } catch { /* ignore */ }

  return parts.join('\n')
}

/**
 * Dynamically determine target files based on module + project structure.
 */
function getTargetFiles(repo: RepoConfig, module: ImprovementModule): string[] {
  const base = [...repo.keyFiles]
  const project = repo.project

  // Add module-specific files based on project's configured paths
  const paths = project.paths

  switch (module) {
    case 'seo':
      if (paths.pages) base.push(`${paths.pages}layout.tsx`, `${paths.pages}page.tsx`)
      if (paths.config) base.push(paths.config)
      break
    case 'content':
      if (project.content.blogFile) base.push(project.content.blogFile)
      break
    case 'performance':
      if (paths.pages) base.push(`${paths.pages}layout.tsx`, `${paths.pages}page.tsx`)
      if (paths.config) base.push(paths.config)
      break
    case 'security':
      if (paths.api) base.push('middleware.ts', 'middleware.js')
      if (paths.config) base.push(paths.config)
      break
    case 'quality':
      // Key files are usually enough for quality analysis
      break
  }

  return [...new Set(base)]
}
