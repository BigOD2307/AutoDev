import fs from 'fs'
import path from 'path'

export type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug'

const COLORS: Record<LogLevel, string> = {
  info: '\x1b[36m',    // cyan
  warn: '\x1b[33m',    // yellow
  error: '\x1b[31m',   // red
  success: '\x1b[32m', // green
  debug: '\x1b[90m',   // gray
}
const RESET = '\x1b[0m'

const LOG_FILE = path.join(process.cwd(), 'data', 'autodev.log')

function ensureLogDir() {
  const dir = path.dirname(LOG_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function formatTimestamp(): string {
  return new Date().toISOString()
}

export function log(level: LogLevel, module: string, message: string, data?: unknown): void {
  const timestamp = formatTimestamp()
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${module}]`
  const line = data
    ? `${prefix} ${message} ${JSON.stringify(data)}`
    : `${prefix} ${message}`

  // Console output with colors
  const color = COLORS[level]
  console.log(`${color}${prefix}${RESET} ${message}`)
  if (data) console.log(`  ${JSON.stringify(data, null, 2)}`)

  // File output
  try {
    ensureLogDir()
    fs.appendFileSync(LOG_FILE, line + '\n')
  } catch {
    // Silently fail file logging
  }
}

export interface ImprovementRecord {
  id: string
  timestamp: string
  project: string
  module: string
  branch: string
  status: 'success' | 'failed' | 'skipped'
  summary: string
  filesChanged: string[]
  buildPassed: boolean
  error?: string
}

const HISTORY_FILE = path.join(process.cwd(), 'data', 'improvements.json')

export function saveImprovement(record: ImprovementRecord): void {
  ensureLogDir()
  let history: ImprovementRecord[] = []
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'))
    }
  } catch {
    history = []
  }
  history.push(record)
  // Keep last 500 records
  if (history.length > 500) history = history.slice(-500)
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2))
}

export function getHistory(): ImprovementRecord[] {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'))
    }
  } catch { /* empty */ }
  return []
}
