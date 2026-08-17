"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FilterBar } from "@/components/FilterBar";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { PlayerSelector } from "@/components/PlayerSelector";
import { ComparisonTable } from "@/components/ComparisonTable";
import { ComparisonChart } from "@/components/ComparisonChart";
import { useChartPalette } from "@/lib/palette";
import { buildPlayerMatchups } from "@/lib/matchup";
import {
  STAT_CATEGORIES,
  type Position,
  type ScoringFormat,
  type WeekSelector,
  type StatsResult,
  type PointsAllowedResult,
} from "@/lib/fantasypros/types";
import type { ScheduleResult } from "@/lib/schedule/types";

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
  const matchupWeek = week === "draft" ? 1 : week;

  const [result, setResult] = useState<StatsResult & { warning?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [chartCategory, setChartCategory] = useState("points");

  const [schedule, setSchedule] = useState<ScheduleResult & { warning?: string } | null>(null);
  const [pointsAllowed, setPointsAllowed] = useState<PointsAllowedResult & { warning?: string } | null>(null);

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

  const loadSchedule = useCallback(async () => {
    const params = new URLSearchParams({ season: String(CURRENT_SEASON), week: String(matchupWeek), source: dataSource });
    const res = await fetch(`/api/schedule?${params}`);
    if (res.ok) setSchedule((await res.json()) as ScheduleResult & { warning?: string });
  }, [matchupWeek, dataSource]);

  const loadPointsAllowed = useCallback(async () => {
    const params = new URLSearchParams({ season: String(CURRENT_SEASON), scoring, source: dataSource });
    const res = await fetch(`/api/points-allowed?${params}`);
    if (res.ok) setPointsAllowed((await res.json()) as PointsAllowedResult & { warning?: string });
    onFetched();
  }, [scoring, dataSource, onFetched]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch triggered by filter change
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- upcoming-opponent lookup for the selected week
    loadSchedule();
  }, [loadSchedule]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- season-average matchup data for the selected scoring format
    loadPointsAllowed();
  }, [loadPointsAllowed]);

  const matchups = useMemo(
    () => buildPlayerMatchups(result?.players ?? [], schedule?.teams ?? null, pointsAllowed?.teams ?? null),
    [result, schedule, pointsAllowed]
  );

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
  const matchupWarning = schedule?.warning ?? pointsAllowed?.warning;

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
          {matchupWarning && (
            <p className="mt-1 text-xs" style={{ color: "var(--status-warning)" }}>
              {matchupWarning}
            </p>
          )}
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
          matchups={matchups}
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
          <ComparisonTable
            players={selectedPlayers}
            categories={categories}
            colors={categorical}
            matchups={matchups}
            matchupWeek={matchupWeek}
          />
        </div>
      </div>
    </>
  );
}
