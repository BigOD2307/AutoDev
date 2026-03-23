<p align="center">
  <img src="https://img.shields.io/badge/AutoDev-Agent-blueviolet?style=for-the-badge&logo=robot&logoColor=white" alt="AutoDev Agent" />
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/LLM_Models-10+-FF6F00?style=for-the-badge&logo=openai&logoColor=white" alt="LLMs" />
</p>

<h1 align="center">AutoDev Agent</h1>

<p align="center">
  <strong>The autonomous AI agent that continuously improves your codebase while you sleep.</strong>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &bull;
  <a href="#how-it-works">How It Works</a> &bull;
  <a href="#configuration">Configuration</a> &bull;
  <a href="#smart-router">Smart Router</a> &bull;
  <a href="#modules">Modules</a> &bull;
  <a href="#memory-system">Memory</a> &bull;
  <a href="#deploy">Deploy</a>
</p>

---

AutoDev is an autonomous AI agent inspired by [Karpathy's autoresearch](https://github.com/karpathy/autoresearch) pattern. It runs on a schedule, analyzes your production codebase, generates targeted improvements (security, performance, SEO, content, AI quality), verifies everything compiles, and creates a Git branch for your review.

**Zero risk.** AutoDev never pushes to `main`. Every change goes to a separate branch, every build is verified, and every failure is automatically reverted. You review and merge when ready.

```
You sleep.                          AutoDev works.
  zzz...                              Analyzing code...
  zzz...                              Found: missing rate limiting on /api/auth
  zzz...                              Applied fix. Build passed.
  zzz...                              Branch: autodev/security/2026-03-23
  *wake up*                            Notification: "New improvement ready for review"
  *review diff*
  *merge*
```

---

## Why AutoDev?

Most codebases have dozens of improvements waiting to happen — missing meta tags, unvalidated API inputs, static imports that could be lazy-loaded, prompts that could be sharper. You know they're there. You just don't have time.

AutoDev handles the backlog while you focus on features.

| What AutoDev does | What you do |
|---|---|
| Scans for security vulnerabilities | Review the PR |
| Optimizes performance bottlenecks | Click merge |
| Adds missing SEO tags | Ship features |
| Generates blog content | Sleep |
| Improves AI prompts | Get coffee |

---

## Quick Start

### Option 1: Single project (no config file needed)

```bash
git clone https://github.com/BigOD2307/AutoDev.git
cd AutoDev
npm install

# Set your keys
export OPENROUTER_API_KEY=sk-or-v1-xxxx
export GITHUB_TOKEN=ghp_xxxx
export AUTODEV_REPO_URL=https://github.com/you/your-project.git
export AUTODEV_PROJECT_NAME=my-project
export AUTODEV_DRY_RUN=true
export AUTODEV_RUN_NOW=true

# Run
npx tsx src/index.ts
```

### Option 2: Multi-project with config file

```bash
cp autodev.config.example.json autodev.config.json
# Edit autodev.config.json with your projects
cp .env.example .env
# Edit .env with your API keys

npm run dry-run
```

---

## How It Works

```
Every 4 hours (configurable)
         |
         v
  +------------------+
  | 1. Pick module   |  Intelligent rotation based on history & memory
  | (security, perf, |  Skips modules that keep failing
  |  seo, content,   |
  |  quality)        |
  +--------+---------+
           |
           v
  +------------------+
  | 2. Pull latest   |  git pull origin main
  +--------+---------+
           |
           v
  +------------------+
  | 3. Smart Router  |  Picks the best LLM model for the task
  | picks LLM model  |  (DeepSeek, Qwen, Gemini, MiniMax, etc.)
  +--------+---------+
           |
           v
  +------------------+
  | 4. LLM analyzes  |  Reads key files, understands the codebase,
  | and generates    |  proposes ONE targeted improvement
  | improvement      |  Includes memory of past failures to avoid
  +--------+---------+
           |
           v
  +------------------+
  | 5. Apply changes |  Write modified files
  +--------+---------+
           |
           v
  +------------------+
  | 6. Build check   |  npm run build (or your build command)
  +--------+---------+
           |
      +----+----+
      |         |
   PASS       FAIL
      |         |
      v         v
  +-------+ +--------+
  | Push  | | Revert |  git checkout -- . && git clean -fd
  | branch| | Auto   |  Record failure in memory
  +---+---+ +---+----+  Learn from the mistake
      |         |
      v         v
  +-------+ +------+
  | Notify| | Log  |
  +-------+ +------+
```

---

## Configuration

### `autodev.config.json`

This is the main configuration file. It defines your projects, modules, and preferences.

```jsonc
{
  "agent": {
    "name": "AutoDev",
    "schedule": "0 */4 * * *",    // Every 4 hours
    "language": "en",
    "dryRun": false
  },
  "projects": [
    {
      "name": "my-saas",
      "repo": "https://github.com/you/my-saas.git",
      "branch": "main",
      "buildCommand": "npm run build",
      "framework": "nextjs",               // nextjs, react, vue, svelte, etc.
      "modules": ["security", "performance", "seo", "quality"],
      "keyFiles": [
        "app/layout.tsx",
        "app/page.tsx",
        "middleware.ts",
        "lib/auth.ts"
      ],
      "paths": {
        "pages": "app/",
        "api": "app/api/",
        "config": "next.config.js"
      },
      "content": {
        "enabled": true,
        "blogFile": "lib/blog.ts",
        "topics": ["saas-growth", "product-management", "ai-tools"],
        "targetAudience": "SaaS founders",
        "language": "en"
      }
    }
  ],
  "notifications": {
    "enabled": true,
    "channels": [
      { "type": "slack", "url": "https://hooks.slack.com/services/xxx" },
      { "type": "discord", "url": "https://discord.com/api/webhooks/xxx" },
      { "type": "webhook", "url": "https://my-app.com/api/notify", "secret": "xxx" }
    ]
  },
  "git": {
    "authorName": "AutoDev Agent",
    "authorEmail": "autodev@my-company.com",
    "branchPrefix": "autodev"
  }
}
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key ([get one here](https://openrouter.ai/keys)) |
| `GITHUB_TOKEN` | Yes | GitHub token with `repo` scope |
| `AUTODEV_DRY_RUN` | No | `true` = analyze without pushing (default: `false`) |
| `AUTODEV_RUN_NOW` | No | `true` = run immediately on startup |
| `AUTODEV_SCHEDULE` | No | Cron schedule (default: `0 */4 * * *`) |
| `NOTIFY_WEBHOOK_URL` | No | Webhook URL for notifications |
| `AUTODEV_SECRET` | No | Shared secret for webhook auth |
| `TINYFISH_API_KEY` | No | TinyFish API for web search (content module) |
| `OPENAI_API_KEY` | No | OpenAI fallback key |

---

## Smart Router

AutoDev doesn't rely on a single LLM. It has an **intelligent router** that picks the best model for each task type, optimizing for quality-to-cost ratio.

### 10 Models Available

| Model | Cost (in/out per 1M tokens) | Quality | Speed | Best for |
|---|---|---|---|---|
| **DeepSeek V3.2** | $0.14 / $0.28 | 92/100 | Fast | Code, Analysis |
| **DeepSeek R1** | $0.55 / $2.19 | 95/100 | Slow | Deep analysis |
| **Gemini 2.5 Flash** | $0.15 / $0.60 | 88/100 | Fast | Analysis, Content |
| **MiniMax M1** | $0.20 / $1.10 | 87/100 | Medium | Code, Content |
| **Qwen 3 235B** | $0.14 / $0.30 | 90/100 | Medium | Code, Analysis |
| **Llama 4 Maverick** | $0.20 / $0.60 | 85/100 | Fast | Code, General |
| **Mistral Medium 3** | $0.40 / $2.00 | 88/100 | Medium | Code, Content |
| **Claude Haiku 4.5** | $0.80 / $4.00 | 91/100 | Fast | Code, Evaluation |
| **Gemini 2.5 Pro** | $1.25 / $10.00 | 94/100 | Slow | Deep evaluation |
| **GPT-4o Mini** | $0.15 / $0.60 | 83/100 | Fast | General, Content |

### Routing Algorithm

```
Score = Quality x CostEfficiency x SuccessRate x SpeedBonus x StrengthMatch

CostEfficiency = 1 / (costPerMTokenOut + 0.01)
SuccessRate    = past successes / past attempts (default: 80%)
SpeedBonus     = Fast: 1.3 | Medium: 1.0 | Slow: 0.7
StrengthMatch  = Exact: 1.5 | General: 1.0
```

The router learns over time — if a model keeps failing for a specific task type, its score drops and alternatives are preferred.

### Automatic Fallback

If the primary model fails, AutoDev automatically tries the next best model:

```
Attempt 1: DeepSeek V3.2 → TIMEOUT
Attempt 2: Qwen 3 235B   → SUCCESS
```

### Cost Estimate

| Frequency | Approx. cost/month |
|---|---|
| Every 4 hours (default) | $0.50 - $2.00 |
| Every 2 hours | $1.00 - $4.00 |
| Once daily | $0.10 - $0.50 |

---

## Modules

### Security

Scans your codebase for common vulnerabilities:

- **Missing authentication** on POST/PUT/DELETE API routes
- **No input validation** (detects missing zod, joi, yup)
- **Server env vars in client code** (e.g., `process.env.SECRET` in a `"use client"` file)
- **XSS risks** (dangerouslySetInnerHTML usage)
- **Missing rate limiting** on auth/payment routes
- **npm audit** vulnerabilities

### Performance

Detects and fixes performance anti-patterns:

- Static imports of heavy libraries (framer-motion, charts)
- Raw `<img>` tags instead of optimized components
- Sequential `await` calls that could be parallelized
- Dynamic imports without loading states
- Large icon library imports

### SEO

Improves search engine optimization:

- Missing `generateMetadata()` on pages
- Missing Open Graph and Twitter Card tags
- Missing JSON-LD structured data
- Missing sitemap.xml and robots.txt
- Missing alt tags on images
- Missing canonical URLs

### Content

Generates SEO-optimized blog articles:

- Reads your existing blog system format
- Avoids duplicate topics
- Researches trending topics via web search
- Generates in the same language as your existing content
- Configurable target audience and topics

### Quality

Improves AI system prompts:

- Detects system prompts in your codebase
- Evaluates clarity, completeness, and consistency
- Suggests targeted improvements
- Never changes output format or business logic

---

## Memory System

AutoDev has a **persistent memory** that survives across runs. This is what makes it genuinely intelligent — it learns from every success and failure.

### What it remembers

| Memory type | Purpose |
|---|---|
| **Success rate** per module per project | Knows which modules work well |
| **Error patterns** | Avoids repeating the same mistakes |
| **Fragile files** | Files that often break builds get extra caution |
| **Successful strategies** | Reuses approaches that worked before |
| **File risk scores** | Tracks which files are dangerous to modify |

### How it learns

```
Run 1: Modified auth.ts → Build FAILED (missing import)
       Memory: auth.ts risk +2, error pattern recorded

Run 2: Modified auth.ts → Build FAILED (type error)
       Memory: auth.ts risk +2 (now 4), marked as FRAGILE

Run 3: Agent sees auth.ts is fragile → Extra careful prompt
       Modified auth.ts with extra validation → Build PASSED
       Memory: auth.ts risk -1, successful strategy recorded

Run 4: Agent reuses successful strategy context → PASSED
```

### Memory is injected into LLM prompts

The agent tells the LLM about past failures and fragile files:

```
## AGENT MEMORY
Success rate: 75% (6/8)

Errors to AVOID:
- error TS2345 (type mismatch in auth.ts)
- Module not found (missing import)

Fragile files (modify with EXTRA CARE):
- lib/auth.ts (risk: 4)

Strategies that WORKED before:
- Added zod validation to API route
```

### Skip logic

If a module fails 3+ times in a row for a project, AutoDev temporarily skips it and tries another module instead.

---

## Deploy

### Railway (Recommended)

<a href="https://railway.com?referralCode=oPjPCV">
  <img src="https://img.shields.io/badge/Deploy_on-Railway-blueviolet?style=for-the-badge&logo=railway&logoColor=white" alt="Deploy on Railway" />
</a>

> Get **$20 free credit** using our referral link: [railway.com?referralCode=oPjPCV](https://railway.com?referralCode=oPjPCV)

1. Fork this repo
2. Go to [Railway](https://railway.com?referralCode=oPjPCV) → New Project → Deploy from GitHub
3. Select your forked repo
4. Add environment variables (see [Configuration](#environment-variables))
5. Railway detects the Dockerfile and deploys automatically

### Docker

```bash
docker build -t autodev-agent .
docker run --env-file .env autodev-agent
```

### VPS / Any Server

```bash
git clone https://github.com/BigOD2307/AutoDev.git
cd AutoDev
npm install
npm run build
# Set environment variables
node dist/index.js
```

### PM2 (Process Manager)

```bash
npm run build
pm2 start dist/index.js --name autodev
pm2 save
```

---

## Project Structure

```
autodev-agent/
├── src/
│   ├── index.ts              # Entry point + cron scheduler
│   ├── config.ts             # Dynamic configuration loader
│   ├── core/
│   │   ├── agent.ts          # Main improvement loop
│   │   ├── analyzer.ts       # LLM-powered code analysis
│   │   ├── builder.ts        # Build verification
│   │   ├── git.ts            # Git operations (clone, branch, push)
│   │   └── notifier.ts       # Multi-channel notifications
│   ├── modules/
│   │   ├── seo.ts            # SEO improvements
│   │   ├── content.ts        # Blog content generation
│   │   ├── performance.ts    # Performance optimizations
│   │   ├── security.ts       # Security auditing
│   │   └── quality.ts        # AI prompt improvement
│   ├── memory/
│   │   └── index.ts          # Persistent learning system
│   └── utils/
│       ├── llm.ts            # Unified LLM client
│       ├── router.ts         # Smart model routing (10 models)
│       └── logger.ts         # Structured logging
├── autodev.config.example.json
├── Dockerfile
├── LICENSE.md
└── docs/
    └── program-template.md   # Project configuration template
```

---

## Safety

AutoDev is designed with **5 layers of protection** to ensure it never breaks your production:

| Layer | Protection |
|---|---|
| **Git isolation** | Never touches `main`. Always creates a separate branch. |
| **Build verification** | Runs your full build command after every change. |
| **Auto-revert** | If build fails, all changes are immediately discarded. |
| **Human review** | You must manually review and merge every improvement. |
| **Memory** | Remembers past failures and avoids repeating them. |

---

## Supported Frameworks

AutoDev is framework-agnostic but works best with:

| Framework | Support level | Notes |
|---|---|---|
| **Next.js** | Excellent | Full module support including SEO |
| **React** | Excellent | All modules except SSR-specific SEO |
| **Vue / Nuxt** | Good | Detects Vue files and patterns |
| **Svelte / SvelteKit** | Good | Detects Svelte files and patterns |
| **Express / Fastify** | Good | Security and performance modules |
| **Flutter** | Basic | Security and quality modules |
| **Any Node.js** | Good | Security, performance, quality |

To add support for a new framework, configure `keyFiles` and `paths` in your `autodev.config.json`.

---

## FAQ

<details>
<summary><strong>Can AutoDev break my production?</strong></summary>

No. AutoDev never pushes to your main branch. It always creates a separate branch, verifies the build passes, and only then pushes. If the build fails, everything is automatically reverted. You must manually review and merge.
</details>

<details>
<summary><strong>How much does it cost?</strong></summary>

- **LLM costs**: $0.50-$2.00/month (using cheap models via OpenRouter)
- **Hosting**: ~$5/month on Railway
- **Total**: ~$5-7/month for continuous code improvement
</details>

<details>
<summary><strong>Can I use my own LLM / API?</strong></summary>

Yes. AutoDev uses OpenRouter which gives you access to 200+ models. You can also configure a specific model via `LLM_MODEL` env var. OpenAI direct is supported as a fallback.
</details>

<details>
<summary><strong>Can I add my own improvement modules?</strong></summary>

Yes. Create a new file in `src/modules/`, export a runner function, and register it in `src/core/agent.ts`. See existing modules for the pattern.
</details>

<details>
<summary><strong>Does it support monorepos?</strong></summary>

Yes. Configure multiple projects in `autodev.config.json`, each with its own build command and key files.
</details>

<details>
<summary><strong>Can I run it locally instead of Railway?</strong></summary>

Yes. Use `npm run dry-run` for testing or `npm start` for production. You can also use PM2, Docker, or any process manager.
</details>

---

## Contributing

Contributions are welcome! Here's how:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push and open a PR

### Adding a new module

1. Create `src/modules/mymodule.ts`
2. Export a runner function: `runMyModule(repo: RepoConfig): Promise<Improvement | null>`
3. Add the module type to `ImprovementModule` in `analyzer.ts`
4. Add the prompt in `MODULE_PROMPTS`
5. Register the runner in `MODULE_RUNNERS` in `agent.ts`

### Adding a new LLM model

Edit `src/utils/router.ts` and add to the `MODELS` array:

```typescript
{
  id: 'provider/model-name',
  name: 'Display Name',
  costIn: 0.10,
  costOut: 0.50,
  contextWindow: 128000,
  strengths: ['code', 'analysis'],
  quality: 85,
  speed: 'fast',
}
```

---

## Credits

Created by **[Ousmane Dicko](https://github.com/BigOD2307)** at **[Dicken AI](https://dickenai.com)**

Inspired by [autoresearch](https://github.com/karpathy/autoresearch) by Andrej Karpathy.

---

## License

AutoDev is **free to use** for personal and internal projects with attribution. Commercial use (resale, SaaS, white-labeling) requires a [commercial license](mailto:ousmane@dickenai.com).

See [LICENSE.md](LICENSE.md) for full terms.

---

<p align="center">
  <strong>AutoDev Agent</strong> by <a href="https://dickenai.com">Dicken AI</a>
  <br/>
  <sub>The AI that improves your code while you sleep.</sub>
</p>
