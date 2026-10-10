// Posts a blog post to Pinterest through the Pinterest API v5.
//
// Setup (once):
//   1. In .env (gitignored) add:
//        PINTEREST_APP_ID=...
//        PINTEREST_APP_SECRET=...
//        PINTEREST_SANDBOX_TOKEN=...   (optional, for --sandbox while on Trial access)
//   2. npm run pin -- login            (opens Pinterest in the browser, saves the token)
//
// Usage:
//   npm run pin -- me                                  show the connected account
//   npm run pin -- boards [--sandbox]                  list boards
//   npm run pin -- make-board "Tech News" [--sandbox]  create a board
//   npm run pin -- create <slug> [--image path.png] [--board "Govt Exams"] [--title "..."]
//                [--description "..."] [--alt "..."] [--board-id ID] [--sandbox] [--dry-run]
//
//   npm run pin -- queue                               scheduled pins (pins/queue.json) and their status
//   npm run pin -- preview                             make the images of pins still waiting, into design/pins/
//   npm run pin -- publish-due [--dry-run]             publish queued pins whose time has come (GitHub runs this)
//   npm run pin -- secrets                             copy the Pinterest keys and token to GitHub (needs `gh`)
//
// Scheduling: Pinterest's API can't schedule, so .github/workflows/pins.yml runs `publish-due` every
// 30 minutes. It reads pins/queue.json from main and records what it published in published.json on
// the `pin-log` branch, so nothing is ever committed to main by the robot.
//
// Title, description, alt text, link and board come from the post unless given.
// Without --image the post's hero photo is used (converted to JPG with macOS sips).
// --sandbox sends to api-sandbox.pinterest.com (Trial access: pins visible only to you).
// The sandbox doesn't list boards you create there, so pass --board-id with the id make-board prints.

import { parseArgs } from 'node:util';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, mkdtempSync, mkdirSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import matter from 'gray-matter';
import { makePin } from './make-pin.mjs';

try {
  process.loadEnvFile();
} catch {}

const SITE_URL = 'https://dishalu.in';
const REDIRECT_URI = 'http://localhost:8085/callback';
const SCOPES = 'boards:read,boards:write,pins:read,pins:write,user_accounts:read';
const TOKEN_FILE = '.pinterest-token.json';
const QUEUE_FILE = 'pins/queue.json';
const LOG_BRANCH = 'pin-log';
const LOG_FILE = process.env.PIN_LOG ?? '.pin-log/published.json';
const STALE_HOURS = 24; // a queued pin this late is skipped, not published
const BOARD_FOR_CATEGORY = {
  'govt-exams': 'Govt Exams',
  'govt-schemes': 'Govt Schemes',
  'tech-news': 'Tech News',
  careers: 'Careers',
  cinema: 'Cinema',
};

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    image: { type: 'string' },
    board: { type: 'string' },
    'board-id': { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    alt: { type: 'string' },
    sandbox: { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
  },
});
const [command, arg] = positionals;
const API = opts.sandbox ? 'https://api-sandbox.pinterest.com/v5' : 'https://api.pinterest.com/v5';

function fail(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

// Retries network errors (dropped connections, timeouts) up to 3 times.
async function request(url, init) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(url, init);
    } catch (e) {
      if (attempt === 3) fail(`Network error talking to Pinterest: ${e.cause?.code ?? e.message}. Check your internet and try again.`);
      await new Promise((r) => setTimeout(r, attempt * 1500));
    }
  }
}

function appCredentials() {
  const id = process.env.PINTEREST_APP_ID;
  const secret = process.env.PINTEREST_APP_SECRET;
  if (!id || !secret) fail('Add PINTEREST_APP_ID and PINTEREST_APP_SECRET to .env first.');
  return { id, secret, basic: Buffer.from(`${id}:${secret}`).toString('base64') };
}

