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
 * Send a notification about an improvement.
 * Supports multiple channels: webhook, slack, discord.
 */
export async function notifyImprovement(
  repo: RepoConfig, improvement: Improvement, branch: string, buildPassed: boolean
): Promise<void> {
  const config = loadConfig()

  const payload: NotificationPayload = {
    project: repo.name,
    module: improvement.module,
    branch,
    title: improvement.title,
    description: improvement.description,
    impact: improvement.impact,
    filesChanged: improvement.changes.map(c => c.filePath),
    buildPassed,
    compareUrl: getCompareUrl(repo, branch),
  }

  if (config.agent.dryRun) {
    log('info', 'notifier', `[DRY RUN] Would notify:\n${formatMessage(payload)}`)
    return
  }

  if (!config.notifications.enabled || config.notifications.channels.length === 0) {
    log('info', 'notifier', `Notifications disabled. Improvement: ${improvement.title}`)
    return
  }

  for (const channel of config.notifications.channels) {
    try {
      await sendToChannel(channel, payload)
      log('success', 'notifier', `Notified via ${channel.type}`)
    } catch (err) {
      log('warn', 'notifier', `${channel.type} notification failed: ${err}`)
    }
  }
}

async function sendToChannel(
  channel: { type: string; url: string; secret?: string; token?: string },
  payload: NotificationPayload
): Promise<void> {
  const message = formatMessage(payload)

  switch (channel.type) {
    case 'webhook': {
      const res = await fetch(channel.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: channel.secret,
          message,
          payload,
        }),
      })
      if (!res.ok) throw new Error(`Webhook ${res.status}`)
      break
    }
    case 'slack': {
      const res = await fetch(channel.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      })
      if (!res.ok) throw new Error(`Slack ${res.status}`)
      break
    }
    case 'discord': {
      const res = await fetch(channel.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message.slice(0, 2000) }),
      })
      if (!res.ok) throw new Error(`Discord ${res.status}`)
      break
    }
    default:
      log('warn', 'notifier', `Unknown channel type: ${channel.type}`)
  }
}

function formatMessage(payload: NotificationPayload): string {
  const impactIcon = { low: 'LOW', medium: 'MEDIUM', high: 'HIGH' }[payload.impact] || payload.impact
  const buildStatus = payload.buildPassed ? 'PASSED' : 'FAILED'

  return `AutoDev — New Improvement

Project: ${payload.project}
Module:  ${payload.module}
Impact:  ${impactIcon}
Branch:  ${payload.branch}

${payload.title}
${payload.description}

Files changed:
${payload.filesChanged.map(f => `  - ${f}`).join('\n')}

Build: ${buildStatus}
Review: ${payload.compareUrl || 'N/A'}`
}

export async function notifyStatus(message: string): Promise<void> {
  const config = loadConfig()
  if (config.agent.dryRun || !config.notifications.enabled) {
    log('info', 'notifier', `[Status] ${message}`)
    return
  }

  for (const channel of config.notifications.channels) {
    try {
      await sendToChannel(channel, {
        project: 'system', module: 'status', branch: '', title: message,
        description: '', impact: 'low', filesChanged: [], buildPassed: true, compareUrl: '',
      })
    } catch { /* silent */ }
  }
}
