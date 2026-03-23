import { loadConfig } from '../config.js'
import { log } from '../utils/logger.js'
import type { Improvement } from './analyzer.js'
import { getCompareUrl } from './git.js'
import type { RepoConfig } from '../config.js'

export interface NotificationPayload {
  project: string
  module: string
  branch: string
  title: string
  description: string
  impact: string
  filesChanged: string[]
  buildPassed: boolean
  compareUrl: string
}

/**
 * Send a WhatsApp notification about an improvement.
 * Uses the ZeroName notify endpoint which forwards to WhatsApp.
 */
export async function notifyImprovement(
  repo: RepoConfig,
  improvement: Improvement,
  branch: string,
  buildPassed: boolean
): Promise<void> {
  const config = loadConfig()

  const compareUrl = getCompareUrl(repo, branch)
  const payload: NotificationPayload = {
    project: repo.name,
    module: improvement.module,
    branch,
    title: improvement.title,
    description: improvement.description,
    impact: improvement.impact,
    filesChanged: improvement.changes.map(c => c.filePath),
    buildPassed,
    compareUrl,
  }

  const message = formatWhatsAppMessage(payload)

  if (config.dryRun) {
    log('info', 'notifier', `[DRY RUN] Would send WhatsApp notification:\n${message}`)
    return
  }

  // Try the ZeroName notify endpoint
  try {
    await sendViaEndpoint(config, message)
    log('success', 'notifier', `WhatsApp notification sent for ${improvement.title}`)
    return
  } catch (err) {
    log('warn', 'notifier', `Notify endpoint failed, trying direct`, { error: String(err) })
  }

  // Log the message so it's not lost even if notification fails
  log('info', 'notifier', `Notification message:\n${message}`)
}

/**
 * Send notification via ZeroName's API endpoint.
 */
async function sendViaEndpoint(config: ReturnType<typeof loadConfig>, message: string): Promise<void> {
  if (!config.notify.url || !config.notify.secret) {
    throw new Error('Notify URL or secret not configured')
  }

  const res = await fetch(config.notify.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: config.notify.secret,
      phone: config.notify.phone,
      message,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Notify endpoint returned ${res.status}: ${text.slice(0, 200)}`)
  }
}

/**
 * Format a clean WhatsApp message for the improvement.
 */
function formatWhatsAppMessage(payload: NotificationPayload): string {
  const impactEmoji = {
    low: '🟡',
    medium: '🟠',
    high: '🔴',
  }[payload.impact] || '⚪'

  const buildEmoji = payload.buildPassed ? '✅' : '❌'

  return `🤖 *AutoDev — Nouvelle amélioration*

📦 *Projet :* ${payload.project}
🏷️ *Type :* ${payload.module}
${impactEmoji} *Impact :* ${payload.impact}
📝 *Branche :* ${payload.branch}

*${payload.title}*
${payload.description}

📁 *Fichiers modifiés :*
${payload.filesChanged.map(f => `  • ${f}`).join('\n')}

Build : ${buildEmoji} ${payload.buildPassed ? 'Passé' : 'Échoué'}

🔗 *Review :* ${payload.compareUrl || 'N/A'}

_Réponds "merge" pour approuver ou "skip" pour ignorer._`
}

/**
 * Send a simple status notification (e.g., agent started, error, etc.)
 */
export async function notifyStatus(message: string): Promise<void> {
  const config = loadConfig()

  if (config.dryRun) {
    log('info', 'notifier', `[DRY RUN] Status: ${message}`)
    return
  }

  try {
    await sendViaEndpoint(config, `🤖 *AutoDev Status*\n\n${message}`)
  } catch {
    log('warn', 'notifier', `Could not send status notification`)
  }
}
