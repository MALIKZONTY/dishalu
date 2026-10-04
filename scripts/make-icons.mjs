// Renders public/favicon.svg into the PNG icon sizes browsers and phones use.
// Usage: node scripts/make-icons.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const svg = readFileSync('public/favicon.svg', 'utf8');
mkdirSync('public/icons', { recursive: true });
const render = (size) => new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
const sizes = { 'icon-512.png': 512, 'icon-192.png': 192, 'apple-touch-icon.png': 180, 'favicon-96.png': 96, 'favicon-48.png': 48, 'favicon-32.png': 32, 'favicon-16.png': 16 };
for (const [name, size] of Object.entries(sizes)) {
  writeFileSync(`public/icons/${name}`, render(size));
  console.log(`✓ public/icons/${name}`);
}

// favicon.ico with 16, 32 and 48 px images (PNG-in-ICO). Google search results look for 48px or larger.
const icoSizes = [16, 32, 48];
const pngs = icoSizes.map(render);
const header = Buffer.alloc(6 + 16 * pngs.length);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4);
let offset = header.length;
pngs.forEach((png, i) => {
  const e = 6 + 16 * i, size = icoSizes[i];
  header.writeUInt8(size, e); header.writeUInt8(size, e + 1); header.writeUInt8(0, e + 2); header.writeUInt8(0, e + 3);
  header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(png.length, e + 8); header.writeUInt32LE(offset, e + 12);
  offset += png.length;
});
writeFileSync('public/favicon.ico', Buffer.concat([header, ...pngs]));
console.log('✓ public/favicon.ico');
