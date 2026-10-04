# Writing style

Every post should read like a helpful senior explaining something to a junior, not like a press release or a generic AI answer.

## Audience

Students and job seekers in India: govt exam aspirants (SSC, UPSC, railways, banking, state PSC, GATE) and people who want to keep up with tech. Mostly reading on a phone, often on mobile data. Busy and a bit sceptical. They want the key facts and the official link fast, then a clear explanation.

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

## Word count

| Post type | Words |
|---|---|
| Admit card / answer key / result | 800–1,200 |
| Tech news explainer | 800–1,200 |
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

**Current affairs (weekly):** date range up front → 20–30 items grouped by topic (National, States, Economy, International, Appointments, Awards, Sports, Science, Important Days), each 2–3 lines with the one fact to remember and its official source → 10–15 practice MCQs with answers → FAQs. No rumours, no opinion in the items.

**Hackathon / internship:** what it is, deadline and who can apply up front → key details table → eligibility → rounds → prizes/stipend → how to apply → prep tips → "Should you apply?" → FAQs.
