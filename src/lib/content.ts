import { getCollection, type CollectionEntry } from 'astro:content';
import { LANGS, type Lang } from '@/config/site';
import { splitId, slugFromBase } from '@/i18n/utils';

export type Post = CollectionEntry<'posts'>;
export type Service = CollectionEntry<'services'>;
export type Member = CollectionEntry<'team'>;
export type Page = CollectionEntry<'pages'>;
export type Doc = CollectionEntry<'documents'>;
export type Issue = CollectionEntry<'issues'>;

const isProd = import.meta.env.PROD;
/** Drafts and future-dated posts are hidden in production builds, visible in dev. */
function visible<T extends { data: { draft?: boolean; date?: Date } }>(e: T): boolean {
  if (!isProd) return true;
  if (e.data.draft) return false;
  if (e.data.date && e.data.date.getTime() > Date.now()) return false;
  return true;
}

export const postLang = (p: Post): Lang => splitId(p.id).lang;
export const postSlug = (p: Post): string => p.data.slug ?? slugFromBase(splitId(p.id).base);
export const entryLang = (e: { id: string }): Lang => splitId(e.id).lang;
export const entryKey = (e: { id: string }): string => splitId(e.id).base;
export const serviceSlug = (s: Service): string => s.data.slug ?? entryKey(s);

export async function getPosts(lang?: Lang): Promise<Post[]> {
  const all = (await getCollection('posts')).filter(visible);
  const mine = lang ? all.filter((p) => postLang(p) === lang) : all;
  return mine.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** The same text in other languages, by translationKey. */
export async function postTranslations(post: Post): Promise<Partial<Record<Lang, Post>>> {
  const all = await getPosts();
  const out: Partial<Record<Lang, Post>> = {};
  for (const p of all) if (p.data.translationKey === post.data.translationKey) out[postLang(p)] = p;
  return out;
}

export async function getServices(lang: Lang): Promise<Service[]> {
  return (await getCollection('services')).filter(visible).filter((s) => entryLang(s) === lang).sort((a, b) => a.data.order - b.data.order);
}
export async function serviceTranslations(key: string): Promise<Partial<Record<Lang, Service>>> {
  const all = (await getCollection('services')).filter(visible);
  const out: Partial<Record<Lang, Service>> = {};
  for (const s of all) if (entryKey(s) === key) out[entryLang(s)] = s;
  return out;
}

export async function getTeam(lang: Lang): Promise<Member[]> {
  return (await getCollection('team')).filter(visible).filter((m) => entryLang(m) === lang).sort((a, b) => a.data.order - b.data.order);
}
export async function getMember(lang: Lang, key: string): Promise<Member | undefined> {
  return (await getTeam(lang)).find((m) => entryKey(m) === key);
}
export async function memberTranslations(key: string): Promise<Partial<Record<Lang, Member>>> {
  const all = (await getCollection('team')).filter(visible);
  const out: Partial<Record<Lang, Member>> = {};
  for (const m of all) if (entryKey(m) === key) out[entryLang(m)] = m;
  return out;
}

export async function getPage(lang: Lang, key: string): Promise<Page | undefined> {
  return (await getCollection('pages')).filter(visible).find((p) => entryLang(p) === lang && entryKey(p) === key);
}
export async function pageLangs(key: string): Promise<Lang[]> {
  const all = (await getCollection('pages')).filter(visible).filter((p) => entryKey(p) === key);
  return LANGS.filter((l) => all.some((p) => entryLang(p) === l));
}

export async function getDocuments(): Promise<Doc[]> {
  return (await getCollection('documents')).filter(visible).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
export async function getIssues(): Promise<Issue[]> {
  return (await getCollection('issues')).sort((a, b) => b.data.number - a.data.number);
}
