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

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i]
    const start = Date.now()

    try {
      const result = await callOpenRouter(messages, model, config.llm.apiKey, options)
      recordModelResult(model, true, Date.now() - start)

      if (i > 0) {
        log('info', 'llm', `Succeeded with fallback model ${model} (attempt ${i + 1})`)
      }

      return result
    } catch (err) {
      lastError = err as Error
      recordModelResult(model, false, Date.now() - start)
      log('warn', 'llm', `Model ${model} failed (attempt ${i + 1}/${modelsToTry.length})`, {
        error: String(err).slice(0, 200),
      })
    }
  }

  throw lastError || new Error('All models failed')
}

async function callOpenRouter(
  messages: LLMMessage[],
  model: string,
  apiKey: string,
  options: LLMOptions
): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 300_000) // 5 min timeout

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
    const content = data?.choices?.[0]?.message?.content
    if (!content) throw new Error(`OpenRouter [${model}]: empty response`)

    const tokens = data?.usage?.total_tokens || 0
    log('debug', 'llm', `✓ ${model} — ${tokens} tokens, ${content.length} chars`)

    return typeof content === 'string' ? content.trim() : JSON.stringify(content)
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
  const raw = await chat(messages, { ...options, jsonMode: true })
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
