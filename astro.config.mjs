import { readdirSync, readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { SITE, isActiveCategory } from './src/site.config.ts';

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

// Photos inside posts: load only when scrolled near, and reserve their space so the page
// doesn't jump. Width and height are read from the WebP file in public/.
const webpSize = (buf) => {
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8X') return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
  if (chunk === 'VP8L') {
    const bits = buf.readUInt32LE(21);
    return [1 + (bits & 0x3fff), 1 + ((bits >> 14) & 0x3fff)];
  }
  if (chunk === 'VP8 ') return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
  return null;
};
const lazyPostImages = {
  name: 'lazy-post-images',
  element: {
    filter: ['img'],
    visit(node, ctx) {
      ctx.setProperty(node, 'loading', 'lazy');
      ctx.setProperty(node, 'decoding', 'async');
      const src = String(node.properties?.src ?? '');
      if (!src.startsWith('/') || !src.endsWith('.webp')) return;
      try {
        const size = webpSize(readFileSync(new URL(`./public${src}`, import.meta.url)));
        if (!size) return;
        ctx.setProperty(node, 'width', String(size[0]));
        ctx.setProperty(node, 'height', String(size[1]));
      } catch {}
    },
  },
};

// Sitemap lastmod dates, read from post frontmatter (updated, else date). Home, archive
// and category pages take the date of their newest post.
const postsDir = new URL('./src/content/posts/', import.meta.url);
const field = (text, key) => text.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)`, 'm'))?.[1].trim();
const lastmod = {};
const bump = (path, date) => {
  if (!lastmod[path] || date > lastmod[path]) lastmod[path] = date;
};
for (const file of readdirSync(postsDir)) {
  if (!file.endsWith('.md')) continue;
  const frontmatter = readFileSync(new URL(file, postsDir), 'utf8').split(/^---$/m)[1] ?? '';
  const category = field(frontmatter, 'category');
  if (field(frontmatter, 'draft') === 'true' || !isActiveCategory(category)) continue;
  const date = new Date(field(frontmatter, 'updated') ?? field(frontmatter, 'date'));
  if (Number.isNaN(date.valueOf())) continue;
  for (const path of [`/${file.replace(/\.md$/, '')}`, '/', '/archive', `/category/${category}`]) bump(path, date);
}

// About, contact and the policy pages have no post date. Change this when you edit one of them.
const STATIC_PAGES_UPDATED = new Date('2026-10-10T09:00:00+05:30');

export default defineConfig({
  site: SITE.url,
  trailingSlash: 'never',
  build: { format: 'file' },
  markdown: {
    processor: satteri({ hastPlugins: [externalLinksNewTab, lazyPostImages] }),
  },
  integrations: [
    sitemap({
      // Tag pages are noindex, so leave them out of the sitemap.
      filter: (page) => !page.includes('/tag/') && !page.includes('/search'),
      // Date for the sitemap index entry; serialize() below sets each page's own date.
      lastmod: lastmod['/'],
      serialize(item) {
        const date = lastmod[new URL(item.url).pathname.replace(/\/$/, '') || '/'] ?? STATIC_PAGES_UPDATED;
        item.lastmod = date.toISOString();
        return item;
      },
    }),
  ],
});
