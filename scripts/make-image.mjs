// Generates a 1200x630 featured image (also used as the social preview).
//
// Usage:
//   npm run new-image -- --slug ssc-cgl-2026-notification \
//     --title "SSC CGL 2026 Notification: Dates, Vacancies and Eligibility" \
//     --category govt-exams \
//     --fact "Last date=15 Oct 2026" --fact "Vacancies=14,582" --fact "Fee=₹100"
//
//   npm run new-image -- --default   (regenerates public/images/default-og.png)
//
// Output: public/images/posts/<slug>.png

import { parseArgs } from 'node:util';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const THEMES = {
  'govt-exams': { label: 'GOVT EXAMS', from: '#1d4ed8', to: '#1e3a8a', accent: '#93c5fd' },
  'tech-news': { label: 'TECH NEWS', from: '#7c3aed', to: '#4c1d95', accent: '#c4b5fd' },
  careers: { label: 'CAREERS', from: '#0f766e', to: '#134e4a', accent: '#5eead4' },
  cinema: { label: 'CINEMA', from: '#be185d', to: '#831843', accent: '#f9a8d4' },
  opportunities: { label: 'HACKATHONS & INTERNSHIPS', from: '#b91c1c', to: '#7f1d1d', accent: '#fca5a5' },
  'earn-grow': { label: 'EARN & GROW', from: '#b45309', to: '#7c2d12', accent: '#fcd34d' },
  default: { label: '', from: '#c8102e', to: '#1e293b', accent: '#fca5a5' },
};

const { values } = parseArgs({
  options: {
    slug: { type: 'string' },
    title: { type: 'string' },
    category: { type: 'string', default: 'default' },
    fact: { type: 'string', multiple: true, default: [] },
    brand: { type: 'string' },
    default: { type: 'boolean', default: false },
  },
});

const brand = values.brand ?? (await readBrand());

async function readBrand() {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../src/site.config.ts', import.meta.url), 'utf8');
  return src.match(/name:\s*'([^']+)'/)?.[1] ?? 'Blog';
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function wrap(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars && line) {
      lines.push(line);
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fitTitle(title) {
  // Try big text first; shrink until it fits in 3 lines.
  for (const [size, chars] of [[64, 26], [56, 30], [48, 36], [42, 42]]) {
    const lines = wrap(title, chars);
    if (lines.length <= 3) return { size, lines };
  }
  const lines = wrap(title, 42).slice(0, 3);
  lines[2] = lines[2].replace(/\s*\S*$/, '…');
  return { size: 42, lines };
}

function render({ title, category, facts }) {
  const t = THEMES[category] ?? THEMES.default;
  const { size, lines } = fitTitle(title);
  const lineHeight = Math.round(size * 1.18);
  const shownFacts = facts.slice(0, 3).map((f) => {
    const [k, ...v] = f.split('=');
    return { k: k.trim(), v: v.join('=').trim() };
  });
  const titleTop = shownFacts.length ? 190 : 230;

  const factBoxes = shownFacts
    .map((f, i) => {
      const w = 340;
      const x = 70 + i * (w + 20);
      return `
      <g transform="translate(${x}, 450)">
        <rect width="${w}" height="104" rx="16" fill="#ffffff" fill-opacity="0.12" stroke="#ffffff" stroke-opacity="0.25"/>
        <text x="22" y="40" font-size="22" fill="${t.accent}" font-weight="600">${esc(f.k.toUpperCase())}</text>
        <text x="22" y="80" font-size="30" fill="#ffffff" font-weight="700">${esc(f.v.length > 20 ? f.v.slice(0, 19) + '…' : f.v)}</text>
      </g>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.from}"/>
      <stop offset="1" stop-color="${t.to}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1100" cy="80" r="220" fill="#ffffff" fill-opacity="0.05"/>
  <circle cx="1180" cy="560" r="140" fill="#ffffff" fill-opacity="0.05"/>
  <g font-family="Helvetica Neue, Helvetica, Arial, sans-serif">
    ${t.label ? `<rect x="70" y="70" width="${t.label.length * 15 + 40}" height="44" rx="22" fill="${t.accent}"/>
    <text x="90" y="100" font-size="22" font-weight="700" fill="${t.to}" letter-spacing="1.5">${esc(t.label)}</text>` : ''}
    ${lines
      .map((l, i) => `<text x="70" y="${titleTop + i * lineHeight}" font-size="${size}" font-weight="800" fill="#ffffff">${esc(l)}</text>`)
      .join('\n    ')}
    ${factBoxes}
    <text x="1130" y="${t.label ? 100 : 100}" font-size="26" font-weight="700" fill="#ffffff" fill-opacity="0.85" text-anchor="end">${esc(brand)}</text>
  </g>
</svg>`;
}

function save(svg, out) {
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: { loadSystemFonts: true, defaultFontFamily: 'Helvetica' },
  })
    .render()
    .asPng();
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, png);
  console.log(`✓ wrote ${out} (${Math.round(png.length / 1024)} KB)`);
}

if (values.default) {
  const { readFileSync } = await import('node:fs');
  const tagline = readFileSync(new URL('../src/site.config.ts', import.meta.url), 'utf8').match(/tagline:\s*'([^']+)'/)?.[1] ?? '';
  save(render({ title: tagline, category: 'default', facts: [] }), 'public/images/default-og.png');
} else {
  if (!values.slug || !values.title) {
    console.error('Missing --slug or --title. See usage at the top of scripts/make-image.mjs');
    process.exit(1);
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(values.slug)) {
    console.error(`Bad slug "${values.slug}". Use lowercase words joined by hyphens.`);
    process.exit(1);
  }
  save(render({ title: values.title, category: values.category, facts: values.fact }), `public/images/posts/${values.slug}.png`);
}
