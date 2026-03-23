import 'dotenv/config'
import cron from 'node-cron'
import { loadConfig } from './config.js'
import { runAgent } from './core/agent.js'
import { notifyStatus } from './core/notifier.js'
import { log } from './utils/logger.js'
import { startDashboard } from './dashboard/server.js'

async function main() {
  const config = loadConfig()

  log('info', 'main', `${config.agent.name} starting up`)
  log('info', 'main', `Schedule: ${config.agent.schedule}`)
  log('info', 'main', `Dry run: ${config.agent.dryRun}`)
  log('info', 'main', `Projects: ${config.projects.map(p => p.name).join(', ') || 'none configured'}`)

  if (config.projects.length === 0) {
    log('error', 'main', 'No projects configured. Create autodev.config.json or set AUTODEV_REPO_URL.')
    log('info', 'main', 'See autodev.config.example.json for configuration reference.')
    process.exit(1)
  }

  // Start embedded dashboard
  startDashboard()

  await notifyStatus(`${config.agent.name} started — ${config.projects.length} project(s)`)

  if (process.env.AUTODEV_RUN_NOW === 'true') {
    log('info', 'main', 'Running immediately (AUTODEV_RUN_NOW=true)')
    try { await runAgent() } catch (err) {
      log('error', 'main', `Immediate run failed: ${err}`)
    }
  }

  const schedule = config.agent.schedule
  if (!cron.validate(schedule)) {
    log('error', 'main', `Invalid cron schedule: ${schedule}`)
    process.exit(1)
  }

  cron.schedule(schedule, async () => {
    log('info', 'main', 'Scheduled run triggered')
    try { await runAgent() } catch (err) {
      log('error', 'main', `Run failed: ${err}`)
      await notifyStatus(`Error: ${String(err).slice(0, 300)}`)
    }
  })

  log('info', 'main', `Scheduled. Waiting for next run...`)

  process.on('SIGINT', () => { log('info', 'main', 'Shutting down'); process.exit(0) })
  process.on('SIGTERM', () => { log('info', 'main', 'Shutting down'); process.exit(0) })
  process.on('uncaughtException', async (err) => {
    log('error', 'main', `Uncaught: ${err}`)
    await notifyStatus(`Uncaught exception: ${String(err).slice(0, 300)}`)
  })
  process.on('unhandledRejection', (reason) => {
    log('error', 'main', `Unhandled rejection: ${reason}`)
  })
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1) })
