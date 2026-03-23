import fs from 'fs'
import path from 'path'
import { log } from './utils/logger.js'

// ─── Types ──────────────────────────────────────────────────────

export interface ProjectConfig {
  name: string
  repo: string
  branch: string
  buildCommand: string
  installCommand: string
  language: string
  framework: string
  modules: string[]
  paths: {
    source: string
    pages: string | null
    components: string | null
    api: string | null
    config: string | null
    blog: string | null
  }
  keyFiles: string[]
  content: {
    enabled: boolean
    blogFile: string | null
    topics: string[]
    targetAudience: string
    language: string
  }
  /** Computed at runtime */
  localPath: string
}

export interface NotificationChannel {
  type: 'webhook' | 'slack' | 'discord' | 'email'
  url: string
  secret?: string
  token?: string
}

export interface Config {
  agent: {
    name: string
    schedule: string
    timezone: string
    language: string
    maxConcurrentRepos: number
    dryRun: boolean
  }
  projects: ProjectConfig[]
  notifications: {
    enabled: boolean
    channels: NotificationChannel[]
  }
  llm: {
    provider: string
    apiKey: string
    openaiKey: string
    defaultModel: string
    maxCostPerRunUSD: number
    temperature: number
    maxTokens: number
  }
  git: {
    token: string
    authorName: string
    authorEmail: string
    branchPrefix: string
    commitPrefix: string
  }
  search: {
    tinyfishKey: string
  }
}

// ─── Config loader ──────────────────────────────────────────────

const CONFIG_FILE_NAMES = ['autodev.config.json', 'autodev.config.js', '.autodevrc']
let cachedConfig: Config | null = null

function env(key: string, fallback = ''): string {
  return process.env[key] || fallback
}

function findConfigFile(): string | null {
  const cwd = process.cwd()
  for (const name of CONFIG_FILE_NAMES) {
    const filePath = path.join(cwd, name)
    if (fs.existsSync(filePath)) return filePath
  }
  return null
}

function loadConfigFile(): Record<string, unknown> | null {
  const filePath = findConfigFile()
  if (!filePath) return null

  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as Record<string, unknown>
  } catch (err) {
    log('warn', 'config', `Failed to parse config file: ${err}`)
    return null
  }
}

/**
 * Load configuration from:
 * 1. autodev.config.json (file-based, highest priority)
 * 2. Environment variables (overrides)
 * 3. Sensible defaults
 */
