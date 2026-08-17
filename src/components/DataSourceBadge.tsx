"use client";

import { STATUS } from "@/lib/palette";

interface DataSourceBadgeProps {
  source: "live" | "cache" | "mock";
  fetchedAt: string;
  warning?: string;
}

const CONFIG = {
  live: { color: STATUS.good, label: "Live" },
  cache: { color: STATUS.good, label: "Cached" },
  mock: { color: STATUS.warning, label: "Mock data" },
} as const;

export function DataSourceBadge({ source, fetchedAt, warning }: DataSourceBadgeProps) {
  const cfg = CONFIG[source];
  const time = new Date(fetchedAt).toLocaleString();

  return (
    <div className="flex flex-col gap-1 text-sm">
      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
        <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
        <span>
          {cfg.label} · as of <span className="tabular-nums">{time}</span>
        </span>
      </div>
      {warning && (
        <p className="text-xs" style={{ color: STATUS.warning }}>
          {warning}
        </p>
      )}
    </div>
  );
}
