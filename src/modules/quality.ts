import type { RepoConfig } from '../config.js'
import { analyzeForImprovement, type Improvement } from '../core/analyzer.js'
import { readRepoFile } from '../core/git.js'
import { chat } from '../utils/llm.js'
import { log } from '../utils/logger.js'
import type { TaskType } from '../utils/router.js'

export async function runQualityModule(repo: RepoConfig): Promise<Improvement | null> {
  log('info', 'quality', `Starting prompt quality analysis for ${repo.name}`)

  // Find system prompts in key files
  for (const keyFile of repo.keyFiles) {
    const content = readRepoFile(repo, keyFile)
    if (!content) continue

    // Detect system prompts (common patterns)
    const promptPatterns = [
      /(?:const|let|var)\s+(?:SYSTEM_PROMPT|systemPrompt|PROMPT)\s*=\s*`([\s\S]{200,}?)`/,
      /system:\s*`([\s\S]{200,}?)`/,
      /role:\s*['"]system['"],?\s*content:\s*`([\s\S]{200,}?)`/,
    ]

    for (const pattern of promptPatterns) {
      const match = content.match(pattern)
      if (match) {
        log('info', 'quality', `Found system prompt in ${keyFile} (${match[1].length} chars)`)

        const evaluation = await evaluatePrompt(match[1], keyFile)
        if (evaluation) {
          log('info', 'quality', `Prompt score: ${evaluation.overall}/100`, {
            clarity: evaluation.clarity,
            weaknesses: evaluation.weaknesses.slice(0, 3),
          })
        }
        break
      }
    }
  }

  return analyzeForImprovement(repo, 'quality')
}

interface PromptEvaluation {
  clarity: number; completeness: number; actionability: number
  consistency: number; overall: number
  weaknesses: string[]; suggestions: string[]
}

async function evaluatePrompt(prompt: string, source: string): Promise<PromptEvaluation | null> {
  try {
    const response = await chat([
      { role: 'system', content: 'You are a prompt engineering expert. Evaluate this prompt on 5 criteria (0-100). Return JSON: { clarity, completeness, actionability, consistency, overall, weaknesses: [], suggestions: [] }' },
      { role: 'user', content: `Evaluate this system prompt from ${source}:\n\n---\n${prompt.slice(0, 8000)}\n---` },
    ], { jsonMode: true, maxTokens: 2000, taskType: 'evaluation' as TaskType })

    return JSON.parse(response.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim())
  } catch { return null }
}
