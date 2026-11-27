#!/usr/bin/env node
/**
 * The site's control panel: one summary of what the site holds and where each material stands.
 *
 *   node scripts/panel.mjs            text summary in the terminal (Russian, the owner's working language)
 *   node scripts/panel.mjs --json     the same data as JSON
 *   node scripts/panel.mjs --html     writes .panel/index.html, a local page that is never published
 *   add --live                        also asks the network: the production host and the domain's name servers
 *
 * A material is one text in up to three languages: a post (joined by translationKey), a service, a page or a
 * team card (joined by file name). Its state per language follows src/lib/content.ts: a draft is hidden in
 * production, a post dated in the future is scheduled and appears on its day, everything else is published.
 * The production host for --live comes from PANEL_LIVE_URL or .panel/config.json {"liveUrl": "https://…"};
 * it is not kept in the repository. Pure Node, no dependencies.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { resolveNs } from 'node:dns/promises';
import { ROOT, CONTENT, PUBLIC, LANGS, rel, walk, frontMatter } from './lib/content-files.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const NOW = Date.now();
const PANEL_DIR = join(ROOT, '.panel');

const COLLECTIONS = [
  { name: 'posts', label: 'Статьи' },
  { name: 'services', label: 'Услуги' },
  { name: 'pages', label: 'Страницы' },
  { name: 'team', label: 'Команда' },
];
const STATE_LABEL = { published: 'на сайте', draft: 'черновик', scheduled: 'запланировано', missing: 'нет' };

const countWords = (s) => (s.replace(/<[^>]+>/g, ' ').match(/[\p{L}\p{N}]+/gu) ?? []).length;
const ruDate = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('.') : '');
const plural = (n, one, few, many) => {
  const a = Math.abs(n) % 100, b = a % 10;
  return `${n} ${a > 10 && a < 20 ? many : b === 1 ? one : b >= 2 && b <= 4 ? few : many}`;
};

function urlOf(col, lang, name, data) {
  if (col === 'posts') return `/${lang}/blog/${data.slug ?? name.replace(/^\d{4}-\d{2}-\d{2}-/, '')}/`;
  if (col === 'services') return `/${lang}/services/${data.slug ?? name}/`;
  if (col === 'team') return `/${lang}/team/${name}/`;
  return name === 'home' ? `/${lang}/` : `/${lang}/${name}/`;
}

/** Every material of the four Markdown collections, with its state in each language. */
function scanMaterials() {
  const out = [];
  for (const { name: col } of COLLECTIONS) {
    const byKey = new Map();
    for (const file of walk(join(CONTENT, col))) {
      const parts = rel(file).split('/'); // src/content/<col>/<lang>/<name>
      const lang = parts[3];
      if (!LANGS.includes(lang)) continue;
      const name = parts.slice(4).join('/').replace(/\.(md|mdx)$/, '');
      const { data, body } = frontMatter(readFileSync(file, 'utf8'));
      const key = col === 'posts' ? (data.translationKey ?? name) : name;
      const date = col === 'posts' && /^\d{4}-\d{2}-\d{2}/.test(String(data.date ?? '')) ? String(data.date).slice(0, 10) : null;
      const state = data.draft === true ? 'draft' : date && Date.parse(date) > NOW ? 'scheduled' : 'published';
      const m = byKey.get(key) ?? { collection: col, key, langs: {} };
      m.langs[lang] = {
        state, reviewed: data.reviewed !== false, title: String(data.title ?? data.name ?? key), date,
        url: urlOf(col, lang, name, data), file: rel(file), words: countWords(body),
      };
      if (typeof data.order === 'number' && (lang === 'ru' || m.order === undefined)) m.order = data.order;
      if (typeof data.issue === 'number') m.issue = data.issue;
      if (data.author && !m.author) m.author = data.author;
      byKey.set(key, m);
    }
    const list = [...byKey.values()].map((m) => {
      const first = LANGS.map((l) => m.langs[l]).find(Boolean);
      return { ...m, title: first.title, date: first.date, missing: LANGS.filter((l) => !m.langs[l]) };
    });
    list.sort((a, b) => col === 'posts' ? String(b.date).localeCompare(String(a.date))
      : a.order !== undefined && b.order !== undefined ? a.order - b.order : a.key.localeCompare(b.key));
    out.push(...list);
  }
  return out;
}

