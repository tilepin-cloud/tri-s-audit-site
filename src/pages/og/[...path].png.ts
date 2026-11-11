/**
 * Open Graph images in the site's design v2: the sky panel with a translucent ring, the rail on top, a white title
 * in the heading face, footer with rubric and date. No orange outside the rail. Rendered from an SVG template with resvg at build time. Fonts: drop TTF/OTF files into
 * src/og/fonts/ (for example FiraSansCondensed-SemiBold.ttf) to make the output identical on every build machine;
 * without them resvg falls back to system fonts (Bahnschrift on Windows, DejaVu/Noto on Linux).
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { readdirSync, existsSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { RUBRICS, firm, LANGS, type Lang, type Rubric } from '@/config/site';
import { postLang, postSlug } from '@/lib/content';
import { t } from '@/i18n/utils';

const W = 1200, H = 630;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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
  const size = title.length > 90 ? 52 : title.length > 60 ? 62 : 76;
  const lines = wrap(title, Math.floor(1000 / (size * 0.52)), 4);
  const lineH = size * 1.1;
  const startY = 335 - ((lines.length - 1) * lineH) / 2;
  const head = 'Bahnschrift SemiBold, Bahnschrift, Fira Sans Condensed, DejaVu Sans, sans-serif';
  const mono = 'Consolas, JetBrains Mono, DejaVu Sans Mono, monospace';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#123a5a"/><stop offset=".42" stop-color="#1f5c8c"/><stop offset="1" stop-color="#3080c0"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <circle cx="1090" cy="40" r="300" fill="none" stroke="#ffffff" stroke-opacity=".07" stroke-width="110"/>
  <rect x="0" y="0" width="${W * 0.3}" height="14" fill="#3080c0"/><rect x="${W * 0.3}" y="0" width="${W * 0.6}" height="14" fill="#000000"/><rect x="${W * 0.9}" y="0" width="${W * 0.1}" height="14" fill="#f87831"/>
  <circle cx="88" cy="112" r="8" fill="#ffffff"/>
  <text x="112" y="121" font-family="${head}" font-weight="600" font-size="24" letter-spacing="2.4" fill="#ffffff">${esc(kicker.toUpperCase())}</text>
  ${lines.map((l, i) => `<text x="80" y="${(startY + i * lineH).toFixed(1)}" font-family="${head}" font-weight="600" font-size="${size}" fill="#ffffff">${esc(l)}</text>`).join('\n  ')}
  <line x1="80" y1="540" x2="${W - 80}" y2="540" stroke="#ffffff" stroke-opacity=".3" stroke-width="2"/>
  <text x="80" y="585" font-family="${mono}" font-size="22" fill="#ffffff">${esc(footerLeft)}</text>
  <text x="${W - 80}" y="585" text-anchor="end" font-family="${mono}" font-size="22" fill="#ffffff" fill-opacity=".85">${esc(footerRight)}</text>
</svg>`;
}

function render(markup: string): Uint8Array {
  const fontsDir = new URL('../../og/fonts/', import.meta.url);
  const fontFiles = existsSync(fontsDir) ? readdirSync(fontsDir).filter((f) => /\.(ttf|otf)$/i.test(f)).map((f) => new URL(f, fontsDir).pathname.replace(/^\/([A-Za-z]:)/, '$1')) : [];
  const r = new Resvg(markup, { fitTo: { mode: 'width', value: W }, font: { loadSystemFonts: true, fontFiles, defaultFontFamily: 'Fira Sans Condensed' } });
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
    markup = svg(tagline, lang === 'ru' ? 'Аудиторская организация · Ташкент' : lang === 'en' ? 'Audit organisation · Tashkent' : 'Auditorlik tashkiloti · Toshkent', `${firm.shortName} · tri-s-audit.uz`, `${firm.email}`);
  }
  return new Response(render(markup), { headers: { 'Content-Type': 'image/png' } });
};
