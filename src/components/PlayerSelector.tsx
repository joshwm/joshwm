"use client";

import type { PlayerRow } from "@/lib/fantasypros/types";

interface PlayerSelectorProps {
  players: PlayerRow[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  colors: readonly string[];
  maxSelected: number;
}

export function PlayerSelector({ players, selectedIds, onToggle, colors, maxSelected }: PlayerSelectorProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">
          Select players to compare
        </h2>
        <span className="text-xs text-[var(--text-muted)]">
          {selectedIds.length}/{maxSelected} selected
        </span>
      </div>
      <ul className="max-h-80 space-y-0.5 overflow-y-auto">
        {players.map((p) => {
          const idx = selectedIds.indexOf(p.id);
          const selected = idx !== -1;
          const disabled = !selected && selectedIds.length >= maxSelected;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onToggle(p.id)}
                disabled={disabled}
                aria-pressed={selected}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-[var(--background)] disabled:opacity-40"
              >
                <span
                  aria-hidden
                  className="inline-block h-3 w-3 shrink-0 rounded-sm border border-[var(--border)]"
                  style={{ backgroundColor: selected ? colors[idx % colors.length] : "transparent" }}
                />
                <span className="flex-1 truncate text-[var(--foreground)]">
                  {p.name}
                  {p.team && <span className="text-[var(--text-muted)]"> · {p.team}</span>}
                </span>
                <span className="tabular-nums text-[var(--text-muted)]">#{p.rank ?? "–"}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
