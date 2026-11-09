#!/usr/bin/env node
/**
 * IndexNow submission of the URLs whose content changed in the last commit.
 * Setup: generate a key (32 hex chars), save it as public/<key>.txt containing the key itself, and as the
 * secret INDEXNOW_KEY. Yandex and Bing share one endpoint: api.indexnow.org.
 */
import { execSync } from 'node:child_process';

const key = process.env.INDEXNOW_KEY; const site = (process.env.SITE_URL ?? 'https://tri-s-audit.uz').replace(/\/$/, '');
if (!key) { console.log('INDEXNOW_KEY not set, skipping'); process.exit(0); }
const changed = execSync('git diff --name-only HEAD~1 HEAD -- src/content', { encoding: 'utf8' }).split('\n').filter(Boolean);
const urls = new Set();
for (const f of changed) {
  const m = f.match(/^src\/content\/(posts|services|team|pages)\/(ru|en|uz)\/(.+)\.mdx?$/);
  if (!m) continue;
  const [, col, lang, name] = m;
  if (col === 'posts') urls.add(`${site}/${lang}/blog/${name.replace(/^\d{4}-\d{2}-\d{2}-/, '')}/`);
  else if (col === 'services') urls.add(`${site}/${lang}/services/${name}/`);
  else if (col === 'team') urls.add(`${site}/${lang}/team/${name}/`);
  else urls.add(name === 'home' ? `${site}/${lang}/` : `${site}/${lang}/${name}/`);
  urls.add(`${site}/${lang}/`);
}
if (!urls.size) { console.log('no public URLs changed'); process.exit(0); }
const body = { host: new URL(site).host, key, keyLocation: `${site}/${key}.txt`, urlList: [...urls] };
const res = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
console.log(`IndexNow: ${res.status} for ${urls.size} URL(s)`); [...urls].forEach((u) => console.log('  ' + u));
if (!res.ok && res.status !== 202) process.exit(1);
