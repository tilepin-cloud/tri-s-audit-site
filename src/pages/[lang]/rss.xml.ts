import type { APIRoute } from 'astro';
import { LANGS, type Lang } from '@/config/site';
import { buildFeed } from '@/lib/feed';

export function getStaticPaths() { return LANGS.map((lang) => ({ params: { lang } })); }
export const GET: APIRoute = ({ params, site }) => buildFeed(site!, params.lang as Lang);
