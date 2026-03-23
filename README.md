<p align="center">
  <img src="https://img.shields.io/badge/v2.0-stable-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/LLMs-10_models-FF6F00?style=flat-square" />
  <img src="https://img.shields.io/badge/License-Free_with_attribution-blue?style=flat-square" />
  <img src="https://img.shields.io/github/stars/BigOD2307/AutoDev?style=flat-square" />
</p>

<br/>

```
     _         _        ____
    / \  _   _| |_ ___ |  _ \  _____   __
   / _ \| | | | __/ _ \| | | |/ _ \ \ / /
  / ___ \ |_| | || (_) | |_| |  __/\ V /
 /_/   \_\__,_|\__\___/|____/ \___| \_/
                                    v2.0
```

<h3 align="center">The autonomous AI agent that continuously improves your codebase.</h3>
<p align="center">Security. Performance. SEO. Content. AI Quality.<br/>All on autopilot. Zero risk.</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> &bull;
  <a href="#-how-it-works">How It Works</a> &bull;
  <a href="#-smart-llm-router">Smart Router</a> &bull;
  <a href="#-modules">Modules</a> &bull;
  <a href="#-memory--learning">Memory</a> &bull;
  <a href="#-dashboard">Dashboard</a> &bull;
  <a href="#-deploy">Deploy</a>
</p>

---

## The Problem

Your codebase has dozens of improvements waiting to happen. Missing meta tags. Unvalidated API inputs. Static imports that should be lazy-loaded. Prompts that could be sharper. You know they're there. You just don't have time.

## The Solution

AutoDev runs every 4 hours. It picks one improvement, applies it, verifies the build passes, and creates a branch for your review. If anything breaks, it automatically reverts. You merge when ready.

```
  You                                     AutoDev
  ----                                    -------
  Sleeping                                Analyzing 38 API routes...
  Sleeping                                Found: /api/auth missing rate limiting
  Sleeping                                Generated fix with DeepSeek V3.2
  Sleeping                                Build passed in 16s
  Sleeping                                Pushed branch: autodev/security/2026-03-24
  Wake up                                 Sent notification: "New improvement ready"
  Review diff on GitHub
  Click merge
```

---

## Why AutoDev?

| Feature | AutoDev | Manual code reviews | Linters |
|---|---|---|---|
| Finds missing auth on routes | Yes | Sometimes | No |
| Generates blog content | Yes | No | No |
| Fixes performance anti-patterns | Yes | Sometimes | Partially |
| Adds JSON-LD structured data | Yes | No | No |
| Improves AI prompts | Yes | No | No |
| Learns from past mistakes | Yes | No | No |
| Runs while you sleep | Yes | No | Yes |
| Zero risk to production | Yes | Depends | Yes |

---

## Quick Start

### 30-second setup (single project)

```bash
git clone https://github.com/BigOD2307/AutoDev.git
cd AutoDev && npm install
```

```bash
export OPENROUTER_API_KEY=sk-or-v1-xxxx    # Get at openrouter.ai/keys
export GITHUB_TOKEN=ghp_xxxx               # github.com/settings/tokens (scope: repo)
export AUTODEV_REPO_URL=https://github.com/you/your-project.git
export AUTODEV_PROJECT_NAME=my-project
export AUTODEV_DRY_RUN=true                # Safe mode first

npx tsx src/index.ts
```

Open `http://localhost:4040` to see the dashboard.

### Multi-project setup

```bash
cp autodev.config.example.json autodev.config.json
```

Edit `autodev.config.json`:

```jsonc
{
  "projects": [
    {
      "name": "my-saas",
      "repo": "https://github.com/you/my-saas.git",
      "framework": "nextjs",
      "modules": ["security", "performance", "seo", "quality"],
      "keyFiles": ["app/layout.tsx", "middleware.ts", "lib/auth.ts"]
    },
    {
      "name": "my-api",
      "repo": "https://github.com/you/my-api.git",
      "framework": "express",
      "modules": ["security", "performance"],
      "keyFiles": ["src/index.ts", "src/middleware.ts"]
    }
  ]
}
```

```bash
npm run dry-run
```

---

## How It Works

