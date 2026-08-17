"use client";

import { useCallback, useEffect, useState } from "react";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { PointsAllowedTable } from "@/components/PointsAllowedTable";
import type { PointsAllowedResult, ScoringFormat } from "@/lib/fantasypros/types";

const CURRENT_SEASON = new Date().getFullYear();
const SCORING: { value: ScoringFormat; label: string }[] = [
  { value: "STD", label: "Standard" },
  { value: "HALF", label: "Half PPR" },
  { value: "PPR", label: "Full PPR" },
];

interface MatchupsViewProps {
  dataSource: "auto" | "mock";
  onFetched: () => void;
}

export function MatchupsView({ dataSource, onFetched }: MatchupsViewProps) {
  const [scoring, setScoring] = useState<ScoringFormat>("PPR");
  const [result, setResult] = useState<PointsAllowedResult & { warning?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ season: String(CURRENT_SEASON), scoring, source: dataSource });
      const res = await fetch(`/api/points-allowed?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setResult((await res.json()) as PointsAllowedResult & { warning?: string });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      onFetched();
    }
  }, [scoring, dataSource, onFetched]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch triggered by filter change
    load();
  }, [load]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          Scoring
          <select
            className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-[var(--foreground)]"
            value={scoring}
            onChange={(e) => setScoring(e.target.value as ScoringFormat)}
          >
            {SCORING.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="ml-auto rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:border-[var(--baseline)] disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh data"}
        </button>
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

      <PointsAllowedTable teams={result?.teams ?? []} />
    </>
  );
}
