import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_FILE = path.join(__dirname, '../data/leads.json');

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

let _redis = null;
async function getRedis() {
  if (!hasRedis) return null;
  if (_redis) return _redis;
  const { Redis } = await import('@upstash/redis');
  _redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return _redis;
}

export async function readLeads() {
  const redis = await getRedis();
  if (redis) {
    const raw = await redis.get('leads');
    if (!raw) return [];
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }
  try {
    return JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'));
  } catch { return []; }
}

export async function writeLeads(leads) {
  const redis = await getRedis();
  if (redis) {
    await redis.set('leads', JSON.stringify(leads));
    return;
  }
  const dir = path.dirname(LOCAL_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(leads, null, 2));
}
