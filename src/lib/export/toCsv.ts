import Papa from "papaparse";
import type { CheckSummary } from "@/lib/lottery/types";
import { PRIZE_LABELS } from "@/lib/lottery/prizes";

export function summaryToCsv(summary: CheckSummary): string {
  const rows = summary.wins.map((w) => ({
    เลขสลาก: w.ticket.number,
    "ภาพต้นทาง": w.ticket.source,
    "ช่องที่": w.ticket.cellIndex ?? "",
    "ประเภทรางวัล": PRIZE_LABELS[w.tier],
    "จำนวนเงิน (บาท)": w.amount,
    "หมายเหตุ": w.reason,
  }));
  return Papa.unparse(rows);
}

export function downloadCsv(filename: string, csv: string) {
  // Prepend BOM so Excel reads UTF-8 Thai correctly
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
