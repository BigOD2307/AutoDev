/**
 * Smart LLM Router — picks the best cheap model on OpenRouter for each task.
 *
 * Strategy:
 * - Categorize the task (code, analysis, content, evaluation)
 * - Select the best model for that category based on quality/cost ratio
 * - Fallback cascade: if primary fails, try next model
 * - Track success/failure per model to learn over time
 */

import { log } from './logger.js'

export type TaskType = 'code' | 'analysis' | 'content' | 'evaluation' | 'general'

export interface ModelConfig {
  id: string
  name: string
  /** Cost per 1M input tokens (USD) */
  costIn: number
  /** Cost per 1M output tokens (USD) */
  costOut: number
  /** Max context window */
  contextWindow: number
  /** What this model excels at */
  strengths: TaskType[]
  /** Quality score 0-100 (subjective, based on benchmarks) */
  quality: number
  /** Speed: fast, medium, slow */
  speed: 'fast' | 'medium' | 'slow'
}

/**
 * Top 10 best cheap models on OpenRouter (March 2026).
 * Sorted by quality/cost ratio for code and analysis tasks.
 */
export const MODELS: ModelConfig[] = [
  {
    id: 'deepseek/deepseek-v3.2',
    name: 'DeepSeek V3.2',
    costIn: 0.14,
    costOut: 0.28,
    contextWindow: 128000,
    strengths: ['code', 'analysis', 'general'],
    quality: 92,
    speed: 'fast',
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    costIn: 0.55,
    costOut: 2.19,
    contextWindow: 128000,
    strengths: ['analysis', 'code', 'evaluation'],
    quality: 95,
    speed: 'slow',
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    costIn: 0.15,
    costOut: 0.60,
    contextWindow: 1000000,
    strengths: ['analysis', 'content', 'general'],
    quality: 88,
    speed: 'fast',
  },
  {
    id: 'minimax/minimax-m1',
    name: 'MiniMax M1',
    costIn: 0.20,
    costOut: 1.10,
    contextWindow: 1000000,
    strengths: ['code', 'analysis', 'content'],
    quality: 87,
    speed: 'medium',
  },
  {
    id: 'qwen/qwen3-235b-a22b',
    name: 'Qwen 3 235B',
    costIn: 0.14,
    costOut: 0.30,
    contextWindow: 128000,
    strengths: ['code', 'analysis', 'general'],
    quality: 90,
    speed: 'medium',
  },
  {
    id: 'meta-llama/llama-4-maverick',
    name: 'Llama 4 Maverick',
    costIn: 0.20,
    costOut: 0.60,
    contextWindow: 128000,
    strengths: ['code', 'general', 'content'],
    quality: 85,
    speed: 'fast',
  },
  {
    id: 'mistralai/mistral-medium-3',
    name: 'Mistral Medium 3',
    costIn: 0.40,
    costOut: 2.00,
    contextWindow: 128000,
    strengths: ['code', 'analysis', 'content'],
    quality: 88,
    speed: 'medium',
  },
  {
    id: 'anthropic/claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    costIn: 0.80,
    costOut: 4.00,
    contextWindow: 200000,
    strengths: ['code', 'analysis', 'evaluation'],
    quality: 91,
    speed: 'fast',
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    costIn: 1.25,
    costOut: 10.00,
    contextWindow: 1000000,
    strengths: ['analysis', 'evaluation', 'content'],
    quality: 94,
    speed: 'slow',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    costIn: 0.15,
    costOut: 0.60,
    contextWindow: 128000,
    strengths: ['general', 'evaluation', 'content'],
    quality: 83,
    speed: 'fast',
  },
]

// Track model performance across runs
interface ModelStats {
  attempts: number
  successes: number
  failures: number
  avgLatencyMs: number
  lastUsed: number
}

const modelStats = new Map<string, ModelStats>()

/**
 * Pick the best model for a task type.
 *
 * Algorithm:
 * 1. Filter models that have the task type in their strengths
 * 2. Score each model: quality * (1 / cost) * successRate * speedBonus
 * 3. Return top model + 2 fallbacks
 *
 * Prioritizes:
 * - Quality/cost ratio (we want cheap but good)
 * - Past success rate (avoid models that keep failing)
 * - Speed for evaluation tasks (fast feedback loop)
 */
export function pickModels(taskType: TaskType, maxCostPer1MOutput = 5.0): string[] {
  const candidates = MODELS
    .filter(m => m.strengths.includes(taskType) || m.strengths.includes('general'))
    .filter(m => m.costOut <= maxCostPer1MOutput)

  const scored = candidates.map(m => {
    const stats = modelStats.get(m.id)
    const successRate = stats ? (stats.successes / Math.max(stats.attempts, 1)) : 0.8 // default 80%
    const speedBonus = m.speed === 'fast' ? 1.3 : m.speed === 'medium' ? 1.0 : 0.7
    const costEfficiency = 1 / (m.costOut + 0.01) // avoid div by zero
    const strengthMatch = m.strengths.includes(taskType) ? 1.5 : 1.0

    const score = m.quality * costEfficiency * successRate * speedBonus * strengthMatch
    return { model: m, score }
  })

  scored.sort((a, b) => b.score - a.score)

  const selected = scored.slice(0, 3).map(s => s.model.id)

  log('debug', 'router', `Task: ${taskType} → Models: ${selected.join(', ')}`, {
    scores: scored.slice(0, 5).map(s => ({ model: s.model.name, score: Math.round(s.score) })),
  })

  return selected
}

/**
 * Record a model call result for future routing decisions.
 */
export function recordModelResult(modelId: string, success: boolean, latencyMs: number): void {
  const existing = modelStats.get(modelId) || {
    attempts: 0,
    successes: 0,
    failures: 0,
    avgLatencyMs: 0,
    lastUsed: 0,
  }

  existing.attempts++
  if (success) existing.successes++
  else existing.failures++
  existing.avgLatencyMs = (existing.avgLatencyMs * (existing.attempts - 1) + latencyMs) / existing.attempts
  existing.lastUsed = Date.now()

  modelStats.set(modelId, existing)
}

/**
 * Get the task type from the improvement module name.
 */
export function moduleToTaskType(module: string): TaskType {
  switch (module) {
    case 'security':
    case 'performance':
      return 'code'
    case 'seo':
      return 'analysis'
    case 'content':
      return 'content'
    case 'quality':
      return 'evaluation'
    default:
      return 'general'
  }
}

/**
 * Estimate cost for a call (in USD).
 */
export function estimateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const model = MODELS.find(m => m.id === modelId)
  if (!model) return 0
  return (inputTokens / 1_000_000) * model.costIn + (outputTokens / 1_000_000) * model.costOut
}