/** Blocks of a YAML list file ("- id: …"), read with the same light touch as the content gate. */
function yamlBlocks(file) {
  if (!existsSync(file)) return [];
  return `\n${readFileSync(file, 'utf8')}`.split(/\n- id:/).slice(1).map((b) => ({
    id: b.split('\n')[0].trim().replace(/^["']|["']$/g, ''),
    field: (name) => (b.match(new RegExp(`\\n\\s+${name}:\\s*(.+)`)) ?? [])[1]?.trim().replace(/^["']|["']$/g, ''),
    titleRu: (b.match(/\n\s+title:\s*\n\s+ru:\s*"([^"]*)"/) ?? [])[1] ?? '',
  }));
}

function scanDocuments() {
  return yamlBlocks(join(CONTENT, 'documents.yaml')).map((b) => {
    const file = b.field('file') ?? '';
    return {
      id: b.id, title: b.titleRu, category: b.field('category') ?? '', date: b.field('date') ?? '', file,
      draft: b.field('draft') === 'true', fileExists: Boolean(file) && existsSync(join(PUBLIC, file)),
    };
  });
}

function scanIssues(materials) {
  return yamlBlocks(join(CONTENT, 'issues.yaml')).map((b) => {
    const number = Number(b.field('number'));
    return { number, date: b.field('date') ?? '', title: b.titleRu, posts: materials.filter((m) => m.collection === 'posts' && m.issue === number).length };
  }).sort((a, b) => b.number - a.number);
}

/** The content gate's verdict, by running the gate itself so the panel never disagrees with CI. */
function runGate() {
  const r = spawnSync(process.execPath, [join(ROOT, 'scripts', 'check-content.mjs')], { cwd: ROOT, encoding: 'utf8' });
  const lines = `${r.stdout ?? ''}\n${r.stderr ?? ''}`.split(/\r?\n/);
  const pick = (word) => lines.filter((l) => l.startsWith(word)).map((l) => l.replace(new RegExp(`^${word}\\s+`), ''));
  return { passed: r.status === 0, errors: pick('error'), warnings: pick('warning') };
}

/** Firm facts in site.ts that still wait for the owner's confirmation. */
function ownerTodo() {
  const file = join(ROOT, 'src', 'config', 'site.ts');
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8').split(/\r?\n/).flatMap((line, i) => {
    const m = line.match(/^\s*(\w+):\s*(.*?),?\s*\/\/\s*\[TB[CD]\]\s*(.*)$/);
    return m ? [{ field: m[1], value: m[2].replace(/^['"]|['"]$/g, ''), note: m[3].replace(/\s*—\s*owner$/, ''), line: i + 1 }] : [];
  });
}

function gitState() {
  const git = (...a) => { const r = spawnSync('git', a, { cwd: ROOT, encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : null; };
  const [commit, date, subject] = (git('log', '-1', '--format=%h%x09%cs%x09%s') ?? '').split('\t');
  const [behind, ahead] = (git('rev-list', '--left-right', '--count', 'origin/main...HEAD') ?? '').split(/\s+/).map(Number);
  return {
    branch: git('rev-parse', '--abbrev-ref', 'HEAD'), commit, date, subject,
    uncommitted: (git('status', '--porcelain') ?? '').split('\n').filter(Boolean).length,
    aheadOfMain: Number.isFinite(ahead) ? ahead : null, behindMain: Number.isFinite(behind) ? behind : null,
  };
}

function panelConfig() {
  const file = join(PANEL_DIR, 'config.json');
  try { return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {}; } catch { return {}; }
}

async function fetchText(url) {
  try {
    const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
    return { status: r.status, headers: r.headers, body: await r.text() };
  } catch (e) {
    return { error: e.cause?.code ?? e.name ?? 'error' };
  }
}

async function nsOverHttps(domain) {
  const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=NS`, { headers: { accept: 'application/dns-json' }, signal: AbortSignal.timeout(15000) });
  const answers = (await r.json()).Answer ?? [];
  if (!answers.length) throw Object.assign(new Error('no NS records'), { code: 'ENODATA' });
  return answers.filter((a) => a.type === 2).map((a) => String(a.data).replace(/\.$/, ''));
}

/** What the network says: who serves the domain, and what the production host shows. */
async function liveState(materials, liveUrl) {
  const siteTs = readFileSync(join(ROOT, 'src', 'config', 'site.ts'), 'utf8');
  const domain = (siteTs.match(/SITE_URL\s*=[^;]*['"]https:\/\/([^'"/]+)['"]/) ?? [])[1] ?? null;
  const out = { domain, host: null, nameServers: [], onCloudflare: false };
  if (domain) {
    try {
      // The system resolver first; some machines refuse it to Node, so DNS over HTTPS is the fallback.
      out.nameServers = (await resolveNs(domain).catch(() => nsOverHttps(domain))).sort();
      out.onCloudflare = out.nameServers.length > 0 && out.nameServers.every((n) => n.endsWith('.cloudflare.com'));
    } catch (e) { out.nameServerError = e.code ?? 'error'; }
    const page = await fetchText(`https://${domain}/ru/`);
    out.domainPage = page.error ? { error: page.error } : { status: page.status, server: page.headers.get('server') ?? '' };
  }
  if (liveUrl) {
    const base = liveUrl.replace(/\/$/, '');
    const page = await fetchText(`${base}/ru/`);
    if (page.error) out.host = { url: base, error: page.error };
    else {
      const rss = await fetchText(`${base}/ru/rss.xml`);
      const expected = materials.filter((m) => m.collection === 'posts' && m.langs.ru?.state === 'published').length;
      out.host = {
        url: base, status: page.status,
        noindex: /noindex/i.test(page.headers.get('x-robots-tag') ?? '') || /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(page.body),
        postsLive: rss.error ? null : (rss.body.match(/<item>/g) ?? []).length, postsExpected: expected,
      };
    }
  }
  return out;
}

function totals(materials) {
  const t = { materials: materials.length, published: 0, draft: 0, scheduled: 0, unreviewed: 0, missing: 0, byCollection: {} };
  for (const m of materials) {
    const c = (t.byCollection[m.collection] ??= { materials: 0, published: 0, draft: 0, scheduled: 0, unreviewed: 0, missing: 0 });
    c.materials++;
    for (const l of LANGS) {
      const e = m.langs[l];
      if (!e) { t.missing++; c.missing++; continue; }
      t[e.state]++; c[e.state]++;
      if (!e.reviewed) { t.unreviewed++; c.unreviewed++; }
    }
  }
  return t;
}

/** The short list a person should read first. */
function attention(d) {
  const out = [];
  const add = (level, text) => out.push({ level, text });
  for (const e of d.gate.errors) add('error', `Ошибка проверки: ${e}`);
  for (const m of d.materials) {
    const label = COLLECTIONS.find((c) => c.name === m.collection).label.toLowerCase();
    const drafts = LANGS.filter((l) => m.langs[l]?.state === 'draft');
    const sched = LANGS.filter((l) => m.langs[l]?.state === 'scheduled');
    if (sched.length) add('info', `Выйдет ${ruDate(m.date)}: «${m.title}» (${sched.join(', ')})`);
    if (drafts.length) add('warn', `Черновик (${label}): «${m.title}» (${drafts.join(', ')})`);
    if (m.missing.length) add('warn', `Нет перевода (${label}): «${m.title}» — ${m.missing.join(', ')}`);
  }
  for (const { name, label } of COLLECTIONS) {
    for (const l of LANGS) {
      const n = d.materials.filter((m) => m.collection === name && m.langs[l] && !m.langs[l].reviewed).length;
      if (n) add('warn', `Не проверено партнером: ${label.toLowerCase()}, ${l} — ${n}`);
    }
  }
  for (const doc of d.documents) {
    if (!doc.fileExists) add(doc.draft ? 'warn' : 'error', `Документ «${doc.title}»: файл ${doc.file || '—'} не найден${doc.draft ? ' (черновик, на сайте скрыт)' : ''}`);
    else if (doc.draft) add('warn', `Документ «${doc.title}» — черновик, на сайте скрыт`);
  }
  if (d.ownerTodo.length) add('warn', `Данные фирмы ждут подтверждения владельца: ${d.ownerTodo.map((o) => `${o.field}${o.note ? ` (${o.note})` : ''}`).join('; ')}`);
  if (d.git.uncommitted) add('info', `В рабочей папке ${plural(d.git.uncommitted, 'несохраненное изменение', 'несохраненных изменения', 'несохраненных изменений')} (ветка ${d.git.branch})`);
  if (d.live) {
    if (d.live.nameServerError) add('error', `Домен ${d.live.domain} не находится в DNS (${d.live.nameServerError}): сайт и почта по этому адресу недоступны`);
    else if (!d.live.onCloudflare) add('warn', `Домен ${d.live.domain} еще не переведен на Cloudflare (серверы: ${d.live.nameServers.join(', ') || 'нет ответа'})`);
    if (d.live.host?.error) add('error', `Рабочий сайт не отвечает: ${d.live.host.error}`);
    if (d.live.host?.noindex) add('warn', 'Рабочий сайт закрыт от поисковиков (noindex)');
    if (d.live.host && d.live.host.postsLive !== null && d.live.host.postsLive !== d.live.host.postsExpected)
      add('warn', `На рабочем сайте ${plural(d.live.host.postsLive, 'статья', 'статьи', 'статей')}, в репозитории опубликовано ${d.live.host.postsExpected} — нужна пересборка или слияние ветки`);
  }
  const rank = { error: 0, warn: 1, info: 2 };
  return out.sort((a, b) => rank[a.level] - rank[b.level]);
}

// ---------------------------------------------------------------- output: text

function renderText(d) {
  const L = [];
  const t = d.totals;
  L.push(`ПАНЕЛЬ САЙТА TRI-S-AUDIT — ${d.generatedAt}`);
  L.push(`Ветка ${d.git.branch}, последний коммит ${d.git.commit} от ${ruDate(d.git.date)}: ${d.git.subject}`);
  L.push('');
  L.push(`Материалов: ${t.materials}. Версий на сайте: ${t.published}, черновиков: ${t.draft}, запланировано: ${t.scheduled}, не проверено: ${t.unreviewed}, нет перевода: ${t.missing}.`);
  L.push(`Проверка содержимого: ${d.gate.passed ? 'пройдена' : 'НЕ ПРОЙДЕНА'} (ошибок ${d.gate.errors.length}, предупреждений ${d.gate.warnings.length}).`);
  L.push('');
  L.push('ТРЕБУЕТ ВНИМАНИЯ');
  if (!d.attention.length) L.push('  нет замечаний');
  for (const a of d.attention) L.push(`  ${a.level === 'error' ? '!!' : a.level === 'warn' ? ' !' : '  '} ${a.text}`);
  for (const { name, label } of COLLECTIONS) {
    L.push('');
    L.push(label.toUpperCase());
    for (const m of d.materials.filter((x) => x.collection === name)) {
      const cells = LANGS.map((l) => {
        const e = m.langs[l];
        if (!e) return `${l}: нет`;
        return `${l}: ${e.state === 'scheduled' ? `на ${ruDate(e.date)}` : STATE_LABEL[e.state]}${e.reviewed ? '' : '*'}`;
      });
      L.push(`  ${m.date ? `${ruDate(m.date)}  ` : ''}${m.title}  [${cells.join(' | ')}]`);
    }
  }
  L.push('');
  L.push('  * — версия не проверена партнером');
  if (d.live) {
    L.push('');
    L.push('САЙТ В СЕТИ');
    L.push(d.live.nameServerError ? `  Домен ${d.live.domain}: НЕ НАХОДИТСЯ В DNS (${d.live.nameServerError})`
      : `  Домен ${d.live.domain}: ${d.live.onCloudflare ? 'на Cloudflare' : 'не на Cloudflare'} (${d.live.nameServers.join(', ') || 'нет ответа'})`);
    if (d.live.host) L.push(d.live.host.error ? `  Рабочий сайт ${d.live.host.url}: не отвечает (${d.live.host.error})`
      : `  Рабочий сайт ${d.live.host.url}: ответ ${d.live.host.status}, ${d.live.host.noindex ? 'закрыт от поисковиков' : 'открыт для поисковиков'}, статей в ленте: ${d.live.host.postsLive ?? '?'}`);
    else L.push('  Адрес рабочего сайта не задан (PANEL_LIVE_URL или .panel/config.json)');
  }
  return L.join('\n');
}

// ---------------------------------------------------------------- output: html

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function chip(e, base) {
  if (!e) return '<span class="chip miss">нет</span>';
  const text = e.state === 'scheduled' ? `на ${ruDate(e.date)}` : STATE_LABEL[e.state];
  const main = `<span class="chip ${e.state}">${esc(text)}</span>`;
  const linked = base && e.state === 'published' ? `<a href="${esc(base + e.url)}" target="_blank" rel="noopener">${main}</a>` : main;
  return `${linked}${e.reviewed ? '' : '<span class="chip rev">не проверен</span>'}`;
}

function renderHtml(d) {
  const t = d.totals;
  const base = d.liveUrl ? d.liveUrl.replace(/\/$/, '') : '';
  const tile = (n, label, cls = '') => `<div class="tile ${cls}"><b>${n}</b><span>${esc(label)}</span></div>`;
  const tables = COLLECTIONS.map(({ name, label }) => {
    const rows = d.materials.filter((m) => m.collection === name);
    const withDate = name === 'posts';
    return `<section><h2>${esc(label)} <small>${rows.length}</small></h2>
<div class="scroll"><table><thead><tr>${withDate ? '<th>Дата</th>' : ''}<th>Материал</th><th>RU</th><th>EN</th><th>UZ</th></tr></thead><tbody>
${rows.map((m) => `<tr>${withDate ? `<td class="num">${esc(ruDate(m.date))}</td>` : ''}<td><div class="t">${esc(m.title)}</div><div class="k">${esc(m.key)}${m.langs.ru ? ` · ${m.langs.ru.words} слов` : ''}${m.issue ? ` · выпуск ${m.issue}` : ''}</div></td>${LANGS.map((l) => `<td>${chip(m.langs[l], base)}</td>`).join('')}</tr>`).join('\n')}
</tbody></table></div></section>`;
  }).join('\n');
  const docs = d.documents.length ? `<section><h2>Документы <small>${d.documents.length}</small></h2>
<div class="scroll"><table><thead><tr><th>Дата</th><th>Документ</th><th>Состояние</th><th>Файл</th></tr></thead><tbody>
${d.documents.map((x) => `<tr><td class="num">${esc(ruDate(x.date))}</td><td><div class="t">${esc(x.title)}</div><div class="k">${esc(x.id)}</div></td><td><span class="chip ${x.draft ? 'draft' : 'published'}">${x.draft ? 'черновик' : 'на сайте'}</span></td><td>${x.fileExists ? '<span class="chip published">есть</span>' : '<span class="chip miss">не найден</span>'} <span class="k">${esc(x.file)}</span></td></tr>`).join('\n')}
</tbody></table></div></section>` : '';
  const issues = d.issues.length ? `<section><h2>Выпуски <small>${d.issues.length}</small></h2>
<div class="scroll"><table><thead><tr><th>№</th><th>Дата</th><th>Тема</th><th>Статей</th></tr></thead><tbody>
${d.issues.map((x) => `<tr><td class="num">${x.number}</td><td class="num">${esc(ruDate(x.date))}</td><td class="t">${esc(x.title)}</td><td class="num">${x.posts}</td></tr>`).join('\n')}
</tbody></table></div></section>` : '';
  const live = d.live ? `<dl>
<dt>Домен</dt><dd>${esc(d.live.domain)} — ${d.live.nameServerError ? '<span class="chip miss">не находится в DNS</span>' : d.live.onCloudflare ? 'подключен к Cloudflare' : 'еще не переведен на Cloudflare'}<div class="k">${esc(d.live.nameServers.join(', ') || d.live.nameServerError || 'нет ответа')}</div></dd>
<dt>Рабочий сайт</dt><dd>${d.live.host ? (d.live.host.error ? `не отвечает (${esc(d.live.host.error)})` : `<a href="${esc(d.live.host.url)}/ru/" target="_blank" rel="noopener">${esc(d.live.host.url.replace(/^https:\/\//, ''))}</a> — ответ ${d.live.host.status}, ${d.live.host.noindex ? 'закрыт от поисковиков' : 'открыт для поисковиков'}, статей в ленте: ${d.live.host.postsLive ?? '?'} из ${d.live.host.postsExpected}`) : 'адрес не задан'}</dd>
</dl>` : '<p class="k">Состояние в сети не запрашивалось. Попросите «обнови сводку с проверкой сайта».</p>';
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Панель сайта — TRI-S-AUDIT</title>
<style>
:root{--navy:#0F2A44;--sky:#3080C0;--tint:#EEF5FB;--line:#dbe3ec;--grey:#5b6470;--ink:#0B1420;--warn:#8a5300;--warn-bg:#fdf1dc;--bad:#a11a1a;--bad-bg:#fbe6e6;--ok:#1d5f3a;--ok-bg:#e4f3ea}
*{box-sizing:border-box}body{margin:0;background:#fff;color:var(--ink);font:15px/1.5 Inter,"Segoe UI",system-ui,sans-serif}
header{background:var(--navy);color:#fff;padding:28px 0}.wrap{max-width:1120px;margin:0 auto;padding:0 20px}
h1{font:700 26px/1.2 Montserrat,"Segoe UI",sans-serif;margin:0 0 6px;text-wrap:balance}header p{margin:0;color:#c9d6e3;font-size:14px}
h2{font:700 18px/1.3 Montserrat,"Segoe UI",sans-serif;margin:0 0 12px;color:var(--navy)}h2 small{font-weight:500;color:var(--grey);font-size:14px;margin-left:4px}
main{padding:28px 0 56px}section{margin-top:36px}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.tile{border:1px solid var(--line);border-radius:10px;padding:14px 16px;background:var(--tint)}
.tile b{display:block;font:700 28px/1.1 Montserrat,"Segoe UI",sans-serif;color:var(--navy);font-variant-numeric:tabular-nums}
.tile span{color:var(--grey);font-size:13px}.tile.warn{background:var(--warn-bg);border-color:#f1dcae}.tile.bad{background:var(--bad-bg);border-color:#f0c4c4}
ul.att{list-style:none;margin:0;padding:0;border:1px solid var(--line);border-radius:10px;overflow:hidden}
ul.att li{padding:10px 14px 10px 40px;border-top:1px solid var(--line);position:relative}ul.att li:first-child{border-top:0}
ul.att li::before{position:absolute;left:14px;top:10px;font-weight:700}
ul.att li.error{background:var(--bad-bg)}ul.att li.error::before{content:"✕";color:var(--bad)}
ul.att li.warn::before{content:"!";color:var(--warn)}ul.att li.info::before{content:"•";color:var(--sky)}
.scroll{overflow-x:auto;border:1px solid var(--line);border-radius:10px}table{border-collapse:collapse;width:100%;min-width:640px}
th,td{text-align:left;padding:10px 14px;border-top:1px solid var(--line);vertical-align:top}thead th{border-top:0;background:var(--tint);font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:var(--grey)}
td.num{font-variant-numeric:tabular-nums;white-space:nowrap}.t{font-weight:600}.k{color:var(--grey);font-size:12.5px}
.chip{display:inline-block;padding:2px 9px;border-radius:999px;font-size:12.5px;white-space:nowrap;margin:1px 4px 1px 0;border:1px solid transparent}
.chip.published{background:var(--ok-bg);color:var(--ok)}.chip.draft{background:#eef1f5;color:var(--grey);border-color:var(--line)}
.chip.scheduled{background:var(--tint);color:var(--sky);border-color:#c5dcee}.chip.miss{background:var(--bad-bg);color:var(--bad)}.chip.rev{background:var(--warn-bg);color:var(--warn)}
a{color:var(--sky)}td a{text-decoration:none}td a:hover .chip{border-color:var(--ok)}a:focus-visible{outline:2px solid var(--sky);outline-offset:2px}
dl{display:grid;grid-template-columns:160px 1fr;gap:8px 16px;margin:0}dt{color:var(--grey)}dd{margin:0}
footer{color:var(--grey);font-size:13px;margin-top:40px;border-top:1px solid var(--line);padding-top:16px}
@media (max-width:560px){dl{grid-template-columns:1fr}dt{margin-top:8px}}
</style></head><body>
<header><div class="wrap"><h1>Панель сайта TRI-S-AUDIT</h1><p>Сводка на ${esc(d.generatedAt)} · ветка ${esc(d.git.branch)} · коммит ${esc(d.git.commit)} от ${esc(ruDate(d.git.date))}</p></div></header>
<main class="wrap">
<div class="tiles">
${tile(t.materials, 'материалов')}${tile(t.published, 'версий на сайте')}${tile(t.draft, 'черновиков', t.draft ? 'warn' : '')}${tile(t.scheduled, 'запланировано')}${tile(t.unreviewed, 'не проверено партнером', t.unreviewed ? 'warn' : '')}${tile(t.missing, 'нет перевода', t.missing ? 'warn' : '')}${tile(d.gate.errors.length, 'ошибок проверки', d.gate.errors.length ? 'bad' : '')}
</div>
<section><h2>Требует внимания <small>${d.attention.length}</small></h2>
${d.attention.length ? `<ul class="att">${d.attention.map((a) => `<li class="${a.level}">${esc(a.text)}</li>`).join('')}</ul>` : '<p>Замечаний нет.</p>'}</section>
${tables}
${docs}
${issues}
<section><h2>Сайт в сети</h2>${live}</section>
<footer>Страница собрана из репозитория командой <code>npm run panel -- --html</code> и нигде не публикуется. Чтобы обновить, скажите Claude «обнови сводку».</footer>
</main></body></html>
`;
}

// ---------------------------------------------------------------- main

const materials = scanMaterials();
const config = panelConfig();
const liveUrl = process.env.PANEL_LIVE_URL ?? config.liveUrl ?? null;
const data = {
  generatedAt: new Date().toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' }),
  git: gitState(),
  totals: totals(materials),
  materials,
  documents: scanDocuments(),
  issues: scanIssues(materials),
  gate: runGate(),
  ownerTodo: ownerTodo(),
  liveUrl,
  live: flag('--live') ? await liveState(materials, liveUrl) : null,
};
data.attention = attention(data);

if (flag('--json')) {
  console.log(JSON.stringify(data, null, 2));
} else if (flag('--html')) {
  const i = args.indexOf('--html');
  const out = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : join(PANEL_DIR, 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, renderHtml(data), 'utf8');
  console.log(`panel: ${rel(out)} — ${data.totals.materials} materials, ${data.attention.length} attention item(s), gate ${data.gate.passed ? 'passed' : 'FAILED'}`);
} else {
  console.log(renderText(data));
}
