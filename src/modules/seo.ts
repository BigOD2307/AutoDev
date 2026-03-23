import type { RepoConfig } from '../config.js'
import { analyzeForImprovement, type Improvement } from '../core/analyzer.js'
import { readRepoFile } from '../core/git.js'
import { log } from '../utils/logger.js'

/**
 * SEO/GEO improvement module.
 *
 * Targets:
 * - Meta tags (title, description, og:*, twitter:*)
 * - JSON-LD structured data (Article, BreadcrumbList, FAQPage, WebSite)
 * - generateMetadata() in Next.js pages
 * - Image alt tags
 * - Sitemap.xml generation
 * - Canonical URLs
 * - Hreflang tags for francophone countries
 */

// SEO checklist items to verify
const SEO_CHECKS = [
  'generateMetadata() with unique title + description on every page',
  'Open Graph tags (og:title, og:description, og:image, og:url)',
  'Twitter Card tags (twitter:card, twitter:title, twitter:description)',
  'JSON-LD structured data (WebSite, Organization, Article, FAQ)',
  'Canonical URLs on all pages',
  'Alt tags on all images',
  'Sitemap.xml exists and is up to date',
  'robots.txt exists and is correct',
  'Hreflang tags for fr-SN, fr-CI, fr-ML, fr-CM, fr-BF, fr-GN, fr-FR',
  'Breadcrumb structured data',
  'Internal linking between blog articles',
]

export async function runSEOModule(repo: RepoConfig): Promise<Improvement | null> {
  log('info', 'seo', `Starting SEO analysis for ${repo.name}`)

  // Quick pre-check: see what's already there
  const layout = readRepoFile(repo, 'app/layout.tsx')
  const sitemapExists = readRepoFile(repo, 'app/sitemap.ts') !== null ||
                        readRepoFile(repo, 'public/sitemap.xml') !== null
  const robotsExists = readRepoFile(repo, 'app/robots.ts') !== null ||
                       readRepoFile(repo, 'public/robots.txt') !== null

  const missing: string[] = []
  if (!sitemapExists) missing.push('sitemap.xml')
  if (!robotsExists) missing.push('robots.txt')
  if (layout && !layout.includes('hreflang')) missing.push('hreflang tags')
  if (layout && !layout.includes('JSON-LD') && !layout.includes('jsonLd') && !layout.includes('application/ld+json')) {
    missing.push('JSON-LD on layout')
  }

  if (missing.length > 0) {
    log('info', 'seo', `Missing SEO elements: ${missing.join(', ')}`)
  }

  // Let the LLM analyzer do the deep analysis and generate the fix
  return analyzeForImprovement(repo, 'seo')
}
