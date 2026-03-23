export interface RepoConfig {
  name: string
  url: string
  localPath: string
  buildCmd: string
  mainBranch: string
  /** Key files the analyzer should always read for context */
  keyFiles: string[]
}

export interface Config {
  repos: Record<string, RepoConfig>
  schedule: string
  dryRun: boolean
  llm: {
    model: string
    fallback: string
    apiKey: string
    openaiKey: string
    tinyfishKey: string
    elevenlabsKey: string
  }
  notify: {
    phone: string
    url: string
    secret: string
  }
  github: {
    token: string
  }
}

function env(key: string, fallback = ''): string {
  return process.env[key] || fallback
}

export function loadConfig(): Config {
  return {
    repos: {
      zeroname: {
        name: 'zeroname',
        url: env('ZERONAME_REPO_URL', 'https://github.com/BigOD2307/zeroname.git'),
        localPath: '/tmp/autodev/zeroname',
        buildCmd: 'npm run build',
        mainBranch: 'main',
        keyFiles: [
          'lib/aiAnalyzer.ts',
          'lib/openRouter.ts',
          'lib/jobsAgent.ts',
          'lib/blog.ts',
          'middleware.ts',
          'next.config.js',
          'app/layout.tsx',
          'app/page.tsx',
          'lib/auth.ts',
          'lib/rateLimit.ts',
          'lib/credits.ts',
          'lib/db.ts',
        ],
      },
      insideai: {
        name: 'insideai',
        url: env('INSIDEAI_REPO_URL', 'https://github.com/BigOD2307/InsideAI---The-APP-.git'),
        localPath: '/tmp/autodev/insideai',
        buildCmd: 'echo "Flutter project — skipping full build"',
        mainBranch: 'main',
        keyFiles: [
          'lib/main.dart',
          'lib/services/api_service.dart',
          'lib/services/openai_service.dart',
          'pubspec.yaml',
          'README.md',
        ],
      },
    },
    schedule: env('AUTODEV_SCHEDULE', '0 */4 * * *'),
    dryRun: env('AUTODEV_DRY_RUN', 'false') === 'true',
    llm: {
      model: env('LLM_MODEL', ''), // Empty = smart router picks the best model
      fallback: env('LLM_FALLBACK', 'deepseek/deepseek-v3.2'),
      apiKey: env('OPENROUTER_API_KEY'),
      openaiKey: env('OPENAI_API_KEY'),
      tinyfishKey: env('TINYFISH_API_KEY'),
      elevenlabsKey: env('ELEVENLABS_API_KEY'),
    },
    notify: {
      phone: env('NOTIFY_PHONE'),
      url: env('ZERONAME_NOTIFY_URL', 'https://zeroname.space/api/autodev/notify'),
      secret: env('AUTODEV_SECRET'),
    },
    github: {
      token: env('GITHUB_TOKEN'),
    },
  }
}
