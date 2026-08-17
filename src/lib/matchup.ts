import { MATCHUP_POSITIONS, type DefenseMatchupRow, type MatchupPosition, type PlayerRow } from "./fantasypros/types";
import type { TeamOpponent } from "./schedule/types";

export interface PlayerMatchup {
  opponent: string | null;
  homeAway: "home" | "away" | null;
  /** Season-average fantasy points the opponent allows to this player's position; null if unknown/not tracked (e.g. DST). */
  opponentPointsAllowed: number | null;
  /** 1 = toughest matchup among all teams for that position. */
  opponentRank: number | null;
  totalTeams: number;
}

const MATCHUP_POSITION_SET = new Set<string>(MATCHUP_POSITIONS);

export function buildPlayerMatchups(
  players: PlayerRow[],
  schedule: Record<string, TeamOpponent> | null,
  pointsAllowed: DefenseMatchupRow[] | null
): Record<string, PlayerMatchup> {
  const pointsAllowedByTeam = new Map((pointsAllowed ?? []).map((row) => [row.team, row]));
  const totalTeams = pointsAllowed?.length ?? 32;
  const result: Record<string, PlayerMatchup> = {};

  for (const player of players) {
    const sched = schedule?.[player.team];
    const opponent = sched?.opponent ?? null;
    const opponentRow = opponent ? pointsAllowedByTeam.get(opponent) : undefined;
    const stat =
      opponentRow && MATCHUP_POSITION_SET.has(player.position)
        ? opponentRow.vs[player.position as MatchupPosition]
        : undefined;

    result[player.id] = {
      opponent,
      homeAway: sched?.homeAway ?? null,
      opponentPointsAllowed: stat?.pointsAllowed ?? null,
      opponentRank: stat?.rank ?? null,
      totalTeams,
    };
  }
  return result;
}
