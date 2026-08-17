"use client";

import { useCallback, useEffect, useState } from "react";
import { BudgetBadge } from "@/components/BudgetBadge";
import { ComparisonView } from "@/components/ComparisonView";
import { MatchupsView } from "@/components/MatchupsView";

interface BudgetStatus {
  used: number;
  limit: number;
}

const TABS = [
  { key: "compare", label: "Player Comparison" },
  { key: "matchups", label: "Points Allowed by Position" },
] as const;

type Tab = (typeof TABS)[number]["key"];

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("compare");
  const [dataSource, setDataSource] = useState<"auto" | "mock">("auto");
  const [budget, setBudget] = useState<BudgetStatus | null>(null);

  const loadBudget = useCallback(async () => {
    const res = await fetch("/api/budget");
    if (res.ok) setBudget(await res.json());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial budget readout on mount
    loadBudget();
  }, [loadBudget]);

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Fantasy Football Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Compare player &amp; defense stats across categories, powered by FantasyPros.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {budget && <BudgetBadge used={budget.used} limit={budget.limit} />}
          <label className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <input
              type="checkbox"
              checked={dataSource === "mock"}
              onChange={(e) => setDataSource(e.target.checked ? "mock" : "auto")}
            />
            Force mock data (don&apos;t spend budget)
          </label>
        </div>
      </header>

      <div className="mb-4 flex gap-1.5 border-b border-[var(--border)]" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={[
              "px-3 py-2 text-sm border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-[var(--foreground)] text-[var(--foreground)] font-medium"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--foreground)]",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "compare" ? (
        <ComparisonView dataSource={dataSource} onFetched={loadBudget} />
      ) : (
        <MatchupsView dataSource={dataSource} onFetched={loadBudget} />
      )}
    </div>
  );
}
