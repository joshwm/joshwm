"use client";

import { STATUS } from "@/lib/palette";

interface BudgetBadgeProps {
  used: number;
  limit: number;
}

export function BudgetBadge({ used, limit }: BudgetBadgeProps) {
  const remaining = Math.max(0, limit - used);
  const ratio = limit > 0 ? used / limit : 0;
  const color = ratio >= 1 ? STATUS.critical : ratio >= 0.7 ? STATUS.warning : STATUS.good;
  const label = ratio >= 1 ? "Exhausted" : ratio >= 0.7 ? "Low" : "OK";

  return (
    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
      <span
        aria-hidden
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>
        FantasyPros budget: <strong className="tabular-nums text-[var(--foreground)]">{remaining}</strong>
        /{limit} left today ({label})
      </span>
    </div>
  );
}
