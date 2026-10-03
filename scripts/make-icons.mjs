// Renders public/favicon.svg into the PNG icon sizes browsers and phones use.
// Usage: node scripts/make-icons.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const svg = readFileSync('public/favicon.svg', 'utf8');
mkdirSync('public/icons', { recursive: true });
const sizes = { 'icon-512.png': 512, 'icon-192.png': 192, 'apple-touch-icon.png': 180, 'favicon-32.png': 32, 'favicon-16.png': 16 };
for (const [name, size] of Object.entries(sizes)) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(`public/icons/${name}`, png);
  console.log(`✓ public/icons/${name}`);
}