```
                         Every 4 hours
                              |
                    +---------v---------+
                    |  Pick next module  |  Intelligent rotation
                    |  Check memory for  |  Skip failing modules
                    |  fragile files     |  Reuse winning strategies
                    +---------+---------+
                              |
                    +---------v---------+
                    |  git pull latest   |
                    |  npm install       |
                    +---------+---------+
                              |
                    +---------v---------+
                    |  Smart Router      |  Picks best model:
                    |  scores 10 models  |  DeepSeek, Qwen, Gemini,
                    |  picks top 3       |  MiniMax, Llama, Claude...
                    +---------+---------+
                              |
                    +---------v---------+
                    |  LLM analyzes code |  Reads key files
                    |  + memory context  |  Knows past errors
                    |  Proposes ONE fix  |  Knows fragile files
                    +---------+---------+
                              |
                    +---------v---------+
                    |  Apply changes     |
                    |  Run build         |
                    +---------+---------+
                              |
                     +--------+--------+
                     |                 |
                  PASSED            FAILED
                     |                 |
              +------v------+   +------v------+
              | git branch  |   | git revert  |
              | git commit  |   | record error|
              | git push    |   | learn from  |
              | notify team |   | the mistake |
              +-------------+   +-------------+
```

---

## Smart LLM Router

AutoDev doesn't depend on one model. It has a **smart router** that picks the best model for each task, optimizing cost and quality.

### 10 Models, Automatic Selection

```
Task: security fix
  Score algorithm:
    Quality x CostEfficiency x HistoricalSuccessRate x SpeedBonus x StrengthMatch

  Results:
    #1  DeepSeek V3.2    Score: 495   $0.28/1M out   SELECTED
    #2  Qwen 3 235B      Score: 348   $0.30/1M out   Fallback 1
    #3  Llama 4 Maverick  Score: 217   $0.60/1M out   Fallback 2
```

| Model | $/1M out | Quality | Speed | Best for |
|---|---|---|---|---|
| DeepSeek V3.2 | $0.28 | 92 | Fast | Code, Security |
| Qwen 3 235B | $0.30 | 90 | Medium | Code, Analysis |
| Gemini 2.5 Flash | $0.60 | 88 | Fast | Content, SEO |
| MiniMax M1 | $1.10 | 87 | Medium | Code, Content |
| Llama 4 Maverick | $0.60 | 85 | Fast | General |
| Mistral Medium 3 | $2.00 | 88 | Medium | Code, Content |
| GPT-4o Mini | $0.60 | 83 | Fast | General |
| Claude Haiku 4.5 | $4.00 | 91 | Fast | Code, Eval |
| DeepSeek R1 | $2.19 | 95 | Slow | Deep Analysis |
| Gemini 2.5 Pro | $10.00 | 94 | Slow | Deep Eval |

**Automatic fallback**: if model #1 times out, the router tries #2, then #3.

**Self-learning**: the router tracks success/failure per model and adjusts scores over time. Bad models get deprioritized automatically.

**Monthly cost**: ~$1-2 with default settings.

---

## Modules

### Security

Detects and fixes vulnerabilities across your API routes:

```
Scans for:
  POST routes without authentication        [HIGH]
  JSON body parsed without validation        [MEDIUM]
  Server env vars in client-side code        [CRITICAL]
  dangerouslySetInnerHTML (XSS risk)         [MEDIUM]
  Missing rate limiting on auth endpoints    [MEDIUM]
```

### Performance

Finds and fixes performance anti-patterns:

```
Detects:
  framer-motion imported statically          -> dynamic import
  <img> without optimization                 -> next/image or equivalent
  5+ sequential awaits                       -> Promise.all
  Dynamic imports without loading states     -> add Suspense/loading
```

### SEO

Adds missing SEO elements:

```
Checks:
  generateMetadata() on every page
  Open Graph tags (og:title, og:description, og:image)
  JSON-LD structured data
  Sitemap.xml and robots.txt
  Canonical URLs and hreflang tags
```

### Content

Generates blog articles for your audience:

```
Configure in autodev.config.json:
  "content": {
    "enabled": true,
    "blogFile": "lib/blog.ts",
    "topics": ["ai-tools", "productivity", "engineering"],
    "targetAudience": "developers",
    "language": "en"
  }
```

The agent reads your existing blog format, avoids duplicates, researches trending topics via web search, and generates articles matching your style.

### Quality

Improves AI system prompts in your codebase:

```
Detects system prompts automatically (SYSTEM_PROMPT, systemPrompt, etc.)
Evaluates: clarity, completeness, actionability, consistency
Suggests targeted improvements
Never changes output format or business logic
```

---

## Memory & Learning

AutoDev has a **persistent memory** that makes it smarter over time. This isn't just logging — it's active learning that changes the agent's behavior.

