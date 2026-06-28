"use client";

import { useState } from "react";
import type { CheckSummary } from "@/lib/lottery/types";
import { summaryToCsv, downloadCsv } from "@/lib/export/toCsv";
import { openPrintReport } from "@/lib/export/printReport";
import { saveHistory } from "@/lib/history/store";

export function ExportButtons({ summary }: { summary: CheckSummary }) {
  const [savedMsg, setSavedMsg] = useState("");

  const baseName =
    "lottery-" + (summary.drawResult.drawDate || Date.now().toString());

  const onCsv = () => {
    downloadCsv(`${baseName}.csv`, summaryToCsv(summary));
  };

  const onPrint = () => {
    openPrintReport(summary);
  };

  const onSave = async () => {
    try {
      await saveHistory(summary);
      setSavedMsg("บันทึกแล้ว");
      setTimeout(() => setSavedMsg(""), 2000);
    } catch (e) {
      setSavedMsg("บันทึกไม่สำเร็จ: " + (e instanceof Error ? e.message : ""));
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        onClick={onCsv}
        className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
      >
        ดาวน์โหลด CSV
      </button>
      <button
        onClick={onPrint}
        className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
        title="เปิดหน้าพิมพ์ — กด Save as PDF เพื่อบันทึกเป็น PDF"
      >
        🖨️ พิมพ์ / Save as PDF
      </button>
      <button
        onClick={onSave}
        className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
      >
        บันทึกประวัติ
      </button>
      {savedMsg && (
        <span className="text-sm text-emerald-600">{savedMsg}</span>
      )}
    </div>
  );
}