async function tokenRequest(params) {
  const { basic } = appCredentials();
  const res = await request('https://api.pinterest.com/v5/oauth/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  const data = await res.json();
  if (!res.ok) fail(`Token request failed (${res.status}): ${JSON.stringify(data)}`);
  const saved = {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? params.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    scope: data.scope,
  };
  writeFileSync(TOKEN_FILE, JSON.stringify(saved, null, 2), { mode: 0o600 });
  return saved;
}

async function accessToken() {
  if (opts.sandbox) {
    const t = process.env.PINTEREST_SANDBOX_TOKEN;
    if (!t) fail('Add PINTEREST_SANDBOX_TOKEN to .env (My Apps → Manage → Generate access token → Sandbox).');
    return t;
  }
  // On GitHub there is no token file: the token comes from the repository secrets.
  if (!existsSync(TOKEN_FILE) && process.env.PINTEREST_ACCESS_TOKEN) return process.env.PINTEREST_ACCESS_TOKEN;
  if (!existsSync(TOKEN_FILE)) fail('Not logged in. Run: npm run pin -- login');
  let saved = JSON.parse(readFileSync(TOKEN_FILE, 'utf8'));
  if (Date.now() > saved.expires_at - 5 * 60 * 1000) {
    console.log('Access token expired, refreshing…');
    saved = await tokenRequest({ grant_type: 'refresh_token', refresh_token: saved.refresh_token });
  }
  return saved.access_token;
}

async function api(method, path, body) {
  const send = async () =>
    request(API + path, {
      method,
      headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  let res = await send();
  // On GitHub the access token secret expires after 30 days: get a fresh one with the refresh token and retry.
  if (res.status === 401 && !existsSync(TOKEN_FILE) && process.env.PINTEREST_REFRESH_TOKEN) {
    console.log('Access token rejected, refreshing…');
    await tokenRequest({ grant_type: 'refresh_token', refresh_token: process.env.PINTEREST_REFRESH_TOKEN });
    res = await send();
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const hint =
      res.status === 401 || res.status === 403
        ? '\n  On Trial access, try again with --sandbox.'
        : '';
    fail(`${method} ${path} failed (${res.status}): ${data.message ?? text}${hint}`);
  }
  return data;
}

async function login() {
  const { id } = appCredentials();
  const state = randomBytes(16).toString('hex');
  const authUrl =
    'https://www.pinterest.com/oauth/?' +
    new URLSearchParams({ client_id: id, redirect_uri: REDIRECT_URI, response_type: 'code', scope: SCOPES, state });

  const code = await new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, REDIRECT_URI);
      if (url.pathname !== '/callback') return res.writeHead(404).end();
      const ok = url.searchParams.get('state') === state && url.searchParams.get('code');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', Connection: 'close' });
      res.end(
        ok
          ? '<h2>Dishalu Publisher is connected to Pinterest.</h2><p>You can close this tab.</p>'
          : '<h2>Login failed.</h2><p>Go back to the terminal.</p>',
      );
      server.close();
      server.closeAllConnections();
      ok ? resolve(url.searchParams.get('code')) : reject(new Error(url.searchParams.get('error') ?? 'state mismatch'));
    });
    server.listen(8085, () => {
      console.log('Opening Pinterest in your browser to connect Dishalu Publisher…');
      console.log(`If it doesn't open, visit:\n${authUrl}\n`);
      execFileSync('open', [authUrl]);
    });
  }).catch((e) => fail(`Login failed: ${e.message}`));

  await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI });
  console.log(`✓ Logged in. Token saved to ${TOKEN_FILE} (gitignored).`);
  await me();
}

async function me() {
  const u = await api('GET', '/user_account');
  console.log(`Connected account: ${u.username} (${u.account_type})`);
}

async function listBoards() {
  const { items } = await api('GET', '/boards?page_size=100');
  if (!items.length) console.log('No boards yet.');
  for (const b of items) console.log(`${b.id}  ${b.name}  (${b.privacy})`);
  return items;
}

async function makeBoard(name) {
  if (!name) fail('Give a board name: npm run pin -- make-board "Tech News"');
  const b = await api('POST', '/boards', { name, privacy: 'PUBLIC' });
  console.log(`✓ Board created: ${b.name} (${b.id})`);
}

function imagePayload(file) {
  let path = file;
  const ext = extname(file).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
    path = join(mkdtempSync(join(tmpdir(), 'pin-')), 'pin.jpg');
    execFileSync('sips', ['-s', 'format', 'jpeg', file, '--out', path], { stdio: 'ignore' });
  }
  return {
    source_type: 'image_base64',
    content_type: extname(path).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg',
    data: readFileSync(path).toString('base64'),
  };
}

