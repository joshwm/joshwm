import { readCache, writeCache } from "@/lib/cache";
import { fetchLiveWeekSchedule } from "./client";
import { generateMockWeekSchedule } from "./mock";
import type { ScheduleQuery, ScheduleResult } from "./types";

export type ScheduleSourcePreference = "auto" | "mock";

function cacheKey(query: ScheduleQuery): string {
  return `schedule-${query.season}-${query.week}`;
}

/**
 * No FantasyPros budget involved here (schedules aren't their data), so
 * this always tries live unless explicitly forced to mock. Still cached to
 * be a polite, low-volume consumer of ESPN's public endpoint.
 */
export async function getWeekSchedule(
  query: ScheduleQuery,
  preference: ScheduleSourcePreference = "auto"
): Promise<ScheduleResult & { warning?: string }> {
  if (preference === "mock") {
    return { query, teams: generateMockWeekSchedule(query), source: "mock", fetchedAt: new Date().toISOString() };
  }

  const key = cacheKey(query);
  const cached = await readCache<ScheduleResult>(key);
  if (cached) return { ...cached, source: "cache" };

  try {
    const teams = await fetchLiveWeekSchedule(query);
    const result: ScheduleResult = { query, teams, source: "live", fetchedAt: new Date().toISOString() };
    await writeCache(key, result);
    return result;
  } catch (err) {
    return {
      query,
      teams: generateMockWeekSchedule(query),
      source: "mock",
      fetchedAt: new Date().toISOString(),
      warning: `Live NFL schedule lookup failed (${(err as Error).message}); showing a placeholder schedule instead - see client.ts.`,
    };
  }
}
