---
description: Refresh an existing post with new information (result out, date changed, admit card released).
argument-hint: "<slug or topic of the post to update>"
---

Update an existing post: "$ARGUMENTS"

1. Run `npm run list-posts -- <word>` to find the post. If more than one matches, ask which one.
2. Read the post and its `sourceUrl`. Search the web for what has changed since it was published (new dates, results, admit card, answer key, deadline extension, cancelled event).
3. If nothing has changed, say so and stop.
4. Edit the post following @docs/writing-style.md:
   - Put the new information near the top in a short "**Update (<date>):** ..." line, then fix the facts in the rest of the post so nothing contradicts it.
   - Add `updated: <today>` to the frontmatter (keep the original `date`).
   - Update FAQs if their answers changed.
   - If key facts on the image changed, regenerate it with `npm run new-image` using the same slug.
5. Run `npm run check-post -- <slug>` and `npm run build`.
6. Show the user what changed (old → new, with sources) and the preview link `http://localhost:4321/<slug>`. Ask: **Publish the update?**
7. Only after they say okay: commit with `git commit -m "update: <title>"` and `git push` if a remote exists.
