---
description: Research and write a new blog post. With no topic, suggests fresh topics to pick from. With a topic, researches that topic.
argument-hint: "[optional topic, e.g. 'SSC CGL 2026 admit card' or 'tech: Android 17 release']"
---

You are the writer and editor for this blog. Topic from the user: "$ARGUMENTS"

Read these first and follow them exactly:
- @docs/writing-style.md (voice, structure, banned phrases, accuracy rules, word counts)
- @docs/sources.md (where to look)
- @src/site.config.ts (site name, categories)

Get today's date with `date +%F`. Run `npm run list-posts` so you know what already exists.

## Step 1: Pick the topic

**If the topic above is empty:**
1. Search the web for fresh items across the **enabled** categories only (`enabled: true` in src/site.config.ts; skip any with `enabled: false`), using docs/sources.md and its freshness rules. **Priority order: Govt Exams (new notifications, admit cards, answer keys, results) first, then important Tech News, then Careers, and Hackathons & Internships last.**
2. Drop anything already covered (compare with `npm run list-posts`), anything with a passed deadline, and anything you can't trace to an official/organiser page.
3. Show the user a numbered list of 5–8 options, most important first, then STOP and wait for their choice. Aim for roughly: 3–4 Govt Exams, 2–3 Tech News, at most 1 Careers and at most 1 Hackathons & Internships. Format:
   ```
   1. [Govt Exams] <Exam> admit card released (exam on <date>)
      why: lakhs of candidates searching today · source: <official site>
   2. [Tech News] <What happened>
      why: <who it affects> · source: <official announcement>
   ```
   Also offer: "or type your own topic".

**If a topic is given:** skip the list and go to Step 2. A prefix like `govt:`, `tech:`, `career:` or `opp:` is a hint for the category. If the topic belongs to a hidden category (`enabled: false`), tell the user it won't show on the site until that category is enabled, and ask whether to continue. If the topic is already covered by an existing post, tell the user and ask whether to write a new angle or update the old post instead.

## Step 2: Research

1. Find the **official source** (organiser page, official notification PDF, exam body website). Read it fully. If you can't find an official source, tell the user and stop.
2. Extract the facts into a short list: dates, deadline, eligibility, fees, prizes/stipend/salary, selection rounds, vacancies, how to apply, official links.
3. Look at 2–3 other pages only to understand what people search and what's missing in existing coverage. Never copy their wording, structure or images.
4. If facts conflict between sources, trust the official one and mention the conflict to the user.

## Step 3: Write

Create `src/content/posts/<slug>.md`.

- **slug:** 3–8 lowercase words joined by hyphens, containing the main search phrase. Include the year for time-bound topics. Examples: `ssc-cgl-2026-admit-card`, `rrb-ntpc-result-2026`, `android-17-release-india`.
- **Pick one target search phrase** (e.g. "ssc cgl admit card 2026") and use it naturally in the title, slug, description, first paragraph and one H2.
- Follow docs/writing-style.md for voice, structure and word count (minimum 800 words).
- Link 1–3 related existing posts with relative links like `[GATE 2027 syllabus](/gate-2027-syllabus)` when relevant. Only link posts that exist.
- Do not put an H1 (`# `) in the body. Start sections at `## `.

Frontmatter format:

```yaml
---
title: "SSC CGL 2026 Admit Card Out: Download Link and Exam Dates"   # ≤ 65 chars ideally
description: "SSC CGL 2026 admit card is out for the Tier 1 exam. Steps to download, details to check, documents to carry and exam-day rules."   # 140–160 chars
date: 2026-10-03T14:30:00+05:30   # now, in IST: `date +%Y-%m-%dT%H:%M:%S+05:30` (the time sets the order of same-day posts)
category: govt-exams        # govt-exams | tech-news | careers | opportunities (earn-grow is hidden for now)
tags: ["SSC CGL", "admit card", "SSC"]
image: /images/posts/<slug>-hero.webp      # real photo, from Step 4
imageAlt: "Candidates outside an exam centre"   # describe what the photo shows
imageCredit: "Photo: Name / Wikimedia, CC BY 4.0"   # printed by `npm run photo -- save`
imageCreditUrl: "https://..."
sourceUrl: "https://..."    # the official page
faqs:
  - q: "When is the SSC CGL 2026 Tier 1 exam?"
    a: "..."
  # 4–6 FAQs, real questions people search, 1–3 sentence answers
---
```

