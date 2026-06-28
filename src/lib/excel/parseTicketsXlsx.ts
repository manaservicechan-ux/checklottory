import * as XLSX from "xlsx";
import type { Ticket } from "@/lib/lottery/types";

export interface ParseTicketsResult {
  tickets: Ticket[];
  invalid: string[];
  bySheet: { sheet: string; count: number }[];
}

function pad6(raw: string): string {
  return raw.replace(/\D/g, "").padStart(6, "0");
}

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
        // Allow tokens within a cell to be split by space/comma/etc.
        const tokens = raw.split(/[\s,;\n\r\t|]+/).filter(Boolean);
        for (const tok of tokens) {
          const digits = tok.replace(/\D/g, "");
          if (digits.length === 0) continue;
          // Treat any 1-6 digit numeric token as a ticket (left-pad to 6).
          // Anything longer or mixed alpha is treated as invalid.
          if (/^\d{1,6}$/.test(tok)) {
            const num = pad6(tok);
            tickets.push({
              number: num,
              source: `${file.name}${wb.SheetNames.length > 1 ? `:${sheetName}` : ""}`,
              cellIndex: cellIdx,
            });
            sheetCount++;
            cellIdx++;
          } else if (/\d/.test(tok)) {
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
