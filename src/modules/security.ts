import { exec } from 'child_process'
import type { RepoConfig } from '../config.js'
import { analyzeForImprovement, type Improvement } from '../core/analyzer.js'
import { readRepoFile, listRepoFiles } from '../core/git.js'
import { log } from '../utils/logger.js'

interface SecurityIssue { file: string; type: string; severity: string; detail: string }

export async function runSecurityModule(repo: RepoConfig): Promise<Improvement | null> {
  log('info', 'security', `Starting security analysis for ${repo.name}`)

  const issues = await quickSecurityScan(repo)
  if (issues.length > 0) {
    const critical = issues.filter(i => i.severity === 'critical' || i.severity === 'high')
    log('info', 'security', `Found ${issues.length} issues (${critical.length} high/critical)`, issues.slice(0, 5))
  }

  return analyzeForImprovement(repo, 'security')
}

async function quickSecurityScan(repo: RepoConfig): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = []
  try {
    const apiFiles = await listRepoFiles(repo, '**/api/**/route.{ts,js}')

    for (const file of apiFiles) {
      const content = readRepoFile(repo, file)
      if (!content) continue
      if (file.includes('/cron/') || file.includes('/webhook')) continue

      const hasAuth = /getAuth|verifyToken|Authorization|authenticate|requireAuth|CRON_SECRET/i.test(content)
      if (!hasAuth && content.includes('export async function POST')) {
        issues.push({ file, type: 'no-auth', severity: 'high', detail: 'POST without auth' })
      }

      const hasValidation = /zod|\.parse\(|\.safeParse\(|ajv|joi|yup/i.test(content)
      if (!hasValidation && content.includes('request.json()')) {
        issues.push({ file, type: 'no-validation', severity: 'medium', detail: 'No input validation' })
      }
    }

    const clientFiles = await listRepoFiles(repo, '{app,src,pages}/**/*.{tsx,jsx}')
    for (const file of clientFiles.slice(0, 30)) {
      const content = readRepoFile(repo, file)
      if (!content) continue
      if (content.includes("'use client'") && content.match(/process\.env\.\w+/) && !content.match(/process\.env\.(NEXT_PUBLIC_|REACT_APP_|VITE_)/)) {
        issues.push({ file, type: 'env-exposure', severity: 'critical', detail: 'Server env in client' })
      }
      if (content.includes('dangerouslySetInnerHTML')) {
        issues.push({ file, type: 'xss-risk', severity: 'medium', detail: 'dangerouslySetInnerHTML' })
      }
    }
  } catch { /* ignore */ }
  return issues
}
