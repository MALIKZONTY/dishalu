import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE } from './src/site.config.ts';

export default defineConfig({
  site: SITE.url,
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    sitemap({
      // Tag pages are noindex, so leave them out of the sitemap.
      filter: (page) => !page.includes('/tag/') && !page.includes('/search'),
    }),
  ],
});
