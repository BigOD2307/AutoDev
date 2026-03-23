import simpleGit, { SimpleGit } from 'simple-git'
import fs from 'fs'
import path from 'path'
import { loadConfig, type RepoConfig } from '../config.js'
import { log } from '../utils/logger.js'

function getAuthUrl(url: string): string {
  const config = loadConfig()
  if (!config.git.token) return url
  return url.replace('https://github.com/', `https://${config.git.token}@github.com/`)
}

export async function cloneOrPull(repo: RepoConfig): Promise<SimpleGit> {
  const parentDir = path.dirname(repo.localPath)
  if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true })

  const config = loadConfig()

  if (fs.existsSync(path.join(repo.localPath, '.git'))) {
    log('info', 'git', `Pulling latest for ${repo.name}`)
    const git = simpleGit(repo.localPath)
    await git.raw(['checkout', '--', '.'])
    await git.clean('f', ['-d'])
    await git.checkout(repo.mainBranch)
    await git.pull('origin', repo.mainBranch)
    return git
  }

  log('info', 'git', `Cloning ${repo.name}`)
  const authUrl = getAuthUrl(repo.url)
  await simpleGit().clone(authUrl, repo.localPath, ['--depth', '50'])

  const git = simpleGit(repo.localPath)
  await git.addConfig('user.email', config.git.authorEmail)
  await git.addConfig('user.name', config.git.authorName)
  return git
}

export async function createBranch(repo: RepoConfig, moduleName: string): Promise<string> {
  const config = loadConfig()
  const git = simpleGit(repo.localPath)
  const date = new Date().toISOString().split('T')[0]
  const uid = Date.now().toString(36)
  const branchName = `${config.git.branchPrefix}/${moduleName}/${date}-${uid}`

  await git.checkout(repo.mainBranch)
  await git.checkoutLocalBranch(branchName)
  log('info', 'git', `Created branch ${branchName}`)
  return branchName
}

export async function commitAndPush(
  repo: RepoConfig, branchName: string, message: string, files: string[]
): Promise<void> {
  const config = loadConfig()
  const git = simpleGit(repo.localPath)

  for (const file of files) await git.add(file)
  await git.commit(message)

  if (!config.agent.dryRun) {
    const authUrl = getAuthUrl(repo.url)
    await git.remote(['set-url', 'origin', authUrl])
    await git.push('origin', branchName, ['--set-upstream'])
    log('success', 'git', `Pushed ${branchName}`)
  } else {
    log('info', 'git', `[DRY RUN] Would push ${branchName}`)
  }
}

export async function discardChanges(repo: RepoConfig): Promise<void> {
  const git = simpleGit(repo.localPath)
  await git.raw(['checkout', '--', '.'])
  await git.clean('f', ['-d'])
  await git.checkout(repo.mainBranch)
  log('info', 'git', `Discarded changes in ${repo.name}`)
}

export function getCompareUrl(repo: RepoConfig, branchName: string): string {
  const match = repo.url.match(/github\.com\/([^/]+\/[^/.]+)/)
  if (!match) return ''
  return `https://github.com/${match[1]}/compare/${repo.mainBranch}...${branchName}`
}

export function readRepoFile(repo: RepoConfig, filePath: string): string | null {
  const fullPath = path.join(repo.localPath, filePath)
  try { return fs.readFileSync(fullPath, 'utf-8') } catch { return null }
}

export function writeRepoFile(repo: RepoConfig, filePath: string, content: string): void {
  const fullPath = path.join(repo.localPath, filePath)
  const dir = path.dirname(fullPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(fullPath, content, 'utf-8')
}

export async function listRepoFiles(repo: RepoConfig, pattern: string): Promise<string[]> {
  const { glob } = await import('glob')
  return glob(pattern, {
    cwd: repo.localPath,
    nodir: true,
    ignore: ['node_modules/**', '.git/**', 'dist/**', '.next/**', 'build/**'],
  })
}
