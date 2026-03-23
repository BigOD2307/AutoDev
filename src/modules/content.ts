import type { RepoConfig } from '../config.js'
import { analyzeForImprovement, type Improvement } from '../core/analyzer.js'
import { readRepoFile } from '../core/git.js'
import { chat, webSearch } from '../utils/llm.js'
import { log } from '../utils/logger.js'

/**
 * Content generation module.
 *
 * Generates SEO-optimized blog articles for the African job market.
 * Articles are added to lib/blog.ts in the existing BlogPost[] array.
 *
 * Topics pool:
 * - Recherche d'emploi en Afrique de l'Ouest
 * - Comment rédiger un CV pour le marché africain
 * - Préparation aux entretiens d'embauche
 * - Les secteurs qui recrutent en Afrique
 * - Intelligence artificielle et emploi
 * - Freelance et travail à distance en Afrique
 * - Compétences les plus demandées
 * - Premier emploi après les études
 * - Reconversion professionnelle
 * - Réseaux professionnels en Afrique (LinkedIn, etc.)
 */

const ARTICLE_TOPICS = [
  "les-10-erreurs-cv-afrique",
  "preparer-entretien-embauche-afrique",
  "secteurs-recrutement-afrique-2026",
  "intelligence-artificielle-emploi-afrique",
  "freelance-travail-distance-afrique",
  "competences-demandees-afrique-2026",
  "premier-emploi-diplome-afrique",
  "reconversion-professionnelle-afrique",
  "linkedin-reseaux-professionnels-afrique",
  "negocier-salaire-afrique",
  "stage-professionnel-afrique-guide",
  "emploi-technologie-afrique",
  "entrepreneuriat-vs-salariat-afrique",
  "langues-atout-emploi-afrique",
  "cv-ats-optimisation-guide",
  "lettre-motivation-modele-afrique",
  "teletravail-opportunites-afrique",
  "concours-fonction-publique-guide",
  "soft-skills-emploi-afrique",
  "femmes-leadership-emploi-afrique",
]

export async function runContentModule(repo: RepoConfig): Promise<Improvement | null> {
  log('info', 'content', `Starting content generation for ${repo.name}`)

  // Read existing blog posts to avoid duplicates
  const blogFile = readRepoFile(repo, 'lib/blog.ts')
  if (!blogFile) {
    log('warn', 'content', 'lib/blog.ts not found — skipping content module')
    return null
  }

  // Extract existing slugs
  const existingSlugs = [...blogFile.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map(m => m[1])
  log('info', 'content', `Found ${existingSlugs.length} existing articles`)

  // Find a topic that hasn't been covered
  const availableTopics = ARTICLE_TOPICS.filter(t => !existingSlugs.some(s => s.includes(t.split('-').slice(0, 3).join('-'))))

  if (availableTopics.length === 0) {
    log('info', 'content', 'All predefined topics covered — asking LLM for new topic')
  }

  // Research trending topics via TinyFish web search
  const nextTopic = availableTopics[0] || 'emploi afrique 2026'
  const searchQuery = nextTopic.replace(/-/g, ' ') + ' Afrique emploi'
  const webResults = await webSearch(searchQuery, 5)
  if (webResults.length > 0) {
    log('info', 'content', `Web research: ${webResults.length} results for "${searchQuery}"`,
      webResults.map(r => r.title).slice(0, 3))
  }

  // Use the standard analyzer which will read blog.ts and generate a new article
  return analyzeForImprovement(repo, 'content')
}
