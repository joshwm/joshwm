import { promises as fs } from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), ".data", "cache");

/**
 * How long a cached response is served before it's considered stale enough
 * to justify spending another request out of the daily budget.
 */
const CACHE_TTL_MS = Number(process.env.FANTASYPROS_CACHE_TTL_HOURS ?? 12) * 60 * 60 * 1000;

interface CacheEnvelope<T> {
  cachedAt: string;
  result: T;
}

function safeFileName(key: string): string {
  return `${key.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`;
}

export async function readCache<T>(key: string): Promise<T | null> {
  const file = path.join(CACHE_DIR, safeFileName(key));
  try {
    const raw = await fs.readFile(file, "utf-8");
    const envelope = JSON.parse(raw) as CacheEnvelope<T>;
    const age = Date.now() - new Date(envelope.cachedAt).getTime();
    if (age > CACHE_TTL_MS) return null;
    return envelope.result;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, result: T): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, safeFileName(key));
  const envelope: CacheEnvelope<T> = { cachedAt: new Date().toISOString(), result };
  await fs.writeFile(file, JSON.stringify(envelope, null, 2), "utf-8");
}
