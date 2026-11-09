import { LANGS, DEFAULT_LANG, LANG_LOCALE, type Lang } from '@/config/site';
import { ui, type UiKey } from './ui';

export function isLang(x: string | undefined): x is Lang {
  return !!x && (LANGS as string[]).includes(x);
}

export function langFromUrl(url: URL): Lang {
  const [, first] = url.pathname.split('/');
  return isLang(first) ? first : DEFAULT_LANG;
}

export function t(lang: Lang) {
  return (key: UiKey): string => ui[lang][key] ?? ui[DEFAULT_LANG][key] ?? key;
}

/** /ru/blog/ → path for another language, keeping the rest. */
export function switchLang(pathname: string, to: Lang): string {
  const parts = pathname.split('/');
  if (isLang(parts[1])) parts[1] = to; else parts.splice(1, 0, to);
  return parts.join('/');
}

export function localePath(lang: Lang, ...segments: string[]): string {
  const clean = segments.filter(Boolean).map((s) => s.replace(/^\/+|\/+$/g, ''));
  return `/${[lang, ...clean].join('/')}/`;
}

export function formatDate(date: Date, lang: Lang, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  return new Intl.DateTimeFormat(LANG_LOCALE[lang], opts).format(date);
}

/** Entry id "ru/2026-11-20-isa-240" → { lang, base: "2026-11-20-isa-240" } */
export function splitId(id: string): { lang: Lang; base: string } {
  const [first, ...rest] = id.split('/');
  return { lang: isLang(first) ? first : DEFAULT_LANG, base: rest.join('/') };
}

/** "2026-11-20-isa-240" → "isa-240" */
export function slugFromBase(base: string): string {
  return base.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

export function readingMinutes(text: string): number {
  const words = text.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}
