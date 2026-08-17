"use client";

import { useState } from "react";
import type { PlayerRow, StatCategoryDef } from "@/lib/fantasypros/types";
import type { PlayerMatchup } from "@/lib/matchup";
import { sequentialHeatColor } from "@/lib/palette";

interface ComparisonTableProps {
  players: PlayerRow[];
  categories: StatCategoryDef[];
  colors: readonly string[];
  matchups: Record<string, PlayerMatchup>;
  matchupWeek: number;
}

type SortState = { key: string; dir: "asc" | "desc" };

function bestValue(players: PlayerRow[], cat: StatCategoryDef): number | null {
  if (players.length < 2) return null;
  const values = players.map((p) => (cat.key === "points" ? p.points : p.stats[cat.key] ?? 0));
  return cat.higherIsBetter ? Math.max(...values) : Math.min(...values);
}

function OpponentCell({ matchup }: { matchup?: PlayerMatchup }) {
  if (!matchup || !matchup.opponent) {
    return <span className="text-[var(--text-muted)]">BYE</span>;
  }
  return (
    <span className="text-[var(--foreground)]">
      {matchup.homeAway === "away" ? "@" : "vs"} {matchup.opponent}
    </span>
  );
}

function OpponentAllowsCell({ matchup }: { matchup?: PlayerMatchup }) {
  if (!matchup || matchup.opponentPointsAllowed === null || matchup.opponentRank === null) {
    return <span className="text-[var(--text-muted)]">–</span>;
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 tabular-nums text-[var(--foreground)]"
      style={{ backgroundColor: `${sequentialHeatColor(matchup.opponentRank, matchup.totalTeams)}33` }}
    >
      {matchup.opponentPointsAllowed}
      <span className="text-xs text-[var(--text-muted)]">#{matchup.opponentRank}</span>
    </span>
  );
}

export function ComparisonTable({ players, categories, colors, matchups, matchupWeek }: ComparisonTableProps) {
  const [sort, setSort] = useState<SortState>({ key: "points", dir: "desc" });

  const getValue = (p: PlayerRow, key: string) => (key === "points" ? p.points : p.stats[key] ?? 0);

  const sorted = [...players].sort((a, b) => {
    const av = getValue(a, sort.key);
    const bv = getValue(b, sort.key);
    return sort.dir === "asc" ? av - bv : bv - av;
  });

  function toggleSort(key: string) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }
    );
  }

  if (players.length === 0) {
    return (
      <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-muted)]">
        Select players above to compare their stats.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
            <th className="sticky left-0 z-10 bg-[var(--surface)] px-3 py-2 font-medium">Player</th>
            <th className="px-3 py-2 font-medium">Wk {matchupWeek} Opp</th>
            <th className="px-3 py-2 font-medium" title="Season-average fantasy points the opponent allows to this position">
              Opp Allows
            </th>
            {categories.map((cat) => (
              <th
                key={cat.key}
                className="px-3 py-2 font-medium"
                aria-sort={sort.key === cat.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
              >
                <button
                  type="button"
                  onClick={() => toggleSort(cat.key)}
                  className="flex items-center gap-1 tabular-nums hover:text-[var(--foreground)]"
                >
                  {cat.label}
                  {sort.key === cat.key && <span aria-hidden>{sort.dir === "asc" ? "▲" : "▼"}</span>}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const colorIdx = players.findIndex((x) => x.id === p.id);
            const matchup = matchups[p.id];
            return (
              <tr key={p.id} className="border-b border-[var(--gridline)] last:border-0">
                <td className="sticky left-0 z-10 bg-[var(--surface)] px-3 py-2">
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: colors[colorIdx % colors.length] }}
                    />
                    <span className="text-[var(--foreground)]">{p.name}</span>
                    {p.team && <span className="text-[var(--text-muted)]">{p.team}</span>}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <OpponentCell matchup={matchup} />
                </td>
                <td className="px-3 py-2">
                  <OpponentAllowsCell matchup={matchup} />
                </td>
                {categories.map((cat) => {
                  const value = getValue(p, cat.key);
                  const best = bestValue(players, cat);
                  const isBest = best !== null && value === best;
                  return (
                    <td
                      key={cat.key}
                      className={`px-3 py-2 tabular-nums ${
                        isBest ? "font-semibold text-[var(--foreground)]" : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
