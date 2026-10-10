# Writing style

Every post should read like a helpful senior explaining something to a junior, not like a press release or a generic AI answer.

## Audience

Students and job seekers in India: govt exam aspirants (SSC, UPSC, railways, banking, state PSC, GATE) and people who want to keep up with tech and cinema. Mostly reading on a phone, often on mobile data. Busy and a bit sceptical. They want the key facts and the official link fast, then a clear explanation.

## Voice

- Talk to the reader as "you". Use "I" or "we" for the site.
- Simple English. If a reader from a small town, for whom English is a second language, would need to re-read a sentence, rewrite it.
- Contractions are fine: you'll, don't, it's, here's.
- Have an opinion. "Honestly, apply only if you can give it 2 weekends." "Skip this one if you're not from CSE or IT."
- Be honest about downsides: small prize, tough competition, unpaid, short deadline, unclear selection.

## Shape of a post

1. **Answer first.** The first 2–3 lines give the most important facts (what it is, deadline, who can apply). No warm-up intro.
2. **Quick facts table** right after the opening.
3. **Sections with clear H2 headings** that match what people search: "Eligibility", "How to apply", "Selection process", "Syllabus", "How to prepare".
4. **Something the official page doesn't give:** who should apply (and who shouldn't), prep tips, common mistakes, what happened last year, what to do next.
5. **A short "My take" or "Should you apply?" section** with a real opinion.
6. **FAQs** go in frontmatter (they are rendered at the end and marked up for Google). 4–6 real questions people type into Google.

## Sentences

- Mix short and long sentences. Some very short. Like this.
- Paragraphs of 1–3 lines. Never a wall of text.
- Use tables for dates, fees, prizes, vacancies, comparisons.
- Use bullets for steps and lists, but don't turn the whole post into bullets.
- Bold sparingly, for things people must not miss (deadlines, eligibility cut-offs).
- Numbers as numbers: "15 October 2026", "₹500", "3 rounds".

## Never use

Generic AI filler. `npm run check-post` blocks these:

> in today's fast-paced world, in today's digital age, in this article we will, in this blog post, let's dive in, dive into, delve, it's important to note, it is worth noting, whether you're a beginner, unlock your potential, unlock the power, embark on, journey of, in conclusion, to sum up, game-changer, seamless, robust, leverage, landscape, realm, tapestry, navigate the, look no further, buckle up, without further ado, stay tuned, elevate your, supercharge, a testament to, plethora, myriad

Also avoid:

- More than 3 em dashes (—) in a post. Use commas, full stops or brackets.
- More than 3 emojis.
- Ending with a summary that repeats the post. End with a useful next step instead.
- Vague lines like "This is a great opportunity for students to showcase their skills." Say *why*, specifically.
- Hype: "life-changing", "once in a lifetime", "don't miss out!!!"

## Before / after

**AI-sounding:**
> In today's competitive landscape, hackathons have become a crucial avenue for students to showcase their skills. In this article, we will delve into Flipkart GRiD 2026 and explore everything you need to know.

**Human:**
> Flipkart GRiD 2026 registrations are open and close on 15 October. If you're in 2nd year or above, this one is worth your time, because top teams get PPIs, not just certificates. Here's what you need before you register.

## Accuracy rules

