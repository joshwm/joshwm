import { fetchLiveStats } from "./client";
import { readCache, writeCache } from "./cache";
import { spendBudget, BudgetExceededError } from "./budget";
import { generateMockStats } from "./mock";
import type { StatsQuery, StatsResult } from "./types";

export type DataSourcePreference = "auto" | "mock";

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

  const cached = await readCache(query);
  if (cached) return cached;

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
    await writeCache(query, result);
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