async function createPin(slug) {
  if (!slug) fail('Give a post slug: npm run pin -- create <slug>');
  const file = `src/content/posts/${slug}.md`;
  if (!existsSync(file)) fail(`No post found: ${file}`);
  const { data: post } = matter(readFileSync(file, 'utf8'));

  const boardName = opts.board ?? BOARD_FOR_CATEGORY[post.category];
  if (!boardName) fail(`No board for category "${post.category}". Pass --board "Name".`);
  const imageFile = opts.image ?? join('public', post.image);
  if (!existsSync(imageFile)) fail(`Image not found: ${imageFile}`);

  const pin = {
    title: (opts.title ?? post.title).slice(0, 100),
    description: (opts.description ?? post.description).slice(0, 500),
    link: `${SITE_URL}/${slug}`,
    alt_text: (opts.alt ?? post.imageAlt ?? '').slice(0, 500),
  };

  console.log(`Board:       ${boardName}${opts.sandbox ? ' (sandbox)' : ''}`);
  console.log(`Title:       ${pin.title}`);
  console.log(`Description: ${pin.description}`);
  console.log(`Link:        ${pin.link}`);
  console.log(`Image:       ${imageFile}`);
  if (opts['dry-run']) return console.log('\n(dry run, nothing posted)');

  let board = opts['board-id'] && { id: opts['board-id'] };
  if (!board) {
    const { items } = await api('GET', '/boards?page_size=100');
    board = items.find((b) => b.name.toLowerCase() === boardName.toLowerCase());
  }
  if (!board) fail(`Board "${boardName}" not found. Create it: npm run pin -- make-board "${boardName}"${opts.sandbox ? ' --sandbox' : ''}`);

  const created = await api('POST', '/pins', { ...pin, board_id: board.id, media_source: imagePayload(imageFile) });
  console.log(`\n✓ Pin created: https://www.pinterest.com/pin/${created.id}/`);
}

// ── Scheduled pins ─────────────────────────────────────────────────────────────

// Each item: { id, at, slug, title, description, alt, board?, and either
//   image: "path/to/ready.png"   or   style, headline?, label?, facts: [["Label", "Value"], …], photo? }
function readQueue() {
  if (!existsSync(QUEUE_FILE)) return [];
  const items = JSON.parse(readFileSync(QUEUE_FILE, 'utf8'));
  const seen = new Set();
  for (const it of items) {
    const where = `${QUEUE_FILE}: "${it.id ?? '(no id)'}"`;
    if (!it.id || seen.has(it.id)) fail(`${where} needs a unique id.`);
    seen.add(it.id);
    if (Number.isNaN(Date.parse(it.at))) fail(`${where} needs a time, e.g. "at": "2026-10-10T18:00:00+05:30".`);
    const postFile = `src/content/posts/${it.slug}.md`;
    if (!existsSync(postFile)) fail(`${where}: no post found at ${postFile}`);
    it.post = matter(readFileSync(postFile, 'utf8')).data;
    it.board ??= BOARD_FOR_CATEGORY[it.post.category];
    if (!it.board) fail(`${where}: no board for category "${it.post.category}".`);
    if (!it.title || it.title.length > 100) fail(`${where} needs a title of up to 100 characters.`);
    if (!it.description || it.description.length > 500) fail(`${where} needs a description of up to 500 characters.`);
    if (!it.alt) fail(`${where} needs alt text.`);
    if (it.image ? !existsSync(it.image) : !Array.isArray(it.facts)) fail(`${where} needs "facts" or an existing "image" file.`);
  }
  return items;
}

const readLog = () => (existsSync(LOG_FILE) ? JSON.parse(readFileSync(LOG_FILE, 'utf8')) : {});

// What GitHub has published so far, read from the pin-log branch.
function remoteLog() {
  try {
    execFileSync('git', ['fetch', '--quiet', 'origin', LOG_BRANCH], { stdio: 'ignore' });
    return JSON.parse(execFileSync('git', ['show', `origin/${LOG_BRANCH}:published.json`], { stdio: ['ignore', 'pipe', 'ignore'] }).toString());
  } catch {
    return {};
  }
}

