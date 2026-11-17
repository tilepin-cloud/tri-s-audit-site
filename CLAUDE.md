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
| `src/styles/global.css` | design v3 tokens and all styles; Montserrat and Inter via `@fontsource`; no framework |
| `scripts/` | `check-content.mjs` gate, `new-post.mjs` scaffold, `indexnow.mjs` |
| `public/_headers`, `public/_redirects` | security headers and 301 map for Cloudflare |
| `design-v3/` | the approved static page of design v3 (visual source of truth, not built); `CREDITS.md` at the root lists photo and font credits |
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

- Design v3 (approved by the partners, source of truth: the static page in `design-v3/`): white tall header with
  the owl mark and the wordmark; full-bleed hero with the mountain photo under a dark gradient and the firm name as
  the title; navy `#0F2A44` panels with thin-bordered cards; numbered steps; the leadership block on the `#EEF5FB`
  band; posts as bordered cards; sky `#3080C0` contact panel; near-black `#0B1420` footer. Sections breathe at
  128–136 px. Colours and fonts only from the tokens in `global.css`: Montserrat 500–800 for headings and the
  wordmark, Inter 400–600 for text, both from Fontsource. Orange `#F87831` appears only in hover and focus states and
  under the current language: text links get an orange underline on hover, buttons and cards never. One light scheme.
  At 1180 px and below the header puts the logo and languages on the first row and the menu on a scrolling second
  row. `prototype/` shows the rejected v1 look; `design-v3/` is kept as the visual reference, not built.
- Every page sets `alternates` so hreflang is reciprocal and never points at a missing translation.
- URLs: `/<lang>/section/slug/` with trailing slash; rubric and service keys are language-independent.
- Uzbek is Latin script (`uz-Latn`); use the proper apostrophes oʻ, gʻ, ʼ.
- Do not add dependencies for things CSS or a few lines of script can do.
- Commit messages: `content: <what>` for texts, `site: <what>` for code; mention the language(s) touched.
