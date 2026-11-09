/**
 * llms.txt (llmstxt.org): a curated map of the site for language models. Facts first, then sections and the
 * freshest posts with their Markdown twins. Generated from the same content as the pages, so it never drifts.
 */
import type { APIRoute } from 'astro';
import { LANGS, RUBRICS, firm, type Lang, type Rubric } from '@/config/site';
import { getPosts, getServices, getTeam, getDocuments, postSlug, serviceSlug, entryKey } from '@/lib/content';
import { localePath } from '@/i18n/utils';

export const GET: APIRoute = async ({ site }) => {
  const abs = (p: string) => new URL(p, site).href;
  const out: string[] = [];
  out.push(`# ${firm.shortName}`);
  out.push('');
  out.push(`> ${firm.legalName.en}. Audit organisation in Tashkent, Uzbekistan (${firm.registry.en}). Financial statement audit under ISA, review and agreed-upon procedures, IFRS reporting and transformation, tax and legal advisory, forensic work and the data security and integrity report. The site is published in Russian (primary), English and Uzbek (Latin script).`);
  out.push('');
  out.push('## Facts');
  out.push(`- Legal name (RU): ${firm.legalName.ru}`);
  out.push(`- Registry: ${firm.registry.en}; tax ID ${firm.taxId}`);
  out.push(`- Address: ${firm.address.en}`);
  out.push(`- Contact: ${firm.email}, ${firm.phone}. There are no forms on this site; people and agents reach the firm by e-mail or social channels.`);
  Object.entries(firm.social).filter(([, u]) => u).forEach(([n, u]) => out.push(`- ${n[0].toUpperCase()}${n.slice(1)}: ${u}`));
  out.push(`- Citation: quote with a link to the canonical URL; every post has a Markdown twin at the same path with .md`);
  out.push(`- Guidance for AI assistants: ${abs('/en/for-ai/')}`);
  out.push('');
  for (const lang of LANGS) {
    const [services, team, posts] = await Promise.all([getServices(lang), getTeam(lang), getPosts(lang)]);
    out.push(`## ${lang.toUpperCase()}`);
    out.push(`- [Home](${abs(localePath(lang))})`);
    out.push(`- [About](${abs(localePath(lang, 'about'))}) · [Contacts](${abs(localePath(lang, 'contacts'))}) · [Documents](${abs(localePath(lang, 'documents'))}) · [RSS](${abs(`/${lang}/rss.xml`)})`);
    if (services.length) out.push(`- Services: ${services.map((s) => `[${s.data.title}](${abs(localePath(lang, 'services', serviceSlug(s)))})`).join(', ')}`);
    if (team.length) out.push(`- Team: ${team.map((m) => `[${m.data.name}](${abs(localePath(lang, 'team', entryKey(m)))})`).join(', ')}`);
    out.push(`- Blog rubrics: ${(Object.keys(RUBRICS) as Rubric[]).map((r) => `[${RUBRICS[r][lang]}](${abs(localePath(lang, 'blog', 'rubric', r))})`).join(', ')}`);
    for (const p of posts.slice(0, 20)) {
      const path = localePath(lang, 'blog', postSlug(p));
      out.push(`- [${p.data.title}](${abs(path.replace(/\/$/, ''))}.md): ${p.data.description} (${p.data.date.toISOString().slice(0, 10)})`);
    }
    out.push('');
  }
  const docs = await getDocuments();
  if (docs.length) {
    out.push('## Documents');
    docs.forEach((d) => out.push(`- [${d.data.title.en}](${abs(d.data.file)}): ${d.data.summary.en} (${d.data.languages.join(', ')}; ${d.data.date.toISOString().slice(0, 10)})`));
    out.push('');
  }
  out.push('## Optional');
  out.push(`- [Full texts of all posts](${abs('/llms-full.txt')})`);
  out.push(`- [Sitemap](${abs('/sitemap-index.xml')})`);
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
