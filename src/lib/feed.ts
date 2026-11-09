import rss from '@astrojs/rss';
import { RUBRICS, firm, LANG_TAG, type Lang, type Rubric } from '@/config/site';
import { t, localePath } from '@/i18n/utils';
import { getPosts, postSlug, type Post } from '@/lib/content';

/** One builder for the per-language and per-rubric feeds. */
export async function buildFeed(site: URL, lang: Lang, rubric?: Rubric) {
  const tr = t(lang);
  const posts = (await getPosts(lang)).filter((p) => !rubric || p.data.rubric === rubric).slice(0, 50);
  const title = rubric ? `${firm.shortName} — ${RUBRICS[rubric][lang]}` : `${firm.shortName} — ${tr('blog.title')}`;
  return rss({
    title,
    description: tr('blog.description'),
    site,
    trailingSlash: true,
    xmlns: { atom: 'http://www.w3.org/2005/Atom', dc: 'http://purl.org/dc/elements/1.1/' },
    customData: [
      `<language>${LANG_TAG[lang]}</language>`,
      `<atom:link href="${new URL(rubric ? `/${lang}/blog/rubric/${rubric}/rss.xml` : `/${lang}/rss.xml`, site).href}" rel="self" type="application/rss+xml"/>`,
      `<copyright>© ${new Date().getFullYear()} ${firm.shortName}</copyright>`,
    ].join(''),
    items: posts.map((p: Post) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: localePath(lang, 'blog', postSlug(p)),
      categories: [RUBRICS[p.data.rubric as Rubric][lang], ...p.data.tags],
      customData: `<dc:creator>${p.data.author}</dc:creator>${p.data.issue ? `<category>issue-${p.data.issue}</category>` : ''}`,
    })),
  });
}
