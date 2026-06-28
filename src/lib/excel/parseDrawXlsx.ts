import * as XLSX from "xlsx";
import type { DrawResult, PrizeTier, Prizes } from "@/lib/lottery/types";
import { DEFAULT_AMOUNTS } from "@/lib/lottery/prizes";

interface ParsedRow {
  label: string;
  value: string;
}

const TIER_KEYWORDS: { tier: PrizeTier; patterns: RegExp[] }[] = [
  { tier: "firstAdjacent", patterns: [/ข้างเคียง/, /ข า ง เ ค ี ย ง/] },
  { tier: "first", patterns: [/รางวัลที่\s*1(?!\d)/, /ที่\s*1\b/, /^first$/i] },
  { tier: "second", patterns: [/รางวัลที่\s*2/, /ที่\s*2\b/, /^second$/i] },
  { tier: "third", patterns: [/รางวัลที่\s*3/, /ที่\s*3\b/, /^third$/i] },
  { tier: "fourth", patterns: [/รางวัลที่\s*4/, /ที่\s*4\b/, /^fourth$/i] },
  { tier: "fifth", patterns: [/รางวัลที่\s*5/, /ที่\s*5\b/, /^fifth$/i] },
  { tier: "front3", patterns: [/เลขหน้า\s*3/, /^front3$/i] },
  { tier: "back3", patterns: [/เลขท้าย\s*3/, /^back3$/i] },
  { tier: "back2", patterns: [/เลขท้าย\s*2/, /^back2$/i] },
];

const DRAW_KEYS = [/^งวด/, /draw/i, /date/i];

function matchTier(label: string): PrizeTier | null {
  for (const { tier, patterns } of TIER_KEYWORDS) {
    if (patterns.some((p) => p.test(label))) return tier;
  }
  return null;
}

function isDrawLabelRow(label: string): boolean {
  return DRAW_KEYS.some((p) => p.test(label));
}

function splitNumbers(value: string): string[] {
  return value
    .split(/[\s,;\n\r\t|]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const THAI_MONTHS: Record<string, number> = {
  "มกราคม": 1, "กุมภาพันธ์": 2, "มีนาคม": 3, "เมษายน": 4,
  "พฤษภาคม": 5, "มิถุนายน": 6, "กรกฎาคม": 7, "สิงหาคม": 8,
  "กันยายน": 9, "ตุลาคม": 10, "พฤศจิกายน": 11, "ธันวาคม": 12,
};

function parseDrawDate(value: string): string {
  // Already ISO?
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // Thai: "16 มิถุนายน 2569"
  const thai = value.match(/(\d{1,2})\s*([฀-๿]+)\s*(\d{4})/);
  if (thai) {
    const day = parseInt(thai[1], 10);
    const month = THAI_MONTHS[thai[2]];
    const yearBe = parseInt(thai[3], 10);
    if (month && yearBe) {
      const yearCe = yearBe > 2400 ? yearBe - 543 : yearBe;
      return `${yearCe.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    }
  }
  return "";
}

export async function parseDrawXlsx(file: File): Promise<DrawResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("ไม่พบ sheet ในไฟล์ Excel");
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error("Sheet ว่างเปล่า");

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    header: 1,
    raw: false,
  }) as unknown as unknown[][];

  const parsed: ParsedRow[] = [];
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    const a = String(row[0] ?? "").trim();
    const b = String(row[1] ?? "").trim();
    if (!a) continue;
    parsed.push({ label: a, value: b });
  }

  const prizes: Prizes = {};
  let drawLabel = "";
  let drawDate = "";

  for (const { label, value } of parsed) {
    if (isDrawLabelRow(label)) {
      drawLabel = value || drawLabel;
      drawDate = parseDrawDate(value);
      continue;
    }
    const tier = matchTier(label);
    if (!tier) continue;
    const numbers = splitNumbers(value);
    if (numbers.length === 0) continue;
    const existing = prizes[tier]?.numbers ?? [];
    prizes[tier] = {
      numbers: [...existing, ...numbers],
      amount: DEFAULT_AMOUNTS[tier],
    };
  }

  if (!prizes.first) {
    throw new Error(
      "ไม่พบรางวัลที่ 1 ในไฟล์ Excel — กรุณาใช้รูปแบบตามไฟล์ template",
    );
  }

  return { drawDate, drawLabel: drawLabel || drawDate, prizes };
}
