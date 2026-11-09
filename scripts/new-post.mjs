#!/usr/bin/env node
/**
 * Scaffold a post in three languages.
 *   node scripts/new-post.mjs <slug> --rubric audit|ifrs|tax|ai|firm --author tilepin [--issue 2] [--date 2026-12-01] [--langs ru,en,uz]
 * Creates src/content/posts/<lang>/<date>-<slug>.md with the same translationKey, ready to fill in.
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith('--'));
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def; };
if (!slug || !/^[a-z0-9-]+$/.test(slug)) { console.error('usage: node scripts/new-post.mjs <slug> --rubric <key> --author <team-key> [--issue N] [--date YYYY-MM-DD] [--langs ru,en,uz]'); process.exit(1); }
const rubric = opt('rubric', 'audit'); const author = opt('author', 'tilepin'); const issue = opt('issue'); const date = opt('date', new Date().toISOString().slice(0, 10));
const langs = opt('langs', 'ru,en,uz').split(',');
const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const titles = { ru: 'Заголовок: ответ в одной фразе', en: 'Title: the answer in one sentence', uz: 'Sarlavha: javob bir jumlada' };
const descs = { ru: 'Два-три предложения: что произошло, кого касается и что делать. Это первое, что читают люди и модели.', en: 'Two or three sentences: what happened, whom it concerns and what to do. People and models read this first.', uz: 'Ikki-uch jumla: nima boʻldi, kimga tegishli va nima qilish kerak. Buni odamlar ham, modellar ham birinchi oʻqiydi.' };
const h = { ru: ['Главное', 'Что именно меняется', 'Как подготовиться'], en: ['Key points', 'What exactly changes', 'How to prepare'], uz: ['Asosiysi', 'Aynan nima oʻzgaradi', 'Qanday tayyorlanish kerak'] };
for (const lang of langs) {
  const dir = join(ROOT, 'src', 'content', 'posts', lang); mkdirSync(dir, { recursive: true });
  const file = join(dir, `${date}-${slug}.md`);
  if (existsSync(file)) { console.error(`exists: ${file}`); continue; }
  const fm = [
    '---', `title: "${titles[lang]}"`, `description: "${descs[lang]}"`, `date: ${date}`, `rubric: ${rubric}`, `tags: ["${rubric}"]`,
    issue ? `issue: ${issue}` : null, `author: ${author}`, `translationKey: ${slug}`, 'draft: true', lang === 'ru' ? null : 'reviewed: false',
    'sources:', '  - title: ""', '    url: ""', '---', '',
  ].filter((l) => l !== null).join('\n');
  const body = `## ${h[lang][0]}\n\n- \n- \n- \n\n## ${h[lang][1]}\n\n\n\n## ${h[lang][2]}\n\n`;
  writeFileSync(file, fm + body, 'utf8');
  console.log(`created ${file}`);
}
