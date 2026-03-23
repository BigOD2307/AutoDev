import { exec } from 'child_process'
import type { RepoConfig } from '../config.js'
import { analyzeForImprovement, type Improvement } from '../core/analyzer.js'
import { readRepoFile, listRepoFiles } from '../core/git.js'
import { log } from '../utils/logger.js'

/**
 * Security improvement module.
 *
 * Targets:
 * - Input validation on API routes (zod schemas)
 * - Rate limiting on sensitive endpoints
 * - Authentication checks on protected routes
 * - CSP headers
 * - npm audit vulnerabilities
 * - API key exposure in client code
 * - SQL injection prevention
 * - XSS prevention
 */

interface SecurityIssue {
  file: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  detail: string
}

export async function runSecurityModule(repo: RepoConfig): Promise<Improvement | null> {
  log('info', 'security', `Starting security analysis for ${repo.name}`)

  // Quick security scan
  const issues = await quickSecurityScan(repo)
  if (issues.length > 0) {
    const critical = issues.filter(i => i.severity === 'critical' || i.severity === 'high')
    log('info', 'security', `Found ${issues.length} potential security issues (${critical.length} high/critical)`, issues.slice(0, 5))
  }

  return analyzeForImprovement(repo, 'security')
}

async function quickSecurityScan(repo: RepoConfig): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = []

  try {
    // Check API routes for missing auth
    const apiFiles = await listRepoFiles(repo, 'app/api/**/route.ts')

    for (const file of apiFiles) {
      const content = readRepoFile(repo, file)
      if (!content) continue

      // Skip cron and webhook routes (they use different auth)
      if (file.includes('/cron/') || file.includes('/webhook')) continue

      // Check for missing authentication
      const hasAuth = content.includes('getAuthEmail') ||
                      content.includes('verifyAdminToken') ||
                      content.includes('verifyCreatorToken') ||
                      content.includes('verifyEntrepriseToken') ||
                      content.includes('CRON_SECRET') ||
                      content.includes('Authorization')

      if (!hasAuth && content.includes('export async function POST')) {
        issues.push({
          file, type: 'no-auth',
          severity: 'high',
          detail: 'POST route without authentication check',
        })
      }

      // Check for missing input validation
      const hasValidation = content.includes('zod') ||
                           content.includes('.parse(') ||
                           content.includes('.safeParse(') ||
                           content.includes('typeof ') ||
                           content.includes('validator')

      if (!hasValidation && content.includes('request.json()')) {
        issues.push({
          file, type: 'no-validation',
          severity: 'medium',
          detail: 'JSON body parsed without validation',
        })
      }

      // Check for rate limiting
      const hasFateLimiting = content.includes('rateLimit') || content.includes('rate_limit')
      if (!hasFateLimiting && (file.includes('/auth/') || file.includes('/analyze'))) {
        issues.push({
          file, type: 'no-rate-limit',
          severity: 'medium',
          detail: 'Sensitive endpoint without rate limiting',
        })
      }
    }

    // Check for client-side API key exposure
    const clientFiles = await listRepoFiles(repo, 'app/**/*.tsx')
    for (const file of clientFiles.slice(0, 30)) {
      const content = readRepoFile(repo, file)
      if (!content) continue

      // Check for non-NEXT_PUBLIC env vars in client code
      if (content.includes("'use client'") || content.includes('"use client"')) {
        if (content.match(/process\.env\.\w+/) && !content.match(/process\.env\.NEXT_PUBLIC_/)) {
          issues.push({
            file, type: 'env-exposure',
            severity: 'critical',
            detail: 'Server env var accessed in client component',
          })
        }
      }
    }

    // Check for dangerouslySetInnerHTML
    for (const file of clientFiles.slice(0, 30)) {
      const content = readRepoFile(repo, file)
      if (!content) continue
      if (content.includes('dangerouslySetInnerHTML')) {
        issues.push({
          file, type: 'xss-risk',
          severity: 'medium',
          detail: 'dangerouslySetInnerHTML used — verify input is sanitized',
        })
      }
    }

  } catch (err) {
    log('warn', 'security', 'Quick scan failed', { error: String(err) })
  }

  return issues
}

/**
 * Run npm audit and return vulnerabilities count.
 */
export async function runNpmAudit(repo: RepoConfig): Promise<{ total: number; critical: number; high: number }> {
  return new Promise((resolve) => {
    exec('npm audit --json 2>/dev/null', {
      cwd: repo.localPath,
      timeout: 30_000,
      maxBuffer: 5 * 1024 * 1024,
    }, (error, stdout) => {
      try {
        const data = JSON.parse(stdout)
        resolve({
          total: data?.metadata?.vulnerabilities?.total || 0,
          critical: data?.metadata?.vulnerabilities?.critical || 0,
          high: data?.metadata?.vulnerabilities?.high || 0,
        })
      } catch {
        resolve({ total: 0, critical: 0, high: 0 })
      }
    })
  })
}