export function loadConfig(): Config {
  if (cachedConfig) return cachedConfig

  const file = loadConfigFile() as {
    agent?: Partial<Config['agent']>
    projects?: Partial<ProjectConfig>[]
    notifications?: Partial<Config['notifications']>
    llm?: Partial<Config['llm']>
    git?: Partial<Config['git']>
  } | null

  // Build projects from config file or env vars
  let projects: ProjectConfig[] = []

  if (file?.projects && Array.isArray(file.projects)) {
    projects = file.projects.map((p, i) => ({
      name: p.name || `project-${i}`,
      repo: p.repo || '',
      branch: p.branch || 'main',
      buildCommand: p.buildCommand || 'npm run build',
      installCommand: p.installCommand || 'npm install --no-audit --no-fund',
      language: p.language || 'typescript',
      framework: p.framework || 'unknown',
      modules: p.modules || ['security', 'performance', 'seo', 'quality'],
      paths: {
        source: p.paths?.source || 'src/',
        pages: p.paths?.pages || null,
        components: p.paths?.components || null,
        api: p.paths?.api || null,
        config: p.paths?.config || null,
        blog: p.paths?.blog || null,
      },
      keyFiles: p.keyFiles || ['package.json'],
      content: {
        enabled: p.content?.enabled ?? false,
        blogFile: p.content?.blogFile || null,
        topics: p.content?.topics || [],
        targetAudience: p.content?.targetAudience || 'developers',
        language: p.content?.language || 'en',
      },
      localPath: `/tmp/autodev/${p.name || `project-${i}`}`,
    }))
  }

  // Fallback: env-based single project configuration
  if (projects.length === 0 && env('AUTODEV_REPO_URL')) {
    const name = env('AUTODEV_PROJECT_NAME', 'my-project')
    projects.push({
      name,
      repo: env('AUTODEV_REPO_URL'),
      branch: env('AUTODEV_BRANCH', 'main'),
      buildCommand: env('AUTODEV_BUILD_CMD', 'npm run build'),
      installCommand: env('AUTODEV_INSTALL_CMD', 'npm install --no-audit --no-fund'),
      language: env('AUTODEV_LANGUAGE', 'typescript'),
      framework: env('AUTODEV_FRAMEWORK', 'nextjs'),
      modules: env('AUTODEV_MODULES', 'security,performance,seo,quality').split(','),
      paths: { source: 'src/', pages: null, components: null, api: null, config: null, blog: null },
      keyFiles: env('AUTODEV_KEY_FILES', 'package.json').split(','),
      content: { enabled: false, blogFile: null, topics: [], targetAudience: 'developers', language: 'en' },
      localPath: `/tmp/autodev/${name}`,
    })
  }

  const config: Config = {
    agent: {
      name: file?.agent?.name || env('AUTODEV_AGENT_NAME', 'AutoDev'),
      schedule: env('AUTODEV_SCHEDULE', file?.agent?.schedule || '0 */4 * * *'),
      timezone: file?.agent?.timezone || 'UTC',
      language: file?.agent?.language || 'en',
      maxConcurrentRepos: file?.agent?.maxConcurrentRepos || 1,
      dryRun: env('AUTODEV_DRY_RUN', String(file?.agent?.dryRun ?? 'false')) === 'true',
    },
    projects,
    notifications: {
      enabled: file?.notifications?.enabled ?? !!env('NOTIFY_WEBHOOK_URL'),
      channels: file?.notifications?.channels as NotificationChannel[] || (
        env('NOTIFY_WEBHOOK_URL')
          ? [{ type: 'webhook' as const, url: env('NOTIFY_WEBHOOK_URL'), secret: env('AUTODEV_SECRET') }]
          : []
      ),
    },
    llm: {
      provider: file?.llm?.provider || 'openrouter',
      apiKey: env('OPENROUTER_API_KEY'),
      openaiKey: env('OPENAI_API_KEY'),
      defaultModel: env('LLM_MODEL', file?.llm?.defaultModel || ''),
      maxCostPerRunUSD: file?.llm?.maxCostPerRunUSD ?? 0.10,
      temperature: file?.llm?.temperature ?? 0.3,
      maxTokens: file?.llm?.maxTokens ?? 16000,
    },
    git: {
      token: env('GITHUB_TOKEN'),
      authorName: file?.git?.authorName || env('GIT_AUTHOR_NAME', 'AutoDev Agent'),
      authorEmail: file?.git?.authorEmail || env('GIT_AUTHOR_EMAIL', 'autodev@localhost'),
      branchPrefix: file?.git?.branchPrefix || 'autodev',
      commitPrefix: file?.git?.commitPrefix || 'autodev',
    },
    search: {
      tinyfishKey: env('TINYFISH_API_KEY'),
    },
  }

  cachedConfig = config
  return config
}

/**
 * Reset cached config (useful for testing or hot-reload).
 */
export function resetConfig(): void {
  cachedConfig = null
}

// ─── Compatibility layer (maps new config to old RepoConfig shape) ──

export interface RepoConfig {
  name: string
  url: string
  localPath: string
  buildCmd: string
  installCmd: string
  mainBranch: string
  keyFiles: string[]
  framework: string
  modules: string[]
  project: ProjectConfig
}

export function getRepoConfigs(): RepoConfig[] {
  const config = loadConfig()
  return config.projects.map(p => ({
    name: p.name,
    url: p.repo,
    localPath: p.localPath,
    buildCmd: p.buildCommand,
    installCmd: p.installCommand,
    mainBranch: p.branch,
    keyFiles: p.keyFiles,
    framework: p.framework,
    modules: p.modules,
    project: p,
  }))
}
