import {
  DefenseMatchupRow,
  MATCHUP_POSITIONS,
  MatchupPosition,
  PlayerRow,
  PointsAllowedQuery,
  Position,
  StatsQuery,
} from "./types";
import { seededRandom } from "@/lib/random";
import { NFL_TEAMS, TEAM_ABBRS } from "@/lib/teams";

const NAMES_BY_POSITION: Record<Position, [string, string][]> = {
  QB: [
    ["Josh", "Allen"], ["Patrick", "Mahomes"], ["Jalen", "Hurts"], ["Lamar", "Jackson"],
    ["Joe", "Burrow"], ["C.J.", "Stroud"], ["Dak", "Prescott"], ["Justin", "Herbert"],
    ["Brock", "Purdy"], ["Kyler", "Murray"], ["Trevor", "Lawrence"], ["Jordan", "Love"],
  ],
  RB: [
    ["Christian", "McCaffrey"], ["Breece", "Hall"], ["Bijan", "Robinson"], ["Jahmyr", "Gibbs"],
    ["Saquon", "Barkley"], ["Jonathan", "Taylor"], ["De'Von", "Achane"], ["Derrick", "Henry"],
    ["Kenneth", "Walker"], ["Josh", "Jacobs"], ["Isiah", "Pacheco"], ["Rachaad", "White"],
  ],
  WR: [
    ["Justin", "Jefferson"], ["Ja'Marr", "Chase"], ["Tyreek", "Hill"], ["CeeDee", "Lamb"],
    ["Amon-Ra", "St. Brown"], ["A.J.", "Brown"], ["Puka", "Nacua"], ["Garrett", "Wilson"],
    ["Chris", "Olave"], ["DK", "Metcalf"], ["Davante", "Adams"], ["Stefon", "Diggs"],
  ],
  TE: [
    ["Travis", "Kelce"], ["Sam", "LaPorta"], ["Mark", "Andrews"], ["T.J.", "Hockenson"],
    ["Trey", "McBride"], ["George", "Kittle"], ["Dalton", "Kincaid"], ["Evan", "Engram"],
    ["Kyle", "Pitts"], ["David", "Njoku"], ["Jake", "Ferguson"], ["Cole", "Kmet"],
  ],
  K: [
    ["Justin", "Tucker"], ["Harrison", "Butker"], ["Brandon", "Aubrey"], ["Tyler", "Bass"],
    ["Jake", "Moody"], ["Evan", "McPherson"], ["Jason", "Sanders"], ["Younghoe", "Koo"],
  ],
  DST: [],
};

const TEAMS = TEAM_ABBRS;

function statsForPosition(position: Position, rand: () => number, rankFactor: number): Record<string, number> {
  const scale = (base: number, spread: number) =>
    Math.max(0, Math.round(base * rankFactor + (rand() - 0.5) * spread));

  switch (position) {
    case "QB":
      return {
        pass_att: scale(34, 6),
        pass_cmp: scale(22, 5),
        pass_yds: scale(255, 60),
        pass_tds: scale(1.8, 1.2),
        pass_int: scale(0.6, 0.8),
        rush_att: scale(4, 3),
        rush_yds: scale(18, 15),
        rush_tds: scale(0.2, 0.4),
        fumbles: scale(0.2, 0.4),
      };
    case "RB":
      return {
        rush_att: scale(16, 5),
        rush_yds: scale(72, 30),
        rush_tds: scale(0.6, 0.6),
        rec: scale(3, 2),
        rec_tgts: scale(4, 2),
        rec_yds: scale(24, 15),
        rec_tds: scale(0.15, 0.3),
        fumbles: scale(0.15, 0.3),
      };
    case "WR":
      return {
        rec: scale(5, 2),
        rec_tgts: scale(7.5, 3),
        rec_yds: scale(68, 30),
        rec_tds: scale(0.45, 0.5),
        rush_att: scale(0.3, 0.6),
        rush_yds: scale(2, 5),
        rush_tds: scale(0.02, 0.1),
        fumbles: scale(0.05, 0.2),
      };
    case "TE":
      return {
        rec: scale(4, 2),
        rec_tgts: scale(5.5, 2.5),
        rec_yds: scale(46, 22),
        rec_tds: scale(0.35, 0.4),
        fumbles: scale(0.05, 0.2),
      };
    case "K": {
      const fga = scale(2, 1.5);
      const fg = Math.min(fga, scale(1.7, 1.3));
      return {
        fg,
        fga,
        fg_pct: fga > 0 ? Math.round((fg / fga) * 1000) / 10 : 0,
        xpt: scale(2.5, 1.5),
      };
    }
    case "DST":
      return {
        sacks: scale(2.4, 1.5),
        def_int: scale(0.7, 0.8),
        fumble_recovery: scale(0.5, 0.7),
        def_td: scale(0.15, 0.4),
        safety: scale(0.03, 0.15),
        points_allowed: scale(20, 8),
      };
  }
}

