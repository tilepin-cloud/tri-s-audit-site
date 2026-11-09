# tri-s-audit-site

Public website of **TRI-S-AUDIT**, an audit organisation in Tashkent, Uzbekistan — <https://tri-s-audit.uz>.

Static site on [Astro](https://astro.build), three languages (Russian, English, Uzbek), content in Markdown,
built and hosted by Cloudflare from this repository. No forms, no cookies, no third-party scripts.
Machine-readable: `robots.txt` with explicit AI-crawler policy, `llms.txt`, `llms-full.txt`, Markdown twin of every
post, JSON-LD on every page, RSS per language and per rubric, hreflang with `x-default`.

```
npm install
npm run dev
npm run check:content
npm run build
```

Editing rules for people and agents: [AGENTS.md](AGENTS.md). Orientation for Claude Code: [CLAUDE.md](CLAUDE.md).

Texts © TRI-S-AUDIT. Quote with a link to the canonical URL. Code: MIT.
