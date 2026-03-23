/**
 * AutoDev Dashboard — Embedded web UI
 * Real-time SSE logs, agent control, memory visualization
 */

import http from 'http'
import { loadConfig, getRepoConfigs } from '../config.js'
import { getHistory } from '../utils/logger.js'
import { getMemory } from '../memory/index.js'
import { runAgent, onActivity, getActivity } from '../core/agent.js'
import { log } from '../utils/logger.js'
import { MODELS } from '../utils/router.js'
import { getHTML } from './ui.js'
import { onInteraction, getInteractions } from '../utils/llm.js'

const PORT = parseInt(process.env.DASHBOARD_PORT || '4040', 10)

// SSE clients
const sseClients: Set<http.ServerResponse> = new Set()

// In-memory log buffer for the dashboard
const logBuffer: { timestamp: string; level: string; module: string; message: string }[] = []
const MAX_BUFFER = 500

// Intercept console.log for SSE + buffer
const _origLog = console.log
console.log = (...args: unknown[]) => {
  _origLog(...args)
  const raw = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')
  const clean = raw.replace(/\x1b\[[0-9;]*m/g, '')

  // Parse structured log: [timestamp] [LEVEL] [module] message
  const match = clean.match(/\[([^\]]+)\]\s*\[([^\]]+)\]\s*\[([^\]]+)\]\s*(.*)/)
  const entry = match
    ? { timestamp: match[1], level: match[2], module: match[3], message: match[4] }
    : { timestamp: new Date().toISOString(), level: 'INFO', module: 'system', message: clean }

  logBuffer.push(entry)
  if (logBuffer.length > MAX_BUFFER) logBuffer.splice(0, logBuffer.length - MAX_BUFFER)

  broadcastSSE({ type: 'log', ...entry })
}

function broadcastSSE(payload: unknown): void {
  const data = `data: ${JSON.stringify(payload)}\n\n`
  for (const client of sseClients) {
    try { client.write(data) } catch { sseClients.delete(client) }
  }
}

// Agent state
let agentStatus: 'idle' | 'running' | 'error' = 'idle'
let lastRunTime: string | null = null
let runCount = 0

export function startDashboard(): void {
  // Wire up LLM interaction events → SSE
  onInteraction((interaction) => {
    broadcastSSE({ type: 'interaction', ...interaction })
  })

  // Wire up activity events → SSE
  onActivity((event) => {
    broadcastSSE({ type: 'activity', ...event })
  })

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`)

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

    const json = (data: unknown) => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(data))
    }

    try {
      switch (url.pathname) {
        case '/':
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(getHTML())
          break

        case '/api/status':
          json(getStatus())
          break

        case '/api/history':
          json(getHistory().slice(-(parseInt(url.searchParams.get('limit') || '50'))).reverse())
          break

        case '/api/memory':
          json(getMemory().getRawStore())
          break

        case '/api/logs':
          json(logBuffer.slice(-(parseInt(url.searchParams.get('limit') || '200'))))
          break

        case '/api/interactions':
          json(getInteractions(parseInt(url.searchParams.get('limit') || '50')))
          break

        case '/api/activity':
          json(getActivity(parseInt(url.searchParams.get('limit') || '100')))
          break

        case '/api/models':
          json(MODELS.map(m => ({
            id: m.id, name: m.name,
            costIn: m.costIn, costOut: m.costOut,
            quality: m.quality, speed: m.speed,
            strengths: m.strengths,
          })))
          break

        case '/api/config': {
          const config = loadConfig()
          json({
            agent: config.agent,
            projects: config.projects.map(p => ({
              name: p.name, repo: p.repo.replace(/ghp_[^@]+@/, '***@'),
              framework: p.framework, branch: p.branch,
              modules: p.modules, buildCommand: p.buildCommand,
              keyFiles: p.keyFiles,
              content: p.content,
            })),
            notifications: { enabled: config.notifications.enabled, channels: config.notifications.channels.length },
            llm: { provider: config.llm.provider, defaultModel: config.llm.defaultModel || 'Smart Router' },
            git: { authorName: config.git.authorName, branchPrefix: config.git.branchPrefix },
          })
          break
        }

        case '/api/run':
          if (req.method !== 'POST') { res.writeHead(405); res.end(); break }
          if (agentStatus === 'running') {
            res.writeHead(409, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Agent is already running' }))
            break
          }
          json({ status: 'started' })
          triggerRun()
          break

        case '/api/events':
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          })
          // Send current state
          res.write(`data: ${JSON.stringify({ type: 'connected', status: agentStatus })}\n\n`)
          // Send buffered logs
          for (const entry of logBuffer.slice(-50)) {
            res.write(`data: ${JSON.stringify({ type: 'log', ...entry })}\n\n`)
          }
          sseClients.add(res)
          req.on('close', () => sseClients.delete(res))
          break

        default:
          res.writeHead(404)
          res.end('Not found')
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: String(err) }))
    }
  })

  server.listen(PORT, () => {
    log('info', 'dashboard', `Dashboard running at http://localhost:${PORT}`)
  })
}

async function triggerRun(): Promise<void> {
  agentStatus = 'running'
  broadcastSSE({ type: 'status', status: 'running' })
  const start = Date.now()
  try {
    await runAgent()
    agentStatus = 'idle'
    lastRunTime = new Date().toISOString()
    runCount++
  } catch (err) {
    agentStatus = 'error'
    log('error', 'dashboard', `Run failed: ${err}`)
  }
  broadcastSSE({ type: 'status', status: agentStatus, durationMs: Date.now() - start })
  broadcastSSE({ type: 'history-update' })
}

function getStatus() {
  const history = getHistory()
  const repos = getRepoConfigs()
  const config = loadConfig()
  const memory = getMemory()

  const successes = history.filter(h => h.status === 'success').length
  const failures = history.filter(h => h.status === 'failed').length
  const skipped = history.filter(h => h.status === 'skipped').length

  // Per-project stats
  const projectStats = repos.map(r => {
    const projHistory = history.filter(h => h.project === r.name)
    const projSuccess = projHistory.filter(h => h.status === 'success').length
    return {
      name: r.name,
      framework: r.framework,
      modules: r.modules,
      runs: projHistory.length,
      successes: projSuccess,
      successRate: projHistory.length > 0 ? Math.round((projSuccess / projHistory.length) * 100) : 0,
      fragileFiles: memory.getFragileFiles(r.name),
      lastRun: projHistory[projHistory.length - 1]?.timestamp || null,
    }
  })

  return {
    agent: {
      name: config.agent.name,
      status: agentStatus,
      schedule: config.agent.schedule,
      dryRun: config.agent.dryRun,
      lastRun: lastRunTime,
      totalRuns: runCount,
      uptime: process.uptime(),
    },
    projects: projectStats,
    stats: {
      total: history.length,
      successes,
      failures,
      skipped,
      successRate: history.length > 0 ? Math.round((successes / history.length) * 100) : 0,
    },
    sseClients: sseClients.size,
    logBufferSize: logBuffer.length,
  }
}
