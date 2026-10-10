// Makes a 1000×1500 Pinterest pin image for a post. No AI: the text is typed, so every
// word, date and ₹ amount is exactly what you pass in.
//
// Usage:
//   node scripts/make-pin.mjs <slug> --fact "Posts=858" --fact "Fee=Nil" --fact "Last date=26 Oct 2026"
//        [--headline "CDAC Recruitment 2026"] [--label "GOVT JOB"] [--style photo|card|list]
//        [--photo public/images/posts/<slug>-2.webp] [--out design/pins/name.png]
//
// Styles (use a different one for each pin of the same post):
//   photo  the post's real header photo on top, facts in tiles below (default)
//   card   bold colour card, no photo, facts as a list
//   list   photo strip on top, a numbered list below. Each --fact is one line, e.g. --fact "Epic=Netflix"
//
// Headline defaults to the post title up to the first colon. 2–4 facts, each "Label=Value".
// Output: design/pins/<slug>-<n>.png (gitignored).
// scripts/pin.mjs imports makePin() to build the images for scheduled pins (pins/queue.json).

import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import matter from 'gray-matter';

// Same colours as the category labels on the site (src/site.config.ts).
const THEMES = {
  'govt-exams': { label: 'GOVT JOB', color: '#c8102e', dark: '#7f0a1d', soft: '#fdecee' },
  'govt-schemes': { label: 'GOVT SCHEME', color: '#c2410c', dark: '#7c2d12', soft: '#fdeee6' },
  'tech-news': { label: 'TECH NEWS', color: '#1d4ed8', dark: '#1e3a8a', soft: '#e8efff' },
  careers: { label: 'CAREERS', color: '#047857', dark: '#064e3b', soft: '#e3f6ee' },
  cinema: { label: 'CINEMA', color: '#be185d', dark: '#831843', soft: '#fdeaf3' },
};
const W = 1000;
const H = 1500;
const FONT_DIR = new URL('./fonts/', import.meta.url).pathname;

function fail(msg) {
  throw new Error(msg);
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function wrap(text, maxChars) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (line && `${line} ${word}`.length > maxChars) {
      lines.push(line);
      line = word;
    } else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines;
}

// Biggest size that fits the headline in `maxLines` lines.
function fit(text, sizes, maxLines) {
  for (const [size, chars] of sizes) {
    const lines = wrap(text, chars);
    if (lines.length <= maxLines) return { size, lines };
  }
  fail(`Headline is too long for the pin: "${text}". Pass a shorter --headline.`);
}

// Font size for a value so it stays inside `width` pixels (Plus Jakarta Sans Bold is about 0.58em per character).
const sizeFor = (text, width, max) => Math.min(max, Math.floor(width / (text.length * 0.58)));

// The renderer can't read WebP, so the photo is converted to JPEG first: with sharp (comes with Astro,
// works on GitHub's Linux runners) or, failing that, macOS sips.
async function photoData(file) {
  if (!existsSync(file)) fail(`Photo not found: ${file}`);
  let jpeg;
  try {
    const { default: sharp } = await import('sharp');
    jpeg = await sharp(file).jpeg({ quality: 90 }).toBuffer();
  } catch {
    const jpg = join(mkdtempSync(join(tmpdir(), 'pin-')), 'photo.jpg');
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '90', file, '--out', jpg], { stdio: 'ignore' });
    jpeg = readFileSync(jpg);
  }
  return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
}

function pill(x, y, text, fill, color) {
  const w = Math.round(text.length * 17.5 + 56);
  return `<rect x="${x}" y="${y}" width="${w}" height="58" rx="29" fill="${fill}"/>
  <text x="${x + w / 2}" y="${y + 39}" font-size="26" font-weight="800" fill="${color}" text-anchor="middle" letter-spacing="2">${esc(text)}</text>`;
}

function footer(t) {
  return `<rect x="0" y="${H - 116}" width="${W}" height="116" fill="${t.color}"/>
  <text x="${W / 2}" y="${H - 44}" font-size="40" font-weight="700" fill="#ffffff" text-anchor="middle">Full details on <tspan font-weight="800">dishalu.in</tspan></text>`;
}

// The pin font only has Latin letters. A credit in another script is left off the image; put it in the pin description.
function credit(text, y) {
  if (text && /[^\u0000-\u024F\u2000-\u206F]/.test(text)) return '';
  return text ? `<text x="${W - 36}" y="${y}" font-size="19" font-weight="500" fill="#ffffff" fill-opacity="0.85" text-anchor="end">${esc(text)}</text>` : '';
}

