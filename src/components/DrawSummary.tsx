"use client";

import type { DrawResult } from "@/lib/lottery/types";
import { PRIZE_ORDER, PRIZE_LABELS, formatThaiBaht } from "@/lib/lottery/prizes";

export function DrawSummary({ draw }: { draw: DrawResult }) {
  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold">ผลรางวัลงวดนี้</h2>
        <p className="text-sm text-gray-500 mt-0.5">{draw.drawLabel}</p>
      </header>
      <div className="space-y-2">
        {PRIZE_ORDER.map((tier) => {
          const p = draw.prizes[tier];
          if (!p) return null;
          return (
            <div key={tier} className="flex items-start gap-3 text-sm">
              <div className="w-44 shrink-0 font-medium">{PRIZE_LABELS[tier]}</div>
              <div className="text-xs text-gray-500 w-24 shrink-0">
                {formatThaiBaht(p.amount)}
              </div>
              <div className="font-mono text-xs flex flex-wrap gap-1">
                {p.numbers.map((n, i) => (
                  <span
                    key={i}
                    className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
