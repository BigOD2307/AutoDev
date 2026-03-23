import { type RepoConfig } from '../config.js'
import { readRepoFile, listRepoFiles } from './git.js'
import { chatJSON } from '../utils/llm.js'
import { log } from '../utils/logger.js'
import { moduleToTaskType } from '../utils/router.js'

export type ImprovementModule = 'seo' | 'content' | 'performance' | 'security' | 'quality'

export interface FileChange {
  filePath: string
  oldContent: string
  newContent: string
}

export interface Improvement {
  module: ImprovementModule
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  changes: FileChange[]
  commitMessage: string
}

const MODULE_PROMPTS: Record<ImprovementModule, string> = {
  seo: `Tu es un expert SEO/GEO pour l'Afrique francophone. Analyse le code et propose UNE amélioration SEO concrète.
Priorités : meta tags, Open Graph, JSON-LD structured data, generateMetadata(), alt tags images, sitemap, canonical URLs.
Le site cible le marché de l'emploi en Afrique de l'Ouest (Sénégal, Côte d'Ivoire, Mali, Cameroun, etc).
NE TOUCHE PAS à la logique métier, seulement le SEO.`,

  content: `Tu es un expert en content marketing pour l'emploi en Afrique francophone.
Génère UN article de blog complet (~1500 mots, en français) optimisé SEO.
L'article doit être ajouté au fichier lib/blog.ts dans le tableau 'posts'.
Thèmes possibles : recherche d'emploi en Afrique, CV, entretien, IA pour la carrière, secteurs qui recrutent.
Respecte EXACTEMENT le format BlogPost existant (slug, title, description, date, readTime, category, emoji, content, relatedSlugs).
Le contenu doit être utile, concret et adapté au marché africain.`,

  performance: `Tu es un expert performance web / Next.js. Analyse le code et propose UNE amélioration de performance.
Priorités : imports dynamiques (lazy loading), optimisation images (next/image), réduction bundle,
mise en cache, optimisation API routes (timeouts, parallel requests), tree-shaking.
NE CASSE PAS la fonctionnalité. L'amélioration doit être safe.`,

  security: `Tu es un expert sécurité web. Analyse le code et propose UNE amélioration de sécurité.
Priorités : validation des inputs (zod), rate limiting, headers CSP, protection XSS/CSRF,
vérification d'auth sur les API routes, exposition de clés côté client, npm audit fixes.
NE CASSE PAS la fonctionnalité. L'amélioration doit être safe et rétro-compatible.`,

  quality: `Tu es un expert en IA et prompt engineering. Analyse les prompts système et propose UNE amélioration.
Priorités : clarté du prompt, structure, exemples dans le prompt, instructions de format,
gestion des edge cases, cohérence de la langue française.
NE CHANGE PAS la logique métier ou le format de sortie. Améliore seulement la qualité du prompt.`,
}

/**
 * Analyze a repo for improvements in a specific module.
 * Returns null if no good improvement was found.
 */
