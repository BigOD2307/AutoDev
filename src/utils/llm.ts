import { loadConfig } from '../config.js'
import { log } from './logger.js'
import { pickModels, recordModelResult, type TaskType } from './router.js'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  jsonMode?: boolean
  /** Task type for smart routing — if set, overrides model selection */
  taskType?: TaskType
}

// ─── LLM Interaction Tracking ────────────────────────────────

export interface LLMInteraction {
  id: string
  timestamp: string
  model: string
  taskType: TaskType | 'unknown'
  promptSummary: string
  responseSummary: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costUSD: number
  latencyMs: number
  success: boolean
  error?: string
  fallbacksUsed: number
}

const interactionBuffer: LLMInteraction[] = []
const MAX_INTERACTIONS = 200

/** Listeners for real-time interaction events */
type InteractionListener = (interaction: LLMInteraction) => void
const interactionListeners: Set<InteractionListener> = new Set()

export function onInteraction(listener: InteractionListener): () => void {
  interactionListeners.add(listener)
  return () => { interactionListeners.delete(listener) }
}

function emitInteraction(interaction: LLMInteraction): void {
  interactionBuffer.push(interaction)
  if (interactionBuffer.length > MAX_INTERACTIONS) interactionBuffer.splice(0, interactionBuffer.length - MAX_INTERACTIONS)
  for (const listener of interactionListeners) {
    try { listener(interaction) } catch { /* ignore */ }
  }
}

export function getInteractions(limit = 50): LLMInteraction[] {
  return interactionBuffer.slice(-limit)
}

function summarizePrompt(messages: LLMMessage[]): string {
  const sys = messages.find(m => m.role === 'system')
  const user = messages.find(m => m.role === 'user')
  const sysSummary = sys ? sys.content.slice(0, 120).replace(/\n/g, ' ') : ''
  const userSummary = user ? user.content.slice(0, 80).replace(/\n/g, ' ') : ''
  return `[system] ${sysSummary}... [user] ${userSummary}...`
}

/**
 * Smart LLM client with automatic model routing.
 *
 * If taskType is provided, the router picks the best model.
 * If model is provided explicitly, uses that model.
 * Falls back through up to 3 models if one fails.
 */
