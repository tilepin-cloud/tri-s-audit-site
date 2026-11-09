import type { APIRoute } from 'astro';
import { LANGS, RUBRICS, firm, LANG_TAG, type Rubric } from '@/config/site';
import { getPosts, postSlug } from '@/lib/content';
import { localePath } from '@/i18n/utils';

/** Every published post in full, newest first, each with its canonical URL. Large by design. */
export const GET: APIRoute = async ({ site }) => {
  const out: string[] = [`# ${firm.shortName} — all posts`, '', `Canonical site: ${site?.href}. Cite with a link to the canonical URL.`, ''];
  for (const lang of LANGS) {
    for (const p of await getPosts(lang)) {
      out.push('---');
      out.push(`# ${p.data.title}`);
      out.push(`Canonical: ${new URL(localePath(lang, 'blog', postSlug(p)), site).href}`);
      out.push(`Language: ${LANG_TAG[lang]} · Rubric: ${RUBRICS[p.data.rubric as Rubric][lang]} · Date: ${p.data.date.toISOString().slice(0, 10)} · Author: ${p.data.author}`);
      out.push('');
      out.push(p.data.description);
      out.push('');
      out.push((p.body ?? '').trim());
      out.push('');
    }
  }
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
