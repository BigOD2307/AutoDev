# AutoDev Program Template

Copy this template and customize it for your project. Place it as `docs/program-{project-name}.md` in the AutoDev directory.

## Project: {Your Project Name}

**Description:** {What your project does}
**Stack:** {e.g., Next.js 15, React 19, PostgreSQL}
**Deployment:** {e.g., Vercel, Railway, AWS}

## Safety Rules

1. NEVER break production
2. One improvement at a time
3. Branch only (`autodev/{module}/{date}`)
4. Verify build before push
5. Notify on success
6. Discard on failure

## Module Configuration

### Security (Priority: High)
- Input validation on API routes
- Authentication checks on protected endpoints
- Rate limiting on sensitive routes
- CSP headers

### Performance (Priority: Medium)
- Dynamic imports for heavy components
- Image optimization
- API route optimization
- Bundle size reduction

### SEO (Priority: Medium)
- Meta tags on all public pages
- JSON-LD structured data
- Sitemap and robots.txt
- Open Graph tags

### Content (Priority: Low)
- Blog articles related to your niche
- Target audience: {your audience}
- Language: {en/fr/es/etc.}

### Quality (Priority: Medium)
- System prompts optimization
- AI response quality improvement

## Key Files

| File | Purpose | Module |
|------|---------|--------|
| {path/to/file} | {what it does} | {which module} |

## Constraints

- Build command: `{npm run build}`
- Max file changes per improvement: 3
- Article length: 1000-2500 words
