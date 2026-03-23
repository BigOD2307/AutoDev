import { exec } from 'child_process'
import { type RepoConfig } from '../config.js'
import { log } from '../utils/logger.js'

export interface BuildResult {
  success: boolean
  stdout: string
  stderr: string
  durationMs: number
  errors: string[]
}

const BUILD_TIMEOUT_MS = 300_000 // 5 minutes

/**
 * Run the build command for a repo and return the result.
 * Never throws — always returns a BuildResult.
 */
export async function verifyBuild(repo: RepoConfig): Promise<BuildResult> {
  log('info', 'builder', `Running build for ${repo.name}: ${repo.buildCmd}`)
  const start = Date.now()

  return new Promise((resolve) => {
    const child = exec(repo.buildCmd, {
      cwd: repo.localPath,
      timeout: BUILD_TIMEOUT_MS,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      env: {
        ...process.env,
        NODE_ENV: 'production',
        // Disable telemetry/analytics during build
        NEXT_TELEMETRY_DISABLED: '1',
        // Placeholder env vars so Next.js build doesn't crash on missing keys
        // These are only used during build-time static generation, not at runtime
        RESEND_API_KEY: process.env.RESEND_API_KEY || 're_placeholder',
        RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
        JWT_SECRET: process.env.JWT_SECRET || 'build-placeholder-secret',
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'sk-placeholder',
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || 'sk-or-placeholder',
      },
    }, (error, stdout, stderr) => {
      const durationMs = Date.now() - start
      const errors = extractErrors(stderr + '\n' + stdout)

      if (error) {
        log('error', 'builder', `Build failed for ${repo.name} (${durationMs}ms)`, {
          errorCount: errors.length,
          firstErrors: errors.slice(0, 5),
        })
        resolve({
          success: false,
          stdout: stdout.slice(-3000),
          stderr: stderr.slice(-3000),
          durationMs,
          errors,
        })
        return
      }

      log('success', 'builder', `Build passed for ${repo.name} (${durationMs}ms)`)
      resolve({
        success: true,
        stdout: stdout.slice(-2000),
        stderr: stderr.slice(-2000),
        durationMs,
        errors: [],
      })
    })

    // Kill on timeout
    setTimeout(() => {
      child.kill('SIGTERM')
    }, BUILD_TIMEOUT_MS + 5000)
  })
}

/**
 * Run npm install / dependency install for a repo.
 */
export async function installDeps(repo: RepoConfig): Promise<boolean> {
  log('info', 'builder', `Installing deps for ${repo.name}`)

  return new Promise((resolve) => {
    exec('npm install --no-audit --no-fund', {
      cwd: repo.localPath,
      timeout: 180_000, // 3 minutes
      maxBuffer: 5 * 1024 * 1024,
    }, (error) => {
      if (error) {
        log('error', 'builder', `npm install failed for ${repo.name}`, { error: String(error) })
        resolve(false)
        return
      }
      log('success', 'builder', `Deps installed for ${repo.name}`)
      resolve(true)
    })
  })
}

/**
 * Run a quick TypeScript type check without full build.
 */
export async function typeCheck(repo: RepoConfig): Promise<BuildResult> {
  log('info', 'builder', `Type checking ${repo.name}`)
  const start = Date.now()

  return new Promise((resolve) => {
    exec('npx tsc --noEmit --pretty 2>&1', {
      cwd: repo.localPath,
      timeout: 120_000,
      maxBuffer: 5 * 1024 * 1024,
    }, (error, stdout, stderr) => {
      const durationMs = Date.now() - start
      const combined = stdout + '\n' + stderr
      const errors = extractErrors(combined)

      resolve({
        success: !error,
        stdout: stdout.slice(-3000),
        stderr: stderr.slice(-3000),
        durationMs,
        errors,
      })
    })
  })
}

function extractErrors(output: string): string[] {
  const lines = output.split('\n')
  const errors: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    // TypeScript errors: src/file.ts(10,5): error TS2345: ...
    if (/error\s+TS\d+/.test(trimmed)) {
      errors.push(trimmed)
      continue
    }
    // ESLint errors
    if (/\d+:\d+\s+error\s+/.test(trimmed)) {
      errors.push(trimmed)
      continue
    }
    // Generic errors
    if (/^Error:|^ERR!|^FATAL|TypeError:|SyntaxError:/.test(trimmed)) {
      errors.push(trimmed)
    }
  }

  return errors.slice(0, 20) // Max 20 errors
}
