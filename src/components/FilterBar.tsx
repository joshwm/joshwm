"use client";

import type { Position, ScoringFormat, WeekSelector } from "@/lib/fantasypros/types";

const POSITIONS: Position[] = ["QB", "RB", "WR", "TE", "K", "DST"];
const SCORING: { value: ScoringFormat; label: string }[] = [
  { value: "STD", label: "Standard" },
  { value: "HALF", label: "Half PPR" },
  { value: "PPR", label: "Full PPR" },
];
const WEEKS: { value: string; label: string }[] = [
  { value: "draft", label: "Full Season" },
  ...Array.from({ length: 18 }, (_, i) => ({ value: String(i + 1), label: `Week ${i + 1}` })),
];

interface FilterBarProps {
  position: Position;
  scoring: ScoringFormat;
  week: WeekSelector;
  onChange: (next: { position?: Position; scoring?: ScoringFormat; week?: WeekSelector }) => void;
  onRefresh: () => void;
  loading: boolean;
}

function segButton(active: boolean) {
  return [
    "px-3 py-1.5 text-sm rounded-md border transition-colors",
    active
      ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--baseline)]",
  ].join(" ");
}

export function FilterBar({ position, scoring, week, onChange, onRefresh, loading }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <div className="flex items-center gap-1.5" role="group" aria-label="Position">
        {POSITIONS.map((p) => (
          <button
            key={p}
            type="button"
            className={segButton(position === p)}
            aria-pressed={position === p}
            onClick={() => onChange({ position: p })}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-[var(--border)]" />

      <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        Scoring
        <select
          className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-[var(--foreground)]"
          value={scoring}
          onChange={(e) => onChange({ scoring: e.target.value as ScoringFormat })}
        >
          {SCORING.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        Period
        <select
          className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-[var(--foreground)]"
          value={String(week)}
          onChange={(e) => onChange({ week: e.target.value === "draft" ? "draft" : Number(e.target.value) })}
        >
          {WEEKS.map((w) => (
            <option key={w.value} value={w.value}>
              {w.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="ml-auto rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:border-[var(--baseline)] disabled:opacity-50"
      >
        {loading ? "Refreshing…" : "Refresh data"}
      </button>
    </div>
  );
}
