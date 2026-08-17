export interface ScheduleQuery {
  season: number;
  week: number;
}

export interface TeamOpponent {
  team: string;
  /** null = team is on a bye that week. */
  opponent: string | null;
  homeAway: "home" | "away" | null;
}

export interface ScheduleResult {
  query: ScheduleQuery;
  /** Keyed by team abbreviation. */
  teams: Record<string, TeamOpponent>;
  source: "live" | "mock" | "cache";
  fetchedAt: string;
}
