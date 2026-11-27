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
4. **Facts about standards and laws are cited — inside the text.** There is no source list under a post and the
   `sources:` field stays empty (owner, 25.11.2026): a source with a public address is a link on the words that name
   it; one without an address is named without a link. Article and paragraph numbers are checked against the current
   edition (lex.uz for Uzbek acts, the IAASB Handbook 2026 for ISA/ISQM). If you cannot verify a number, do not write it.
5. **Three languages share one `translationKey`.** A translation may lag, but never diverge in facts.
   Uzbek and English texts written by a model carry `reviewed: false` until a partner reviews them.
6. **Nothing interactive.** Do not add forms, chat widgets, analytics scripts or external embeds. `_headers`
   sets a strict CSP; a change there is a decision of the owner.
7. **Firm facts live in `src/config/site.ts`** (names, address, registry, socials, rubrics). Change them there, not in texts.
8. **A reprint does not point at the author's personal site** (owner, 27.11.2026). A text that first appeared on a
   partner's own site (tilep.in) is published here as the firm's article: no "first published on…" line and no link
   to that site, in any language. The content gate fails on such a link.
9. **No letter ё in Russian texts** (owner, 27.11.2026): write е, in content and in interface strings. The gate fails on it.
10. **Plain words about the firm** (owner, 27.11.2026). Pages about the firm do not explain the quality system, name
    ISQM or the firm's internal documents, or describe internal roles and tools. Positions are the official ones:
    S. Golosova is Director and Managing Partner, I. Tilepin is Deputy Director for Development and Partner. The firm
    has worked since 2002; the registry number is not published. Stress tax advice, IFRS and forensic work.
    Audit always comes first in any list of what the firm does. The firm gives tax advice only: no legal advice, no
    "commercial law". A standard is named in full with its issuer on first mention (International Standards on
    Auditing and International Standard on Quality Management 1, issued by the IAASB), not by a bare abbreviation.
    Do not advertise AI: the blog rubric is «Современные технологии», and firm pages do not mention AI.
    Terms follow the Law on Auditing Activity (ЗРУ-677): art. 9 for the standards («международные стандарты аудита,
    публикуемые Советом по международным стандартам аудита и заданий, обеспечивающих уверенность Международной
    федерации бухгалтеров»; «международные стандарты контроля качества»), art. 33 for the services («консультирование
    по применению налогового законодательства», «составление финансовой отчетности по МСФО», «информационная
    безопасность финансовой информации»), art. 45 for quality («внутренний контроль качества работы аудиторов»).
    Uzbek uses the law's words: tahliliy tekshiruv, turdosh xizmatlar, auditning xalqaro standartlari.
    No bare abbreviations: on first mention in a page write the full name, then the abbreviation in brackets
    («международные стандарты финансовой отчетности (МСФО)»); the `standards:` tags of a service are data and are
    not shown. Do not name НСБУ: write «национальные и международные стандарты финансовой отчетности».
    No slogans anywhere: the firm is presented by the plain line «Аудит, налоги и консалтинг».

## Writing a post

```
node scripts/new-post.mjs <slug> --rubric audit|ifrs|tax|ai|firm --author <team-key> [--issue N] [--date YYYY-MM-DD]
```
Then fill `src/content/posts/ru/<date>-<slug>.md` first (Russian is the master for Uzbek-law topics; English is the
master for methodology topics — write the master, then translate), remove `draft: true`, run `npm run check:content`
and `npm run build`. Structure that works: `## Главное` (3–5 bullets, answer first) → what changes → how to prepare
(table), with sources as inline links. The post must open with that second-level heading and a plain list right
after it: the page lifts the pair into the key-points box beside the text. A source line under a table is an italic
paragraph right after the table; it is set as the table's caption. Description 40–320 characters: it is the card, the meta description, the feed summary and the
llms.txt line. Title ≤ 140 characters. Keep paragraphs short; one idea per paragraph.

Posts with a future `date` are built in dev but hidden in production until the day; the scheduled workflow rebuilds daily.

## Services, team, pages

One file per language with the same file name: `services/<lang>/<key>.md`, `team/<lang>/<key>.md`,
`pages/<lang>/<key>.md`. A service carries `short:` — the name used in the footer; keep it under 40 characters. The key is the URL slug and the link between languages. `pages/<lang>/home.md` is the
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
