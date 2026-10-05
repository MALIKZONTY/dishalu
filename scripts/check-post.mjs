// Quality gate for a post before publishing.
// Usage: npm run check-post -- <slug>        (one post)
//        npm run check-post -- --all         (every post)
//
// Errors (✗) must be fixed. Warnings (!) are worth a look.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import matter from 'gray-matter';

const DIR = 'src/content/posts';
const MIN_WORDS = 800;
const CATEGORIES = ['govt-exams', 'govt-schemes', 'tech-news', 'careers', 'cinema', 'current-affairs', 'opportunities', 'earn-grow'];

// Phrases that make a post read like generic AI output. Keep in sync with docs/writing-style.md
const BANNED = [
  "in today's fast-paced world",
  "in today's digital age",
  "in today's competitive",
  'in this article, we will',
  'in this blog post',
  "let's dive in",
  'dive into',
  'delve',
  'it is important to note',
  "it's important to note",
  'it is worth noting',
  'whether you are a beginner',
  "whether you're a beginner",
  'unlock your potential',
  'unlock the power',
  'embark on',
  'journey of',
  'in conclusion',
  'to sum up',
  'game-changer',
  'game changer',
  'seamless',
  'seamlessly',
  'robust',
  'leverage',
  'landscape',
  'realm',
  'tapestry',
  'navigate the',
  'look no further',
  'buckle up',
  'without further ado',
  'stay tuned',
  'elevate your',
  'supercharge',
  'a testament to',
  'plethora',
  'myriad',
];

const args = process.argv.slice(2);
const files = args.includes('--all')
  ? readdirSync(DIR).filter((f) => f.endsWith('.md'))
  : args.map((a) => (a.endsWith('.md') ? a.split('/').pop() : `${a}.md`));

if (!files.length) {
  console.error('Usage: npm run check-post -- <slug>   or   --all');
  process.exit(1);
}

const allPosts = readdirSync(DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({ slug: f.replace(/\.md$/, ''), ...matter(readFileSync(`${DIR}/${f}`, 'utf8')).data }));

let failed = false;

