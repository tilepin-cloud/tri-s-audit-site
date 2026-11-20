#!/usr/bin/env node
/**
 * Content gate, run before every build (npm run check:content) and in CI.
 * Errors (exit 1): [TBD]/[TBC] in a non-draft text, a post without translationKey or author, an unknown author,
 *                  a document whose file is missing, a broken internal link, a date in the wrong format.
 * Warnings:        a text present in one language but not the others, reviewed: false, a description outside 40–320 chars.
 * Pure Node, no dependencies; the file walker and the front matter parser are in lib/content-files.mjs.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { CONTENT, PUBLIC, LANGS, rel, walk, frontMatter } from './lib/content-files.mjs';

const errors = [], warnings = [];
const err = (f, m) => errors.push(`${rel(f)}: ${m}`);
const warn = (f, m) => warnings.push(`${rel(f)}: ${m}`);

const collections = ['pages', 'services', 'team', 'posts'];
const byKey = {}; // collection -> key -> Set(lang)
const authors = new Set(walk(join(CONTENT, 'team')).map((f) => f.split(sep).pop().replace(/\.(md|mdx)$/, '')));
const postSlugs = new Set();

for (const col of collections) {
  byKey[col] = {};
  for (const file of walk(join(CONTENT, col))) {
    const parts = rel(file).split('/');
    const lang = parts[3]; // src/content/<col>/<lang>/<name>
    const name = parts.slice(4).join('/').replace(/\.(md|mdx)$/, '');
    if (!LANGS.includes(lang)) { err(file, `unexpected language folder "${lang}"`); continue; }
    const { data, body } = frontMatter(readFileSync(file, 'utf8'));
    const key = col === 'posts' ? (data.translationKey ?? name) : name;
    (byKey[col][key] ??= new Set()).add(lang);
    if (data.draft !== true) {
      const tbd = (body + JSON.stringify(data)).match(/\[TB[DC]\]/g);
      if (tbd) err(file, `${tbd.length} × [TBD]/[TBC] in a published text`);
    }
    if (data.reviewed === false) warn(file, 'reviewed: false — human review pending');
    if (typeof data.description === 'string' && (data.description.length < 40 || data.description.length > 320)) warn(file, `description is ${data.description.length} chars (40–320 expected)`);
    if (col === 'posts') {
      if (!data.translationKey) err(file, 'translationKey is required');
      if (!data.author) err(file, 'author is required'); else if (!authors.has(data.author)) err(file, `unknown author "${data.author}" (no team/*/${data.author}.md)`);
      if (!/^\d{4}-\d{2}-\d{2}/.test(String(data.date ?? ''))) err(file, `date "${data.date}" must be YYYY-MM-DD`);
      if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/.test(name)) warn(file, 'file name should be YYYY-MM-DD-slug.md (lowercase, hyphens)');
      const slug = data.slug ?? name.replace(/^\d{4}-\d{2}-\d{2}-/, '');
      const id = `${lang}/${slug}`;
      if (postSlugs.has(id)) err(file, `duplicate slug "${slug}" in ${lang}`); else postSlugs.add(id);
      if (!data.description) err(file, 'description is required');
    }
    // Internal links: /ru/... must resolve to a content entry or a known route; relative links to .md are not allowed.
    for (const m of body.matchAll(/\]\((\/[a-z]{2}\/[^)#\s]*)/g)) {
      const target = m[1].replace(/\/$/, '');
      const [, tl, section, ...rest] = target.split('/');
      const known = ['services', 'team', 'blog', 'documents', 'issues', 'about', 'contacts', 'for-ai', 'legal', 'search'];
      if (!LANGS.includes(tl) || (section && !known.includes(section))) warn(file, `link ${m[1]} points outside known sections`);
      if ((section === 'services' || section === 'team') && rest[0] && !byKeyHas(section, rest[0])) err(file, `broken link ${m[1]}`);
    }
  }
}
function byKeyHas(col, key) { return existsSync(join(CONTENT, col)) && walk(join(CONTENT, col)).some((f) => f.endsWith(`${sep}${key}.md`) || f.endsWith(`${sep}${key}.mdx`)); }

// Translation parity report.
for (const col of collections) {
  for (const [key, langs] of Object.entries(byKey[col])) {
    const missing = LANGS.filter((l) => !langs.has(l));
    if (missing.length) warnings.push(`${col}/${key}: missing in ${missing.join(', ')}`);
  }
}

// Documents: files must exist.
const docsYaml = join(CONTENT, 'documents.yaml');
if (existsSync(docsYaml)) {
  const text = readFileSync(docsYaml, 'utf8');
  const blocks = text.split(/\n- id:/).slice(1);
  for (const b of blocks) {
    const id = b.split('\n')[0].trim();
    const file = (b.match(/\n\s+file:\s*(\S+)/) ?? [])[1];
    const draft = /\n\s+draft:\s*true/.test(b);
    if (!file) { err(docsYaml, `document ${id}: file is required`); continue; }
    const abs = join(PUBLIC, file);
    if (!existsSync(abs)) { (draft ? warn : err)(docsYaml, `document ${id}: ${file} not found under public/`); }
    else if (statSync(abs).size > 25 * 1024 * 1024) err(docsYaml, `document ${id}: ${file} exceeds 25 MB (Cloudflare asset limit)`);
  }
}

for (const w of warnings) console.log(`warning  ${w}`);
for (const e of errors) console.error(`error    ${e}`);
console.log(`\ncheck-content: ${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