const istTime = (at) =>
  new Date(at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

async function pinImage(item, dir) {
  if (item.image) return item.image;
  return makePin({
    slug: item.slug,
    style: item.style,
    headline: item.headline,
    label: item.label,
    facts: item.facts.map(([k, v]) => ({ k, v })),
    photo: item.photo,
    out: join(dir, `${item.id}.png`),
  });
}

function showQueue() {
  const log = remoteLog();
  const items = readQueue();
  if (!items.length) return console.log(`No pins in ${QUEUE_FILE}.`);
  for (const it of items.sort((a, b) => Date.parse(a.at) - Date.parse(b.at))) {
    const done = log[it.id];
    const late = !done && Date.now() - Date.parse(it.at) > STALE_HOURS * 3600e3;
    const status = done ? `published  https://www.pinterest.com/pin/${done.pin_id}/` : late ? 'missed (too late, will be skipped)' : 'waiting';
    console.log(`${istTime(it.at).padEnd(18)} ${it.id.padEnd(28)} ${it.board.padEnd(13)} ${status}`);
  }
}

async function preview() {
  const log = remoteLog();
  const waiting = readQueue().filter((it) => !log[it.id]);
  if (!waiting.length) return console.log('No pins waiting.');
  for (const it of waiting) {
    const file = await pinImage(it, 'design/pins');
    console.log(`\n${istTime(it.at)}  →  ${it.board}\n  Image:       ${file}\n  Title:       ${it.title}\n  Description: ${it.description}\n  Link:        ${SITE_URL}/${it.slug}`);
  }
}

async function publishDue() {
  const log = readLog();
  const now = Date.now();
  const due = readQueue()
    .filter((it) => !log[it.id] && Date.parse(it.at) <= now)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  if (!due.length) return console.log('Nothing due.');

  const { items: boards } = await api('GET', '/boards?page_size=100');
  const tmp = mkdtempSync(join(tmpdir(), 'pins-'));
  for (const it of due) {
    if (now - Date.parse(it.at) > STALE_HOURS * 3600e3) {
      console.log(`– Skipped ${it.id}: it was due ${istTime(it.at)}, more than ${STALE_HOURS} hours ago.`);
      continue;
    }
    const board = boards.find((b) => b.name.toLowerCase() === it.board.toLowerCase());
    if (!board) fail(`Board "${it.board}" not found for ${it.id}.`);
    const pin = { title: it.title, description: it.description, link: `${SITE_URL}/${it.slug}`, alt_text: it.alt.slice(0, 500) };
    const file = await pinImage(it, tmp);
    if (opts['dry-run']) {
      console.log(`Would publish ${it.id} to ${it.board}: ${pin.title} (${file})`);
      continue;
    }
    // Safety net against a double post if a previous run published the pin but could not save the log.
    const { items: recent } = await api('GET', `/boards/${board.id}/pins?page_size=100`);
    let id = recent.find((p) => p.title === pin.title && (p.link ?? '').includes(it.slug))?.id;
    if (id) console.log(`• ${it.id} is already on the board, not posting again.`);
    else {
      id = (await api('POST', '/pins', { ...pin, board_id: board.id, media_source: imagePayload(file) })).id;
      console.log(`✓ Published ${it.id}: https://www.pinterest.com/pin/${id}/`);
    }
    log[it.id] = { pin_id: id, title: pin.title, published_at: new Date().toISOString() };
    mkdirSync(dirname(LOG_FILE), { recursive: true });
    writeFileSync(LOG_FILE, JSON.stringify(log, null, 2) + '\n');
  }
}

// Copies the app keys and the current token to the GitHub repository's encrypted secrets.
// Values are piped straight to `gh`, never printed. Run again after `login`.
async function pushSecrets() {
  const { id, secret } = appCredentials();
  await accessToken(); // refreshes the saved token first if it is about to expire
  const saved = JSON.parse(readFileSync(TOKEN_FILE, 'utf8'));
  const secrets = {
    PINTEREST_APP_ID: id,
    PINTEREST_APP_SECRET: secret,
    PINTEREST_ACCESS_TOKEN: saved.access_token,
    PINTEREST_REFRESH_TOKEN: saved.refresh_token,
  };
  for (const [name, value] of Object.entries(secrets)) {
    if (!value) fail(`${name} is empty. Run: npm run pin -- login`);
    execFileSync('gh', ['secret', 'set', name], { input: value, stdio: ['pipe', 'ignore', 'inherit'] });
    console.log(`✓ ${name}`);
  }
  console.log('GitHub can now publish scheduled pins.');
}

const commands = {
  login,
  me,
  boards: listBoards,
  'make-board': () => makeBoard(arg),
  create: () => createPin(arg),
  queue: showQueue,
  preview,
  'publish-due': publishDue,
  secrets: pushSecrets,
};
if (!commands[command]) {
  console.log('Commands: login, me, boards, make-board "<name>", create <slug> [--image file] [--sandbox] [--dry-run], queue, preview, publish-due [--dry-run], secrets');
  process.exit(command ? 1 : 0);
}
try {
  await commands[command]();
} catch (e) {
  fail(e.message);
}
process.exit(0);
