import { fetchLiveStats, fetchLivePointsAllowed } from "./client";
import { readCache, writeCache } from "./cache";
import { spendBudget, BudgetExceededError } from "./budget";
import { generateMockStats, generateMockPointsAllowed } from "./mock";
import type { PointsAllowedQuery, PointsAllowedResult, StatsQuery, StatsResult } from "./types";

export type DataSourcePreference = "auto" | "mock";

function statsCacheKey(query: StatsQuery): string {
  return `stats-${query.season}-${query.week}-${query.position}-${query.scoring}`;
}

function pointsAllowedCacheKey(query: PointsAllowedQuery): string {
  return `points-allowed-${query.season}-${query.scoring}`;
}

/**
 * Resolves a stats query using, in order: fresh cache, then (if allowed and
 * budget remains) a live FantasyPros call, then mock data as a last resort
 * so the dashboard never hard-fails. This is the only entry point the API
 * routes should use - it's what keeps live calls within the daily budget.
 */
export async function getStats(
  query: StatsQuery,
  preference: DataSourcePreference = "auto"
): Promise<StatsResult & { warning?: string }> {
  if (preference === "mock") {
    return {
      query,
      players: generateMockStats(query),
      source: "mock",
      fetchedAt: new Date().toISOString(),
    };
  }

  const key = statsCacheKey(query);
  const cached = await readCache<StatsResult>(key);
  if (cached) return { ...cached, source: "cache" };

  const hasKey = Boolean(process.env.FANTASYPROS_API_KEY);
  if (!hasKey) {
    return {
      query,
      players: generateMockStats(query),
      source: "mock",
      fetchedAt: new Date().toISOString(),
      warning: "FANTASYPROS_API_KEY is not configured; showing mock data.",
    };
  }

  try {
    const endpoint = `${query.season}/projections?position=${query.position}&scoring=${query.scoring}&week=${query.week}`;
    await spendBudget(endpoint);
    const players = await fetchLiveStats(query);
    const result: StatsResult = {
      query,
      players,
      source: "live",
      fetchedAt: new Date().toISOString(),
    };
    await writeCache(key, result);
    return result;
  } catch (err) {
    const warning =
      err instanceof BudgetExceededError
        ? err.message
        : `Live FantasyPros request failed (${(err as Error).message}); showing mock data instead.`;
    return {
      query,
      players: generateMockStats(query),
      source: "mock",
      fetchedAt: new Date().toISOString(),
      warning,
    };
  }
}

/**
 * Same cache -> budget -> live -> mock fallback pattern as getStats, for
 * the "points allowed by position" defensive matchup report. See the
 * warning in client.ts's fetchLivePointsAllowed - the live endpoint here is
 * an unverified guess, so this is more likely to fall back to mock data
 * than getStats is, until the real endpoint/shape is confirmed.
 */
export async function getPointsAllowed(
  query: PointsAllowedQuery,
  preference: DataSourcePreference = "auto"
): Promise<PointsAllowedResult & { warning?: string }> {
  if (preference === "mock") {
    return {
      query,
      teams: generateMockPointsAllowed(query),
      source: "mock",
      fetchedAt: new Date().toISOString(),
    };
  }

  const key = pointsAllowedCacheKey(query);
  const cached = await readCache<PointsAllowedResult>(key);
  if (cached) return { ...cached, source: "cache" };

  const hasKey = Boolean(process.env.FANTASYPROS_API_KEY);
  if (!hasKey) {
    return {
      query,
      teams: generateMockPointsAllowed(query),
      source: "mock",
      fetchedAt: new Date().toISOString(),
      warning: "FANTASYPROS_API_KEY is not configured; showing mock data.",
    };
  }

  try {
    const endpoint = `${query.season}/points-allowed?scoring=${query.scoring}`;
    await spendBudget(endpoint);
    const teams = await fetchLivePointsAllowed(query);
    const result: PointsAllowedResult = {
      query,
      teams,
      source: "live",
      fetchedAt: new Date().toISOString(),
    };
    await writeCache(key, result);
    return result;
  } catch (err) {
    const warning =
      err instanceof BudgetExceededError
        ? err.message
        : `Live FantasyPros points-allowed request failed (${(err as Error).message}); showing mock data instead. This endpoint's URL/shape is unverified - see client.ts.`;
    return {
      query,
      teams: generateMockPointsAllowed(query),
      source: "mock",
      fetchedAt: new Date().toISOString(),
      warning,
    };
  }
}
