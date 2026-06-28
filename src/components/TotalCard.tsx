"use client";

import type { CheckSummary } from "@/lib/lottery/types";
import { formatThaiBaht } from "@/lib/lottery/prizes";

export function TotalCard({ summary }: { summary: CheckSummary }) {
  return (
    <section className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-lg p-5 shadow-md">
      <div className="text-xs uppercase tracking-wider opacity-80">
        ยอดรวมเงินรางวัล
      </div>
      <div className="text-3xl font-bold mt-1 font-mono">
        {formatThaiBaht(summary.totalAmount)}
      </div>
      <div className="text-sm mt-3 opacity-90">
        ใบที่ถูกรางวัล: {summary.totalWinTickets} ใบ จากทั้งหมด{" "}
        {summary.tickets.length} ใบ
      </div>
    </section>
  );
}
