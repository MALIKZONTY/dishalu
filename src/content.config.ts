import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES } from './site.config';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string().max(80),
    description: z.string().min(70).max(170),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    category: z.enum(Object.keys(CATEGORIES) as [string, ...string[]]),
    tags: z.array(z.string()).default([]),
    image: z.string(),
    imageAlt: z.string(),
    imageCredit: z.string().optional(), // e.g. "Photo: Name / Wikimedia, CC BY 4.0"
    imageCreditUrl: z.string().url().optional(),
    sourceUrl: z.string().url().optional(),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
