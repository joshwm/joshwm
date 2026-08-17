/** All 32 NFL team abbreviations + names, shared by mock data and schedule lookups. */
export const NFL_TEAMS: [abbr: string, name: string][] = [
  ["ARI", "Cardinals"], ["ATL", "Falcons"], ["BAL", "Ravens"], ["BUF", "Bills"],
  ["CAR", "Panthers"], ["CHI", "Bears"], ["CIN", "Bengals"], ["CLE", "Browns"],
  ["DAL", "Cowboys"], ["DEN", "Broncos"], ["DET", "Lions"], ["GB", "Packers"],
  ["HOU", "Texans"], ["IND", "Colts"], ["JAC", "Jaguars"], ["KC", "Chiefs"],
  ["LAC", "Chargers"], ["LAR", "Rams"], ["LV", "Raiders"], ["MIA", "Dolphins"],
  ["MIN", "Vikings"], ["NE", "Patriots"], ["NO", "Saints"], ["NYG", "Giants"],
  ["NYJ", "Jets"], ["PHI", "Eagles"], ["PIT", "Steelers"], ["SEA", "Seahawks"],
  ["SF", "49ers"], ["TB", "Buccaneers"], ["TEN", "Titans"], ["WAS", "Commanders"],
];

export const TEAM_ABBRS: string[] = NFL_TEAMS.map(([abbr]) => abbr);

export const TEAM_NAME_BY_ABBR: Record<string, string> = Object.fromEntries(NFL_TEAMS);
