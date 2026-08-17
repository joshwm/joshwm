import { TEAM_ABBRS } from "@/lib/teams";
import { seededRandom, seededShuffle } from "@/lib/random";
import type { ScheduleQuery, TeamOpponent } from "./types";

const BYE_WEEK_POOL = [6, 7, 8, 9, 10, 11, 12, 13, 14];

function teamByeWeek(season: number, team: string): number {
  const rand = seededRandom(`bye-${season}-${team}`);
  return BYE_WEEK_POOL[Math.floor(rand() * BYE_WEEK_POOL.length)];
}

/**
 * Deterministic placeholder schedule - NOT a real NFL schedule. Used only
 * when the live lookup (see schedule/client.ts) is unavailable or fails.
 * Every consumer must treat this the same as the rest of the app's mock
 * data: fine for exploring the UI, never for real matchup decisions.
 */
export function generateMockWeekSchedule(query: ScheduleQuery): Record<string, TeamOpponent> {
  const onBye = new Set(TEAM_ABBRS.filter((t) => teamByeWeek(query.season, t) === query.week));
  const playing = TEAM_ABBRS.filter((t) => !onBye.has(t));
  const shuffled = seededShuffle(playing, seededRandom(`schedule-${query.season}-${query.week}`));

  const result: Record<string, TeamOpponent> = {};
  for (const team of onBye) {
    result[team] = { team, opponent: null, homeAway: null };
  }
  for (let i = 0; i < shuffled.length - 1; i += 2) {
    const home = shuffled[i];
    const away = shuffled[i + 1];
    result[home] = { team: home, opponent: away, homeAway: "home" };
    result[away] = { team: away, opponent: home, homeAway: "away" };
  }
  return result;
}
