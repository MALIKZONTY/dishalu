import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { SITE } from './src/site.config.ts';

// Open external links in posts in a new tab; internal links stay in the same tab.
const siteHost = new URL(SITE.url).hostname.replace(/^www\./, '');
const externalLinksNewTab = {
  name: 'external-links-new-tab',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      const href = String(node.properties?.href ?? '');
      if (!/^https?:\/\//i.test(href)) return;
      if (new URL(href).hostname.replace(/^www\./, '') === siteHost) return;
      ctx.setProperty(node, 'target', '_blank');
      ctx.setProperty(node, 'rel', ['noopener', 'noreferrer']);
    },
  },
};

export default defineConfig({
  site: SITE.url,
  trailingSlash: 'never',
  build: { format: 'file' },
  markdown: {
    processor: satteri({ hastPlugins: [externalLinksNewTab] }),
  },
  integrations: [
    sitemap({
      // Tag pages are noindex, so leave them out of the sitemap.
      filter: (page) => !page.includes('/tag/') && !page.includes('/search'),
    }),
  ],
});
