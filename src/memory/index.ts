/**
 * AutoDev Memory System
 *
 * Long-term memory that persists across runs. The agent remembers:
 * - Which improvements worked and which failed (per project, per module)
 * - Common error patterns and how to avoid them
 * - File-level insights (which files are fragile, which are safe)
 * - Successful strategies to reuse
 *
 * Memory is stored in data/memory.json and loaded at startup.
 * This is what makes AutoDev learn from its mistakes over time.
 */

import fs from 'fs'
import path from 'path'
import { log } from '../utils/logger.js'

// ─── Types ──────────────────────────────────────────────────────

export interface Outcome {
  project: string
  module: string
  success: boolean
  reason: string
  filesChanged: string[]
  timestamp?: string
}

export interface ModuleMemory {
  totalAttempts: number
  totalSuccesses: number
  totalFailures: number
  consecutiveFailures: number
  lastSuccess: string | null
  lastFailure: string | null
  /** Common error patterns seen */
  errorPatterns: string[]
  /** Files that often cause build failures */
  fragileFiles: string[]
  /** Successful strategies/descriptions to reuse */
  successfulStrategies: string[]
}

export interface ProjectMemory {
  name: string
  modules: Record<string, ModuleMemory>
  /** Global file fragility scores (higher = more dangerous to modify) */
  fileRisk: Record<string, number>
  /** Total runs across all modules */
  totalRuns: number
  firstSeen: string
  lastSeen: string
}

export interface MemoryStore {
  version: number
  projects: Record<string, ProjectMemory>
  /** Global insights that apply across all projects */
  globalInsights: string[]
  /** Error patterns that recur across projects */
  globalErrorPatterns: string[]
  createdAt: string
  updatedAt: string
}

// ─── Memory file management ────────────────────────────────────

const MEMORY_FILE = path.join(process.cwd(), 'data', 'memory.json')
const MAX_PATTERNS = 50
const MAX_STRATEGIES = 30
const MAX_INSIGHTS = 20

let memoryCache: MemoryStore | null = null

