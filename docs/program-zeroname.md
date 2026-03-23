# Program: ZeroName.space — AutoDev Experimentation Guide

## Identity

ZeroName.space is an AI-powered career platform for African professionals.
Stack: Next.js 16, React 18, Supabase, OpenAI + OpenRouter.
Deployed on Vercel. Everything is in PRODUCTION.

## Rules

1. **NEVER break production** — every change must pass `npm run build`
2. **One improvement at a time** — small, focused, verifiable changes
3. **Branch only** — never push to main, always create `autodev/{module}/{date}`
4. **Verify before push** — always run full build after applying changes
5. **Notify on success** — WhatsApp message with summary and review link
6. **Discard on failure** — if build fails, revert everything

## Improvement Modules

### SEO (Priority: High)
- Meta tags on all public pages
- JSON-LD structured data (WebSite, Organization, Article, FAQ, BreadcrumbList)
- Open Graph + Twitter Cards on every page
- Sitemap.xml and robots.txt
- Hreflang tags for: fr-SN, fr-CI, fr-ML, fr-CM, fr-BF, fr-GN, fr-FR
- Internal linking between blog articles
- Target keywords: "emploi Afrique", "CV", "entretien", "carrière Afrique"

### Content (Priority: High)
- Generate SEO blog articles in French for the African job market
- Add to `lib/blog.ts` BlogPost[] array
- Topics: job search, CV tips, interview prep, AI for career, sectors hiring in Africa
- ~1500 words, 5-8 min read, practical and actionable
- Include related slugs for internal linking

### Performance (Priority: Medium)
- Dynamic imports for heavy components (framer-motion, heavy charts)
- next/image instead of <img>
- Promise.all for parallel API calls
- Lazy loading below-the-fold components
- Reduce API route response times

### Security (Priority: High)
- Input validation with zod on all POST API routes
- Rate limiting on auth and analyze endpoints
- CSP headers strengthening
- Verify no API keys in client-side code
- npm audit fix for vulnerabilities

### Quality (Priority: Medium)
- Improve SYSTEM_PROMPT in aiAnalyzer.ts
- More specific scoring rubrics
- Better French language instructions
- Edge case handling in prompts
- Job agent query generation optimization

## Key Files

| File | Purpose | Module |
|------|---------|--------|
| `lib/aiAnalyzer.ts` | CV analysis AI | quality, performance |
| `lib/blog.ts` | Blog articles | content, seo |
| `lib/jobsAgent.ts` | Job scraping | quality, performance |
| `middleware.ts` | Auth middleware | security |
| `next.config.js` | App config | seo, security |
| `app/layout.tsx` | Root layout | seo |
| `app/page.tsx` | Landing page | seo, performance |

## Metrics

- Build must pass (zero tolerance)
- Changes should be minimal (< 200 lines changed)
- One file changed per improvement (ideal), max 3 files
- Articles: min 1000 words, max 2500 words
