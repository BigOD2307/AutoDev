/**
 * AutoDev Dashboard — Embedded web UI
 *
 * Lightweight HTTP server with SSE for real-time logs.
 * No external dependencies — uses Node.js built-in http module.
 * Serves a single-page app with Tailwind CSS via CDN.
 */

import http from 'http'
import { loadConfig, getRepoConfigs } from '../config.js'
import { getHistory } from '../utils/logger.js'
import { getMemory } from '../memory/index.js'
import { runAgent } from '../core/agent.js'
import { log } from '../utils/logger.js'
import { getHTML } from './ui.js'

const PORT = parseInt(process.env.DASHBOARD_PORT || '4040', 10)

// SSE clients for real-time log streaming
const sseClients: Set<http.ServerResponse> = new Set()

// Intercept logs for SSE broadcast
const originalLog = console.log
console.log = (...args: unknown[]) => {
  originalLog(...args)
  const message = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')
  // Strip ANSI color codes
  const clean = message.replace(/\x1b\[[0-9;]*m/g, '')
  broadcastSSE({ type: 'log', data: clean, timestamp: new Date().toISOString() })
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
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`)

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

    try {
      switch (url.pathname) {
        case '/':
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(getHTML())
          break

        case '/api/status':
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(getStatus()))
          break

        case '/api/history':
          res.writeHead(200, { 'Content-Type': 'application/json' })
          const limit = parseInt(url.searchParams.get('limit') || '50', 10)
          res.end(JSON.stringify(getHistory().slice(-limit).reverse()))
          break

        case '/api/memory':
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(getMemory().getRawStore()))
          break

        case '/api/config':
          res.writeHead(200, { 'Content-Type': 'application/json' })
          const config = loadConfig()
          // Sanitize: hide API keys
          const safe = {
            agent: config.agent,
            projects: config.projects.map(p => ({ ...p, repo: p.repo.replace(/ghp_[a-zA-Z0-9]+@/, '***@') })),
            notifications: { enabled: config.notifications.enabled, channels: config.notifications.channels.length },
            llm: { provider: config.llm.provider, defaultModel: config.llm.defaultModel },
            git: { authorName: config.git.authorName, branchPrefix: config.git.branchPrefix },
          }
          res.end(JSON.stringify(safe))
          break

        case '/api/run':
          if (req.method !== 'POST') { res.writeHead(405); res.end(); break }
          if (agentStatus === 'running') {
            res.writeHead(409, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Agent is already running' }))
            break
          }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ status: 'started' }))
          triggerRun()
          break

        case '/api/events':
          // SSE endpoint
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          })
          res.write(`data: ${JSON.stringify({ type: 'connected', status: agentStatus })}\n\n`)
          sseClients.add(res)
          req.on('close', () => sseClients.delete(res))
          break

        default:
          res.writeHead(404, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Not found' }))
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
  try {
    await runAgent()
    agentStatus = 'idle'
    lastRunTime = new Date().toISOString()
    runCount++
  } catch (err) {
    agentStatus = 'error'
    log('error', 'dashboard', `Run failed: ${err}`)
  }
  broadcastSSE({ type: 'status', status: agentStatus })
}

function getStatus() {
  const history = getHistory()
  const repos = getRepoConfigs()
  const config = loadConfig()

  const successes = history.filter(h => h.status === 'success').length
  const failures = history.filter(h => h.status === 'failed').length
  const skipped = history.filter(h => h.status === 'skipped').length

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
    projects: repos.map(r => ({
      name: r.name,
      framework: r.framework,
      modules: r.modules,
    })),
    stats: {
      total: history.length,
      successes,
      failures,
      skipped,
      successRate: history.length > 0 ? Math.round((successes / history.length) * 100) : 0,
    },
    sseClients: sseClients.size,
  }
}
