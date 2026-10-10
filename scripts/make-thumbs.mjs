#!/usr/bin/env node
// Small versions of post header photos, used by cards, lists and search results.
// Usage: node scripts/make-thumbs.mjs          → makes any missing thumbnails
//        node scripts/make-thumbs.mjs --force  → remakes all of them
//
// public/images/posts/<slug>-hero.webp (1200×630) → public/images/thumbs/<slug>-hero.webp (480×252)
// and <slug>-hero-320.webp (320×168, for the small cards and phone screens).
// `npm run photo -- save … --as hero` runs this for you. Needs `cwebp` on this machine.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, existsSync, statSync } from 'node:fs';

const SRC = 'public/images/posts';
const OUT = 'public/images/thumbs';
const force = process.argv.includes('--force');

mkdirSync(OUT, { recursive: true });
let made = 0;
for (const file of readdirSync(SRC).filter((f) => f.endsWith('-hero.webp'))) {
  for (const [w, h, out] of [
    [480, 252, `${OUT}/${file}`],
    [320, 168, `${OUT}/${file.replace('.webp', '-320.webp')}`],
  ]) {
    if (!force && existsSync(out)) continue;
    execFileSync('cwebp', ['-quiet', '-q', '72', '-resize', `${w}`, `${h}`, `${SRC}/${file}`, '-o', out]);
    console.log(`✓ ${out} (${Math.round(statSync(out).size / 1024)} KB)`);
    made++;
  }
}
if (!made) console.log('Thumbnails are up to date.');