// Photo on top, headline and fact tiles on a white card below.
function photoStyle({ t, label, headline, facts, photo, photoCredit }) {
  const { size, lines } = fit(headline, [[76, 20], [66, 23], [58, 27], [52, 30]], 3);
  const lh = Math.round(size * 1.16);
  const headTop = 730 + size;
  const tilesTop = headTop + (lines.length - 1) * lh + 62;
  const cols = facts.length === 3 ? 3 : 2;
  const gap = 20;
  const tw = (W - 120 - gap * (cols - 1)) / cols;
  const rows = Math.ceil(facts.length / cols);
  const th = Math.min(170, Math.floor((H - 116 - 44 - tilesTop - gap * (rows - 1)) / rows));
  const tiles = facts
    .map((f, i) => {
      const x = 60 + (i % cols) * (tw + gap);
      const y = tilesTop + Math.floor(i / cols) * (th + gap);
      return `<g transform="translate(${x}, ${y})">
      <rect width="${tw}" height="${th}" rx="26" fill="${t.soft}"/>
      <text x="28" y="${th / 2 - 18}" font-size="23" font-weight="700" fill="${t.color}" letter-spacing="1.5">${esc(f.k.toUpperCase())}</text>
      <text x="28" y="${th / 2 + 36}" font-size="${sizeFor(f.v, tw - 56, 46)}" font-weight="800" fill="#111827">${esc(f.v)}</text>
    </g>`;
    })
    .join('\n    ');

  return `<defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000000" stop-opacity="0.35"/>
      <stop offset="0.3" stop-color="#000000" stop-opacity="0"/>
      <stop offset="0.7" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <image href="${photo}" x="0" y="0" width="${W}" height="720" preserveAspectRatio="xMidYMid slice"/>
  <rect x="0" y="0" width="${W}" height="720" fill="url(#shade)"/>
  ${pill(60, 56, label, t.color, '#ffffff')}
  ${credit(photoCredit, 636)}
  <rect x="0" y="660" width="${W}" height="${H - 660}" rx="56" fill="#ffffff"/>
  <rect x="0" y="760" width="${W}" height="${H - 760}" fill="#ffffff"/>
  <rect x="60" y="708" width="96" height="10" rx="5" fill="${t.color}"/>
  ${lines.map((l, i) => `<text x="60" y="${headTop + i * lh}" font-size="${size}" font-weight="800" fill="#111827" letter-spacing="-1">${esc(l)}</text>`).join('\n  ')}
  ${tiles}
  ${footer(t)}`;
}

