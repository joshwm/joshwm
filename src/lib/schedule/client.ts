import type { ScheduleQuery, TeamOpponent } from "./types";

/**
 * NFL schedules aren't part of FantasyPros' API, so this doesn't touch the
 * daily budget at all. ESPN's public scoreboard endpoint is free, needs no
 * key, and is a long-standing, widely-used community reference - but its
 * response shape here is from that general knowledge, not verified against
 * a live call from this environment (outbound network here is restricted
 * to an allowlist that doesn't include espn.com; see the dev sandbox's
 * network policy). If the shape has drifted, this throws and
 * `getWeekSchedule` in service.ts falls back to the mock schedule with a
 * visible warning - never to a wrong-but-confident-looking real matchup.
 */
const ESPN_SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

/** ESPN uses a few team abbreviations that differ from FantasyPros'/the rest of this app. */
const ABBR_ALIASES: Record<string, string> = {
  WSH: "WAS",
  JAX: "JAC",
  LA: "LAR",
};

function normalizeAbbr(abbr: string | undefined): string | null {
  if (!abbr) return null;
  return ABBR_ALIASES[abbr] ?? abbr;
}

interface EspnTeam {
  abbreviation?: string;
}
interface EspnCompetitor {
  homeAway?: string;
  team?: EspnTeam;
}
interface EspnCompetition {
  competitors?: EspnCompetitor[];
}
interface EspnEvent {
  competitions?: EspnCompetition[];
}
interface EspnScoreboardResponse {
  events?: EspnEvent[];
}

export async function fetchLiveWeekSchedule(query: ScheduleQuery): Promise<Record<string, TeamOpponent>> {
  const url = new URL(ESPN_SCOREBOARD_URL);
  url.searchParams.set("seasontype", "2"); // regular season
  url.searchParams.set("week", String(query.week));
  url.searchParams.set("year", String(query.season));

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`ESPN schedule request failed (${res.status} ${res.statusText})`);
  }

  const data = (await res.json()) as EspnScoreboardResponse;
  const events = data.events ?? [];
  if (events.length === 0) {
    throw new Error("ESPN schedule response had no events - unexpected shape or empty week");
  }

  const result: Record<string, TeamOpponent> = {};
  for (const event of events) {
    for (const competition of event.competitions ?? []) {
      const competitors = competition.competitors ?? [];
      if (competitors.length !== 2) continue;
      const [a, b] = competitors;
      const abbrA = normalizeAbbr(a.team?.abbreviation);
      const abbrB = normalizeAbbr(b.team?.abbreviation);
      if (!abbrA || !abbrB) continue;
      result[abbrA] = { team: abbrA, opponent: abbrB, homeAway: a.homeAway === "home" ? "home" : "away" };
      result[abbrB] = { team: abbrB, opponent: abbrA, homeAway: b.homeAway === "home" ? "home" : "away" };
    }
  }
  return result;
}
