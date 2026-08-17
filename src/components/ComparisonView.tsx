"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FilterBar } from "@/components/FilterBar";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { PlayerSelector } from "@/components/PlayerSelector";
import { ComparisonTable } from "@/components/ComparisonTable";
import { ComparisonChart } from "@/components/ComparisonChart";
import { useChartPalette } from "@/lib/palette";
import { STAT_CATEGORIES, type Position, type ScoringFormat, type WeekSelector, type StatsResult } from "@/lib/fantasypros/types";

const MAX_SELECTED = 8;
const CURRENT_SEASON = new Date().getFullYear();

interface ComparisonViewProps {
  dataSource: "auto" | "mock";
  onFetched: () => void;
}

export function ComparisonView({ dataSource, onFetched }: ComparisonViewProps) {
  const [position, setPosition] = useState<Position>("RB");
  const [scoring, setScoring] = useState<ScoringFormat>("PPR");
  const [week, setWeek] = useState<WeekSelector>("draft");

  const [result, setResult] = useState<StatsResult & { warning?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [chartCategory, setChartCategory] = useState("points");

  const { categorical } = useChartPalette();
  const categories = STAT_CATEGORIES[position];

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        season: String(CURRENT_SEASON),
        week: String(week),
        position,
        scoring,
        source: dataSource,
      });
      const res = await fetch(`/api/stats?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const data = (await res.json()) as StatsResult & { warning?: string };
      setResult(data);
      setSelectedIds(data.players.slice(0, 3).map((p) => p.id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      onFetched();
    }
  }, [position, scoring, week, dataSource, onFetched]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch triggered by filter change
    loadStats();
  }, [loadStats]);

  const selectedPlayers = useMemo(
    () => (result?.players ?? []).filter((p) => selectedIds.includes(p.id)).sort(
      (a, b) => selectedIds.indexOf(a.id) - selectedIds.indexOf(b.id)
    ),
    [result, selectedIds]
  );

  function toggleSelected(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX_SELECTED ? prev : [...prev, id]
    );
  }

  const chartCategoryDef = categories.find((c) => c.key === chartCategory) ?? categories[0];

  return (
    <>
      <div className="mb-4">
        <FilterBar
          position={position}
          scoring={scoring}
          week={week}
          loading={loading}
          onChange={(next) => {
            if (next.position) setPosition(next.position);
            if (next.scoring) setScoring(next.scoring);
            if (next.week !== undefined) setWeek(next.week);
          }}
          onRefresh={loadStats}
        />
      </div>

      {result && (
        <div className="mb-4">
          <DataSourceBadge source={result.source} fetchedAt={result.fetchedAt} warning={result.warning} />
        </div>
      )}
      {error && (
        <p className="mb-4 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        <PlayerSelector
          players={result?.players ?? []}
          selectedIds={selectedIds}
          onToggle={toggleSelected}
          colors={categorical}
          maxSelected={MAX_SELECTED}
        />

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="chart-category" className="text-sm text-[var(--text-secondary)]">
              Chart stat
            </label>
            <select
              id="chart-category"
              className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm text-[var(--foreground)]"
              value={chartCategoryDef.key}
              onChange={(e) => setChartCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <ComparisonChart players={selectedPlayers} category={chartCategoryDef} colors={categorical} />
          <ComparisonTable players={selectedPlayers} categories={categories} colors={categorical} />
        </div>
      </div>
    </>
  );
}
