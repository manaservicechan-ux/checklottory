"use client";

import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { DrawSummary } from "@/components/DrawSummary";
import { WinnersTable } from "@/components/WinnersTable";
import { TotalCard } from "@/components/TotalCard";
import { ExportButtons } from "@/components/ExportButtons";
import { PdfConverter } from "@/components/PdfConverter";
import { checkAllTickets } from "@/lib/lottery/checkTicket";
import { parseDrawXlsx } from "@/lib/excel/parseDrawXlsx";
import { parseAllTicketFiles } from "@/lib/excel/parseTicketsXlsx";
import { downloadTemplate } from "@/lib/excel/createTemplate";
import { downloadTicketsTemplate } from "@/lib/excel/createTicketsTemplate";
import type { CheckSummary } from "@/lib/lottery/types";

const XLSX_ACCEPT = {
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  "text/csv": [".csv"],
};

export default function HomePage() {
  const [drawFile, setDrawFile] = useState<File[]>([]);
  const [ticketFiles, setTicketFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<CheckSummary | null>(null);

  const canCheck =
    drawFile.length === 1 && ticketFiles.length > 0 && !busy;

  async function handleCheck() {
    setError("");
    setSummary(null);
    setBusy(true);
    try {
      const draw = await parseDrawXlsx(drawFile[0]);
      const { tickets, invalid, perFile } = await parseAllTicketFiles(ticketFiles);
      if (tickets.length === 0) {
        throw new Error("ไม่พบเลขสลาก 6 หลักในไฟล์ Excel ใบจอง");
      }

      const { wins, totalAmount, totalWinTickets } = checkAllTickets(tickets, draw);
      const warnings: string[] = [];
      if (invalid.length > 0) {
        warnings.push(
          `ข้ามค่าที่ไม่ใช่เลขสลาก ${invalid.length} รายการ — ตัวอย่าง: ${invalid.slice(0, 5).join(", ")}`,
        );
      }
      for (const f of perFile) {
        warnings.push(
          `อ่านจาก ${f.file}: ${f.count} ใบ` +
            (f.sheets.length > 1
              ? ` (${f.sheets.map((s) => `${s.sheet}=${s.count}`).join(", ")})`
              : ""),
        );
      }

      setSummary({
        drawResult: draw,
        tickets,
        wins,
        totalAmount,
        totalWinTickets,
        warnings,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PdfConverter />

      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">1. ไฟล์ผลรางวัล (Excel)</h2>
          <button
            onClick={() => downloadTemplate()}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ⬇️ ดาวน์โหลด template
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          ใช้ไฟล์ที่แปลงจาก PDF ด้านบน หรือดาวน์โหลด template แล้วกรอกเอง
        </p>
        <UploadZone
          label="ลากไฟล์ Excel ผลรางวัลมาวาง"
          accept={XLSX_ACCEPT}
          multiple={false}
          files={drawFile}
          onFiles={setDrawFile}
        />
      </section>

      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">
            2. ไฟล์ Excel เลขสลาก (ใบจอง)
          </h2>
          <button
            onClick={() => downloadTicketsTemplate()}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ⬇️ ดาวน์โหลด template
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          ระบบจะดึง <strong>เลข 6 หลัก</strong> ทุก cell ในทุก sheet —
          วางคอลัมน์เลขสลากจาก Excel ของคุณได้เลย (เลข 1–5 หลักจะถูก pad ด้วย 0 ทางซ้าย)
        </p>
        <UploadZone
          label="ลากไฟล์ Excel เลขสลาก (รับหลายไฟล์)"
          accept={XLSX_ACCEPT}
          multiple
          files={ticketFiles}
          onFiles={setTicketFiles}
        />
      </section>

      <div className="flex justify-center">
        <button
          onClick={handleCheck}
          disabled={!canCheck}
          className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold transition"
        >
          {busy ? "กำลังตรวจ..." : "ตรวจรางวัล"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 rounded p-4 text-sm whitespace-pre-wrap">
          {error}
        </div>
      )}

      {summary && (
        <>
          <TotalCard summary={summary} />
          <DrawSummary draw={summary.drawResult} />
          <WinnersTable wins={summary.wins} />
          {summary.warnings.length > 0 && (
            <section className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4 text-sm">
              <h3 className="font-semibold mb-2">ℹ️ รายละเอียดเพิ่มเติม</h3>
              <ul className="list-disc pl-5 space-y-0.5 text-yellow-800 dark:text-yellow-200">
                {summary.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </section>
          )}
          <ExportButtons summary={summary} />
        </>
      )}
    </div>
  );
}