### What it remembers

```
data/memory.json
{
  "projects": {
    "my-saas": {
      "totalRuns": 47,
      "modules": {
        "security": {
          "totalAttempts": 12,
          "totalSuccesses": 9,
          "totalFailures": 3,
          "consecutiveFailures": 0,
          "errorPatterns": ["error TS2345", "Module not found"],
          "fragileFiles": ["lib/auth.ts"],
          "successfulStrategies": [
            "Added zod validation to POST route",
            "Rate limiting with sliding window"
          ]
        }
      },
      "fileRisk": {
        "lib/auth.ts": 4,          // HIGH risk — handle with care
        "app/page.tsx": 1,          // LOW risk — safe to modify
        "middleware.ts": 2           // MEDIUM risk
      }
    }
  }
}
```

### How it learns

| Event | Memory action |
|---|---|
| Build passes | File risk -1, strategy recorded |
| Build fails | File risk +2, error pattern saved |
| Risk >= 4 | File marked as "fragile" |
| 3+ consecutive failures | Module skipped next run |

### Memory is injected into LLM prompts

The LLM receives past context before generating:

```
## AGENT MEMORY (learn from past runs)
Success rate: 75% (9/12)

Errors to AVOID:
- error TS2345 (type mismatch)
- Module not found

Fragile files (modify with EXTRA CARE):
- lib/auth.ts (risk: 4)

Strategies that WORKED before:
- Added zod validation to POST route
```

---

## Dashboard

AutoDev includes a built-in web dashboard at `http://localhost:4040`.

```
+------------------------------------------------------------------+
|  AutoDev Dashboard                              [Idle] [Run Now]  |
+------------------------------------------------------------------+
|                                                                   |
|  Total Runs    Success Rate    Successes    Failed                 |
|     47            75%             35           12                  |
|                                                                   |
|  +------------------+  +-------------------------------------+   |
|  | Projects         |  | Recent Improvements                 |   |
|  |                  |  |                                     |   |
|  | my-saas          |  | [success] security  Rate limiting   |   |
|  |   nextjs         |  | [failed]  perf      Lazy loading    |   |
|  |   4 modules      |  | [success] seo       JSON-LD added   |   |
|  |                  |  | [success] quality   Prompt improved  |   |
|  +------------------+  +-------------------------------------+   |
|  | Agent Memory     |  | Live Logs                            |   |
|  |                  |  |                                     |   |
|  | security 75%     |  | [INFO] Pulling latest for my-saas   |   |
|  | perf     60%     |  | [INFO] Smart Router: DeepSeek V3.2  |   |
|  | seo      90%     |  | [SUCCESS] Found: Add JSON-LD...     |   |
|  | Fragile:auth.ts  |  | [INFO] Build passed (12s)            |   |
|  +------------------+  +-------------------------------------+   |
+------------------------------------------------------------------+
```

Features:
- **Real-time logs** via Server-Sent Events (SSE)
- **Agent status** with live status indicator
- **Run Now** button for on-demand runs
- **Memory visualization** — see success rates, fragile files, error patterns
- **Project overview** — configured projects and their modules
- **Improvement history** with status, module, timestamp

Access it at `http://localhost:4040` (configurable via `DASHBOARD_PORT`).

---

## Deploy

### Railway (Recommended)

