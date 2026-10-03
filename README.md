# Dishalu: govt exam updates, results and tech news

A fast, SEO-ready static blog (Astro) that you write with Claude Code using `/new-post`, and that deploys for free on Cloudflare Pages.

## How it works

```
You (Claude Code)                       Free cloud
/new-post  → pick topic                 GitHub repo
Claude researches official source        ↓ (auto on every push)
writes post + makes image  ── git push → Cloudflare Pages builds
you check → "okay"                       ↓
                                         yourdomain.in/<post-slug>
```

## Daily use

| Command | What it does |
|---|---|
| `/new-post` | Finds 5–8 fresh topics, you pick one, Claude writes it and shows a preview, then publishes when you say okay |
| `/new-post SSC CGL 2026 admit card` | Same, for a topic you choose |
| `/new-post tech: Android 17 release` | Prefix hints the category (`govt:`, `tech:`, `career:`, `opp:`) |
| `/update-post ssc cgl` | Refreshes an existing post (result out, date changed) |
| `npm run dev` | Preview the site at http://localhost:4321 |

---

## One-time setup

### 1. Put your brand in

Edit **`src/site.config.ts`**: `name`, `url` (your domain), `author`, `email`, socials.
Then regenerate the default social image:

```
npm run new-image -- --default
```

### 2. Push to GitHub

1. Create a new **empty** repo on https://github.com/new (private is fine).
2. In this folder:
   ```
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

### 3. Deploy on Cloudflare Pages

1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Pick your repo.
3. Build settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION` = `22`
4. Deploy. You get a `<project>.pages.dev` URL.

(If Cloudflare only offers a **Worker** with static assets instead of Pages, use the same build command and `dist` as the assets directory.)

### 4. Connect your domain

1. Cloudflare project → **Custom domains** → add `yourdomain.in` (and `www.yourdomain.in`).
2. If the domain is bought at Porkbun/Namecheap, the easiest path is: add the domain to Cloudflare (free plan), then change the nameservers at your registrar to the two Cloudflare gives you.
3. HTTPS turns on automatically.

### 5. Google Search Console

1. https://search.google.com/search-console → add a **Domain** property → verify with the DNS TXT record (add it in Cloudflare DNS).
2. **Sitemaps** → submit `sitemap-index.xml`.
3. After each new post, optionally paste the URL into **URL inspection → Request indexing**.

Also add the site to Bing Webmaster Tools (https://www.bing.com/webmasters). It can import from Search Console.

### 6. AdSense (after 20–30 good posts)

1. Apply at https://adsense.google.com with your domain.
2. Once you have a publisher id, set `adsenseClient: 'ca-pub-XXXXXXXXXXXXXXXX'` in `src/site.config.ts` and push.
   That adds the AdSense script to every page and fills `/ads.txt` automatically.
3. Turn on **Auto ads** in AdSense. (Manual ad slots: `<AdSlot slot="1234567890" />` in `src/pages/[slug].astro`.)

---

## What's included

- Home, category pages, archive, tag pages, post pages
- About, Editorial Policy, Contact, Privacy Policy (AdSense, cookies, DPDP Act), Disclaimer, Terms, 404, search page
- SEO: titles, descriptions, canonical URLs, Open Graph/WhatsApp previews, JSON-LD (BlogPosting, FAQPage, Breadcrumbs), sitemap, robots.txt, RSS
- News-site layout (featured post, list rows, sidebar, share buttons), white theme, mobile-first, no JavaScript framework
- Featured image generator (`scripts/make-image.mjs`)
- Quality checker (`scripts/check-post.mjs`): 800+ words, banned AI phrases, SEO fields, image, broken internal links

## Folder map

```
src/site.config.ts          ← brand, domain, AdSense id, categories
src/content/posts/*.md      ← posts (file name = URL)
public/images/posts/*.png   ← featured images
docs/writing-style.md       ← how posts are written
docs/sources.md             ← where topics and facts come from
.claude/commands/           ← /new-post and /update-post
scripts/                    ← image maker, checker, post list
```

## Before applying to AdSense: checklist

- [ ] Own domain connected, HTTPS working
- [ ] `src/site.config.ts` filled in (name, author, email)
- [ ] 20–30 posts, each 800+ words, across categories
- [ ] About, Contact, Privacy, Disclaimer pages show your real details
- [ ] Search Console verified and sitemap submitted; posts indexed
- [ ] Site has been live and posting for a few weeks

## Credits

- 3D icons in `public/icons/3d/`: [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji), MIT License, © Microsoft Corporation.