for (const file of files) {
  const path = `${DIR}/${file}`;
  const slug = file.replace(/\.md$/, '');
  const errors = [];
  const warns = [];

  if (!existsSync(path)) {
    console.log(`\n✗ ${path} not found`);
    failed = true;
    continue;
  }

  const { data: fm, content } = matter(readFileSync(path, 'utf8'));

  // Slug
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errors.push('Slug must be lowercase words joined by hyphens');
  if (slug.split('-').length > 9) warns.push('Slug is long. Aim for 3–8 words.');

  // Frontmatter
  for (const k of ['title', 'description', 'date', 'category', 'image', 'imageAlt']) {
    if (!fm[k]) errors.push(`Missing frontmatter: ${k}`);
  }
  if (fm.title && fm.title.length > 70) warns.push(`Title is ${fm.title.length} chars. Google cuts off around 60–65.`);
  if (fm.description && (fm.description.length < 70 || fm.description.length > 170))
    errors.push(`Description is ${fm.description.length} chars (needs 70–170, ideal 140–160)`);
  if (fm.category && !CATEGORIES.includes(fm.category)) errors.push(`Unknown category "${fm.category}"`);
  const config = readFileSync('src/site.config.ts', 'utf8');
  const catBlock = config.split(`'${fm.category}':`)[1] ?? config.split(`${fm.category}:`)[1] ?? '';
  if (/enabled:\s*false/.test(catBlock.split('},')[0]))
    warns.push(`Category "${fm.category}" is hidden (enabled: false in site.config.ts), so this post will NOT appear on the site.`);
  if (fm.image && !existsSync(`public${fm.image}`)) errors.push(`Image not found: public${fm.image}`);
  if (!fm.sourceUrl) warns.push('No sourceUrl. Link the official source unless this is a pure guide.');
  if (!fm.faqs || fm.faqs.length < 3) warns.push('Fewer than 3 FAQs.');
  if (!fm.tags || fm.tags.length < 2) warns.push('Add 2–6 tags.');
  if (fm.draft) warns.push('draft: true, so this post will NOT appear on the live site.');

  // Length (body + FAQ answers)
  const faqText = (fm.faqs ?? []).map((f) => `${f.q} ${f.a}`).join(' ');
  const plain = (content + ' ' + faqText)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_|`-]/g, ' ');
  const words = plain.split(/\s+/).filter((w) => /[a-z0-9₹]/i.test(w)).length;
  if (words < MIN_WORDS) errors.push(`Only ${words} words (minimum ${MIN_WORDS})`);

  // Structure
  const h2 = (content.match(/^## /gm) ?? []).length;
  if (h2 < 3) warns.push(`Only ${h2} H2 sections. Aim for 4+ so the post is easy to scan.`);
  if (/^# /m.test(content)) errors.push('Do not use a "# " H1 in the body. The title is already the H1.');
  if (!/\|.*\|/.test(content)) warns.push('No table. Key facts (dates, fees, prizes) read better in a table.');
  const inlineImages = (content.match(/!\[[^\]]*\]\([^)]+\)/g) ?? []).length;
  if (inlineImages < 1) warns.push('No images inside the post. Aim for 2–3 real photos per post (header photo + 1–2 inside the post).');
  for (const m of content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) {
    if (!m[1].trim() || m[1].includes('DESCRIBE')) errors.push(`Image needs real alt text: ${m[2]}`);
    if (m[2].startsWith('/') && !existsSync(`public${m[2]}`)) errors.push(`Image not found: public${m[2]}`);
  }
  if (fm.image && /\.webp$/.test(fm.image) && !fm.imageCredit) errors.push('Header photo needs imageCredit (from `npm run photo -- save`).');
  const internal = content.match(/\]\(\/[a-z0-9-]+\)/g) ?? [];
  if (allPosts.length > 1 && internal.length === 0) warns.push('No internal links to your other posts.');
  for (const link of internal) {
    const target = link.slice(3, -1);
    if (!allPosts.some((p) => p.slug === target) && !['about', 'contact', 'archive'].includes(target))
      errors.push(`Broken internal link: /${target}`);
  }

  // Style
  const lower = (content + ' ' + faqText + ' ' + (fm.title ?? '') + ' ' + (fm.description ?? '')).toLowerCase();
  const hits = BANNED.filter((p) => lower.includes(p));
  if (hits.length) errors.push(`AI-sounding phrases: ${hits.map((h) => `"${h}"`).join(', ')}`);
  const emDashes = (content.match(/—/g) ?? []).length;
  if (emDashes > 3) warns.push(`${emDashes} em dashes (—). Use commas, full stops or brackets instead.`);
  const emojis = (content.match(/\p{Extended_Pictographic}/gu) ?? []).length;
  if (emojis > 3) warns.push(`${emojis} emojis. Keep it to 0–3.`);
  const longParas = content.split(/\n\s*\n/).filter((p) => !/^[|#>\-*\d]/.test(p.trim()) && p.split(/\s+/).length > 90);
  if (longParas.length) warns.push(`${longParas.length} paragraph(s) over 90 words. Break them up for mobile readers.`);

  // Duplicates
  const sameTitle = allPosts.find(
    (p) => p.slug !== slug && p.title && fm.title && p.title.toLowerCase().trim() === fm.title.toLowerCase().trim(),
  );
  if (sameTitle) errors.push(`Same title as existing post: ${sameTitle.slug}`);

  // Report
  console.log(`\n${errors.length ? '✗' : '✓'} ${slug}  (${words} words, ${h2} sections, ${fm.faqs?.length ?? 0} FAQs)`);
  errors.forEach((e) => console.log(`   ✗ ${e}`));
  warns.forEach((w) => console.log(`   ! ${w}`));
  if (errors.length) failed = true;
}

process.exit(failed ? 1 : 0);
