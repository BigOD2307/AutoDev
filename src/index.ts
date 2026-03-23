import 'dotenv/config'
import cron from 'node-cron'
import { loadConfig } from './config.js'
import { runAgent } from './core/agent.js'
import { notifyStatus } from './core/notifier.js'
import { log } from './utils/logger.js'

async function main() {
  const config = loadConfig()

  log('info', 'main', '🤖 AutoDev Agent starting up')
  log('info', 'main', `Schedule: ${config.schedule}`)
  log('info', 'main', `Dry run: ${config.dryRun}`)
  log('info', 'main', `LLM model: ${config.llm.model}`)
  log('info', 'main', `Repos: ${Object.keys(config.repos).join(', ')}`)

  // Notify that the agent has started
  await notifyStatus(`Agent démarré\nSchedule: ${config.schedule}\nMode: ${config.dryRun ? 'DRY RUN' : 'PRODUCTION'}`)

  // Run once immediately on startup if AUTODEV_RUN_NOW is set
  if (process.env.AUTODEV_RUN_NOW === 'true') {
    log('info', 'main', 'Running immediately (AUTODEV_RUN_NOW=true)')
    try {
      await runAgent()
    } catch (err) {
      log('error', 'main', 'Immediate run failed', { error: String(err) })
    }
  }

  // Schedule recurring runs
  if (!cron.validate(config.schedule)) {
    log('error', 'main', `Invalid cron schedule: ${config.schedule}`)
    process.exit(1)
  }

  cron.schedule(config.schedule, async () => {
    log('info', 'main', '⏰ Scheduled run triggered')
    try {
      await runAgent()
    } catch (err) {
      log('error', 'main', 'Scheduled run failed', { error: String(err) })
      await notifyStatus(`❌ Erreur agent:\n${String(err).slice(0, 300)}`)
    }
  })

  log('info', 'main', `✅ Agent scheduled. Next run at: ${config.schedule}`)
  log('info', 'main', 'Waiting for scheduled runs... (Ctrl+C to stop)')

  // Keep process alive
  process.on('SIGINT', async () => {
    log('info', 'main', 'Agent shutting down (SIGINT)')
    await notifyStatus('Agent arrêté (SIGINT)')
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    log('info', 'main', 'Agent shutting down (SIGTERM)')
    await notifyStatus('Agent arrêté (SIGTERM)')
    process.exit(0)
  })

  // Uncaught errors — notify and continue
  process.on('uncaughtException', async (err) => {
    log('error', 'main', 'Uncaught exception', { error: String(err) })
    await notifyStatus(`⚠️ Exception non gérée:\n${String(err).slice(0, 300)}`)
  })

  process.on('unhandledRejection', async (reason) => {
    log('error', 'main', 'Unhandled rejection', { reason: String(reason) })
  })
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
