# AutoDev Agent

### L'agent IA autonome qui ameliore tes apps en continu, pendant que tu dors.

```
     _         _        ____
    / \  _   _| |_ ___ |  _ \  _____   __
   / _ \| | | | __/ _ \| | | |/ _ \ \ / /
  / ___ \ |_| | || (_) | |_| |  __/\ V /
 /_/   \_\__,_|\__\___/|____/ \___| \_/
                                    Agent v1.0
```

> **AutoDev** est un agent IA autonome inspire du pattern [autoresearch](https://github.com/karpathy/autoresearch) de Andrej Karpathy. Il analyse automatiquement tes projets en production, genere des ameliorations (SEO, securite, performance, contenu, qualite IA), verifie que tout compile, cree une branche Git, et t'envoie une notification WhatsApp pour review avant merge.

> **Zero risque** : l'agent ne push JAMAIS sur `main`. Toujours une branche separee. Toujours un build verifie. Si le build echoue, tout est automatiquement revert.

---

## Table des matieres

- [Pourquoi AutoDev ?](#pourquoi-autodev-)
- [Comment ca marche](#comment-ca-marche)
- [Architecture complete](#architecture-complete)
- [Le Smart Router LLM](#le-smart-router-llm)
- [Les 5 modules d'amelioration](#les-5-modules-damelioration)
  - [Module Securite](#1--module-securite)
  - [Module Performance](#2--module-performance)
  - [Module SEO / GEO](#3--module-seo--geo)
  - [Module Contenu](#4--module-contenu-articles-blog)
  - [Module Qualite IA](#5--module-qualite-ia-prompts)
- [Systeme de securite](#systeme-de-securite)
- [Notifications WhatsApp](#notifications-whatsapp)
- [Installation](#installation)
  - [En local](#en-local)
  - [Sur Railway](#deploiement-sur-railway)
  - [Avec Docker](#avec-docker)
- [Configuration](#configuration)
  - [Variables d'environnement](#variables-denvironnement)
  - [Configuration des repos](#configuration-des-repos)
  - [Planning CRON](#planning-cron)
- [Structure du projet](#structure-du-projet)
- [Cycle de vie d'une amelioration](#cycle-de-vie-dune-amelioration)
- [Algorithmes cles](#algorithmes-cles)
  - [Selection du module](#algorithme-de-selection-du-module)
  - [Routage LLM](#algorithme-de-routage-llm)
  - [Verification du build](#algorithme-de-verification-du-build)
- [Logs et historique](#logs-et-historique)
- [Gestion des erreurs](#gestion-des-erreurs)
- [Projets supportes](#projets-supportes)
- [Guide de contribution](#guide-de-contribution)
- [FAQ](#faq)
- [Licence](#licence)

---

## Pourquoi AutoDev ?

```
Le probleme :
  - Tu as des apps en production (ZeroName, InsideAI, etc.)
  - Tu sais qu'il y a des trucs a ameliorer (SEO, secu, perf...)
  - Mais t'as pas le temps de tout faire
  - Et quand tu changes quelque chose, tu risques de casser la prod

La solution :
  - Un agent IA qui tourne toutes les 4 heures
  - Il analyse ton code, trouve UNE amelioration concrete
  - Il l'applique, verifie que le build passe
  - Si OK -> branche Git + notification WhatsApp
  - Si KO -> revert automatique, zero degat
  - Toi tu review et merge quand tu veux
```

### Ce que AutoDev fait pour toi

```
+------------------------------------------------------------------+
|                                                                  |
|  SECURITE          PERFORMANCE        SEO / GEO                  |
|  - Validation      - Lazy loading     - Meta tags                |
|    des inputs      - next/image       - JSON-LD                  |
|  - Rate limiting   - Bundle size      - Sitemap                  |
|  - Auth checks     - Promise.all      - Hreflang                 |
|  - CSP headers     - Tree-shaking     - Open Graph               |
|  - npm audit       - API optimization - Alt tags                 |
|                                                                  |
|  CONTENU                     QUALITE IA                          |
|  - Articles blog SEO         - Prompts systeme                   |
|  - 1500 mots en francais     - Scoring rubrics                   |
|  - Marche africain           - Edge cases                        |
|  - 20+ sujets pre-definis    - Coherence langue                  |
|  - Recherche web (TinyFish)  - Evaluation auto                   |
|                                                                  |
+------------------------------------------------------------------+
```

### Chiffres cles

| Metrique | Valeur |
|----------|--------|
| Frequence d'analyse | Toutes les 4h (configurable) |
| Modeles LLM disponibles | 10 modeles, routing intelligent |
| Modules d'amelioration | 5 (secu, perf, seo, contenu, qualite) |
| Cout mensuel LLM | ~$1-5 (modeles ultra-cheap) |
| Cout Railway | ~$5/mois |
| Temps par cycle | 2-5 minutes |
| Risque pour la prod | 0% (branch only, build verify, auto-revert) |

---

## Comment ca marche

```
                    Toutes les 4 heures
                           |
                           v
              +------------------------+
              |    1. SELECTION        |
              |    Quel module ?       |
              |    (rotation smart)    |
              +----------+-------------+
                         |
                         v
              +------------------------+
              |    2. CLONE / PULL     |
              |    git pull origin     |
              |    main                |
              +----------+-------------+
                         |
                         v
              +------------------------+
              |    3. ANALYSE          |
              |    Le Smart Router     |
              |    choisit le meilleur |
              |    modele LLM          |
              |    (DeepSeek, Qwen,    |
              |     Gemini, etc.)      |
              +----------+-------------+
                         |
                         v
              +------------------------+
              |    4. GENERATION       |
              |    Le LLM propose UNE  |
              |    amelioration        |
              |    concrete avec le    |
              |    code modifie        |
              +----------+-------------+
                         |
                         v
              +------------------------+
              |    5. APPLICATION      |
              |    Ecriture des        |
              |    fichiers modifies   |
              +----------+-------------+
                         |
                         v
              +------------------------+
              |    6. BUILD CHECK      |
              |    npm run build       |
              |                        |
              +----+-------------+-----+
                   |             |
                   v             v
              BUILD OK      BUILD FAIL
                   |             |
                   v             v
              +--------+   +----------+
              | Branch |   | REVERT   |
              | Commit |   | git      |
              | Push   |   | checkout |
              +---+----+   +-----+----+
                  |              |
                  v              v
              +--------+   +--------+
              |WhatsApp|   | Log    |
              |Notif   |   | erreur |
              +--------+   +--------+
```

---

## Architecture complete

```
+------------------------------------------------------------------+
|                     AUTODEV AGENT (Railway)                       |
|                                                                  |
|  +---------------------------+  +-----------------------------+  |
|  |      ENTRY POINT          |  |      CONFIGURATION          |  |
|  |      src/index.ts         |  |      src/config.ts          |  |
|  |                           |  |                             |  |
|  |  - Charge .env            |  |  - Repos (ZeroName,        |  |
|  |  - Init cron scheduler    |  |    InsideAI)                |  |
|  |  - Gestion SIGINT/SIGTERM |  |  - Schedule CRON            |  |
|  |  - Error handling global  |  |  - Cles API                 |  |
|  +-------------+-------------+  |  - Config notifications     |  |
|                |                +-----------------------------+  |
|                v                                                 |
|  +---------------------------+                                   |
|  |      AGENT PRINCIPAL      |                                   |
|  |      src/core/agent.ts    |                                   |
|  |                           |                                   |
|  |  - Rotation des modules   |                                   |
|  |  - Orchestration du cycle |                                   |
|  |  - Gestion multi-repos    |                                   |
|  +---+---------+---------+---+                                   |
|      |         |         |                                       |
|      v         v         v                                       |
|  +-------+ +-------+ +--------+  +-------+  +--------+          |
|  | Git   | |Builder| |Analyzer|  |Notifier|  | Logger |          |
|  | .ts   | | .ts   | | .ts    |  | .ts    |  | .ts    |          |
|  |       | |       | |        |  |        |  |        |          |
|  |Clone  | |Build  | |LLM     |  |WhatsApp|  |Console |          |
|  |Branch | |Verify | |Analysis|  |API     |  |File    |          |
|  |Commit | |Deps   | |Context |  |Format  |  |History |          |
|  |Push   | |Errors | |Parse   |  |Status  |  |JSON    |          |
|  +-------+ +-------+ +---+----+  +--------+  +--------+          |
|                           |                                      |
|                           v                                      |
|  +----------------------------------------------------------+   |
|  |                  SMART LLM ROUTER                         |   |
|  |                  src/utils/router.ts                      |   |
|  |                                                          |   |
|  |  10 modeles  -  Scoring auto  -  Fallback cascade        |   |
|  |  Apprentissage des succes/echecs par modele              |   |
|  +----------------------------------------------------------+   |
|                           |                                      |
|                           v                                      |
|  +----------------------------------------------------------+   |
|  |               5 MODULES D'AMELIORATION                    |   |
|  |                                                          |   |
|  |  +----------+  +---------+  +-----+  +-------+  +-----+ |   |
|  |  | Securite |  |  Perf   |  | SEO |  |Content|  |Qual.| |   |
|  |  +----------+  +---------+  +-----+  +-------+  +-----+ |   |
|  +----------------------------------------------------------+   |
|                                                                  |
+-------------------------+--------+-------------------------------+
                          |        |
                    +-----+--+ +---+------+
                    | GitHub | | WhatsApp |
                    | Repos  | | Notifs   |
                    +--------+ +----------+
```

---

## Le Smart Router LLM

AutoDev ne s'appuie pas sur un seul modele. Il dispose d'un **routeur intelligent** qui choisit automatiquement le meilleur modele pour chaque type de tache, en optimisant le rapport qualite/prix.

### Les 10 modeles disponibles

```
+-------------------------------------------------------------------+
|                    MODELES LLM DISPONIBLES                        |
+-------------------------------------------------------------------+
|                                                                   |
|  TIER 1 — Ultra-cheap, haute qualite                              |
|  +--------------------------------------------------------------+ |
|  | DeepSeek V3.2    | $0.14/$0.28  | 128K | 92/100 | FAST     | |
|  | Qwen 3 235B      | $0.14/$0.30  | 128K | 90/100 | MEDIUM   | |
|  | Gemini 2.5 Flash  | $0.15/$0.60  | 1M   | 88/100 | FAST     | |
|  | GPT-4o Mini       | $0.15/$0.60  | 128K | 83/100 | FAST     | |
|  +--------------------------------------------------------------+ |
|                                                                   |
|  TIER 2 — Bon rapport qualite/prix                                |
|  +--------------------------------------------------------------+ |
|  | MiniMax M1        | $0.20/$1.10  | 1M   | 87/100 | MEDIUM   | |
|  | Llama 4 Maverick  | $0.20/$0.60  | 128K | 85/100 | FAST     | |
|  | Mistral Medium 3  | $0.40/$2.00  | 128K | 88/100 | MEDIUM   | |
|  +--------------------------------------------------------------+ |
|                                                                   |
|  TIER 3 — Premium (pour les taches critiques)                     |
|  +--------------------------------------------------------------+ |
|  | DeepSeek R1       | $0.55/$2.19  | 128K | 95/100 | SLOW     | |
|  | Claude Haiku 4.5  | $0.80/$4.00  | 200K | 91/100 | FAST     | |
|  | Gemini 2.5 Pro    | $1.25/$10.0  | 1M   | 94/100 | SLOW     | |
|  +--------------------------------------------------------------+ |
|                                                                   |
| Prix en USD par million de tokens (input / output)                |
+-------------------------------------------------------------------+
```

### Comment le routeur choisit

Le routeur utilise un **algorithme de scoring** qui prend en compte 5 facteurs :

```
Score = Qualite x Efficacite_Cout x Taux_Succes x Bonus_Vitesse x Match_Competence

ou :
  Qualite         = Score du modele (0-100)
  Efficacite_Cout = 1 / (Cout output + 0.01)
  Taux_Succes     = Succes / Tentatives (defaut: 80%)
  Bonus_Vitesse   = Fast: 1.3 | Medium: 1.0 | Slow: 0.7
  Match_Competence = Exact: 1.5 | General: 1.0
```

### Routage par type de tache

```
+-------------------+------------------+------------------+------------------+
| Type de tache     | Modele principal | Fallback 1       | Fallback 2       |
+-------------------+------------------+------------------+------------------+
| CODE              | DeepSeek V3.2    | Qwen 3 235B      | Llama 4 Maverick |
| (securite, perf)  | Score: 495       | Score: 348        | Score: 217       |
+-------------------+------------------+------------------+------------------+
| ANALYSE           | DeepSeek V3.2    | Gemini 2.5 Flash  | Qwen 3 235B      |
| (SEO)             | Score: 495       | Score: 150        | Score: 348       |
+-------------------+------------------+------------------+------------------+
| CONTENU           | MiniMax M1       | Gemini Flash      | Mistral Medium   |
| (articles blog)   | Score: 178       | Score: 150        | Score: 132       |
+-------------------+------------------+------------------+------------------+
| EVALUATION        | DeepSeek R1      | Claude Haiku 4.5  | Gemini 2.5 Pro   |
| (qualite prompts) | Score: 210       | Score: 172        | Score: 89        |
+-------------------+------------------+------------------+------------------+
```

### Apprentissage continu

Le routeur **apprend** au fil du temps :

```
Appel modele X
     |
     +---> Succes ? -----> Taux succes X augmente
     |                     Latence moyenne mise a jour
     |                     Score futur de X augmente
     |
     +---> Echec ? ------> Taux succes X diminue
                           Score futur de X diminue
                           Prochain appel: autre modele
```

### Cascade de fallback

Si un modele echoue, le routeur passe automatiquement au suivant :

```
Tentative 1: DeepSeek V3.2 ---> TIMEOUT
                                    |
Tentative 2: Qwen 3 235B   ---> SUCCES !
                                    |
                                    v
                              Resultat retourne
                              Stats mises a jour
```

### Estimation des couts

| Scenario | Appels/jour | Cout/jour | Cout/mois |
|----------|-------------|-----------|-----------|
| 6 runs (toutes les 4h) | ~12 appels LLM | ~$0.01 | ~$0.30 |
| Avec contenu (long) | ~18 appels LLM | ~$0.03 | ~$0.90 |
| Avec evaluation R1 | ~15 appels LLM | ~$0.05 | ~$1.50 |
| **Total max** | **~18 appels** | **~$0.05** | **~$1.50** |

---

## Les 5 modules d'amelioration

### 1. Module Securite

```
+---------------------------------------------------------------+
|  MODULE SECURITE                           Priorite : HAUTE    |
+---------------------------------------------------------------+
|                                                               |
|  SCAN AUTOMATIQUE (avant LLM)                                 |
|  +---------------------------------------------------------+  |
|  | Verifie toutes les API routes pour :                     |  |
|  | - Auth manquante sur les routes POST                     |  |
|  | - Validation d'input manquante (pas de zod)              |  |
|  | - Rate limiting absent sur endpoints sensibles           |  |
|  | - Variables d'env server dans le code client              |  |
|  | - dangerouslySetInnerHTML (risque XSS)                   |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  DETECTION D'AUTH                                              |
|  Le scanner cherche : getAuthEmail, verifyAdminToken,          |
|  verifyCreatorToken, verifyEntrepriseToken, CRON_SECRET,       |
|  Authorization header                                          |
|                                                               |
|  DETECTION DE VALIDATION                                       |
|  Le scanner cherche : zod, .parse(), .safeParse(),             |
|  typeof, validator                                             |
|                                                               |
|  NIVEAUX DE SEVERITE                                           |
|  CRITICAL : Variables d'env server dans code client            |
|  HIGH     : Route POST sans authentification                   |
|  MEDIUM   : JSON parse sans validation, pas de rate limit      |
|  MEDIUM   : dangerouslySetInnerHTML                           |
|                                                               |
|  FICHIERS CIBLES                                               |
|  - middleware.ts          (middleware d'auth)                   |
|  - lib/auth.ts            (logique d'authentification)         |
|  - lib/adminAuth.ts       (auth admin)                         |
|  - lib/rateLimit.ts       (limitation de debit)                |
|  - lib/credits.ts         (gestion des credits)                |
|  - next.config.js         (headers de securite)                |
|  - app/api/auth/*         (routes d'authentification)          |
|  - app/api/analyze/*      (route d'analyse)                    |
|                                                               |
|  + npm audit (vulnerabilites des dependances)                  |
+---------------------------------------------------------------+
```

**Exemples d'ameliorations generees :**
- Ajout de validation zod sur `/api/analyze`
- Rate limiting sur les routes d'authentification
- Renforcement des headers CSP dans `next.config.js`
- Fix de vulnerabilites npm

---

### 2. Module Performance

```
+---------------------------------------------------------------+
|  MODULE PERFORMANCE                        Priorite : MOYENNE  |
+---------------------------------------------------------------+
|                                                               |
|  SCAN AUTOMATIQUE (avant LLM)                                 |
|  +---------------------------------------------------------+  |
|  | Detecte les anti-patterns de performance :               |  |
|  |                                                         |  |
|  | no-next-image     <img> au lieu de next/image           |  |
|  | heavy-import      framer-motion importe statiquement    |  |
|  | large-import      Trop d'icones lucide-react            |  |
|  | missing-suspense  Import dynamique sans loading state   |  |
|  | sequential-awaits 5+ await sans Promise.all             |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  FICHIERS SCANNES                                              |
|  - app/**/*.tsx          (max 30 composants)                   |
|  - components/**/*.tsx   (tous les composants)                 |
|  - app/api/**/route.ts   (max 15 routes API)                  |
|                                                               |
|  STRATEGIES D'AMELIORATION                                     |
|  - Import dynamique : dynamic(() => import('...'))             |
|  - next/image : remplacer <img> par <Image>                   |
|  - Promise.all : paralleliser les appels API                   |
|  - Lazy loading : composants below-the-fold                    |
|  - Tree-shaking : imports specifiques                          |
|  - Bundle reduction : analyse des dependances                  |
|                                                               |
|  FICHIERS CIBLES                                               |
|  - app/layout.tsx, app/page.tsx                                |
|  - lib/aiAnalyzer.ts     (optimisation timeout)                |
|  - lib/jobsAgent.ts      (requetes paralleles)                 |
|  - lib/openRouter.ts     (optimisation API)                    |
|  - app/api/analyze/*     (route principale)                    |
+---------------------------------------------------------------+
```

**Exemples d'ameliorations generees :**
- Lazy loading de framer-motion sur la landing page
- Conversion de `<img>` en `<Image>` de Next.js
- Parallelisation des appels Supabase avec `Promise.all`

---

### 3. Module SEO / GEO

```
+---------------------------------------------------------------+
|  MODULE SEO / GEO                          Priorite : HAUTE   |
+---------------------------------------------------------------+
|                                                               |
|  CHECKLIST SEO (verification automatique)                      |
|  +---------------------------------------------------------+  |
|  | [?] generateMetadata() avec titre unique par page        |  |
|  | [?] Open Graph (og:title, og:description, og:image)      |  |
|  | [?] Twitter Cards (twitter:card, twitter:title)           |  |
|  | [?] JSON-LD (WebSite, Organization, Article, FAQ)        |  |
|  | [?] Canonical URLs sur toutes les pages                  |  |
|  | [?] Alt tags sur toutes les images                       |  |
|  | [?] Sitemap.xml (app/sitemap.ts ou public/sitemap.xml)   |  |
|  | [?] robots.txt (app/robots.ts ou public/robots.txt)      |  |
|  | [?] Hreflang tags (fr-SN, fr-CI, fr-ML, fr-CM, etc.)    |  |
|  | [?] Breadcrumb structured data                           |  |
|  | [?] Internal linking entre articles                      |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  MARCHES CIBLES (GEO)                                          |
|  +-----------------------------+                               |
|  | Senegal       (fr-SN)      |                               |
|  | Cote d'Ivoire (fr-CI)      |                               |
|  | Mali          (fr-ML)      |                               |
|  | Cameroun      (fr-CM)      |                               |
|  | Burkina Faso  (fr-BF)      |                               |
|  | Guinee        (fr-GN)      |                               |
|  | France        (fr-FR)      |                               |
|  | Togo, Benin, Niger, Congo  |                               |
|  +-----------------------------+                               |
|                                                               |
|  MOTS-CLES CIBLES                                              |
|  "emploi Afrique", "CV", "entretien", "carriere Afrique",     |
|  "recrutement", "offre emploi", "recherche emploi"             |
|                                                               |
|  FICHIERS CIBLES                                               |
|  - app/layout.tsx             (meta globales)                  |
|  - app/page.tsx               (landing page)                   |
|  - app/ressources/page.tsx    (liste articles)                 |
|  - app/ressources/[slug]/*    (articles individuels)           |
|  - app/essai/page.tsx         (page essai gratuit)             |
|  - app/auth/page.tsx          (page connexion)                 |
|  - next.config.js             (redirections, headers)          |
+---------------------------------------------------------------+
```

**Exemples d'ameliorations generees :**
- Ajout de JSON-LD Organization sur le layout
- Sitemap.xml dynamique avec tous les articles
- Hreflang tags pour le marche francophone africain
- Open Graph optimise sur la landing page

---

### 4. Module Contenu (articles blog)

```
+---------------------------------------------------------------+
|  MODULE CONTENU                            Priorite : HAUTE    |
+---------------------------------------------------------------+
|                                                               |
|  BANQUE DE 20 SUJETS PRE-DEFINIS                               |
|  +---------------------------------------------------------+  |
|  |  1. les-10-erreurs-cv-afrique                            |  |
|  |  2. preparer-entretien-embauche-afrique                  |  |
|  |  3. secteurs-recrutement-afrique-2026                    |  |
|  |  4. intelligence-artificielle-emploi-afrique             |  |
|  |  5. freelance-travail-distance-afrique                   |  |
|  |  6. competences-demandees-afrique-2026                   |  |
|  |  7. premier-emploi-diplome-afrique                       |  |
|  |  8. reconversion-professionnelle-afrique                 |  |
|  |  9. linkedin-reseaux-professionnels-afrique              |  |
|  | 10. negocier-salaire-afrique                             |  |
|  | 11. stage-professionnel-afrique-guide                    |  |
|  | 12. emploi-technologie-afrique                           |  |
|  | 13. entrepreneuriat-vs-salariat-afrique                  |  |
|  | 14. langues-atout-emploi-afrique                         |  |
|  | 15. cv-ats-optimisation-guide                            |  |
|  | 16. lettre-motivation-modele-afrique                     |  |
|  | 17. teletravail-opportunites-afrique                     |  |
|  | 18. concours-fonction-publique-guide                     |  |
|  | 19. soft-skills-emploi-afrique                           |  |
|  | 20. femmes-leadership-emploi-afrique                     |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  PROCESSUS DE GENERATION                                       |
|                                                               |
|  1. Lire lib/blog.ts                                           |
|  2. Extraire les slugs existants (eviter doublons)             |
|  3. Choisir un sujet non couvert                               |
|  4. Recherche web (TinyFish) pour enrichir le contenu          |
|  5. Generer article (~1500 mots, francais)                     |
|  6. Ajouter au tableau BlogPost dans lib/blog.ts               |
|                                                               |
|  FORMAT DE SORTIE (BlogPost)                                    |
|  {                                                             |
|    slug: "mon-article-seo",                                    |
|    title: "Titre optimise SEO",                                |
|    description: "Meta description 160 chars",                  |
|    date: "2026-03-23",                                         |
|    readTime: "7 min",                                          |
|    category: "Carriere",                                       |
|    emoji: "...",                                               |
|    content: "## Contenu markdown complet...",                  |
|    relatedSlugs: ["article-1", "article-2"]                    |
|  }                                                             |
|                                                               |
|  SPECS                                                         |
|  - Longueur : 1000-2500 mots                                   |
|  - Langue : Francais                                           |
|  - Ton : Professionnel, concret, actionnable                   |
|  - Cible : Jeunes professionnels africains                     |
|  - SEO : Mots-cles integres naturellement                      |
+---------------------------------------------------------------+
```

---

### 5. Module Qualite IA (prompts)

```
+---------------------------------------------------------------+
|  MODULE QUALITE IA                         Priorite : MOYENNE  |
+---------------------------------------------------------------+
|                                                               |
|  PROMPTS CIBLES                                                |
|  - SYSTEM_PROMPT dans lib/aiAnalyzer.ts (analyse CV)           |
|  - Prompts de coaching dans InsideAI                           |
|  - Prompts du copilote chat                                    |
|  - Prompts de l'agent de recherche d'emploi                    |
|                                                               |
|  EVALUATION SUR 5 DIMENSIONS (0-100)                           |
|  +---------------------------------------------------+        |
|  | Clarte          | Le prompt est-il clair ?         |        |
|  | Completude      | Couvre-t-il tous les cas ?       |        |
|  | Actionnabilite  | Les instructions sont concretes ?|        |
|  | Coherence       | Le ton est-il uniforme ?         |        |
|  | Score global    | Moyenne ponderee                 |        |
|  +---------------------------------------------------+        |
|                                                               |
|  + Faiblesses identifiees (array)                              |
|  + Suggestions d'amelioration (array)                          |
|                                                               |
|  PROCESSUS                                                     |
|  1. Extraire le SYSTEM_PROMPT actuel                           |
|  2. Evaluer avec un LLM-juge (5 dimensions)                   |
|  3. Generer une version amelioree                              |
|  4. Verifier que le format de sortie ne change pas             |
|  5. Proposer la modification                                   |
|                                                               |
|  REGLES                                                        |
|  - NE PAS changer la logique metier                            |
|  - NE PAS changer le format de sortie JSON                     |
|  - Ameliorer SEULEMENT la qualite du prompt                    |
|  - Garder la coherence en francais                             |
+---------------------------------------------------------------+
```

---

## Systeme de securite

AutoDev est concu pour ne JAMAIS casser ta production. Voici toutes les couches de protection :

```
+================================================================+
||                COUCHES DE PROTECTION                          ||
+================================================================+

Couche 1 : ISOLATION GIT
+-------------------------------------------------------------+
| - L'agent ne travaille JAMAIS sur la branche main            |
| - Toute modification se fait sur autodev/{module}/{date}     |
| - Si quelque chose va mal : git checkout -- . + git clean    |
| - Clone shallow (--depth 50) pour minimiser les donnees      |
+-------------------------------------------------------------+

Couche 2 : VERIFICATION BUILD
+-------------------------------------------------------------+
| - Apres chaque modification : npm run build complet          |
| - Timeout de 5 minutes                                       |
| - Si le build echoue :                                       |
|   -> Toutes les modifications sont REVERTEES                 |
|   -> Le status est enregistre comme "failed"                 |
|   -> L'agent passe au module suivant                         |
| - Extraction intelligente des erreurs TypeScript/ESLint       |
+-------------------------------------------------------------+

Couche 3 : REVIEW HUMAINE
+-------------------------------------------------------------+
| - L'agent ne merge JAMAIS lui-meme                           |
| - Tu recois une notification WhatsApp avec :                 |
|   -> Resume de l'amelioration                                |
|   -> Fichiers modifies                                       |
|   -> Lien GitHub pour voir le diff                           |
| - TOI tu decides de merger ou pas                            |
+-------------------------------------------------------------+

Couche 4 : DRY RUN
+-------------------------------------------------------------+
| - Mode AUTODEV_DRY_RUN=true                                  |
| - L'agent fait TOUT (analyse, generation, build) SAUF :      |
|   -> Pas de push sur GitHub                                  |
|   -> Pas de notification WhatsApp                            |
| - Parfait pour tester en securite                            |
+-------------------------------------------------------------+

Couche 5 : LOGGING COMPLET
+-------------------------------------------------------------+
| - Chaque action est loggee (console + fichier)               |
| - Historique des ameliorations (data/improvements.json)      |
| - Max 500 records conserves                                  |
| - Status : success | failed | skipped                        |
+-------------------------------------------------------------+
```

### Mecanisme de revert automatique

```
Modification appliquee
        |
        v
  npm run build
        |
   +----+----+
   |         |
 PASS      FAIL
   |         |
   v         v
 Branch    git checkout -- .    (revert staged changes)
 Commit    git clean -f -d      (remove new files)
 Push      git checkout main    (back to main branch)
   |         |
   v         v
 Notif     Log error
 WhatsApp  Continue to next module
```

---

## Notifications WhatsApp

L'agent t'envoie un message WhatsApp structure pour chaque amelioration reussie :

```
+----------------------------------------------------------+
|                                                          |
|  *AutoDev -- Nouvelle amelioration*                      |
|                                                          |
|  Projet :  zeroname                                      |
|  Type :    seo                                           |
|  Impact :  high                                          |
|  Branche : autodev/seo/2026-03-23-a1b2c3d               |
|                                                          |
|  *Ajout de JSON-LD Organization sur le layout*           |
|  Ajout de donnees structurees Schema.org pour            |
|  ameliorer le referencement dans les moteurs de          |
|  recherche. Inclut le nom, logo, et liens sociaux.       |
|                                                          |
|  Fichiers modifies :                                     |
|    - app/layout.tsx                                      |
|    - next.config.js                                      |
|                                                          |
|  Build : PASSE                                           |
|                                                          |
|  Review :                                                |
|  github.com/BigOD2307/zeroname/compare/main...           |
|  autodev/seo/2026-03-23-a1b2c3d                          |
|                                                          |
|  Reponds "merge" pour approuver ou "skip"                |
|  pour ignorer.                                           |
|                                                          |
+----------------------------------------------------------+
```

### Acheminement de la notification

```
AutoDev Agent (Railway)
        |
        | POST /api/autodev/notify
        | { secret, phone, message }
        v
ZeroName API (Vercel)
        |
        +---> WhatsApp Business API (si configure)
        |
        +---> Supabase queue (pour le bot Baileys)
        |
        +---> Console log (fallback)
```

---

## Installation

### En local

```bash
# 1. Clone le repo
git clone https://github.com/BigOD2307/AutoDev.git
cd AutoDev

# 2. Installe les dependances
npm install

# 3. Configure tes cles API
cp .env.example .env
# Edite .env avec tes vraies valeurs

# 4. Test en dry-run (aucun push, aucune notification)
AUTODEV_DRY_RUN=true AUTODEV_RUN_NOW=true npx tsx src/index.ts

# 5. Build pour production
npm run build
```

### Deploiement sur Railway

```
Etape 1 : Connecte ton repo GitHub a Railway
+----------------------------------------------------+
| railway.app -> New Project -> Deploy from GitHub   |
| Selectionne : BigOD2307/AutoDev                    |
+----------------------------------------------------+

Etape 2 : Configure les variables d'environnement
+----------------------------------------------------+
| Variable              | Valeur                     |
|----------------------------------------------------+
| OPENROUTER_API_KEY    | sk-or-v1-...               |
| GITHUB_TOKEN          | ghp_...                    |
| AUTODEV_SECRET        | ton-secret-unique          |
| NOTIFY_PHONE          | 225XXXXXXXXX               |
| ZERONAME_NOTIFY_URL   | https://zeroname.space/     |
|                       | api/autodev/notify          |
| TINYFISH_API_KEY      | sk-tinyfish-...            |
| AUTODEV_DRY_RUN       | true (au debut)            |
| AUTODEV_RUN_NOW       | true (1er lancement)       |
+----------------------------------------------------+

Etape 3 : Railway detecte le Dockerfile et deploie
+----------------------------------------------------+
| Le Dockerfile :                                    |
| - Installe Node 20 + git                           |
| - Installe les deps                                |
| - Build TypeScript -> dist/                        |
| - Lance node dist/index.js                         |
+----------------------------------------------------+

Etape 4 : Verifie les logs
+----------------------------------------------------+
| Railway -> Deployments -> Logs                     |
| Tu devrais voir :                                  |
| "AutoDev Agent starting up"                        |
| "Schedule: 0 */4 * * *"                            |
| "Running immediately..."                           |
+----------------------------------------------------+

Etape 5 : Passe en production
+----------------------------------------------------+
| Change AUTODEV_DRY_RUN a "false"                   |
| L'agent commence a creer des branches et           |
| t'envoyer des notifications WhatsApp               |
+----------------------------------------------------+
```

### Avec Docker

```bash
# Build l'image
docker build -t autodev-agent .

# Lance en dry-run
docker run --env-file .env \
  -e AUTODEV_DRY_RUN=true \
  -e AUTODEV_RUN_NOW=true \
  autodev-agent

# Lance en production
docker run --env-file .env \
  -e AUTODEV_DRY_RUN=false \
  autodev-agent
```

---

## Configuration

### Variables d'environnement

```bash
# ================================================================
# OBLIGATOIRES
# ================================================================

# Cle API OpenRouter (pour les modeles LLM)
# Obtenir sur : https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# Token GitHub (pour push les branches)
# Creer sur : github.com/settings/tokens
# Scope requis : "repo" (full control)
GITHUB_TOKEN=ghp_xxxxx

# Secret partage entre l'agent et ZeroName
# Pour authentifier les notifications
AUTODEV_SECRET=ton-secret-unique

# ================================================================
# NOTIFICATIONS
# ================================================================

# Numero WhatsApp (format international sans +)
NOTIFY_PHONE=2250712345678

# URL de l'endpoint de notification dans ZeroName
ZERONAME_NOTIFY_URL=https://zeroname.space/api/autodev/notify

# ================================================================
# OPTIONNELLES
# ================================================================

# Cle API OpenAI (fallback si OpenRouter down)
OPENAI_API_KEY=sk-proj-xxxxx

# Cle API TinyFish (recherche web pour le contenu)
TINYFISH_API_KEY=sk-tinyfish-xxxxx

# Cle API ElevenLabs (pour les features vocales InsideAI)
ELEVENLABS_API_KEY=sk_xxxxx

# ================================================================
# MODE DE FONCTIONNEMENT
# ================================================================

# true = analyse sans push ni notification
# false = mode production complet
AUTODEV_DRY_RUN=false

# true = lance immediatement au demarrage
AUTODEV_RUN_NOW=true

# Expression CRON pour la frequence
# Defaut : toutes les 4 heures
AUTODEV_SCHEDULE=0 */4 * * *

# ================================================================
# REPOS (optionnel - valeurs par defaut incluses)
# ================================================================

ZERONAME_REPO_URL=https://github.com/BigOD2307/zeroname.git
INSIDEAI_REPO_URL=https://github.com/BigOD2307/InsideAI---The-APP-.git
```

### Configuration des repos

Chaque repo est configure dans `src/config.ts` :

```typescript
{
  name: 'zeroname',                          // Identifiant
  url: 'https://github.com/.../zeroname.git', // URL GitHub
  localPath: '/tmp/autodev/zeroname',         // Clone local
  buildCmd: 'npm run build',                  // Commande de build
  mainBranch: 'main',                         // Branche principale
  keyFiles: [                                 // Fichiers que l'agent lit
    'lib/aiAnalyzer.ts',
    'lib/openRouter.ts',
    'lib/jobsAgent.ts',
    'lib/blog.ts',
    'middleware.ts',
    'next.config.js',
    // ...
  ],
}
```

### Planning CRON

```
# Exemples de schedules

0 */4 * * *     Toutes les 4 heures (defaut)
0 */2 * * *     Toutes les 2 heures (plus agressif)
0 3 * * *       Une fois par jour a 3h du matin
0 */6 * * *     Toutes les 6 heures (economique)
*/30 * * * *    Toutes les 30 minutes (mode turbo)
```

---

## Structure du projet

```
autodev-agent/
|
|-- src/
|   |-- index.ts                 Entry point + cron scheduler
|   |-- config.ts                Configuration centralisee
|   |
|   |-- core/
|   |   |-- agent.ts             Boucle principale d'amelioration
|   |   |-- analyzer.ts          Analyse du code via LLM
|   |   |-- builder.ts           Verification du build
|   |   |-- git.ts               Operations Git (clone, branch, push)
|   |   |-- notifier.ts          Notifications WhatsApp
|   |
|   |-- modules/
|   |   |-- seo.ts               Module SEO / GEO
|   |   |-- content.ts           Module generation de contenu
|   |   |-- performance.ts       Module optimisation performance
|   |   |-- security.ts          Module audit securite
|   |   |-- quality.ts           Module qualite des prompts IA
|   |
|   |-- utils/
|       |-- llm.ts               Client LLM unifie (OpenRouter)
|       |-- router.ts            Smart routing entre 10 modeles
|       |-- logger.ts            Logging + historique
|
|-- docs/
|   |-- program-zeroname.md      Guide d'experimentation ZeroName
|   |-- program-insideai.md      Guide d'experimentation InsideAI
|
|-- data/
|   |-- improvements.json        Historique (auto-genere)
|   |-- autodev.log              Logs (auto-genere)
|
|-- Dockerfile                   Container pour Railway
|-- package.json                 Dependances
|-- tsconfig.json                Configuration TypeScript
|-- .env.example                 Template variables d'env
|-- .gitignore                   Fichiers exclus
```

---

## Cycle de vie d'une amelioration

```
ETAPE 1 : SELECTION DU MODULE
+-------------------------------------------------------+
| L'agent regarde l'historique des dernieres executions  |
| et choisit le module le moins recemment utilise.       |
| Ordre de priorite : security > performance > seo >    |
| content > quality                                      |
+-------------------------------------------------------+
              |
              v
ETAPE 2 : PREPARATION
+-------------------------------------------------------+
| - git clone (ou git pull si deja clone)                |
| - npm install                                          |
| - Lecture des fichiers cles du projet                  |
+-------------------------------------------------------+
              |
              v
ETAPE 3 : SCAN RAPIDE (specifique au module)
+-------------------------------------------------------+
| Le module fait un scan statique du code :              |
| - Securite : cherche auth, validation, rate limit      |
| - Performance : cherche imports lourds, img, awaits    |
| - SEO : verifie sitemap, robots, meta tags             |
| - Contenu : lit les articles existants                 |
| - Qualite : extrait et evalue les prompts              |
+-------------------------------------------------------+
              |
              v
ETAPE 4 : ANALYSE LLM
+-------------------------------------------------------+
| Le smart router choisit le meilleur modele LLM.       |
| Le code source est envoye avec un prompt specialise.   |
| Le LLM retourne un JSON avec :                        |
| - Titre de l'amelioration                              |
| - Description                                          |
| - Impact (low/medium/high)                             |
| - Fichiers modifies (contenu COMPLET)                  |
| - Message de commit                                    |
+-------------------------------------------------------+
              |
              v
ETAPE 5 : APPLICATION
+-------------------------------------------------------+
| Les fichiers modifies sont ecrits sur le disque.       |
| Une branche autodev/{module}/{date} est creee.         |
+-------------------------------------------------------+
              |
              v
ETAPE 6 : VERIFICATION
+-------------------------------------------------------+
| npm run build est execute.                             |
| Si le build echoue :                                   |
|   -> git checkout -- .                                 |
|   -> git clean -f -d                                   |
|   -> git checkout main                                 |
|   -> Status = "failed"                                 |
| Si le build passe :                                    |
|   -> git add + git commit + git push                   |
|   -> Status = "success"                                |
+-------------------------------------------------------+
              |
              v
ETAPE 7 : NOTIFICATION
+-------------------------------------------------------+
| Message WhatsApp envoye avec :                         |
| - Resume de l'amelioration                             |
| - Fichiers modifies                                    |
| - Lien GitHub compare                                  |
| - Status du build                                      |
+-------------------------------------------------------+
              |
              v
ETAPE 8 : LOG
+-------------------------------------------------------+
| L'amelioration est enregistree dans                    |
| data/improvements.json avec tous les details.          |
+-------------------------------------------------------+
```

---

## Algorithmes cles

### Algorithme de selection du module

```
function getNextModule():
  history = dernieres 10 ameliorations reussies
  recentModules = modules utilises recemment

  # Priorite 1 : modules jamais utilises recemment
  for module in [security, performance, seo, content, quality]:
    if module NOT in recentModules:
      return module

  # Priorite 2 : module utilise le plus anciennement
  for module in ORDER:
    lastIndex = position la plus recente dans recentModules
    if lastIndex < (length - 5):
      return module

  # Fallback : round-robin
  totalRuns = nombre total de succes
  return ORDER[totalRuns % 5]
```

### Algorithme de routage LLM

```
function pickModels(taskType, maxCost):
  # Filtrer les modeles
  candidates = MODELS
    .filter(strengths includes taskType OR general)
    .filter(costOut <= maxCost)

  # Scorer chaque modele
  for model in candidates:
    successRate = model.successes / model.attempts (defaut 0.8)
    speedBonus = fast:1.3, medium:1.0, slow:0.7
    costEfficiency = 1 / (costOut + 0.01)
    strengthMatch = exact:1.5, general:1.0

    score = quality * costEfficiency * successRate * speedBonus * strengthMatch

  # Trier par score decroissant
  return top 3 models
```

### Algorithme de verification du build

```
function verifyBuild(repo):
  # Injecter les env vars placeholder
  env = {
    NODE_ENV: "production",
    RESEND_API_KEY: placeholder,
    JWT_SECRET: placeholder,
    SUPABASE keys: placeholder,
    ...
  }

  # Executer la commande de build
  result = exec(repo.buildCmd, {
    cwd: repo.localPath,
    timeout: 5 minutes,
    maxBuffer: 10MB,
    env: env
  })

  # Extraire les erreurs
  errors = extractErrors(stdout + stderr)
    # Pattern TypeScript : error TSxxxx
    # Pattern ESLint : line:col error
    # Pattern generique : Error:, TypeError:

  return { success, stdout, stderr, durationMs, errors }
```

---

## Logs et historique

### Format des logs console

```
[2026-03-23T03:20:52.175Z] [INFO] [main] AutoDev Agent starting up
[2026-03-23T03:20:55.895Z] [INFO] [performance] Starting performance analysis
[2026-03-23T03:20:56.103Z] [DEBUG] [router] Task: code -> Models: deepseek/deepseek-v3.2, qwen/qwen3-235b-a22b
[2026-03-23T03:23:31.901Z] [DEBUG] [llm] DeepSeek V3.2 -- 37148 tokens, 5159 chars
[2026-03-23T03:23:31.902Z] [SUCCESS] [analyzer] Found improvement: Lazy loading des composants
[2026-03-23T03:23:48.656Z] [ERROR] [builder] Build failed for zeroname (16600ms)
[2026-03-23T03:23:49.003Z] [INFO] [git] Discarded changes in zeroname, back to main
```

### Format de l'historique (data/improvements.json)

```json
[
  {
    "id": "zeroname-security-mn2l5g2a",
    "timestamp": "2026-03-23T02:50:31.919Z",
    "project": "zeroname",
    "module": "security",
    "branch": "autodev/security/2026-03-23-mn2l8akn",
    "status": "failed",
    "summary": "Ajout de rate limiting -- BUILD FAILED",
    "filesChanged": ["app/api/analyze/route.ts"],
    "buildPassed": false,
    "error": "Error: Turbopack build failed..."
  },
  {
    "id": "insideai-security-mn2l9300",
    "timestamp": "2026-03-23T02:50:47.288Z",
    "project": "insideai",
    "module": "security",
    "branch": "autodev/security/2026-03-23-mn2l9els",
    "status": "success",
    "summary": "Implement CSP headers for web platform",
    "filesChanged": ["lib/main.dart"],
    "buildPassed": true
  }
]
```

---

## Gestion des erreurs

```
+------------------------------------------------------------------+
|  SCENARIO                        | ACTION DE L'AGENT             |
+------------------------------------------------------------------+
| Build echoue                     | Revert auto, log, continue    |
| LLM timeout                      | Essayer modele suivant (x3)   |
| LLM reponse invalide            | Log warn, retourner null      |
| Pas d'amelioration trouvee      | Log "skipped", continue       |
| npm install echoue              | Log error, tenter le build    |
| Git push echoue                 | Log error, notification erreur|
| Notification echoue             | Log le message, continue      |
| Exception non geree             | Log + notif WhatsApp erreur   |
| Cle API manquante               | Erreur explicite au demarrage |
| Repo inaccessible               | Log error, passer au suivant  |
| Contexte trop long (>80K chars) | Tronquer, continuer           |
+------------------------------------------------------------------+
```

---

## Projets supportes

### ZeroName.space

```
Type     : Application web Next.js
Stack    : Next.js 16, React 18, Supabase, OpenAI + OpenRouter
Deploy   : Vercel
Modules  : TOUS (seo, content, performance, security, quality)
Build    : npm run build
```

### InsideAI

```
Type     : Application mobile
Stack    : Flutter / Expo React Native
Deploy   : App Store / Play Store
Modules  : security, quality (seulement)
Build    : Verification simplifiee
```

### Ajouter un nouveau projet

Edite `src/config.ts` et ajoute une entree dans `repos` :

```typescript
monprojet: {
  name: 'monprojet',
  url: 'https://github.com/user/monprojet.git',
  localPath: '/tmp/autodev/monprojet',
  buildCmd: 'npm run build',
  mainBranch: 'main',
  keyFiles: [
    'src/index.ts',
    'package.json',
    // fichiers importants de ton projet
  ],
},
```

Puis dans `src/core/agent.ts`, ajoute le cycle pour ton projet dans `runAgent()`.

---

## Guide de contribution

### Ajouter un nouveau module

1. Cree `src/modules/monmodule.ts`
2. Exporte `runMonModule(repo: RepoConfig): Promise<Improvement | null>`
3. Ajoute le type dans `ImprovementModule` dans `analyzer.ts`
4. Ajoute le prompt dans `MODULE_PROMPTS`
5. Ajoute les fichiers cibles dans `getTargetFiles()`
6. Ajoute le runner dans `MODULE_RUNNERS` dans `agent.ts`
7. Ajoute le module dans `MODULE_ORDER`

### Ajouter un nouveau modele LLM

Edite `src/utils/router.ts` et ajoute dans le tableau `MODELS` :

```typescript
{
  id: 'provider/model-name',
  name: 'Model Display Name',
  costIn: 0.XX,      // USD par 1M tokens input
  costOut: 0.XX,      // USD par 1M tokens output
  contextWindow: XXXXX,
  strengths: ['code', 'analysis'],
  quality: XX,        // Score 0-100
  speed: 'fast',      // fast | medium | slow
},
```

---

## FAQ

### L'agent peut-il casser ma production ?

**Non.** L'agent ne push jamais sur `main`. Il cree toujours une branche separee (`autodev/...`). Si le build echoue, les changements sont automatiquement reverts. Tu dois review et merger manuellement.

### Combien ca coute ?

- **Railway** : ~$5/mois
- **LLM** : ~$1-2/mois (DeepSeek V3.2 est quasi gratuit)
- **Total** : ~$6-7/mois

### Comment l'agent choisit le modele ?

Le smart router score chaque modele sur : qualite, cout, taux de succes passe, vitesse, et adequation a la tache. Il choisit le top 3 et essaie chacun en cascade si un echoue.

### Que se passe-t-il si le LLM genere du mauvais code ?

Le build (`npm run build`) le detecte. Si le build echoue, tout est automatiquement revert. Meme si le build passe, tu dois quand meme review le diff sur GitHub avant de merger.

### Puis-je ajouter mes propres projets ?

Oui. Ajoute une entree dans `src/config.ts` avec l'URL du repo, la commande de build, et les fichiers cles. Voir la section "Ajouter un nouveau projet".

### Comment changer la frequence ?

Modifie `AUTODEV_SCHEDULE` dans `.env`. Format CRON standard. Exemples :
- `0 */2 * * *` = toutes les 2 heures
- `0 3 * * *` = une fois par jour a 3h

### Les notifications WhatsApp ne marchent pas ?

Verifie :
1. `AUTODEV_SECRET` est identique dans Railway ET dans Vercel (ZeroName)
2. `NOTIFY_PHONE` est au bon format (sans +, ex: 2250712345678)
3. `ZERONAME_NOTIFY_URL` pointe vers la bonne URL
4. Le endpoint `/api/autodev/notify` est deploye sur ZeroName

### Puis-je utiliser un seul modele au lieu du router ?

Oui. Definis `LLM_MODEL` dans `.env` :
```
LLM_MODEL=deepseek/deepseek-v3.2
```
Le router sera bypass et ce modele sera utilise pour tout.

---

## Stack technique

```
Runtime        : Node.js 20+
Langage        : TypeScript 5.8
Build          : tsc (TypeScript Compiler)
Container      : Docker (node:20-slim)
Deploiement    : Railway / Docker
Git            : simple-git
Cron           : node-cron
LLM            : OpenRouter API (10 modeles)
Search         : TinyFish API
Env            : dotenv
```

---

## Licence

MIT License - Dicken AI (c) 2026

Cree par **Ousmane Dicko** avec l'aide de **Claude (Anthropic)**

---

<p align="center">
  <strong>AutoDev Agent</strong> — par <a href="https://github.com/dickenai">Dicken AI</a>
  <br>
  <em>L'IA qui ameliore tes apps pendant que tu dors.</em>
</p>