> **$20 free credit** with our referral: **[railway.com?referralCode=oPjPCV](https://railway.com?referralCode=oPjPCV)**

1. Fork this repo
2. [Railway](https://railway.com?referralCode=oPjPCV) -> New Project -> Deploy from GitHub
3. Add environment variables
4. Done. The Dockerfile handles everything.

### Docker

```bash
docker build -t autodev .
docker run --env-file .env -p 4040:4040 autodev
```

### PM2

```bash
npm run build
pm2 start dist/index.js --name autodev
```

### Any VPS

```bash
git clone https://github.com/BigOD2307/AutoDev.git
cd AutoDev && npm install && npm run build
node dist/index.js
```

---

## Safety Guarantees

| Layer | What it does |
|---|---|
| **Git isolation** | Never pushes to `main`. Always a separate branch. |
| **Build verification** | Full build after every change. Fails? Auto-revert. |
| **Auto-revert** | `git checkout -- .` + `git clean -fd` on any failure. |
| **Human review** | You review every diff. You click merge. Always. |
| **Memory** | Learns from failures. Skips fragile files. Avoids known errors. |
| **Dry run mode** | Test everything without pushing. `AUTODEV_DRY_RUN=true` |

---

## Supported Frameworks

| Framework | Modules available |
|---|---|
| Next.js | All 5 (security, perf, seo, content, quality) |
| React / Vite | Security, Performance, Quality |
| Vue / Nuxt | Security, Performance, SEO, Quality |
| Svelte / SvelteKit | Security, Performance, SEO, Quality |
| Express / Fastify | Security, Performance, Quality |
| Django / Flask | Security, Quality |
| Any Node.js project | Security, Performance, Quality |

---

## Configuration Reference

### `autodev.config.json`

```jsonc
{
  "agent": {
    "name": "AutoDev",                    // Agent display name
    "schedule": "0 */4 * * *",            // Cron schedule
    "dryRun": false                       // true = no push, no notifications
  },
  "projects": [{
    "name": "my-project",                 // Project identifier
    "repo": "https://github.com/...",     // Git clone URL
    "branch": "main",                     // Target branch
    "buildCommand": "npm run build",      // Build verification command
    "framework": "nextjs",                // Framework hint for the LLM
    "modules": ["security", "performance", "seo", "quality"],
    "keyFiles": ["app/layout.tsx", "..."],// Files the LLM always reads
    "paths": {                            // Project structure hints
      "pages": "app/",
      "api": "app/api/",
      "config": "next.config.js"
    },
    "content": {                          // Blog generation config
      "enabled": false,
      "blogFile": "lib/blog.ts",
      "topics": ["topic-1", "topic-2"],
      "targetAudience": "developers",
      "language": "en"
    }
  }],
  "notifications": {
    "channels": [
      { "type": "slack", "url": "https://hooks.slack.com/..." },
      { "type": "discord", "url": "https://discord.com/api/webhooks/..." },
      { "type": "webhook", "url": "https://...", "secret": "..." }
    ]
  },
  "git": {
    "authorName": "AutoDev Agent",
    "authorEmail": "autodev@company.com",
    "branchPrefix": "autodev"
  }
}
```

### Environment Variables

| Variable | Required | Default |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | — |
| `GITHUB_TOKEN` | Yes | — |
| `AUTODEV_DRY_RUN` | No | `false` |
| `AUTODEV_RUN_NOW` | No | `false` |
| `AUTODEV_SCHEDULE` | No | `0 */4 * * *` |
| `DASHBOARD_PORT` | No | `4040` |
| `NOTIFY_WEBHOOK_URL` | No | — |
| `AUTODEV_SECRET` | No | — |
| `TINYFISH_API_KEY` | No | — |

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Open a PR

### Add a new module

```typescript
// src/modules/mymodule.ts
import { analyzeForImprovement, type Improvement } from '../core/analyzer.js'
import type { RepoConfig } from '../config.js'

export async function runMyModule(repo: RepoConfig): Promise<Improvement | null> {
  // Your pre-analysis logic here
  return analyzeForImprovement(repo, 'mymodule')
}
```

Register in `src/core/agent.ts`:
```typescript
import { runMyModule } from '../modules/mymodule.js'
MODULE_RUNNERS['mymodule'] = runMyModule
```

### Add a new LLM model

Edit `src/utils/router.ts`:
```typescript
{
  id: 'provider/model-name',
  name: 'Display Name',
  costIn: 0.10,        // $/1M input tokens
  costOut: 0.50,        // $/1M output tokens
  contextWindow: 128000,
  strengths: ['code', 'analysis'],
  quality: 85,          // 0-100
  speed: 'fast',        // fast | medium | slow
}
```

---

## License

**Free to use** for personal and internal projects. Attribution required:

> Powered by [AutoDev](https://github.com/BigOD2307/AutoDev) by Dicken AI

**Commercial use** (resale, SaaS, white-labeling) requires a license.
Contact: [ousmane@dickenai.com](mailto:ousmane@dickenai.com)

See [LICENSE.md](LICENSE.md) for full terms.

---

<p align="center">
  <br/>
  <strong>AutoDev</strong> by <a href="https://dickenai.com">Dicken AI</a>
  <br/>
  <sub>Building AI for Africa and the world.</sub>
  <br/><br/>
  <a href="https://github.com/BigOD2307/AutoDev">GitHub</a> &bull;
  <a href="mailto:ousmane@dickenai.com">Contact</a> &bull;
  <a href="https://railway.com?referralCode=oPjPCV">Deploy on Railway ($20 free)</a>
</p>
