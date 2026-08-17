export type Position = "QB" | "RB" | "WR" | "TE" | "K" | "DST";

export type ScoringFormat = "STD" | "HALF" | "PPR";

/** "draft" = full-season projections/totals, otherwise a specific week 1-18. */
export type WeekSelector = "draft" | number;

export interface StatLine {
  [statKey: string]: number | undefined;
}

export interface PlayerRow {
  id: string;
  name: string;
  team: string;
  position: Position;
  rank: number | null;
  points: number;
  stats: StatLine;
}

export interface StatsQuery {
  season: number;
  week: WeekSelector;
  position: Position;
  scoring: ScoringFormat;
}

export interface StatsResult {
  query: StatsQuery;
  players: PlayerRow[];
  source: "live" | "mock" | "cache";
  fetchedAt: string;
}

/** The four offense positions FantasyPros tracks in its points-allowed report. */
export type MatchupPosition = "QB" | "RB" | "WR" | "TE";
export const MATCHUP_POSITIONS: MatchupPosition[] = ["QB", "RB", "WR", "TE"];

export interface PositionMatchupStat {
  /** Average fantasy points allowed per game to this offensive position. */
  pointsAllowed: number;
  /** 1 = toughest matchup (fewest points allowed) for that position. */
  rank: number;
}

export interface DefenseMatchupRow {
  team: string;
  teamName: string;
  vs: Record<MatchupPosition, PositionMatchupStat>;
}

export interface PointsAllowedQuery {
  season: number;
  scoring: ScoringFormat;
}

export interface PointsAllowedResult {
  query: PointsAllowedQuery;
  teams: DefenseMatchupRow[];
  source: "live" | "mock" | "cache";
  fetchedAt: string;
}

export interface StatCategoryDef {
  key: string;
  label: string;
  /** Higher numbers are better (used for sort default direction). */
  higherIsBetter: boolean;
}

export const STAT_CATEGORIES: Record<Position, StatCategoryDef[]> = {
  QB: [
    { key: "points", label: "Fantasy Pts", higherIsBetter: true },
    { key: "pass_att", label: "Pass Att", higherIsBetter: true },
    { key: "pass_cmp", label: "Pass Cmp", higherIsBetter: true },
    { key: "pass_yds", label: "Pass Yds", higherIsBetter: true },
    { key: "pass_tds", label: "Pass TD", higherIsBetter: true },
    { key: "pass_int", label: "INT", higherIsBetter: false },
    { key: "rush_att", label: "Rush Att", higherIsBetter: true },
    { key: "rush_yds", label: "Rush Yds", higherIsBetter: true },
    { key: "rush_tds", label: "Rush TD", higherIsBetter: true },
    { key: "fumbles", label: "Fumbles", higherIsBetter: false },
  ],
  RB: [
    { key: "points", label: "Fantasy Pts", higherIsBetter: true },
    { key: "rush_att", label: "Rush Att", higherIsBetter: true },
    { key: "rush_yds", label: "Rush Yds", higherIsBetter: true },
    { key: "rush_tds", label: "Rush TD", higherIsBetter: true },
    { key: "rec", label: "Rec", higherIsBetter: true },
    { key: "rec_tgts", label: "Targets", higherIsBetter: true },
    { key: "rec_yds", label: "Rec Yds", higherIsBetter: true },
    { key: "rec_tds", label: "Rec TD", higherIsBetter: true },
    { key: "fumbles", label: "Fumbles", higherIsBetter: false },
  ],
  WR: [
    { key: "points", label: "Fantasy Pts", higherIsBetter: true },
    { key: "rec", label: "Rec", higherIsBetter: true },
    { key: "rec_tgts", label: "Targets", higherIsBetter: true },
    { key: "rec_yds", label: "Rec Yds", higherIsBetter: true },
    { key: "rec_tds", label: "Rec TD", higherIsBetter: true },
    { key: "rush_att", label: "Rush Att", higherIsBetter: true },
    { key: "rush_yds", label: "Rush Yds", higherIsBetter: true },
    { key: "rush_tds", label: "Rush TD", higherIsBetter: true },
    { key: "fumbles", label: "Fumbles", higherIsBetter: false },
  ],
  TE: [
    { key: "points", label: "Fantasy Pts", higherIsBetter: true },
    { key: "rec", label: "Rec", higherIsBetter: true },
    { key: "rec_tgts", label: "Targets", higherIsBetter: true },
    { key: "rec_yds", label: "Rec Yds", higherIsBetter: true },
    { key: "rec_tds", label: "Rec TD", higherIsBetter: true },
    { key: "fumbles", label: "Fumbles", higherIsBetter: false },
  ],
  K: [
    { key: "points", label: "Fantasy Pts", higherIsBetter: true },
    { key: "fg", label: "FG Made", higherIsBetter: true },
    { key: "fga", label: "FG Att", higherIsBetter: true },
    { key: "fg_pct", label: "FG %", higherIsBetter: true },
    { key: "xpt", label: "XP Made", higherIsBetter: true },
  ],
  DST: [
    { key: "points", label: "Fantasy Pts", higherIsBetter: true },
    { key: "sacks", label: "Sacks", higherIsBetter: true },
    { key: "def_int", label: "INT", higherIsBetter: true },
    { key: "fumble_recovery", label: "Fum Rec", higherIsBetter: true },
    { key: "def_td", label: "Def TD", higherIsBetter: true },
    { key: "safety", label: "Safeties", higherIsBetter: true },
    { key: "points_allowed", label: "Pts Allowed", higherIsBetter: false },
  ],
};
