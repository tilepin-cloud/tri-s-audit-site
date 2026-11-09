import type { APIRoute } from 'astro';
import { LANGS, RUBRIC_KEYS, type Lang, type Rubric } from '@/config/site';
import { buildFeed } from '@/lib/feed';

export function getStaticPaths() { return LANGS.flatMap((lang) => RUBRIC_KEYS.map((rubric) => ({ params: { lang, rubric } }))); }
export const GET: APIRoute = ({ params, site }) => buildFeed(site!, params.lang as Lang, params.rubric as Rubric);
