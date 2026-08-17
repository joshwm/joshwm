import { promises as fs } from "fs";
import path from "path";
import type { StatsResult, StatsQuery } from "./types";

const CACHE_DIR = path.join(process.cwd(), ".data", "cache");

/**
 * How long a cached response is served before it's considered stale enough
 * to justify spending another request out of the daily budget.
 */
const CACHE_TTL_MS = Number(process.env.FANTASYPROS_CACHE_TTL_HOURS ?? 12) * 60 * 60 * 1000;

function cacheKey(query: StatsQuery): string {
  return `${query.season}-${query.week}-${query.position}-${query.scoring}.json`;
}

interface CacheEnvelope {
  cachedAt: string;
  result: StatsResult;
}

export async function readCache(query: StatsQuery): Promise<StatsResult | null> {
  const file = path.join(CACHE_DIR, cacheKey(query));
  try {
    const raw = await fs.readFile(file, "utf-8");
    const envelope = JSON.parse(raw) as CacheEnvelope;
    const age = Date.now() - new Date(envelope.cachedAt).getTime();
    if (age > CACHE_TTL_MS) return null;
    return { ...envelope.result, source: "cache" };
  } catch {
    return null;
  }
}

export async function writeCache(query: StatsQuery, result: StatsResult): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, cacheKey(query));
  const envelope: CacheEnvelope = { cachedAt: new Date().toISOString(), result };
  await fs.writeFile(file, JSON.stringify(envelope, null, 2), "utf-8");
}
