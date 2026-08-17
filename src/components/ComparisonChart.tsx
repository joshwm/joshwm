"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PlayerRow, StatCategoryDef } from "@/lib/fantasypros/types";
import { useChartPalette } from "@/lib/palette";

interface ComparisonChartProps {
  players: PlayerRow[];
  category: StatCategoryDef;
  colors: readonly string[];
}

interface TooltipPayloadItem {
  payload: { name: string; team: string; value: number };
}

function ChartTooltip({ active, payload, chrome }: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  chrome: { surface: string; textPrimary: string; textSecondary: string; gridline: string };
}) {
  if (!active || !payload?.length) return null;
  const { name, team, value } = payload[0].payload;
  return (
    <div
      className="rounded-md border px-3 py-2 text-sm shadow-sm"
      style={{ backgroundColor: chrome.surface, borderColor: chrome.gridline, color: chrome.textPrimary }}
    >
      <div className="tabular-nums font-semibold">{value}</div>
      <div style={{ color: chrome.textSecondary }}>
        {name}
        {team ? ` · ${team}` : ""}
      </div>
    </div>
  );
}

export function ComparisonChart({ players, category, colors }: ComparisonChartProps) {
  const { chrome } = useChartPalette();

  if (players.length === 0) {
    return null;
  }

  const data = players.map((p) => ({
    name: p.name,
    team: p.team,
    value: category.key === "points" ? p.points : p.stats[category.key] ?? 0,
  }));

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold" style={{ color: chrome.textSecondary }}>
        {category.label} comparison
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(220, players.length * 44)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke={chrome.gridline} strokeDasharray="0" />
          <XAxis
            type="number"
            tick={{ fill: chrome.textMuted, fontSize: 12 }}
            axisLine={{ stroke: chrome.baseline }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fill: chrome.textSecondary, fontSize: 12 }}
            axisLine={{ stroke: chrome.baseline }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: chrome.gridline, opacity: 0.4 }}
            content={<ChartTooltip chrome={chrome} />}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24} isAnimationActive={false}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
