/**
 * Shared by the content gate (check-content.mjs) and the panel (panel.mjs): where the content lives and how a
 * Markdown file with front matter is read. Pure Node, no dependencies: front matter is parsed with a small YAML
 * subset (scalars, lists, one-level maps).
 */
import { readdirSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const ROOT = new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
export const CONTENT = join(ROOT, 'src', 'content');
export const PUBLIC = join(ROOT, 'public');
export const LANGS = ['ru', 'en', 'uz'];

/** Path relative to the repository root, with forward slashes. */
export const rel = (f) => relative(ROOT, f).split(sep).join('/');

/** Every .md and .mdx file under a directory, recursively. */
export function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => d.isDirectory() ? walk(join(dir, d.name)) : /\.(md|mdx)$/.test(d.name) ? [join(dir, d.name)] : []);
}

export function frontMatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: text };
  const data = {}; let key = null;
  for (const raw of m[1].split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const list = raw.match(/^\s+-\s+(.*)$/);
    if (list && key) { (data[key] = Array.isArray(data[key]) ? data[key] : []).push(list[1].replace(/^q:\s*/, '')); continue; }
    const kv = raw.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    key = kv[1]; let v = kv[2].trim();
    if (v === '') { data[key] = []; continue; }
    if (/^\[.*\]$/.test(v)) { data[key] = v.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean); continue; }
    if (/^["'].*["']$/.test(v)) v = v.slice(1, -1);
    if (v === 'true') v = true; else if (v === 'false') v = false; else if (/^\d+$/.test(v)) v = Number(v);
    data[key] = v;
  }
  return { data, body: m[2] };
}
