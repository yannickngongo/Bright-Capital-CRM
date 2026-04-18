import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// On Vercel the deployment filesystem is read-only; /tmp is writable but not persistent.
// In production always use Upstash Redis. /tmp is a safe fallback so the function never crashes.
const LOCAL_FILE = process.env.VERCEL
  ? '/tmp/bright-capital-leads.json'
  : path.join(__dirname, '../data/leads.json');

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

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
    console.error('[storage] Failed to init Redis:', err.message);
    return null;
  }
}

export async function readLeads() {
  try {
    const redis = await getRedis();
    if (redis) {
      const raw = await redis.get('leads');
      if (!raw) return [];
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    }
    return JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'));
  } catch {
    return [];
  }
}

export async function writeLeads(leads) {
  try {
    const redis = await getRedis();
    if (redis) {
      await redis.set('leads', JSON.stringify(leads));
      return;
    }
    const dir = path.dirname(LOCAL_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(leads, null, 2));
  } catch (err) {
    console.error('[storage] writeLeads failed:', err.message);
    // Don't rethrow — email still goes out even if storage fails
  }
}
