"use client";

import { useState } from "react";
import type { DefenseMatchupRow, MatchupPosition } from "@/lib/fantasypros/types";
import { MATCHUP_POSITIONS } from "@/lib/fantasypros/types";
import { SEQUENTIAL_BLUE, sequentialHeatColor } from "@/lib/palette";

interface PointsAllowedTableProps {
  teams: DefenseMatchupRow[];
}

type SortKey = "team" | MatchupPosition;
type SortState = { key: SortKey; dir: "asc" | "desc" };

export function PointsAllowedTable({ teams }: PointsAllowedTableProps) {
  const [sort, setSort] = useState<SortState>({ key: "team", dir: "asc" });

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "team" ? "asc" : "desc" }
    );
  }

  const sorted = [...teams].sort((a, b) => {
    const av = sort.key === "team" ? a.teamName : a.vs[sort.key].pointsAllowed;
    const bv = sort.key === "team" ? b.teamName : b.vs[sort.key].pointsAllowed;
    if (typeof av === "string" || typeof bv === "string") {
      return sort.dir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    }
    return sort.dir === "asc" ? av - bv : bv - av;
  });

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)]">
          Fantasy points allowed by position (per game avg)
        </h3>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span
            aria-hidden
            className="inline-block h-2.5 w-10 rounded-sm"
            style={{ background: `linear-gradient(to right, ${SEQUENTIAL_BLUE[0]}, ${SEQUENTIAL_BLUE[SEQUENTIAL_BLUE.length - 1]})` }}
          />
          <span>Tougher matchup (fewer pts allowed) → Easier matchup (more pts allowed)</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
              <th className="sticky left-0 z-10 bg-[var(--surface)] px-3 py-2 font-medium">
                <button
                  type="button"
                  onClick={() => toggleSort("team")}
                  className="hover:text-[var(--foreground)]"
                >
                  Defense
                </button>
              </th>
              {MATCHUP_POSITIONS.map((pos) => (
                <th
                  key={pos}
                  className="px-3 py-2 font-medium"
                  aria-sort={sort.key === pos ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(pos)}
                    className="flex items-center gap-1 tabular-nums hover:text-[var(--foreground)]"
                  >
                    vs {pos}
                    {sort.key === pos && <span aria-hidden>{sort.dir === "asc" ? "▲" : "▼"}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.team} className="border-b border-[var(--gridline)] last:border-0">
                <td className="sticky left-0 z-10 bg-[var(--surface)] px-3 py-2 text-[var(--foreground)]">
                  {row.teamName}
                  <span className="ml-1 text-[var(--text-muted)]">{row.team}</span>
                </td>
                {MATCHUP_POSITIONS.map((pos) => {
                  const stat = row.vs[pos];
                  return (
                    <td key={pos} className="px-3 py-2">
                      <span
                        className="inline-flex min-w-16 items-center justify-between gap-2 rounded px-2 py-1 tabular-nums text-[var(--foreground)]"
                        style={{ backgroundColor: `${sequentialHeatColor(stat.rank, teams.length)}33` }}
                      >
                        {stat.pointsAllowed}
                        <span className="text-xs text-[var(--text-muted)]">#{stat.rank}</span>
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
