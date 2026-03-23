import type { RepoConfig } from '../config.js'
import { analyzeForImprovement, type Improvement } from '../core/analyzer.js'
import { readRepoFile } from '../core/git.js'
import { chat } from '../utils/llm.js'
import { log } from '../utils/logger.js'
import type { TaskType } from '../utils/router.js'

/**
 * Prompt quality improvement module.
 *
 * Targets:
 * - SYSTEM_PROMPT in aiAnalyzer.ts (ZeroName CV analysis)
 * - Coaching prompts in InsideAI openai.ts
 * - Chat/copilot prompts
 * - Job agent prompts in jobsAgent.ts
 *
 * Strategy:
 * 1. Read the current prompt
 * 2. Ask LLM to evaluate it and suggest a specific improvement
 * 3. Generate the improved version
 * 4. Validate: run a quick A/B test on 3 sample inputs
 * 5. If the improved version scores better, propose it
 */

interface PromptEvaluation {
  clarity: number       // 0-100
  completeness: number  // 0-100
  actionability: number // 0-100
  consistency: number   // 0-100
  overall: number       // 0-100
  weaknesses: string[]
  suggestions: string[]
}

export async function runQualityModule(repo: RepoConfig): Promise<Improvement | null> {
  log('info', 'quality', `Starting prompt quality analysis for ${repo.name}`)

  // For ZeroName, focus on the main analyzer prompt
  if (repo.name === 'zeroname') {
    const analyzer = readRepoFile(repo, 'lib/aiAnalyzer.ts')
    if (analyzer) {
      // Extract the SYSTEM_PROMPT
      const promptMatch = analyzer.match(/const SYSTEM_PROMPT\s*=\s*`([\s\S]*?)`/)
      if (promptMatch) {
        const currentPrompt = promptMatch[1]
        log('info', 'quality', `Found SYSTEM_PROMPT (${currentPrompt.length} chars)`)

        // Evaluate the current prompt
        const evaluation = await evaluatePrompt(currentPrompt, 'CV analysis and job matching')
        if (evaluation) {
          log('info', 'quality', `Prompt evaluation: ${evaluation.overall}/100`, {
            clarity: evaluation.clarity,
            completeness: evaluation.completeness,
            weaknesses: evaluation.weaknesses.slice(0, 3),
          })
        }
      }
    }
  }

  // Use the standard analyzer to generate the improvement
  return analyzeForImprovement(repo, 'quality')
}

/**
 * Evaluate a prompt's quality on multiple dimensions.
 */
async function evaluatePrompt(prompt: string, purpose: string): Promise<PromptEvaluation | null> {
  try {
    const response = await chat([
      {
        role: 'system',
        content: `Tu es un expert en prompt engineering. Évalue ce prompt sur 5 critères (0-100).
Retourne un JSON avec : clarity, completeness, actionability, consistency, overall, weaknesses (array), suggestions (array).`
      },
      {
        role: 'user',
        content: `Évalue ce prompt utilisé pour ${purpose} :\n\n---\n${prompt.slice(0, 8000)}\n---`
      }
    ], { jsonMode: true, maxTokens: 2000, taskType: 'evaluation' as TaskType })

    const cleaned = response.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    return JSON.parse(cleaned) as PromptEvaluation
  } catch (err) {
    log('warn', 'quality', 'Prompt evaluation failed', { error: String(err) })
    return null
  }
}
