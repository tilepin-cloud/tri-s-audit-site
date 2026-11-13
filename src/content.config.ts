import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';
import { RUBRIC_KEYS, DOC_CATEGORIES } from './config/site';

const lang = z.enum(['ru', 'en', 'uz']);
const trilingual = z.object({ ru: z.string(), en: z.string(), uz: z.string() });

/** Editorial posts: src/content/posts/<lang>/YYYY-MM-DD-slug.md. Entry id = "<lang>/YYYY-MM-DD-slug". */
const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(8).max(140),
      /** The answer-first summary: shown in cards, meta description, feeds and llms.txt. */
      description: z.string().min(40).max(320),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      rubric: z.enum(RUBRIC_KEYS as [string, ...string[]]),
      tags: z.array(z.string()).default([]),
      /** Issue number of the periodic release this post belongs to. */
      issue: z.number().int().positive().optional(),
      /** Team entry key, e.g. "tilepin". Every public post has a human author. */
      author: z.string(),
      /** Same value across the RU/EN/UZ versions of one text; drives the language switcher and hreflang. */
      translationKey: z.string(),
      /** URL slug; defaults to the file name without the date prefix. */
      slug: z.string().optional(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      sources: z.array(z.object({ title: z.string(), url: z.string().url().optional() })).default([]),
      draft: z.boolean().default(false),
      /** Human review of the text in this language is done. The check script reports unreviewed texts. */
      reviewed: z.boolean().default(true),
    }),
});

/** Service pages: src/content/services/<lang>/<key>.md. The key is shared by all languages. */
const services = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    /** One or two sentences that answer "what is it and who needs it". */
    summary: z.string().min(40).max(400),
    order: z.number().int(),
    standards: z.array(z.string()).default([]),
    deliverables: z.array(z.string()).default([]),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    slug: z.string().optional(),
    draft: z.boolean().default(false),
    reviewed: z.boolean().default(true),
  }),
});

/** Team: src/content/team/<lang>/<key>.md. */
const team = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/team' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string(),
      credentials: z.array(z.string()).default([]),
      photo: image().optional(),
      linkedin: z.string().url().optional(),
      email: z.string().email().optional(),
      order: z.number().int(),
      partner: z.boolean().default(false),
      /** The head of the firm: shown on the home page with photo and biography. */
      lead: z.boolean().default(false),
      draft: z.boolean().default(false),
      reviewed: z.boolean().default(true),
    }),
});

/** Static pages: src/content/pages/<lang>/<key>.md (about, methodology, legal, for-ai, contacts). */
const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().min(40).max(320),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    reviewed: z.boolean().default(true),
  }),
});

/** Documents (PDF and similar) published under /public/docs/. Metadata in one YAML file. */
const documents = defineCollection({
  loader: file('./src/content/documents.yaml'),
  schema: z.object({
    id: z.string(),
    title: trilingual,
    summary: trilingual,
    category: z.enum(Object.keys(DOC_CATEGORIES) as [string, ...string[]]),
    date: z.coerce.date(),
    /** Languages the document itself is written in. */
    languages: z.array(lang).min(1),
    /** Path under /public, e.g. /docs/quality-system-description-ru.pdf */
    file: z.string().startsWith('/docs/'),
    pages: z.number().int().positive().optional(),
    draft: z.boolean().default(false),
  }),
});

/** Periodic issues (выпуски): a theme and date that posts attach to by number. */
const issues = defineCollection({
  loader: file('./src/content/issues.yaml'),
  schema: z.object({
    id: z.string(),
    number: z.number().int().positive(),
    date: z.coerce.date(),
    title: trilingual,
    summary: trilingual,
  }),
});

export const collections = { posts, services, team, pages, documents, issues };