export async function chat(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<string> {
  const config = loadConfig()

  if (!config.llm.apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured')
  }

  // Determine which models to try
  let modelsToTry: string[]

  if (options.model) {
    // Explicit model — use it with DeepSeek V3.2 as fallback
    modelsToTry = [options.model, 'deepseek/deepseek-v3.2']
  } else if (options.taskType) {
    // Smart routing — pick best models for this task type
    modelsToTry = pickModels(options.taskType)
  } else {
    // Default cascade: DeepSeek V3.2 → Qwen 3 → Gemini Flash
    modelsToTry = ['deepseek/deepseek-v3.2', 'qwen/qwen3-235b-a22b', 'google/gemini-2.5-flash']
  }

  // Deduplicate
  modelsToTry = [...new Set(modelsToTry)]

  // Try each model in order
  let lastError: Error | null = null
  const interactionId = `llm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  const globalStart = Date.now()

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i]
    const start = Date.now()

    try {
      const { content: result, usage } = await callOpenRouter(messages, model, config.llm.apiKey, options)
      const latencyMs = Date.now() - start
      recordModelResult(model, true, latencyMs)

      if (i > 0) {
        log('info', 'llm', `Succeeded with fallback model ${model} (attempt ${i + 1})`)
      }

      // Track interaction
      const { estimateCost } = await import('./router.js')
      emitInteraction({
        id: interactionId,
        timestamp: new Date().toISOString(),
        model,
        taskType: options.taskType || 'unknown',
        promptSummary: summarizePrompt(messages),
        responseSummary: result.slice(0, 200).replace(/\n/g, ' '),
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
        costUSD: estimateCost(model, usage.inputTokens, usage.outputTokens),
        latencyMs,
        success: true,
        fallbacksUsed: i,
      })

      return result
    } catch (err) {
      lastError = err as Error
      recordModelResult(model, false, Date.now() - start)
      log('warn', 'llm', `Model ${model} failed (attempt ${i + 1}/${modelsToTry.length})`, {
        error: String(err).slice(0, 200),
      })
    }
  }

  // Track failed interaction
  emitInteraction({
    id: interactionId,
    timestamp: new Date().toISOString(),
    model: modelsToTry[0] || 'unknown',
    taskType: options.taskType || 'unknown',
    promptSummary: summarizePrompt(messages),
    responseSummary: '',
    inputTokens: 0, outputTokens: 0, totalTokens: 0, costUSD: 0,
    latencyMs: Date.now() - globalStart,
    success: false,
    error: String(lastError).slice(0, 200),
    fallbacksUsed: modelsToTry.length - 1,
  })

  throw lastError || new Error('All models failed')
}

interface CallResult {
  content: string
  usage: { inputTokens: number; outputTokens: number; totalTokens: number }
}

async function callOpenRouter(
  messages: LLMMessage[],
  model: string,
  apiKey: string,
  options: LLMOptions
): Promise<CallResult> {
  const controller = new AbortController()
  const timeoutMs = model.includes('deepseek') ? 600_000 : 300_000 // 10min for DeepSeek, 5min others
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.AUTODEV_URL || 'https://github.com/autodev-agent',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 16000,
        ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: controller.signal,
    })

    const text = await res.text()
    if (!res.ok) throw new Error(`OpenRouter ${res.status} [${model}]: ${text.slice(0, 300)}`)

    const data = JSON.parse(text)
    let content = data?.choices?.[0]?.message?.content
    if (!content) throw new Error(`OpenRouter [${model}]: empty response`)

    // Handle array content (some models return [{type:'text', text:'...'}])
    if (Array.isArray(content)) {
      content = content
        .filter((p: { type?: string; text?: string }) => p?.type === 'text' && typeof p.text === 'string')
        .map((p: { text: string }) => p.text)
        .join('')
    }

    if (typeof content !== 'string') content = JSON.stringify(content)
    content = content.trim()

    // Validate: if response is too short or looks like a header, reject it
    if (content.length < 50 || /^(encoding|charset|content-type)/i.test(content)) {
      throw new Error(`OpenRouter [${model}]: invalid response (${content.length} chars): "${content.slice(0, 100)}"`)
    }

    const usage = {
      inputTokens: data?.usage?.prompt_tokens || 0,
      outputTokens: data?.usage?.completion_tokens || 0,
      totalTokens: data?.usage?.total_tokens || 0,
    }
    log('debug', 'llm', `✓ ${model} — ${usage.totalTokens} tokens, ${content.length} chars`)

    return { content, usage }
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Shortcut: ask the LLM a question and get a JSON response.
 */
export async function chatJSON<T = unknown>(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<T> {
  const raw = await chat(messages, { ...options, jsonMode: true }) as string
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(cleaned) as T
}

// ─── TinyFish Web Search ───────────────────────────────────────

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

/**
 * Search the web using TinyFish API.
 * Useful for content research, SEO keyword analysis, and trend checking.
 */
export async function webSearch(query: string, maxResults = 5): Promise<SearchResult[]> {
  const apiKey = process.env.TINYFISH_API_KEY
  if (!apiKey) {
    log('warn', 'llm', 'TINYFISH_API_KEY not configured — skipping web search')
    return []
  }

  try {
    const res = await fetch('https://api.tinyfish.io/v1/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        max_results: maxResults,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      log('warn', 'llm', `TinyFish search failed: ${res.status}`, { body: text.slice(0, 200) })
      return []
    }

    const data = await res.json() as { results?: SearchResult[] }
    const results = data.results || []

    log('debug', 'llm', `TinyFish: ${results.length} results for "${query}"`)
    return results.slice(0, maxResults)
  } catch (err) {
    log('warn', 'llm', 'TinyFish search error', { error: String(err) })
    return []
  }
}
