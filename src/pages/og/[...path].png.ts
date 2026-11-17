/**
 * Open Graph images in design v3: the navy card with the white owl mark and the wordmark, an eyebrow in pale sky
 * (rubric or "audit organisation · Tashkent"), the title in Montserrat SemiBold, a hairline and a footer in Inter.
 * No orange. Rendered from an SVG template with resvg at build time. Fonts come from src/og/fonts/ (Montserrat
 * SemiBold and Bold, Inter Regular, merged from the Fontsource subsets — see the README there), so the output is the
 * same on every build machine; system fonts are only a fallback for glyphs those files lack.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { RUBRICS, firm, LANGS, type Lang, type Rubric } from '@/config/site';
import { postLang, postSlug } from '@/lib/content';
import { t } from '@/i18n/utils';

const W = 1200, H = 630;
const NAVY = '#0F2A44', PALE = '#9CC8EE', WHITE = '#ffffff';
const HEAD = 'Montserrat, Inter, DejaVu Sans, sans-serif';
const TEXT = 'Inter, DejaVu Sans, sans-serif';
/**
 * A project file by its path from the repository root. In dev `import.meta.url` is the source file; in the build it is
 * the chunk under dist/, so the working directory (the project root for `astro build`) is tried as well.
 */
function projectPath(rel: string): string | undefined {
  const fromModule = fileURLToPath(new URL(`../../../${rel}`, import.meta.url));
  const fromCwd = join(process.cwd(), rel);
  return [fromModule, fromCwd].find((p) => existsSync(p));
}
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The owl mark as nested SVG: public/img/owls-white.svg without its outer element and title. */
function owl(x: number, y: number, height: number): string {
  const file = projectPath('public/img/owls-white.svg');
  if (!file) return '';
  const inner = readFileSync(file, 'utf8').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<title>[\s\S]*?<\/title>/, '').replace(/<\/svg>\s*$/, '');
  const width = Math.round((height * 2026) / 1016);
  return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="112 112 2026 1016">${inner}</svg>`;
}

function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/); const lines: string[] = []; let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '…');
  return lines;
}

function svg(title: string, kicker: string, footerLeft: string, footerRight: string): string {
  const size = title.length > 90 ? 50 : title.length > 60 ? 58 : 68;
  const lines = wrap(title, Math.floor(1040 / (size * 0.56)), 4);
  const lineH = size * 1.14;
  const block = (lines.length - 1) * lineH;
  const startY = 352 - block / 2; // the title block is centred on the middle band of the card
  const owlH = 52, owlW = Math.round((owlH * 2026) / 1016);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${NAVY}"/>
  ${owl(80, 64, owlH)}
  <text x="${80 + owlW + 20}" y="${64 + owlH / 2 + 9}" font-family="${HEAD}" font-weight="700" font-size="26" letter-spacing="1.6" fill="${WHITE}">${esc(firm.shortName)}</text>
  <text x="80" y="${startY - size * 1.1 - 22}" font-family="${HEAD}" font-weight="600" font-size="20" letter-spacing="2.8" fill="${PALE}">${esc(kicker.toUpperCase())}</text>
  ${lines.map((l, i) => `<text x="80" y="${(startY + i * lineH).toFixed(1)}" font-family="${HEAD}" font-weight="600" font-size="${size}" letter-spacing="-0.5" fill="${WHITE}">${esc(l)}</text>`).join('\n  ')}
  <line x1="80" y1="546" x2="${W - 80}" y2="546" stroke="${WHITE}" stroke-opacity=".22" stroke-width="1.5"/>
  <text x="80" y="588" font-family="${TEXT}" font-size="21" fill="${WHITE}" fill-opacity=".8">${esc(footerLeft)}</text>
  <text x="${W - 80}" y="588" text-anchor="end" font-family="${TEXT}" font-size="21" fill="${WHITE}" fill-opacity=".6">${esc(footerRight)}</text>
</svg>`;
}

function render(markup: string): Uint8Array {
  const fontsDir = projectPath('src/og/fonts');
  const fontFiles = fontsDir ? readdirSync(fontsDir).filter((f) => /\.(ttf|otf)$/i.test(f)).map((f) => join(fontsDir, f)) : [];
  const r = new Resvg(markup, { fitTo: { mode: 'width', value: W }, font: { loadSystemFonts: true, fontFiles, defaultFontFamily: 'Montserrat' } });
  return r.render().asPng();
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = (await getCollection('posts')).filter((p) => import.meta.env.DEV || (!p.data.draft && p.data.date.getTime() <= Date.now()));
  return [
    { params: { path: 'default' }, props: { kind: 'default' } },
    ...LANGS.map((lang) => ({ params: { path: `${lang}/default` }, props: { kind: 'lang', lang } })),
    ...posts.map((p) => ({ params: { path: `${postLang(p)}/${postSlug(p)}` }, props: { kind: 'post', post: p } })),
  ];
};

export const GET: APIRoute = ({ props }) => {
  let markup: string;
  if (props.kind === 'post') {
    const p = props.post; const lang = postLang(p) as Lang;
    const rubric = RUBRICS[p.data.rubric as Rubric][lang];
    const right = `${p.data.issue ? `${t(lang)('blog.issue')} ${p.data.issue} · ` : ''}${p.data.date.toISOString().slice(0, 10)}`;
    markup = svg(p.data.title, rubric, `${firm.shortName} · tri-s-audit.uz`, right);
  } else {
    const lang = (props.lang ?? 'ru') as Lang;
    const tagline = lang === 'ru' ? 'Аудит, которому доверяют цифры' : lang === 'en' ? 'Audit the numbers can trust' : 'Raqamlar ishonadigan audit';
    markup = svg(tagline, t(lang)('hero.eyebrow'), `${firm.shortName} · tri-s-audit.uz`, `${firm.email}`);
  }
  return new Response(render(markup), { headers: { 'Content-Type': 'image/png' } });
};
