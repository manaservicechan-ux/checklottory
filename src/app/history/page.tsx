"use client";

import { useEffect, useState } from "react";
import { listHistory, deleteHistory } from "@/lib/history/store";
import { DrawSummary } from "@/components/DrawSummary";
import { WinnersTable } from "@/components/WinnersTable";
import { TotalCard } from "@/components/TotalCard";
import { ExportButtons } from "@/components/ExportButtons";
import type { HistoryRecord } from "@/lib/lottery/types";

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [active, setActive] = useState<HistoryRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listHistory().then((r) => {
      setRecords(r);
      setLoading(false);
    });
  }, []);

  async function onDelete(id: string) {
    if (!confirm("ลบประวัตินี้?")) return;
    await deleteHistory(id);
    setRecords((rs) => rs.filter((r) => r.id !== id));
    if (active?.id === id) setActive(null);
  }

  if (loading) {
    return <p className="text-sm text-gray-500">กำลังโหลด...</p>;
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <aside className="md:col-span-1 space-y-2">
        <h2 className="text-base font-semibold mb-2">ประวัติที่บันทึกไว้</h2>
        {records.length === 0 && (
          <p className="text-sm text-gray-500">ยังไม่มีประวัติ</p>
        )}
        {records.map((r) => (
          <div
            key={r.id}
            className={`border rounded p-3 text-sm cursor-pointer transition ${
              active?.id === r.id
                ? "bg-blue-50 border-blue-400 dark:bg-blue-950/30"
                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-400"
            }`}
            onClick={() => setActive(r)}
          >
            <div className="font-medium">
              {r.summary.drawResult.drawLabel || r.summary.drawResult.drawDate}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ตรวจเมื่อ {new Date(r.savedAt).toLocaleString("th-TH")}
            </div>
            <div className="text-xs text-gray-500">
              {r.summary.totalWinTickets} ใบถูก • รวม{" "}
              {r.summary.totalAmount.toLocaleString("th-TH")} บาท
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(r.id);
              }}
              className="text-xs text-red-500 hover:text-red-700 mt-2"
            >
              ลบ
            </button>
          </div>
        ))}
      </aside>

      <section className="md:col-span-2 space-y-4">
        {active ? (
          <>
            <TotalCard summary={active.summary} />
            <DrawSummary draw={active.summary.drawResult} />
            <WinnersTable wins={active.summary.wins} />
            <ExportButtons summary={active.summary} />
          </>
        ) : (
          <p className="text-sm text-gray-500">เลือกประวัติทางซ้ายเพื่อดูรายละเอียด</p>
        )}
      </section>
    </div>
  );
}