## Step 4: Images (2–3 per post, real photos)

Every post gets **a real header photo, the key-facts card, and usually one more real photo**. Use different photos for different posts. Don't reuse a photo already used by another post (check `public/images/posts/`).

**a) Header photo**

1. Search with 2–4 different queries that fit the topic (the place, the activity, the kind of job), e.g. `npm run photo -- search "online exam centre computers"`.
2. Look at `.photo-previews/sheet.png` (numbered grid) and pick one that clearly fits.
3. Save it: `npm run photo -- save <id> --slug <slug> --as hero`, and paste the printed `image`, `imageCredit` and `imageCreditUrl` into the frontmatter.

Photo rules:
- Must fit the topic and not mislead. Example: don't use an SBI photo for an IBPS post (SBI hires through its own exam).
- No close-up identifiable children or private people as the main subject. Buildings, objects, hands, wide crowd shots and empty rooms are best.
- No logos used as if the organisation endorses us. A real building photo of an exam body is fine.
- Prefer large photos (the tool warns about small ones). Skip anything blurry, dated-looking or with heavy text/watermarks.

**b) Key-facts card** (our own graphic, no credit needed)

```
npm run new-image -- --slug <slug> --title "<short title>" --category <category> --fact "Exam date=<date>" --fact "Released=<date>" --fact "Mode=Online"
```

Put it right after the key-details table:

```
![<Exam> key dates: <the facts in words>](/images/posts/<slug>.png)
```

Look at the PNG. If the title wraps badly, shorten the `--title` for the image only.

**c) One more photo** (recommended), placed in a section where it fits (eligibility, how to prepare, what the job is like):

```
npm run photo -- save <id> --slug <slug> --as 2
```

Paste the printed two lines (image, then the caption line right below it) and replace `DESCRIBE THE PHOTO` with real alt text. You can put a short description before "Photo:" in the caption.

## Step 5: Check

Run `npm run check-post -- <slug>`. Fix every ✗ error. Fix warnings unless there's a good reason not to. Re-run until it passes.

Then run `npm run build` to make sure the site builds.

## Step 6: Show the draft and wait

Make sure the dev server is running (`npm run dev` in the background if it isn't), then show the user:

- Preview link: `http://localhost:4321/<slug>`
- Title, description, word count, category, tags
- The quick facts you used, each with its source, so they can verify in 1 minute
- Anything you weren't sure about or couldn't confirm
- A reminder: "Add one line of your own (a tip or opinion) if you can. It makes the post better."

Then ask: **Publish?** (okay / edit something / cancel)

Do NOT commit or push until the user clearly says okay / yes / publish.

If they ask for edits, make them, re-run `npm run check-post -- <slug>`, and ask again.
If they cancel, ask whether to delete the draft files or keep them with `draft: true`.

## Step 7: Publish (only after "okay")

1. `git add src/content/posts/<slug>.md public/images/posts/<slug>.png`
2. `git commit -m "post: <title>"`
3. If a git remote exists, `git push`. Cloudflare Pages deploys in about a minute.
   If there's no remote yet, say: "Committed locally. Connect GitHub + Cloudflare (see README) and push to go live."
4. Reply with the live URL: `<SITE.url>/<slug>`, and remind them to request indexing for it in Google Search Console (optional, speeds things up), and to share it on their Telegram/WhatsApp/LinkedIn.
