# AGENTS.md — rules for AI agents and people editing this repository

This is the public website of the audit firm TRI-S-AUDIT (tri-s-audit.uz). Everything here is public the moment it
reaches `main`. Internal boards, the media plan and drafts live in the private repository `tri-s-audit-desk`, never here.

## What the site is

Astro, static output, three languages (`ru` primary, `en`, `uz` in Latin script), content in Markdown under
`src/content/`, built by Cloudflare from GitHub. No forms, no comments, no accounts, no third-party scripts.
Readers contact the firm by e-mail or social channels only.

## Hard rules

1. **No client names, ever.** Not in posts, not in examples, not in commit messages.
2. **No `[TBD]` or `[TBC]` in a published text.** The content gate (`npm run check:content`) fails the build.
   Unfinished texts carry `draft: true`.
3. **Every post has a human author** (`author:` = a key in `src/content/team/`). The model drafts, a person signs.
4. **Facts about standards and laws are cited.** Each post lists `sources:`; article and paragraph numbers are
   checked against the current edition (lex.uz for Uzbek acts, the IAASB Handbook 2026 for ISA/ISQM).
   If you cannot verify a number, do not write it.
5. **Three languages share one `translationKey`.** A translation may lag, but never diverge in facts.
   Uzbek and English texts written by a model carry `reviewed: false` until a partner reviews them.
6. **Nothing interactive.** Do not add forms, chat widgets, analytics scripts or external embeds. `_headers`
   sets a strict CSP; a change there is a decision of the owner.
7. **Firm facts live in `src/config/site.ts`** (names, address, registry, socials, rubrics). Change them there, not in texts.

## Writing a post

```
node scripts/new-post.mjs <slug> --rubric audit|ifrs|tax|ai|firm --author <team-key> [--issue N] [--date YYYY-MM-DD]
```
Then fill `src/content/posts/ru/<date>-<slug>.md` first (Russian is the master for Uzbek-law topics; English is the
master for methodology topics — write the master, then translate), remove `draft: true`, run `npm run check:content`
and `npm run build`. Structure that works: `## Главное` (3–5 bullets, answer first) → what changes → how to prepare
(table) → sources. Description 40–320 characters: it is the card, the meta description, the feed summary and the
llms.txt line. Title ≤ 140 characters. Keep paragraphs short; one idea per paragraph.

Posts with a future `date` are built in dev but hidden in production until the day; the scheduled workflow rebuilds daily.

## Services, team, pages

One file per language with the same file name: `services/<lang>/<key>.md`, `team/<lang>/<key>.md`,
`pages/<lang>/<key>.md`. The key is the URL slug and the link between languages. `pages/<lang>/home.md` is the
home page: its title and description are the hero, its body is the "How we work" block.

## Documents

Copy the PDF to `public/docs/`, add a block to `src/content/documents.yaml` (title and summary in three languages,
category, date, document languages, file). Limit 25 MB per file. PDFs are public: no client data, no personal data.

## Checks before a pull request

```
npm run check:content   # gate: errors fail, warnings are listed
npm run build           # astro build + pagefind index
```
CI runs both and smoke-tests `robots.txt`, `llms.txt`, the sitemap, RSS, hreflang and JSON-LD.

## Release

`main` is production. Work on a branch, open a pull request, let CI pass, merge. Cloudflare builds `main`
automatically. Preview deployments of branches carry `NOINDEX=1`.
