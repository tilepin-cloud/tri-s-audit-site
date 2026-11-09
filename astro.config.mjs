// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// One place decides the public origin: canonical, hreflang, sitemap, RSS, OG, JSON-LD all read it.
// Local build and the preview host use the default; the production build sets SITE_URL=https://tri-s-audit.uz.
const SITE_URL = process.env.SITE_URL ?? 'https://tri-s-audit.uz';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  i18n: {
    defaultLocale: 'ru',
    locales: ['ru', 'en', 'uz'],
    // The root page src/pages/index.astro does the redirect itself (meta refresh + navigator.language).
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  integrations: [
    mdx(),
    sitemap({
      // hreflang lives in every page's <head> (reciprocal, only for existing translations); the sitemap stays plain.
      // The root redirect page, the .md twins, the search page and the OG images are not landing pages.
      filter: (page) => new URL(page).pathname !== '/' && !/\/(search|og)\//.test(page) && !page.endsWith('.md'),
    }),
  ],
  markdown: { shikiConfig: { theme: 'github-light' } },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  devToolbar: { enabled: false },
});