export async function analyzeForImprovement(
  repo: RepoConfig,
  module: ImprovementModule
): Promise<Improvement | null> {
  log('info', 'analyzer', `Analyzing ${repo.name} for ${module} improvements`)

  // Read key files for context
  const context = await buildContext(repo, module)
  if (!context) {
    log('warn', 'analyzer', `No context available for ${repo.name}/${module}`)
    return null
  }

  const systemPrompt = `${MODULE_PROMPTS[module]}

## RÈGLES CRITIQUES
1. Tu dois retourner un JSON VALIDE, rien d'autre
2. Chaque changement doit inclure le contenu COMPLET du fichier modifié (pas de "..." ou commentaires de troncature)
3. NE CRÉE PAS de nouveaux fichiers sauf si le module est 'content' (articles blog)
4. Les changements doivent être MINIMAUX et CIBLÉS — une seule amélioration à la fois
5. Le code modifié doit compiler et passer le build
6. IMPORTANT : ne casse RIEN. Ce code est en PRODUCTION

## FORMAT DE RÉPONSE (JSON)
{
  "title": "Titre court de l'amélioration",
  "description": "Description détaillée de ce qui a été amélioré et pourquoi",
  "impact": "low|medium|high",
  "changes": [
    {
      "filePath": "chemin/relatif/du/fichier.ts",
      "newContent": "CONTENU COMPLET DU FICHIER MODIFIÉ"
    }
  ],
  "commitMessage": "type(scope): description courte"
}

Si tu ne trouves AUCUNE amélioration valable, retourne : { "skip": true, "reason": "..." }`

  const userPrompt = `Voici le code du projet ${repo.name} :\n\n${context}`

  try {
    const result = await chatJSON<{
      skip?: boolean
      reason?: string
      title?: string
      description?: string
      impact?: string
      changes?: { filePath: string; newContent: string }[]
      commitMessage?: string
    }>([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { maxTokens: 16000, temperature: 0.4, taskType: moduleToTaskType(module) })

    if (result.skip) {
      log('info', 'analyzer', `No improvement found for ${module}: ${result.reason}`)
      return null
    }

    if (!result.title || !result.changes || result.changes.length === 0) {
      log('warn', 'analyzer', `Invalid LLM response for ${module}`, result)
      return null
    }

    // Build the file changes with old content for diffing
    const changes: FileChange[] = []
    for (const change of result.changes) {
      const oldContent = readRepoFile(repo, change.filePath) || ''
      changes.push({
        filePath: change.filePath,
        oldContent,
        newContent: change.newContent,
      })
    }

    const improvement: Improvement = {
      module,
      title: result.title,
      description: result.description || '',
      impact: (result.impact as 'low' | 'medium' | 'high') || 'medium',
      changes,
      commitMessage: result.commitMessage || `autodev(${module}): ${result.title}`,
    }

    log('success', 'analyzer', `Found improvement: ${improvement.title}`, {
      module,
      filesChanged: changes.map(c => c.filePath),
      impact: improvement.impact,
    })

    return improvement
  } catch (err) {
    log('error', 'analyzer', `LLM analysis failed for ${module}`, { error: String(err) })
    return null
  }
}

/**
 * Build context string from key files for the LLM.
 */
async function buildContext(repo: RepoConfig, module: ImprovementModule): Promise<string | null> {
  const parts: string[] = []
  let totalChars = 0
  const MAX_CHARS = 80_000 // Keep context manageable

  // Module-specific file selection
  const targetFiles = getTargetFiles(repo, module)

  for (const filePath of targetFiles) {
    if (totalChars > MAX_CHARS) break

    const content = readRepoFile(repo, filePath)
    if (!content) continue

    const block = `\n--- FILE: ${filePath} ---\n${content}\n--- END: ${filePath} ---\n`
    parts.push(block)
    totalChars += block.length
  }

  // For content module, also list existing blog posts to avoid duplicates
  if (module === 'content') {
    const blogContent = readRepoFile(repo, 'lib/blog.ts')
    if (blogContent) {
      // Extract existing slugs
      const slugs = [...blogContent.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map(m => m[1])
      parts.push(`\n--- EXISTING BLOG SLUGS (do not duplicate) ---\n${slugs.join('\n')}\n`)
    }
  }

  if (parts.length === 0) return null

  // Add file listing for extra context
  try {
    const allFiles = await listRepoFiles(repo, '**/*.{ts,tsx,js,jsx}')
    parts.unshift(`\n--- PROJECT FILE TREE (${allFiles.length} files) ---\n${allFiles.slice(0, 100).join('\n')}\n`)
  } catch { /* ignore */ }

  return parts.join('\n')
}

/**
 * Select which files to read based on the improvement module.
 */
function getTargetFiles(repo: RepoConfig, module: ImprovementModule): string[] {
  const base = repo.keyFiles

  const moduleSpecific: Record<ImprovementModule, string[]> = {
    seo: [
      'app/layout.tsx',
      'app/page.tsx',
      'app/ressources/page.tsx',
      'app/ressources/[slug]/page.tsx',
      'app/essai/page.tsx',
      'app/auth/page.tsx',
      'next.config.js',
    ],
    content: [
      'lib/blog.ts',
      'app/ressources/[slug]/page.tsx',
      'types/analysis.ts',
    ],
    performance: [
      'app/layout.tsx',
      'app/page.tsx',
      'lib/aiAnalyzer.ts',
      'lib/jobsAgent.ts',
      'lib/openRouter.ts',
      'app/api/analyze/route.ts',
      'next.config.js',
    ],
    security: [
      'middleware.ts',
      'lib/auth.ts',
      'lib/adminAuth.ts',
      'lib/rateLimit.ts',
      'lib/credits.ts',
      'next.config.js',
      'app/api/auth/login/route.ts',
      'app/api/auth/register/route.ts',
      'app/api/analyze/route.ts',
    ],
    quality: [
      'lib/aiAnalyzer.ts',
      'lib/openRouter.ts',
      'lib/jobsAgent.ts',
    ],
  }

  // Merge and deduplicate
  const files = [...new Set([...moduleSpecific[module], ...base])]
  return files
}
