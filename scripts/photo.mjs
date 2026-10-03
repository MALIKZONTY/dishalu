// Find and save real photos for posts (openly licensed, commercial use allowed), via Openverse.
//
//   npm run photo -- search "students exam hall india"
//       (add --any to include small and portrait photos)
//       → lists candidates (id, licence, size, source, creator) and saves small previews to
//         .photo-previews/ so you can look at them before choosing.
//
//   npm run photo -- save <id> --slug <post-slug> --as hero
//       → public/images/posts/<slug>-hero.webp, cropped to 1200×630. Prints the frontmatter lines.
//
//   npm run photo -- save <id> --slug <post-slug> --as 2      (or 3, 4…)
//       → public/images/posts/<slug>-2.webp, max 1200 wide. Prints the Markdown to paste.
//
// Needs `cwebp` and `sips` (macOS) on this machine. Nothing here runs on Cloudflare.

import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const API = 'https://api.openverse.org/v1/images/';
const HEADERS = { 'User-Agent': 'Dishalu/1.0 (https://dishalu.in)' };
const PREVIEW_DIR = '.photo-previews';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    slug: { type: 'string' },
    as: { type: 'string' },
    count: { type: 'string', default: '10' },
    any: { type: 'boolean', default: false }, // include small and non-wide photos
  },
});
const [cmd, arg] = positionals;

async function getJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

