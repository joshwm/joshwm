import type {
  DefenseMatchupRow,
  MatchupPosition,
  PlayerRow,
  PointsAllowedQuery,
  Position,
  StatsQuery,
} from "./types";
import { MATCHUP_POSITIONS } from "./types";

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

/**
 * Raw shape guess for FantasyPros' "points allowed by position" report
 * (fantasy points a defense allows to opposing QB/RB/WR/TE). Unlike
 * `/projections`, this report isn't documented in FantasyPros' public v2
 * JSON API reference at all - it may only exist as the HTML page at
 * fantasypros.com/nfl/points-allowed.php, with no JSON endpoint. This
 * function's URL and shape are a best guess and have not been confirmed
 * against a real response (that would cost part of the daily budget just
 * to find out). If it 404s or the shape doesn't match, `getPointsAllowed`
 * in `service.ts` catches the failure and falls back to mock data - so a
 * wrong guess here degrades gracefully instead of breaking the page. Fix
 * the URL/mapping here once you've confirmed the real endpoint (check your
 * FantasyPros API dashboard/docs, or contact their partner support).
 */
interface RawPointsAllowedTeam {
  team_id?: string;
  team_name?: string;
  vs_qb?: { pts?: number | string; rank?: number | string };
  vs_rb?: { pts?: number | string; rank?: number | string };
  vs_wr?: { pts?: number | string; rank?: number | string };
  vs_te?: { pts?: number | string; rank?: number | string };
}

interface RawPointsAllowedResponse {
  teams?: RawPointsAllowedTeam[];
}

const MATCHUP_FIELD: Record<MatchupPosition, keyof RawPointsAllowedTeam> = {
  QB: "vs_qb",
  RB: "vs_rb",
  WR: "vs_wr",
  TE: "vs_te",
};

export async function fetchLivePointsAllowed(query: PointsAllowedQuery): Promise<DefenseMatchupRow[]> {
  const url = new URL(`${BASE_URL}/${query.season}/points-allowed`);
  url.searchParams.set("scoring", query.scoring);

  const res = await fetch(url, {
    headers: { "x-api-key": apiKey() },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `FantasyPros points-allowed request failed (${res.status} ${res.statusText}): ${body.slice(0, 300)}`
    );
  }

  const data = (await res.json()) as RawPointsAllowedResponse;
  return (data.teams ?? []).map((t) => {
    const vs = {} as DefenseMatchupRow["vs"];
    for (const pos of MATCHUP_POSITIONS) {
      const field = t[MATCHUP_FIELD[pos]] as { pts?: number | string; rank?: number | string } | undefined;
      vs[pos] = { pointsAllowed: toNumber(field?.pts), rank: toNumber(field?.rank) };
    }
    return { team: t.team_id ?? "??", teamName: t.team_name ?? "Unknown", vs };
  });
}
