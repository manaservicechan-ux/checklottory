"use client";

import type { WinRecord } from "@/lib/lottery/types";
import { PRIZE_LABELS, formatThaiBaht } from "@/lib/lottery/prizes";

export function WinnersTable({ wins }: { wins: WinRecord[] }) {
  if (wins.length === 0) {
    return (
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
        <h2 className="text-lg font-semibold mb-2">เลขที่ถูกรางวัล</h2>
        <p className="text-sm text-gray-500">ไม่มีเลขที่ถูกรางวัลในครั้งนี้</p>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
      <h2 className="text-lg font-semibold mb-3">
        เลขที่ถูกรางวัล ({wins.length} รายการ)
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-gray-500 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="py-2 pr-3">เลขสลาก</th>
              <th className="py-2 pr-3">ประเภทรางวัล</th>
              <th className="py-2 pr-3 text-right">จำนวนเงิน</th>
              <th className="py-2 pr-3">ภาพต้นทาง</th>
              <th className="py-2 pr-3">ช่อง</th>
            </tr>
          </thead>
          <tbody>
            {wins.map((w, i) => (
              <tr
                key={i}
                className="border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <td className="py-2 pr-3 font-mono font-semibold">
                  {w.ticket.number}
                </td>
                <td className="py-2 pr-3">{PRIZE_LABELS[w.tier]}</td>
                <td className="py-2 pr-3 text-right font-mono">
                  {formatThaiBaht(w.amount)}
                </td>
                <td className="py-2 pr-3 text-xs text-gray-600 dark:text-gray-400">
                  {w.ticket.source}
                </td>
                <td className="py-2 pr-3 text-xs text-gray-500 font-mono">
                  {w.ticket.cellIndex?.toString().padStart(2, "0") ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