async function download(url, file) {
  const res = await fetch(url, { headers: HEADERS, redirect: 'follow' });
  if (!res.ok) throw new Error(`Download failed: ${res.status} for ${url}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

function size(file) {
  const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file]).toString();
  return { w: +out.match(/pixelWidth: (\d+)/)[1], h: +out.match(/pixelHeight: (\d+)/)[1] };
}

function licenceName(r) {
  const l = r.license.toUpperCase();
  if (l === 'CC0') return 'CC0';
  if (l === 'PDM') return 'Public Domain';
  return `CC ${l} ${r.license_version}`;
}

function credit(r) {
  const where = r.source ? r.source.replace(/^\w/, (c) => c.toUpperCase()) : 'Openverse';
  const by = r.creator ? `${r.creator} / ${where}` : where;
  return { text: `Photo: ${by}, ${licenceName(r)}`, url: r.foreign_landing_url || r.url };
}

// Small preview: Openverse thumbnail, else a resized copy from Wikimedia, else the original shrunk locally.
async function preview(r, file) {
  const wiki = r.url.match(/upload\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/]+)/);
  const tries = [r.thumbnail || `${API}${r.id}/thumb/`];
  if (wiki) tries.push(`https://commons.wikimedia.org/wiki/Special:FilePath/${wiki[1]}?width=480`);
  for (const url of tries) {
    try {
      await download(url, file);
      return;
    } catch {
      /* try next */
    }
  }
  try {
    await download(r.url, file);
    execFileSync('sips', ['-Z', '480', '-s', 'format', 'jpeg', file, '--out', file], { stdio: 'ignore' });
  } catch {
    /* preview is optional */
  }
}

// One numbered grid image of all previews, so candidates can be compared at a glance.
function contactSheet(n) {
  const cols = 3, cw = 400, chh = 260, pad = 10;
  const rows = Math.ceil(n / cols);
  let cells = '';
  for (let i = 0; i < n; i++) {
    const file = join(PREVIEW_DIR, `${String(i + 1).padStart(2, '0')}.jpg`);
    const x = pad + (i % cols) * (cw + pad), y = pad + Math.floor(i / cols) * (chh + pad);
    if (existsSync(file)) {
      const b64 = readFileSync(file).toString('base64');
      cells += `<image href="data:image/jpeg;base64,${b64}" x="${x}" y="${y}" width="${cw}" height="${chh}" preserveAspectRatio="xMidYMid slice"/>`;
    } else {
      cells += `<rect x="${x}" y="${y}" width="${cw}" height="${chh}" fill="#ddd"/>`;
    }
    cells += `<rect x="${x}" y="${y}" width="44" height="34" fill="#c8102e"/><text x="${x + 22}" y="${y + 24}" font-size="20" font-weight="700" fill="#fff" text-anchor="middle" font-family="Helvetica">${i + 1}</text>`;
  }
  const W = pad + cols * (cw + pad), H = pad + rows * (chh + pad);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>${cells}</svg>`;
  const png = new Resvg(svg, { font: { loadSystemFonts: true } }).render().asPng();
  writeFileSync(join(PREVIEW_DIR, 'sheet.png'), png);
}

async function search(query) {
  const params = new URLSearchParams({
    q: query,
    license_type: 'commercial,modification',
    page_size: values.count,
    mature: 'false',
    excluded_source: 'stocksnap', // blocks downloads
    ...(values.any ? {} : { size: 'large', aspect_ratio: 'wide' }),
  });
  const data = await getJson(`${API}?${params}`);
  if (!data.results?.length) return console.log('No results. Try simpler or different words.');

  rmSync(PREVIEW_DIR, { recursive: true, force: true });
  mkdirSync(PREVIEW_DIR, { recursive: true });
  console.log(`${data.result_count} results for "${query}"\n`);
  for (const [i, r] of data.results.entries()) {
    const n = String(i + 1).padStart(2, '0');
    const small = r.width && r.width < 1000 ? '  ⚠ small' : '';
    console.log(`${n}. ${r.id}`);
    console.log(`    ${r.width}×${r.height}${small} · ${licenceName(r)} · ${r.source} · ${(r.creator || '?').slice(0, 30)}`);
    console.log(`    ${(r.title || '').slice(0, 80)}`);
    await preview(r, join(PREVIEW_DIR, `${n}.jpg`));
  }
  contactSheet(data.results.length);
  console.log(`\nPreviews saved in ${PREVIEW_DIR}/ and combined in ${PREVIEW_DIR}/sheet.png`);
  console.log(`(single files: 01.jpg, 02.jpg…). Then: npm run photo -- save <id> --slug <slug> --as hero`);
}

async function save(id) {
  if (!values.slug || !values.as) throw new Error('Need --slug and --as (hero, 2, 3…)');
  const r = await getJson(`${API}${id}/`);
  const tmp = join(tmpdir(), `dishalu-${id}`);
  await download(r.url, tmp);
  const { w, h } = size(tmp);
  const out = `public/images/posts/${values.slug}-${values.as}.webp`;
  const c = credit(r);

  if (values.as === 'hero') {
    // Crop to 1200×630 (1.905:1). Keep the upper-middle area, where faces and subjects usually are.
    const ratio = 1200 / 630;
    let cw = w, ch = h, x = 0, y = 0;
    if (w / h > ratio) { cw = Math.round(h * ratio); x = Math.round((w - cw) / 2); }
    else { ch = Math.round(w / ratio); y = Math.round((h - ch) * 0.35); }
    execFileSync('cwebp', ['-quiet', '-q', '80', '-crop', `${x}`, `${y}`, `${cw}`, `${ch}`, '-resize', '1200', '630', tmp, '-o', out]);
    console.log(`✓ ${out} (from ${w}×${h})${w < 1000 ? '  ⚠ source is small, may look soft' : ''}`);
    console.log('\nFrontmatter:');
    console.log(`image: /images/posts/${values.slug}-hero.webp`);
    console.log(`imageCredit: "${c.text}"`);
    console.log(`imageCreditUrl: "${c.url}"`);
  } else {
    const args = ['-quiet', '-q', '78'];
    if (w > 1200) args.push('-resize', '1200', '0');
    execFileSync('cwebp', [...args, tmp, '-o', out]);
    console.log(`✓ ${out} (from ${w}×${h})`);
    console.log('\nMarkdown (image line, then caption line right below it):');
    console.log(`![DESCRIBE THE PHOTO](/images/posts/${values.slug}-${values.as}.webp)`);
    console.log(`*${c.text.replace(/, (CC.*|Public Domain)$/, '')}, [${c.text.match(/(CC.*|Public Domain)$/)[0]}](${c.url})*`);
  }
  rmSync(tmp, { force: true });
}

try {
  if (cmd === 'search' && arg) await search(arg);
  else if (cmd === 'save' && arg) await save(arg);
  else console.log('Usage:\n  npm run photo -- search "words"\n  npm run photo -- save <id> --slug <slug> --as hero|2|3');
} catch (e) {
  console.error('✗', e.message);
  process.exit(1);
}
