import { getPosts, thumb } from '../lib/posts';
import { CATEGORIES, type CategoryKey } from '../site.config';

// Small index used by /search (title, description, tags only, to keep it light).
export async function GET() {
  const posts = await getPosts();
  const index = posts.map((p) => ({
    url: `/${p.id}`,
    title: p.data.title,
    description: p.data.description,
    category: CATEGORIES[p.data.category as CategoryKey].name,
    tags: p.data.tags,
    date: p.data.date.toISOString().slice(0, 10),
    image: thumb(p.data.image),
    imageAlt: p.data.imageAlt,
  }));
  return new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json' } });
}
