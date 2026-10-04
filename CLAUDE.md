# Dishalu (dishalu.in): govt exams + tech news blog (India)

Static Astro site. Posts are Markdown files; every push to GitHub redeploys the site on Cloudflare Pages.

## Workflow

- `/new-post` → suggests fresh topics, user picks one, Claude researches, writes, checks, previews, and publishes after the user says okay.
- `/new-post <topic>` → same, for a given topic.
- `/update-post <slug or topic>` → refresh an existing post with new information.

Never commit or push a post without the user's explicit okay.

## Key files

- `src/site.config.ts`: site name, URL, author, AdSense id, categories. Single place to edit branding.
- `src/content/posts/*.md`: posts. File name = URL slug.
- `src/content.config.ts`: frontmatter schema.
- `public/images/posts/<slug>-hero.webp`, `-2.webp`, `-3.webp`: real photos saved by `npm run photo`.
- Branding: `public/logo-mark.svg` (logo), `public/favicon.svg` (app icon; run `node scripts/make-icons.mjs` after editing to regenerate PNG icons), `public/images/hero.webp` + `hero-small.webp` (home hero photo; original in `design/hero-original.png`; `hero.svg` is a spare illustration). Home hero text lives in `src/site.config.ts` (HERO).
- `docs/writing-style.md`: voice, structure, banned phrases, accuracy rules. Follow it for all writing.
- `docs/sources.md`: where to find topics and official facts.

## Commands

- `npm run dev`: local preview at http://localhost:4321
- `npm run build`: production build into `dist/`
- `npm run list-posts [-- word]`: existing posts
- `npm run check-post -- <slug>` / `-- --all`: quality gate (word count ≥ 800, banned phrases, SEO fields, image, links)
- `npm run photo -- search "words"` / `npm run photo -- save <id> --slug <slug> --as hero|2|3`: real, openly licensed photos via Openverse (commercial use allowed), with credit lines. Previews: `.photo-previews/sheet.png`

## Rules

- Facts only from official/organiser sources; never copy other blogs' text or images.
- Minimum 800 words, no filler. Earn & Grow posts: realistic, no scams or guaranteed income.
- Focus, in priority order: govt-exams (notifications, admit cards, answer keys, results) > govt-schemes (central/state schemes: eligibility, benefits, installments, status) > tech-news > careers (incl. entrance exams & admissions) > current-affairs (weekly roundup + MCQs).
- Each category has `enabled` in site.config.ts; current-affairs, earn-grow and opportunities (hackathons & internships) are currently disabled (hidden everywhere, their posts too). Don't suggest topics for disabled categories.
