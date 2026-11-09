/**
 * Markdown twin of every post: the same text an AI agent or a reader with curl can take without the chrome.
 * Served at /<lang>/blog/<slug>.md and announced by <link rel="alternate" type="text/markdown">.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { RUBRICS, firm, LANG_TAG, type Lang, type Rubric } from '@/config/site';
import { postLang, postSlug } from '@/lib/content';
import { localePath } from '@/i18n/utils';

export const getStaticPaths: GetStaticPaths = async () => {
  const all = (await getCollection('posts')).filter((p) => import.meta.env.DEV || (!p.data.draft && p.data.date.getTime() <= Date.now()));
  return all.map((p) => ({ params: { lang: postLang(p), slug: postSlug(p) }, props: { post: p } }));
};

export const GET: APIRoute = ({ props, site, params }) => {
  const post = props.post;
  const lang = params.lang as Lang;
  const url = new URL(localePath(lang, 'blog', postSlug(post)), site).href;
  const front = [
    '---',
    `title: ${JSON.stringify(post.data.title)}`,
    `description: ${JSON.stringify(post.data.description)}`,
    `date: ${post.data.date.toISOString().slice(0, 10)}`,
    post.data.updated ? `updated: ${post.data.updated.toISOString().slice(0, 10)}` : null,
    `lang: ${LANG_TAG[lang]}`,
    `rubric: ${JSON.stringify(RUBRICS[post.data.rubric as Rubric][lang])}`,
    post.data.tags.length ? `tags: [${post.data.tags.map((t) => JSON.stringify(t)).join(', ')}]` : null,
    post.data.issue ? `issue: ${post.data.issue}` : null,
    `author: ${JSON.stringify(post.data.author)}`,
    `publisher: ${JSON.stringify(firm.shortName)}`,
    `canonical: ${url}`,
    `license: "CC BY-ND 4.0 — cite with a link to the canonical URL"`,
    '---',
  ].filter(Boolean).join('\n');
  const body = `# ${post.data.title}\n\n${post.data.description}\n\n${post.body ?? ''}`.trim();
  const sources = post.data.sources.length ? `\n\n## Sources\n\n${post.data.sources.map((s, i) => `${i + 1}. ${s.title}${s.url ? ` — ${s.url}` : ''}`).join('\n')}` : '';
  return new Response(`${front}\n\n${body}${sources}\n`, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
