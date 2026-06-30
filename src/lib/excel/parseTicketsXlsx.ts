import * as XLSX from "xlsx";
import type { Ticket } from "@/lib/lottery/types";

export interface ParseTicketsResult {
  tickets: Ticket[];
  invalid: string[];
  bySheet: { sheet: string; count: number }[];
}

// Thai lottery tickets are exactly 6 digits (000000–999999). We only accept
// tokens that match exactly to avoid synthesizing fake tickets from row
// numbers, dates, header text, or notes (e.g. "เลขสลาก 6 หลัก" → "000006").
// Cells containing a single 5-digit numeric value are also accepted with one
// leading zero padded, since Excel sometimes strips a single leading zero from
// numeric cells (006432 → 6432).
const SIX_DIGIT = /^\d{6}$/;
const FIVE_DIGIT = /^\d{5}$/;

export async function parseTicketsXlsx(file: File): Promise<ParseTicketsResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const tickets: Ticket[] = [];
  const invalid: string[] = [];
  const bySheet: { sheet: string; count: number }[] = [];

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: false,
    }) as unknown[][];

    let sheetCount = 0;
    let cellIdx = 0;
    for (const row of rows) {
      if (!Array.isArray(row)) continue;
      for (const cell of row) {
        if (cell === null || cell === undefined) continue;
        const raw = String(cell).trim();
        if (!raw) continue;
        // A cell with a single 5-digit numeric value is treated as a stripped
        // ticket; otherwise we split into tokens and require each to be 6 digits.
        const tokens = raw.split(/[\s,;\n\r\t|]+/).filter(Boolean);
        const singleFiveDigit =
          tokens.length === 1 && FIVE_DIGIT.test(tokens[0]) ? tokens[0] : null;

        for (const tok of tokens) {
          let num: string | null = null;
          if (SIX_DIGIT.test(tok)) {
            num = tok;
          } else if (singleFiveDigit && tok === singleFiveDigit) {
            num = "0" + tok;
          }
          if (num) {
            tickets.push({
              number: num,
              source: `${file.name}${wb.SheetNames.length > 1 ? `:${sheetName}` : ""}`,
              cellIndex: cellIdx,
            });
            sheetCount++;
            cellIdx++;
          } else if (/^\d{7,}$/.test(tok)) {
            // Numeric but wrong length — likely a typo or merged value.
            invalid.push(tok);
          }
        }
      }
    }
    bySheet.push({ sheet: sheetName, count: sheetCount });
  }

  return { tickets, invalid, bySheet };
}

export interface MultiParseResult {
  tickets: Ticket[];
  invalid: string[];
  perFile: { file: string; count: number; sheets: { sheet: string; count: number }[] }[];
}

export async function parseAllTicketFiles(files: File[]): Promise<MultiParseResult> {
  const tickets: Ticket[] = [];
  const invalid: string[] = [];
  const perFile: MultiParseResult["perFile"] = [];
  for (const f of files) {
    const r = await parseTicketsXlsx(f);
    tickets.push(...r.tickets);
    invalid.push(...r.invalid);
    perFile.push({
      file: f.name,
      count: r.tickets.length,
      sheets: r.bySheet,
    });
  }
  return { tickets, invalid, perFile };
}