function computePoints(position: Position, stats: Record<string, number>, scoring: string): number {
  const recBonus = scoring === "PPR" ? 1 : scoring === "HALF" ? 0.5 : 0;
  switch (position) {
    case "QB":
      return (
        (stats.pass_yds ?? 0) * 0.04 +
        (stats.pass_tds ?? 0) * 4 +
        (stats.pass_int ?? 0) * -2 +
        (stats.rush_yds ?? 0) * 0.1 +
        (stats.rush_tds ?? 0) * 6 +
        (stats.fumbles ?? 0) * -2
      );
    case "RB":
    case "WR":
    case "TE":
      return (
        (stats.rush_yds ?? 0) * 0.1 +
        (stats.rush_tds ?? 0) * 6 +
        (stats.rec_yds ?? 0) * 0.1 +
        (stats.rec_tds ?? 0) * 6 +
        (stats.rec ?? 0) * recBonus +
        (stats.fumbles ?? 0) * -2
      );
    case "K":
      return (stats.fg ?? 0) * 3 + (stats.xpt ?? 0) * 1;
    case "DST":
      return (
        (stats.sacks ?? 0) * 1 +
        (stats.def_int ?? 0) * 2 +
        (stats.fumble_recovery ?? 0) * 2 +
        (stats.def_td ?? 0) * 6 +
        (stats.safety ?? 0) * 2 +
        Math.max(0, 10 - (stats.points_allowed ?? 0) * 0.3)
      );
  }
}

export function generateMockStats(query: StatsQuery): PlayerRow[] {
  const roster: [string, string, string][] =
    query.position === "DST"
      ? NFL_TEAMS.map(([abbr, teamName]) => [teamName, "", abbr])
      : NAMES_BY_POSITION[query.position].map(([first, last], i) => [first, last, TEAMS[i % TEAMS.length]]);

  const players = roster.map(([first, last, team], index) => {
    const seed = `${query.season}-${query.week}-${query.position}-${query.scoring}-${index}`;
    const rand = seededRandom(seed);
    const rankFactor = Math.max(0.35, 1.15 - index * 0.07);
    const stats = statsForPosition(query.position, rand, rankFactor);
    const points = Math.round(computePoints(query.position, stats, query.scoring) * 10) / 10;
    const name = query.position === "DST" ? `${first} DST` : `${first} ${last}`;

    return { id: seed, name, team, position: query.position, rank: index + 1, points, stats } satisfies PlayerRow;
  });

  if (query.position !== "DST") return players;

  // Roster order is alphabetical by team, not by projected quality - re-rank by points instead.
  return [...players]
    .sort((a, b) => b.points - a.points)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

/** Baseline average fantasy points allowed per game, by position, before scoring/team variance. */
const MATCHUP_BASELINE: Record<MatchupPosition, number> = {
  QB: 19,
  RB: 21,
  WR: 27,
  TE: 11,
};

export function generateMockPointsAllowed(query: PointsAllowedQuery): DefenseMatchupRow[] {
  const recBonus = query.scoring === "PPR" ? 1.15 : query.scoring === "HALF" ? 1.07 : 1;

  const raw = NFL_TEAMS.map(([team, teamName]) => {
    const rand = seededRandom(`${query.season}-${query.scoring}-${team}`);
    const vs = {} as Record<MatchupPosition, { pointsAllowed: number }>;
    for (const pos of MATCHUP_POSITIONS) {
      const scoringFactor = pos === "QB" ? 1 : recBonus;
      const base = MATCHUP_BASELINE[pos] * scoringFactor;
      const pointsAllowed = Math.round(base * (0.75 + rand() * 0.5) * 10) / 10;
      vs[pos] = { pointsAllowed };
    }
    return { team, teamName, vs };
  });

  const ranked: DefenseMatchupRow[] = raw.map((row) => ({ ...row, vs: {} as DefenseMatchupRow["vs"] }));
  for (const pos of MATCHUP_POSITIONS) {
    const order = [...raw]
      .map((row, index) => ({ index, value: row.vs[pos].pointsAllowed }))
      .sort((a, b) => a.value - b.value);
    order.forEach(({ index }, rankIndex) => {
      ranked[index].vs[pos] = { pointsAllowed: raw[index].vs[pos].pointsAllowed, rank: rankIndex + 1 };
    });
  }

  return ranked;
}
