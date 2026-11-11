# CLAUDE.md — tri-s-audit-site

Public website of TRI-S-AUDIT. Read `AGENTS.md` first: it holds the rules (no client names, no `[TBD]` in published
texts, human author on every post, three languages by `translationKey`, nothing interactive).

## Map

| Where | What |
|---|---|
| `src/config/site.ts` | firm facts, languages, rubrics, document categories, AI crawler list |
| `src/content.config.ts` | Zod schemas of the collections (posts, services, team, pages, documents, issues) |
| `src/content/` | the content, one folder per language inside each collection; `documents.yaml`, `issues.yaml` |
| `src/i18n/ui.ts` | interface strings; `src/i18n/utils.ts` paths, dates, language switch |
| `src/layouts/Base.astro` | head: canonical, hreflang, OG, feeds, JSON-LD; header and footer |
| `src/lib/schema.ts` | schema.org builders (Organization, Person, BlogPosting, Service, FAQPage, Breadcrumbs) |
| `src/lib/content.ts` | collection queries, visibility (drafts and future dates hidden in production) |
| `src/pages/` | routes under `[lang]/`; `robots.txt.ts`, `llms.txt.ts`, `llms-full.txt.ts`, `og/[...path].png.ts` |
| `src/styles/global.css` | design tokens of TPL-DOC-001 and all styles; no framework |
| `scripts/` | `check-content.mjs` gate, `new-post.mjs` scaffold, `indexnow.mjs` |
| `public/_headers`, `public/_redirects` | security headers and 301 map for Cloudflare |
| `prototype/` | the HTML prototype of three screens in the v1 design (superseded, not built) |

## Commands

```
npm run dev              # http://localhost:4321
npm run check:content    # content gate
npm run build            # SITE_URL=https://tri-s-audit.uz for production; NOINDEX=1 for the preview host
npm run preview
node scripts/new-post.mjs <slug> --rubric ifrs --author tilepin --issue 2
```

## Conventions

- Design v2 (partners' brief: modern, airy, colourful): one light scheme; colours and fonts only from the tokens in
  `global.css`. The brand colours sky, black and orange are mandatory and carry large rounded panels (sky hero, black
  "how we work", orange contact panel, black footer); cards sit on sky tints. Keep generous spacing (`--section`).
  `prototype/` still shows the rejected v1 look.
- Every page sets `alternates` so hreflang is reciprocal and never points at a missing translation.
- URLs: `/<lang>/section/slug/` with trailing slash; rubric and service keys are language-independent.
- Uzbek is Latin script (`uz-Latn`); use the proper apostrophes oʻ, gʻ, ʼ.
- Do not add dependencies for things CSS or a few lines of script can do.
- Commit messages: `content: <what>` for texts, `site: <what>` for code; mention the language(s) touched.