// Colour card, no photo: headline on top, facts as a list on a white panel.
function cardStyle({ t, label, headline, facts }) {
  const { size, lines } = fit(headline, [[92, 17], [80, 20], [70, 23], [60, 27]], 4);
  const lh = Math.round(size * 1.14);
  const headTop = 190 + size;
  const panelTop = headTop + (lines.length - 1) * lh + 80;
  const panelH = H - 116 - 60 - panelTop;
  const rowH = Math.min(190, Math.floor(panelH / facts.length));
  const top = panelTop + (panelH - rowH * facts.length) / 2;
  const rows = facts
    .map((f, i) => {
      const y = top + i * rowH;
      return `${i ? `<rect x="110" y="${y}" width="${W - 220}" height="2" fill="#e5e7eb"/>` : ''}
    <text x="110" y="${y + rowH / 2 - 16}" font-size="25" font-weight="700" fill="${t.color}" letter-spacing="1.5">${esc(f.k.toUpperCase())}</text>
    <text x="110" y="${y + rowH / 2 + 42}" font-size="${sizeFor(f.v, W - 220, 54)}" font-weight="800" fill="#111827">${esc(f.v)}</text>`;
    })
    .join('\n    ');

  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.color}"/>
      <stop offset="1" stop-color="${t.dark}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="${W - 60}" cy="90" r="260" fill="#ffffff" fill-opacity="0.07"/>
  <circle cx="40" cy="${H - 320}" r="200" fill="#ffffff" fill-opacity="0.05"/>
  ${pill(60, 70, label, '#ffffff', t.color)}
  ${lines.map((l, i) => `<text x="60" y="${headTop + i * lh}" font-size="${size}" font-weight="800" fill="#ffffff" letter-spacing="-1.5">${esc(l)}</text>`).join('\n  ')}
  <rect x="60" y="${panelTop}" width="${W - 120}" height="${panelH}" rx="40" fill="#ffffff"/>
  ${rows}
  <text x="${W / 2}" y="${H - 44}" font-size="40" font-weight="700" fill="#ffffff" text-anchor="middle">Full details on <tspan font-weight="800">dishalu.in</tspan></text>`;
}

// Photo strip on top, numbered list below. Each fact is one line: name on the left, detail on the right.
function listStyle({ t, label, headline, facts, photo, photoCredit }) {
  const { size, lines } = fit(headline, [[72, 21], [62, 25], [54, 29]], 2);
  const lh = Math.round(size * 1.16);
  const headTop = 470 + size;
  const listTop = headTop + (lines.length - 1) * lh + 50;
  const rowH = Math.min(118, Math.floor((H - 116 - 30 - listTop) / facts.length));
  const rows = facts
    .map((f, i) => {
      const y = listTop + i * rowH;
      const mid = y + rowH / 2;
      const detailW = Math.min(360, f.v.length * 19 + 20);
      return `<rect x="60" y="${y + 6}" width="${W - 120}" height="${rowH - 12}" rx="22" fill="${i % 2 ? '#ffffff' : t.soft}"/>
    <circle cx="112" cy="${mid}" r="26" fill="${t.color}"/>
    <text x="112" y="${mid + 10}" font-size="28" font-weight="800" fill="#ffffff" text-anchor="middle">${i + 1}</text>
    <text x="160" y="${mid + 13}" font-size="${sizeFor(f.k, W - 240 - detailW, 38)}" font-weight="800" fill="#111827">${esc(f.k)}</text>
    <text x="${W - 88}" y="${mid + 11}" font-size="30" font-weight="600" fill="${t.color}" text-anchor="end">${esc(f.v)}</text>`;
    })
    .join('\n    ');

  return `<defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000000" stop-opacity="0.4"/>
      <stop offset="0.5" stop-color="#000000" stop-opacity="0.05"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <image href="${photo}" x="0" y="0" width="${W}" height="440" preserveAspectRatio="xMidYMid slice"/>
  <rect x="0" y="0" width="${W}" height="440" fill="url(#shade)"/>
  ${pill(60, 56, label, t.color, '#ffffff')}
  ${credit(photoCredit, 372)}
  <rect x="0" y="396" width="${W}" height="120" rx="48" fill="#ffffff"/>
  ${lines.map((l, i) => `<text x="60" y="${headTop + i * lh}" font-size="${size}" font-weight="800" fill="#111827" letter-spacing="-1">${esc(l)}</text>`).join('\n  ')}
  ${rows}
  ${footer(t)}`;
}

const STYLES = { photo: photoStyle, card: cardStyle, list: listStyle };

// facts: [{ k, v }]. Returns the path of the PNG it wrote.
export async function makePin({ slug, style = 'photo', headline, label, facts = [], photo, out }) {
  if (!slug) fail('Give a post slug. See usage at the top of scripts/make-pin.mjs');
  const postFile = `src/content/posts/${slug}.md`;
  if (!existsSync(postFile)) fail(`No post found: ${postFile}`);
  const { data: post } = matter(readFileSync(postFile, 'utf8'));
  const t = THEMES[post.category];
  if (!t) fail(`No pin colours for category "${post.category}".`);
  if (!STYLES[style]) fail(`Unknown style "${style}". Use photo, card or list.`);
  const [min, max] = style === 'list' ? [3, 8] : [2, 4];
  if (facts.length < min || facts.length > max || facts.some((f) => !f.k || !f.v))
    fail(`The ${style} style needs ${min}–${max} facts, each with a label and a value.`);

  const usesPhoto = style !== 'card';
  const body = STYLES[style]({
    t,
    label: label ?? t.label,
    headline: headline ?? post.title.split(':')[0],
    facts,
    photo: usesPhoto ? await photoData(photo ?? join('public', post.image)) : null,
    // The credit printed on the pin only fits the header photo; other photos are credited in the pin description.
    photoCredit: usesPhoto && !photo ? post.imageCredit : null,
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Plus Jakarta Sans">
  ${body}
</svg>`;

  if (!out) {
    const taken = existsSync('design/pins') ? readdirSync('design/pins').filter((f) => f.startsWith(`${slug}-`)).length : 0;
    out = `design/pins/${slug}-${taken + 1}.png`;
  }
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: {
      fontFiles: ['Medium', 'SemiBold', 'Bold', 'ExtraBold'].map((w) => `${FONT_DIR}PlusJakartaSans-${w}.ttf`),
      loadSystemFonts: false,
      defaultFontFamily: 'Plus Jakarta Sans',
    },
  })
    .render()
    .asPng();
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, png);
  return out;
}

// Run from the terminal (not imported by pin.mjs).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values: opts, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      headline: { type: 'string' },
      label: { type: 'string' },
      fact: { type: 'string', multiple: true, default: [] },
      style: { type: 'string', default: 'photo' },
      photo: { type: 'string' },
      out: { type: 'string' },
    },
  });
  const facts = opts.fact.map((f) => {
    const [k, ...v] = f.split('=');
    return { k: k.trim(), v: v.join('=').trim() };
  });
  try {
    const out = await makePin({ ...opts, slug: positionals[0], facts });
    console.log(`✓ ${out} (${opts.style} style)`);
  } catch (e) {
    console.error(`\n✗ ${e.message}\n`);
    process.exit(1);
  }
}
