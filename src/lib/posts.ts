import { existsSync } from 'node:fs';
import { getCollection, type CollectionEntry } from 'astro:content';
import { isActiveCategory } from '../site.config';

export type Post = CollectionEntry<'posts'>;

export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => (import.meta.env.DEV || !data.draft) && isActiveCategory(data.category));
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

export function readingTime(body = ''): number {
  return Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 220));
}

export function slugifyTag(tag: string): string {
  return tag.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Small copy of a post's header photo for cards, lists and search results: 480×252, or 320×168.
// Made by scripts/make-thumbs.mjs; falls back to the full photo if the small one is missing.
export function thumb(image: string, width: 480 | 320 = 480): string {
  const small = image.replace('/images/posts/', '/images/thumbs/').replace(/\.webp$/, width === 320 ? '-320.webp' : '.webp');
  return small !== image && existsSync(`public${small}`) ? small : image;
}
