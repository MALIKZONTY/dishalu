// Prints every post (newest first) so you can spot duplicates before writing.
// Usage: npm run list-posts            (all)
//        npm run list-posts -- gate    (filter by word in slug/title/tags)
import { readdirSync, readFileSync } from 'node:fs';
import matter from 'gray-matter';

const dir = 'src/content/posts';
const filter = process.argv[2]?.toLowerCase();

const posts = readdirSync(dir)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const { data } = matter(readFileSync(`${dir}/${f}`, 'utf8'));
    return { slug: f.replace(/\.md$/, ''), ...data };
  })
  .filter((p) => !filter || [p.slug, p.title, ...(p.tags ?? [])].join(' ').toLowerCase().includes(filter))
  .sort((a, b) => new Date(b.date) - new Date(a.date));

if (!posts.length) console.log(filter ? `No posts matching "${filter}".` : 'No posts yet.');
for (const p of posts) {
  const d = new Date(p.date).toISOString().slice(0, 10);
  console.log(`${d}  [${p.category}]${p.draft ? ' (draft)' : ''}  ${p.slug}\n            ${p.title}`);
}
console.log(`\n${posts.length} post(s)`);
