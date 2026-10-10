# Pinterest pins: format and workflow (reference)

The API app has Standard access (from 10 Oct 2026). Pins are scheduled through a queue that GitHub publishes, so nothing has to be posted by hand and the Mac can be off.

## How scheduling works

- `pins/queue.json` (on `main`) lists every scheduled pin: time, post, image style and facts, title, description, alt text.
- `.github/workflows/pins.yml` runs every 30 minutes from about 5:30 AM to 10 PM IST and publishes whatever is due. GitHub's timer can be 5–30 minutes late.
- GitHub builds each image itself from the queue (same `make-pin.mjs`), so no image files are committed.
- What has been published is recorded in `published.json` on the `pin-log` branch. The robot never commits to `main`.
- A pin more than 24 hours late is skipped, not published.
- Keys live in the repo's encrypted GitHub secrets. After `npm run pin -- login`, run `npm run pin -- secrets` to refresh them. If the workflow starts failing with a token error, do exactly that.

## Workflow

1. Pick posts by priority: trending first (sales, big releases), then open deadlines (govt exams), then evergreen (schemes). Skip niche or low-search posts.
2. Add one entry per pin to `pins/queue.json` (styles below). Remove entries that are already published (`npm run pin -- queue` shows the status).
3. `npm run pin -- preview` makes the images into `design/pins/` (gitignored) and prints the details. Check every image: each word, date and ₹ amount exactly right.
4. Show the batch to the user. After their okay, commit and push `pins/queue.json`. That push is what schedules the pins.
5. To pull a pin back before its time, delete its entry and push.

A ready-made image (for example an AI lifestyle image) can be used instead of a generated one: commit it under `pins/` and set `"image": "pins/<file>.png"` in the entry. To publish one pin right now from the Mac: `npm run pin -- create <slug> --image <file> --title "…" --description "…" --alt "…"`.

## How many and when

- 5–8 fresh pins a day. Post daily; consistency beats volume.
- Max 3 pins a day for the same post (only for trending topics); 1–2 for normal posts.
- Space pins 2–3 hours apart. Typical slots (IST): 7:00 AM, 10:00 AM, 12:30 PM, 3:00 PM, 6:00 PM, 8:30 PM.
- Every pin gets a new image. Never reuse an image for the same link.
- Time-sensitive text ("starts today", "5 days left", "early access from midnight") must still be true at the slot time.

## Boards

Govt Exams, Govt Schemes, Tech News, Careers, Cinema.

Cinema board description:
```
New movie releases in theatres and on OTT every week: Telugu, Tamil, Hindi, Malayalam and Kannada films, plus Netflix, Prime Video and JioHotstar releases. Release dates, official trailers, cast, box office updates and awards news. Spoiler-free, from Dishalu (dishalu.in).
```

## Image style

Mix the styles so the boards don't all look the same (user's call on 10 Oct 2026: not only pictures of young women). In a day's batch use at least three different looks, and never the same look twice for one post.

Made by `scripts/make-pin.mjs` (no AI, exact text, site colours and font):

| Style | Looks like | Best for |
|---|---|---|
| `photo` (default) | The post's real header photo on top, headline and 2–4 fact tiles below | Recruitment, schemes, anything with a strong real photo |
| `card` | Bold colour card, no photo, facts as a list | Deadlines and key numbers; a second pin for the same post |
| `list` | Photo strip on top, numbered list of 3–8 lines below | Weekly OTT and movie lists, step-by-step guides, "documents needed" |

`--photo public/images/posts/<slug>-2.webp` uses another photo from the post; then put that photo's credit in the pin description.

AI lifestyle images (ChatGPT prompt below) are still fine as one look among several. Vary the subject: places, objects, hands at work, groups, men and women of different ages, not a young woman every time. Text stays short: label, headline, 2–3 fact lines, `dishalu.in`.

Band colours used: govt exams navy `#1e3a8a`, sales blue `#2563eb`, schemes orange `#ea580c`, Supreme Court maroon `#7f1d1d`, OTT purple `#3b0764`, cinema gold on dark.

## Image prompt template

```
Create a vertical Pinterest pin image, portrait 2:3, 1024x1536 pixels.

Scene: realistic photo of <person / object / place matching the topic>, <setting>, <light and mood>.

Text overlay in the top third on a <colour> (#hex) band, bold white sans-serif font, large and readable on mobile, spelled exactly:
- Small label (<colour> pill): "<GOVT JOB / SALE ALERT / IMPORTANT / CINEMA ...>"
- Headline: "<main keyword phrase>"
- Line 1: "<key fact>"
- Line 2: "<deadline or date>"
- Bottom of image, small: "dishalu.in"

Rules: no <brand / government / court> logos, no real celebrity faces, no movie posters or stills, no other text besides the above.
```

## Pin details template

| Field | Rule |
|---|---|
| Title | ≤ 100 chars. Starts with the search phrase (e.g. "RRB Paramedical Recruitment 2026: 590 Posts, Last Date 14 October") |
| Description | ≤ 500 chars. 2–4 sentences: key facts, dates, ₹ amounts from the post, ends with "on Dishalu" |
| Link | `https://dishalu.in/<slug>` |
| Board | From the list above |
| Alt text | What the image shows + the text on it |
| Tagged topics | 5 broad topics, picked from Pinterest's suggestions |
| AI settings | Only for AI-made images: mark as AI-Modified, and "includes an AI-generated person" if a person is shown. Pins from `make-pin.mjs` use real photos and need neither |

## Example (8 Oct 2026)

- **Image:** young nurse in blue uniform in a hospital corridor; navy band: "GOVT JOB" / "RRB Paramedical 2026" / "590 Posts" / "Nursing Superintendent, Pharmacist & more" / "Last date: 14 Oct 2026"
- **Title:** RRB Paramedical Recruitment 2026: 590 Posts, Last Date 14 October
- **Description:** RRB Paramedical 2026 (CEN 05/2026) is open for 590 posts, including 365 Nursing Superintendent and 118 Pharmacist posts. Apply on rrbapply.gov.in by 14 October 2026, 11:59 pm. Fee ₹500 (₹250 for SC, ST, women and other listed groups). Eligibility, age, pay and RRB-wise vacancies on Dishalu.
- **Link:** https://dishalu.in/rrb-paramedical-recruitment-2026
- **Board:** Govt Exams
- **Alt text:** Young nurse in a blue uniform with a stethoscope in a hospital corridor. Text: RRB Paramedical 2026, 590 posts, Nursing Superintendent, Pharmacist and more, last date 14 Oct 2026.
- **Tagged topics:** Government jobs, Railway jobs, Nursing jobs, Nursing, Pharmacy