function ensureDir() {
  const dir = path.dirname(MEMORY_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function createEmptyStore(): MemoryStore {
  return {
    version: 1,
    projects: {},
    globalInsights: [],
    globalErrorPatterns: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function loadStore(): MemoryStore {
  if (memoryCache) return memoryCache

  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const raw = fs.readFileSync(MEMORY_FILE, 'utf-8')
      memoryCache = JSON.parse(raw) as MemoryStore
      return memoryCache
    }
  } catch (err) {
    log('warn', 'memory', `Failed to load memory: ${err}`)
  }

  memoryCache = createEmptyStore()
  return memoryCache
}

function saveStore(store: MemoryStore): void {
  ensureDir()
  store.updatedAt = new Date().toISOString()
  memoryCache = store
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(store, null, 2))
}

// ─── Public API ─────────────────────────────────────────────────

function getOrCreateProject(store: MemoryStore, projectName: string): ProjectMemory {
  if (!store.projects[projectName]) {
    store.projects[projectName] = {
      name: projectName,
      modules: {},
      fileRisk: {},
      totalRuns: 0,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    }
  }
  store.projects[projectName].lastSeen = new Date().toISOString()
  return store.projects[projectName]
}

function getOrCreateModule(project: ProjectMemory, moduleName: string): ModuleMemory {
  if (!project.modules[moduleName]) {
    project.modules[moduleName] = {
      totalAttempts: 0,
      totalSuccesses: 0,
      totalFailures: 0,
      consecutiveFailures: 0,
      lastSuccess: null,
      lastFailure: null,
      errorPatterns: [],
      fragileFiles: [],
      successfulStrategies: [],
    }
  }
  return project.modules[moduleName]
}

/**
 * Record the outcome of an improvement attempt.
 * This is how the agent learns.
 */
export function recordOutcome(outcome: Outcome): void {
  const store = loadStore()
  const project = getOrCreateProject(store, outcome.project)
  const mod = getOrCreateModule(project, outcome.module)

  project.totalRuns++
  mod.totalAttempts++

  if (outcome.success) {
    mod.totalSuccesses++
    mod.consecutiveFailures = 0
    mod.lastSuccess = new Date().toISOString()

    // Remember successful strategy
    if (outcome.reason && !mod.successfulStrategies.includes(outcome.reason)) {
      mod.successfulStrategies.push(outcome.reason)
      if (mod.successfulStrategies.length > MAX_STRATEGIES) {
        mod.successfulStrategies = mod.successfulStrategies.slice(-MAX_STRATEGIES)
      }
    }

    // Decrease file risk for files that were changed successfully
    for (const file of outcome.filesChanged) {
      project.fileRisk[file] = Math.max(0, (project.fileRisk[file] || 0) - 1)
    }

  } else {
    mod.totalFailures++
    mod.consecutiveFailures++
    mod.lastFailure = new Date().toISOString()

    // Remember error pattern
    const errorKey = extractErrorPattern(outcome.reason)
    if (errorKey && !mod.errorPatterns.includes(errorKey)) {
      mod.errorPatterns.push(errorKey)
      if (mod.errorPatterns.length > MAX_PATTERNS) {
        mod.errorPatterns = mod.errorPatterns.slice(-MAX_PATTERNS)
      }
    }

    // Track global error patterns
    if (errorKey && !store.globalErrorPatterns.includes(errorKey)) {
      store.globalErrorPatterns.push(errorKey)
      if (store.globalErrorPatterns.length > MAX_PATTERNS) {
        store.globalErrorPatterns = store.globalErrorPatterns.slice(-MAX_PATTERNS)
      }
    }

    // Increase file risk for files that caused failure
    for (const file of outcome.filesChanged) {
      project.fileRisk[file] = (project.fileRisk[file] || 0) + 2
    }

    // Mark fragile files
    for (const file of outcome.filesChanged) {
      if ((project.fileRisk[file] || 0) >= 4 && !mod.fragileFiles.includes(file)) {
        mod.fragileFiles.push(file)
        log('info', 'memory', `Marked ${file} as fragile for ${outcome.project}/${outcome.module}`)
      }
    }
  }

  saveStore(store)
  log('debug', 'memory', `Recorded ${outcome.success ? 'success' : 'failure'} for ${outcome.project}/${outcome.module}`, {
    successRate: `${mod.totalSuccesses}/${mod.totalAttempts}`,
    consecutiveFailures: mod.consecutiveFailures,
  })
}

/**
 * Get memory interface for querying the agent's knowledge.
 */
export function getMemory() {
  const store = loadStore()

  return {
    /**
     * Get recent failures for a project to avoid repeating mistakes.
     */
    getRecentFailures(projectName: string, limit: number): { module: string; reason: string }[] {
      const project = store.projects[projectName]
      if (!project) return []

      const failures: { module: string; reason: string; time: string }[] = []
      for (const [modName, mod] of Object.entries(project.modules)) {
        if (mod.consecutiveFailures >= 2 && mod.lastFailure) {
          failures.push({
            module: modName,
            reason: mod.errorPatterns[mod.errorPatterns.length - 1] || 'Unknown',
            time: mod.lastFailure,
          })
        }
      }

      return failures
        .sort((a, b) => b.time.localeCompare(a.time))
        .slice(0, limit)
    },

    /**
     * Get the success rate for a module on a project.
     */
    getSuccessRate(projectName: string, moduleName: string): number {
      const mod = store.projects[projectName]?.modules[moduleName]
      if (!mod || mod.totalAttempts === 0) return 0.8 // default optimistic
      return mod.totalSuccesses / mod.totalAttempts
    },

    /**
     * Get fragile files that should be handled with extra care.
     */
    getFragileFiles(projectName: string): string[] {
      const project = store.projects[projectName]
      if (!project) return []

      return Object.entries(project.fileRisk)
        .filter(([_, risk]) => risk >= 4)
        .sort((a, b) => b[1] - a[1])
        .map(([file]) => file)
    },

    /**
     * Get successful strategies to reuse as context for the LLM.
     */
    getSuccessfulStrategies(projectName: string, moduleName: string, limit = 5): string[] {
      const mod = store.projects[projectName]?.modules[moduleName]
      return mod?.successfulStrategies?.slice(-limit) || []
    },

    /**
     * Get error patterns to avoid.
     */
    getErrorPatterns(projectName: string, moduleName: string): string[] {
      const mod = store.projects[projectName]?.modules[moduleName]
      return mod?.errorPatterns?.slice(-10) || []
    },

    /**
     * Should we skip this module? (too many consecutive failures)
     */
    shouldSkipModule(projectName: string, moduleName: string): boolean {
      const mod = store.projects[projectName]?.modules[moduleName]
      if (!mod) return false
      // Skip if 3+ consecutive failures
      return mod.consecutiveFailures >= 3
    },

    /**
     * Get full project memory for LLM context injection.
     */
    getContextForLLM(projectName: string, moduleName: string): string {
      const project = store.projects[projectName]
      if (!project) return ''

      const mod = project.modules[moduleName]
      const parts: string[] = []

      if (mod) {
        const rate = mod.totalAttempts > 0
          ? `${Math.round((mod.totalSuccesses / mod.totalAttempts) * 100)}%`
          : 'N/A'

        parts.push(`## Agent Memory for ${projectName}/${moduleName}`)
        parts.push(`Success rate: ${rate} (${mod.totalSuccesses}/${mod.totalAttempts})`)

        if (mod.errorPatterns.length > 0) {
          parts.push(`\nErrors to AVOID (caused build failures in the past):`)
          for (const err of mod.errorPatterns.slice(-5)) {
            parts.push(`- ${err}`)
          }
        }

        if (mod.fragileFiles.length > 0) {
          parts.push(`\nFragile files (modify with EXTRA CARE):`)
          for (const file of mod.fragileFiles) {
            parts.push(`- ${file} (risk: ${project.fileRisk[file] || 0})`)
          }
        }

        if (mod.successfulStrategies.length > 0) {
          parts.push(`\nStrategies that WORKED before:`)
          for (const s of mod.successfulStrategies.slice(-3)) {
            parts.push(`- ${s}`)
          }
        }
      }

      if (store.globalErrorPatterns.length > 0) {
        parts.push(`\nGlobal error patterns to avoid:`)
        for (const e of store.globalErrorPatterns.slice(-3)) {
          parts.push(`- ${e}`)
        }
      }

      return parts.join('\n')
    },

    /** Raw store for the dashboard */
    getRawStore(): MemoryStore {
      return store
    },
  }
}

/**
 * Add a global insight (from user feedback or self-reflection).
 */
export function addInsight(insight: string): void {
  const store = loadStore()
  if (!store.globalInsights.includes(insight)) {
    store.globalInsights.push(insight)
    if (store.globalInsights.length > MAX_INSIGHTS) {
      store.globalInsights = store.globalInsights.slice(-MAX_INSIGHTS)
    }
    saveStore(store)
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function extractErrorPattern(reason: string): string | null {
  if (!reason) return null

  // Extract TypeScript error codes
  const tsMatch = reason.match(/error TS\d+/)
  if (tsMatch) return tsMatch[0]

  // Extract common error types
  const patterns = [
    /Module not found/i,
    /Cannot find module/i,
    /Property .+ does not exist/i,
    /Type .+ is not assignable/i,
    /Missing API key/i,
    /Turbopack build failed/i,
    /SyntaxError/i,
    /ReferenceError/i,
    /ENOENT/i,
  ]

  for (const pat of patterns) {
    const match = reason.match(pat)
    if (match) return match[0]
  }

  // Truncate to a short key
  return reason.slice(0, 80)
}
