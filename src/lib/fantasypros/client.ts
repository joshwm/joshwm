import type { PlayerRow, Position, StatsQuery } from "./types";

const BASE_URL = "https://api.fantasypros.com/v2/json/nfl";

/**
 * Raw shape of a player entry returned by FantasyPros' `/projections`
 * endpoint. Field names are best-effort from FantasyPros' public API docs;
 * this app hasn't burned a live request to confirm them against the real
 * response, since every call counts against the account's 50/day cap. If
 * fields come back named differently, adjust the mapping in
 * `normalizePlayer` below - this file is the only place that needs to
 * change.
 */
interface RawFantasyProsPlayer {
  player_id: number | string;
  player_name: string;
  player_team_id?: string;
  player_position_id?: string;
  stats?: Record<string, number | string | undefined>;
  points?: number | string;
  rank_ecr?: number | string;
}

interface RawFantasyProsResponse {
  players?: RawFantasyProsPlayer[];
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function normalizePlayer(raw: RawFantasyProsPlayer, position: Position): PlayerRow {
  const stats = raw.stats ?? {};
  return {
    id: String(raw.player_id),
    name: raw.player_name,
    team: raw.player_team_id ?? "FA",
    position,
    rank: raw.rank_ecr != null ? toNumber(raw.rank_ecr) : null,
    points: toNumber(raw.points ?? stats.points),
    stats: Object.fromEntries(
      Object.entries(stats).map(([key, value]) => [key, toNumber(value)])
    ),
  };
}

function apiKey(): string {
  const key = process.env.FANTASYPROS_API_KEY;
  if (!key) {
    throw new Error(
      "FANTASYPROS_API_KEY is not set. Add it to .env.local to enable live data."
    );
  }
  return key;
}

/**
 * Fetches one page of player stats/projections from the real FantasyPros
 * API. Callers MUST check the cache and reserve budget (see
 * `lib/fantasypros/cache.ts` and `budget.ts`) before invoking this - it
 * always spends one real request.
 */
export async function fetchLiveStats(query: StatsQuery): Promise<PlayerRow[]> {
  const url = new URL(`${BASE_URL}/${query.season}/projections`);
  url.searchParams.set("position", query.position);
  url.searchParams.set("scoring", query.scoring);
  if (query.week !== "draft") {
    url.searchParams.set("week", String(query.week));
  }

  const res = await fetch(url, {
    headers: { "x-api-key": apiKey() },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `FantasyPros API request failed (${res.status} ${res.statusText}): ${body.slice(0, 300)}`
    );
  }

  const data = (await res.json()) as RawFantasyProsResponse;
  return (data.players ?? []).map((p) => normalizePlayer(p, query.position));
}
