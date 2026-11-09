import type { APIRoute } from 'astro';
import { AI_CRAWLERS } from '@/config/site';

/** Everyone is welcome; AI crawlers are named explicitly so the policy is unambiguous to them and to us. */
export const GET: APIRoute = ({ site }) => {
  const lines = [
    '# TRI-S-AUDIT — public site. Content may be indexed and cited with a link to the canonical URL.',
    '# Machine-readable map: /llms.txt · full texts: /llms-full.txt · every post also exists as .md',
    'User-agent: *',
    'Allow: /',
    'Disallow: /*/search/',
    '',
    ...AI_CRAWLERS.flatMap((ua) => [`User-agent: ${ua}`, 'Allow: /', '']),
    `Sitemap: ${new URL('/sitemap-index.xml', site).href}`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
