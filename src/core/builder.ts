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

const BUILD_TIMEOUT_MS = 300_000

export async function verifyBuild(repo: RepoConfig): Promise<BuildResult> {
  log('info', 'builder', `Building ${repo.name}: ${repo.buildCmd}`)
  const start = Date.now()

  return new Promise((resolve) => {
    const child = exec(repo.buildCmd, {
      cwd: repo.localPath,
      timeout: BUILD_TIMEOUT_MS,
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        NEXT_TELEMETRY_DISABLED: '1',
        // Placeholder values so builds don't crash on missing env vars
        // These are only used during static generation, never at runtime
        ...(Object.fromEntries(
          Object.entries(process.env)
            .filter(([k]) => k.startsWith('PLACEHOLDER_'))
            .map(([k, v]) => [k.replace('PLACEHOLDER_', ''), v])
        )),
      },
    }, (error, stdout, stderr) => {
      const durationMs = Date.now() - start
      const errors = extractErrors(stderr + '\n' + stdout)

      if (error) {
        log('error', 'builder', `Build failed (${durationMs}ms)`, { errors: errors.slice(0, 5) })
        resolve({ success: false, stdout: stdout.slice(-3000), stderr: stderr.slice(-3000), durationMs, errors })
        return
      }

      log('success', 'builder', `Build passed (${durationMs}ms)`)
      resolve({ success: true, stdout: stdout.slice(-2000), stderr: stderr.slice(-2000), durationMs, errors: [] })
    })

    setTimeout(() => child.kill('SIGTERM'), BUILD_TIMEOUT_MS + 5000)
  })
}

export async function installDeps(repo: RepoConfig): Promise<boolean> {
  const cmd = repo.installCmd || 'npm install --no-audit --no-fund'
  log('info', 'builder', `Installing deps for ${repo.name}`)

  return new Promise((resolve) => {
    exec(cmd, { cwd: repo.localPath, timeout: 180_000, maxBuffer: 5 * 1024 * 1024 }, (error) => {
      if (error) {
        log('error', 'builder', `Install failed: ${error}`)
        resolve(false)
        return
      }
      log('success', 'builder', `Deps installed`)
      resolve(true)
    })
  })
}

function extractErrors(output: string): string[] {
  const errors: string[] = []
  for (const line of output.split('\n')) {
    const t = line.trim()
    if (/error\s+TS\d+/.test(t) || /\d+:\d+\s+error\s+/.test(t) ||
        /^Error:|^ERR!|^FATAL|TypeError:|SyntaxError:|ReferenceError:/.test(t)) {
      errors.push(t)
    }
  }
  return errors.slice(0, 20)
}
