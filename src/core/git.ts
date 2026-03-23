import simpleGit, { SimpleGit } from 'simple-git'
import fs from 'fs'
import path from 'path'
import { loadConfig, type RepoConfig } from '../config.js'
import { log } from '../utils/logger.js'

function getAuthUrl(url: string): string {
  const config = loadConfig()
  if (!config.github.token) return url
  // https://github.com/user/repo.git → https://TOKEN@github.com/user/repo.git
  return url.replace('https://github.com/', `https://${config.github.token}@github.com/`)
}

/**
 * Clone a repo if it doesn't exist locally, otherwise pull latest from main.
 */
export async function cloneOrPull(repo: RepoConfig): Promise<SimpleGit> {
  const parentDir = path.dirname(repo.localPath)
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true })
  }

  if (fs.existsSync(path.join(repo.localPath, '.git'))) {
    log('info', 'git', `Pulling latest for ${repo.name}`)
    const git = simpleGit(repo.localPath)

    // Discard any leftover changes from previous runs
    await git.raw(['checkout', '--', '.'])
    await git.clean('f', ['-d'])
    await git.checkout(repo.mainBranch)
    await git.pull('origin', repo.mainBranch)

    return git
  }

  log('info', 'git', `Cloning ${repo.name} from ${repo.url}`)
  const authUrl = getAuthUrl(repo.url)
  await simpleGit().clone(authUrl, repo.localPath, ['--depth', '50'])

  const git = simpleGit(repo.localPath)
  // Configure git identity for commits
  await git.addConfig('user.email', 'autodev@dickenai.com')
  await git.addConfig('user.name', 'AutoDev Agent')

  return git
}

/**
 * Create a new branch from main for an improvement.
 */
export async function createBranch(repo: RepoConfig, moduleName: string): Promise<string> {
  const git = simpleGit(repo.localPath)
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const timestamp = Date.now().toString(36) // short unique suffix
  const branchName = `autodev/${moduleName}/${date}-${timestamp}`

  await git.checkout(repo.mainBranch)
  await git.checkoutLocalBranch(branchName)

  log('info', 'git', `Created branch ${branchName} for ${repo.name}`)
  return branchName
}

/**
 * Stage specific files, commit, and push the branch.
 */
export async function commitAndPush(
  repo: RepoConfig,
  branchName: string,
  message: string,
  files: string[]
): Promise<void> {
  const config = loadConfig()
  const git = simpleGit(repo.localPath)

  // Stage only the specified files
  for (const file of files) {
    await git.add(file)
  }

  await git.commit(message)

  if (!config.dryRun) {
    const authUrl = getAuthUrl(repo.url)
    // Set remote URL with token for push
    await git.remote(['set-url', 'origin', authUrl])
    await git.push('origin', branchName, ['--set-upstream'])
    log('success', 'git', `Pushed branch ${branchName} to ${repo.name}`)
  } else {
    log('info', 'git', `[DRY RUN] Would push branch ${branchName}`)
  }
}

/**
 * Discard all uncommitted changes and go back to main.
 */
export async function discardChanges(repo: RepoConfig): Promise<void> {
  const git = simpleGit(repo.localPath)
  await git.raw(['checkout', '--', '.'])
  await git.clean('f', ['-d'])
  await git.checkout(repo.mainBranch)
  log('info', 'git', `Discarded changes in ${repo.name}, back to ${repo.mainBranch}`)
}

/**
 * Get the GitHub compare URL for a branch.
 */
export function getCompareUrl(repo: RepoConfig, branchName: string): string {
  // Extract owner/repo from URL: https://github.com/BigOD2307/zeroname.git
  const match = repo.url.match(/github\.com\/([^/]+\/[^/.]+)/)
  if (!match) return ''
  return `https://github.com/${match[1]}/compare/${repo.mainBranch}...${branchName}`
}

/**
 * Read a file from the repo.
 */
export function readRepoFile(repo: RepoConfig, filePath: string): string | null {
  const fullPath = path.join(repo.localPath, filePath)
  try {
    return fs.readFileSync(fullPath, 'utf-8')
  } catch {
    return null
  }
}

/**
 * Write a file in the repo.
 */
export function writeRepoFile(repo: RepoConfig, filePath: string, content: string): void {
  const fullPath = path.join(repo.localPath, filePath)
  const dir = path.dirname(fullPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(fullPath, content, 'utf-8')
}

/**
 * List all files matching a glob pattern in the repo.
 */
export async function listRepoFiles(repo: RepoConfig, pattern: string): Promise<string[]> {
  const { glob } = await import('glob')
  return glob(pattern, {
    cwd: repo.localPath,
    nodir: true,
    ignore: ['node_modules/**', '.git/**', 'dist/**', '.next/**'],
  })
}
