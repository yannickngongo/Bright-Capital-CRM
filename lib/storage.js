import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_FILE = process.env.VERCEL
  ? '/tmp/bright-capital-leads.json'
  : path.join(__dirname, '../data/leads.json');

// ─── Priority: Upstash Redis → GitHub Gist → local file ──────────────────────
const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const hasGist  = !!(process.env.GH_TOKEN) && !hasRedis;

// ─── Upstash Redis ────────────────────────────────────────────────────────────
let _redis = null;
async function getRedis() {
  if (!hasRedis) return null;
  if (_redis) return _redis;
  try {
    const { Redis } = await import('@upstash/redis');
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return _redis;
  } catch (err) {
    console.error('[storage] Redis init failed:', err.message);
    return null;
  }
}

// ─── GitHub Gist ──────────────────────────────────────────────────────────────
const GIST_DESCRIPTION = 'Bright Capital CRM — Lead Database';
const GIST_FILENAME    = 'leads.json';
let _gistId = process.env.GITHUB_GIST_ID || null;

function ghHeaders() {
  return {
    'Authorization': `token ${process.env.GH_TOKEN}`,
    'Accept':        'application/vnd.github.v3+json',
    'Content-Type':  'application/json',
    'User-Agent':    'BrightCapitalCRM/1.0',
  };
}

async function getGistId() {
  if (_gistId) return _gistId;

  // Look for an existing gist with our description
  const listRes = await fetch('https://api.github.com/gists?per_page=100', { headers: ghHeaders() });
  const gists = await listRes.json();
  const found = Array.isArray(gists) && gists.find(g => g.description === GIST_DESCRIPTION);

  if (found) {
    _gistId = found.id;
    console.log('[storage] Found existing Gist:', _gistId);
    return _gistId;
  }

  // First run — create the gist automatically
  const createRes = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: ghHeaders(),
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: { [GIST_FILENAME]: { content: '[]' } },
    }),
  });
  const created = await createRes.json();
  _gistId = created.id;
  console.log('[storage] Created new Gist:', _gistId);
  return _gistId;
}

async function readFromGist() {
  const id = await getGistId();
  const res  = await fetch(`https://api.github.com/gists/${id}`, { headers: ghHeaders() });
  const gist = await res.json();
  const content = gist.files?.[GIST_FILENAME]?.content;
  return content ? JSON.parse(content) : [];
}

async function writeToGist(leads) {
  const id = await getGistId();
  await fetch(`https://api.github.com/gists/${id}`, {
    method: 'PATCH',
    headers: ghHeaders(),
    body: JSON.stringify({
      files: { [GIST_FILENAME]: { content: JSON.stringify(leads, null, 2) } },
    }),
  });
}

// ─── Local file ───────────────────────────────────────────────────────────────
function readFromFile() {
  try { return JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8')); }
  catch { return []; }
}

function writeToFile(leads) {
  const dir = path.dirname(LOCAL_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(leads, null, 2));
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function readLeads() {
  try {
    const redis = await getRedis();
    if (redis) {
      const raw = await redis.get('leads');
      if (!raw) return [];
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    }
    if (hasGist) return await readFromGist();
    return readFromFile();
  } catch (err) {
    console.error('[storage] readLeads failed:', err.message);
    return [];
  }
}

export async function writeLeads(leads) {
  try {
    const redis = await getRedis();
    if (redis) { await redis.set('leads', JSON.stringify(leads)); return; }
    if (hasGist) { await writeToGist(leads); return; }
    writeToFile(leads);
  } catch (err) {
    console.error('[storage] writeLeads failed:', err.message);
  }
}