- Every date, fee, age limit, vacancy count, prize amount and eligibility rule must come from the official source (or the organiser's own page on Unstop/Devfolio). Never guess, never "approx" a deadline.
- If something isn't announced yet, say so: "The exam date hasn't been announced yet. Last year it was in February."
- Mark last year's data clearly as last year's.
- Link the official page in `sourceUrl`, and in the "How to apply" section.

## Earn & Grow rules (stricter)

- Realistic ranges only, with what effort they need. "Beginners usually get ₹2,000–5,000 per small website project after 2–3 months of building a portfolio."
- No "earning apps", task/survey apps, referral chains, crypto trading, betting, fantasy apps, forex or "guaranteed income".
- No fake screenshots or income claims.
- Say who an option is NOT for.

## SEO checklist (from the 10 Oct 2026 site audit)

`npm run check-post` fails a post that breaks the title, description or alt rules below.

- **Title: 50–60 characters as Google shows it.** The site adds " | Dishalu" only when the result still fits in 60, so write the title itself at 40–60 characters. Over 60 gets cut off in search results, usually losing the date at the end.
  - Put the keyword first, then the number, then the date: "CDAC Recruitment 2026: 858 Posts, No Fee, Apply by 26 Oct".
  - Save characters with short months (Oct, Nov), "Ends 6 Nov" instead of "Apply by 6 Nov", and by leaving out filler words (and, how to, list).
  - Never write "Today" or "Tomorrow" in a title. It is wrong the next day. Write the date.
- **Description: 120–160 characters.** Shorter wastes the space in search results, longer gets cut off. Start with the keyword and end with what the reader gets (eligibility, fee, how to apply).
- **Alt text on every image.** `imageAlt` and every photo inside the post need a full sentence describing what is in the photo (25+ characters), not the post topic and not one word.
- **Header photo thumbnails.** Cards and lists load small copies from `public/images/thumbs/`, not the full 1200×630 photo. `npm run photo -- save … --as hero` makes them; if a header photo was added another way, run `node scripts/make-thumbs.mjs`. Commit the thumbnails with the post.
- **Email addresses are fine as plain text.** Helpline emails can be written normally. (Cloudflare's Email Address Obfuscation is switched off; it used to turn every email into a broken link for crawlers. Leave it off.)
- **When a date or fact changes, set `updated:` in the frontmatter** (use `/update-post`). The sitemap takes its last-modified date from `updated`, else `date`, and that is how Google learns the post changed.
- **The file name is the URL. Never rename a published post.** Changing the title or description is safe; renaming the file breaks every shared link and pin.

Site pages (not posts) follow the same limits: category titles are the `title` field in `src/site.config.ts`, basic pages use `seoTitle`, and the home page uses `homeTitle`. About, contact and the policy pages take their sitemap date from `STATIC_PAGES_UPDATED` in `astro.config.mjs`, so bump it when editing one of them. Decorative images (logo, icons) also carry alt text.

## Word count

| Post type | Words |
|---|---|
| Admit card / answer key / result | 800–1,200 |
| Tech news explainer | 800–1,200 |
| Cinema (release, OTT, box office, trailer) | 800–1,200 |
| Hackathon / internship | 800–1,200 |
| Govt job notification | 1,200–1,800 |
| Prep guide / career guide | 1,500–2,500+ |

Minimum 800 for every post. Reach it with useful sections, never with padding.

## Post shapes

**Govt job notification:** key details table (organisation, post names, vacancies, apply dates, fee, exam date, official site) → vacancy breakdown (category-wise if given) → eligibility (age with relaxations, qualification) → selection process and exam pattern → salary/pay level → how to apply step by step → important links → "Should you apply?" → FAQs.

**Admit card / exam city slip:** release date and exam dates up front → step-by-step download → details to check on the admit card → documents to carry and exam-day rules → what if there's a mistake (official helpline) → what comes next (answer key, result) → FAQs.

**Answer key:** release date, objection window and fee → how to download and calculate your score (marking scheme) → how to raise an objection → expected next step → last year's cut-off if available (clearly labelled) → FAQs.

**Result:** declared date and official link up front → how to check step by step → cut-off marks (official, by category) → what's next (document verification, next stage, final list) → FAQs.

**Tech news:** what happened in 2–3 lines → key facts table (what, who, when, price/availability in India) → why it matters → what it means for you (students, job seekers, regular users) → what's still unknown → FAQs. Explain, don't hype. No rumours as facts.

**Govt scheme:** what it gives and who can apply in 2–3 lines → key details table (benefit amount, who runs it, eligibility summary, last date or installment date, official portal) → eligibility (and who is NOT eligible) → benefits → how to apply step by step → how to check status → common problems and fixes → "never pay an agent / beware of fake sites" note → FAQs. Only official facts; say clearly when a date isn't announced.

**Cinema:** what happened in 2–3 lines (film, release date, where to watch) → key facts table (film, language(s), cast and director, release date, theatre or OTT platform, CBFC certificate and runtime if out, official trailer link) → what the film is about (from the official synopsis/trailer, no spoilers) → where and how to watch (theatre / OTT, which plan) → box office or reviews only with clear attribution ("the makers claim ₹X crore") → what's still unknown → FAQs. For "releases this week/month" posts: a table of films with date, language and theatre/OTT, then 2–3 lines on each. No piracy links, no leaks, spoilers only with a clear warning, no posters or stills (use openly licensed photos of theatres, film sets or events).

**Current affairs (weekly):** date range up front → 20–30 items grouped by topic (National, States, Economy, International, Appointments, Awards, Sports, Science, Important Days), each 2–3 lines with the one fact to remember and its official source → 10–15 practice MCQs with answers → FAQs. No rumours, no opinion in the items.

**Hackathon / internship:** what it is, deadline and who can apply up front → key details table → eligibility → rounds → prizes/stipend → how to apply → prep tips → "Should you apply?" → FAQs.
