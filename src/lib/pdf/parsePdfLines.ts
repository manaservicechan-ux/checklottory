import type { DrawResult, PrizeTier, Prizes } from "@/lib/lottery/types";
import { DEFAULT_AMOUNTS } from "@/lib/lottery/prizes";

const THAI_MONTHS: Record<string, number> = {
  "มกราคม": 1, "กุมภาพันธ์": 2, "มีนาคม": 3, "เมษายน": 4,
  "พฤษภาคม": 5, "มิถุนายน": 6, "กรกฎาคม": 7, "สิงหาคม": 8,
  "กันยายน": 9, "ตุลาคม": 10, "พฤศจิกายน": 11, "ธันวาคม": 12,
};

function thaiDateToIso(label: string): string {
  const m = label.match(/(\d{1,2})\s*([฀-๿]+)\s*(\d{4})/);
  if (!m) return "";
  const day = parseInt(m[1], 10);
  const month = THAI_MONTHS[m[2]];
  const yearBe = parseInt(m[3], 10);
  if (!month || !yearBe) return "";
  const yearCe = yearBe > 2400 ? yearBe - 543 : yearBe;
  return `${yearCe.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function findLineIndex(lines: string[], pattern: RegExp, fromIdx = 0): number {
  for (let i = fromIdx; i < lines.length; i++) {
    if (pattern.test(lines[i])) return i;
  }
  return -1;
}

function findDataLineAfter(
  lines: string[],
  startIdx: number,
): { idx: number; line: string } | null {
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/รางวัลละ|บาท|ผลการ|นโยบาย|วิสัยทัศน|งวด|Internet|www\./.test(line)) continue;
    if (/^[\d,\s.]+$/.test(line) && /,/.test(line)) continue;
    if (/\d/.test(line)) return { idx: i, line };
  }
  return null;
}

export function parseLines(lines: string[]): DrawResult {
  const drawIdx = findLineIndex(lines, /งวดวันที่/);
  const drawLabel = drawIdx >= 0 ? lines[drawIdx].trim() : "";
  const drawDate = thaiDateToIso(drawLabel);

  const prizes: Prizes = {};

  // ----- รางวัลที่ 1 + เลขหน้า 3 ตัว + เลขท้าย 3 ตัว + เลขท้าย 2 ตัว -----
  // pdfplumber: "287184 434 758 007 721 48" (single line, 6 tokens)
  // pdfjs:      "287184 434 758 007 721" + "48" (split into 2 lines)
  const headerIdx = findLineIndex(
    lines,
    /รางวัลที่\s*1.*เลข.+2\s*ตัว|รางวัลที่\s*1.*ท้าย\s*2|รางวัลที่\s*1\s+เลข/,
  );
  if (headerIdx >= 0) {
    const data = findDataLineAfter(lines, headerIdx);
    if (data) {
      let tokens = data.line.trim().split(/\s+/);
      // If first line is only 5 tokens (missing back2), look ahead for a 2-digit token
      if (tokens.length === 5) {
        const next = findDataLineAfter(lines, data.idx);
        if (next) {
          const nextTokens = next.line.trim().split(/\s+/);
          if (nextTokens.length >= 1 && /^\d{2}$/.test(nextTokens[0])) {
            tokens = [...tokens, nextTokens[0]];
          }
        }
      }
      if (tokens.length >= 6) {
        const [first, f3a, f3b, b3a, b3b, b2] = tokens;
        if (/^\d{6}$/.test(first))
          prizes.first = { numbers: [first], amount: DEFAULT_AMOUNTS.first };
        if (/^\d{3}$/.test(f3a) && /^\d{3}$/.test(f3b))
          prizes.front3 = { numbers: [f3a, f3b], amount: DEFAULT_AMOUNTS.front3 };
        if (/^\d{3}$/.test(b3a) && /^\d{3}$/.test(b3b))
          prizes.back3 = { numbers: [b3a, b3b], amount: DEFAULT_AMOUNTS.back3 };
        if (/^\d{2}$/.test(b2))
          prizes.back2 = { numbers: [b2], amount: DEFAULT_AMOUNTS.back2 };
      }
    }
  }

  // ----- ข้างเคียงรางวัลที่ 1 + รางวัลที่ 2 -----
  // pdfplumber: "2 8 7 1 8 3 2 8 7 1 8 5 124998 281342 ..." (single line)
  // pdfjs:      "2 8 7 1 8 3 2 8 7 1 8 5" + "124998 281342 ..." (split)
  const adjIdx = findLineIndex(lines, /รางวัลข[า้]างเคียง|รางวัลขางเคียง/);
  if (adjIdx >= 0) {
    for (let i = adjIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (/รางวัลละ|บาท/.test(line)) continue;
      if (!/^[\d\s]+$/.test(line)) break;
      const stripped = line.replace(/\s+/g, "");
      if (stripped.length >= 12) {
        const adj1 = stripped.slice(0, 6);
        const adj2 = stripped.slice(6, 12);
        prizes.firstAdjacent = {
          numbers: [adj1, adj2],
          amount: DEFAULT_AMOUNTS.firstAdjacent,
        };
        // 2nd prize: either same line (after adj) or next line
        let rest = stripped.slice(12);
        if (rest.length < 30) {
          // Look at next data line for 5×6-digit numbers
          const next = findDataLineAfter(lines, i);
          if (next) {
            const nextNums = next.line.match(/\b\d{6}\b/g) ?? [];
            if (nextNums.length >= 5) {
              prizes.second = {
                numbers: nextNums.slice(0, 5),
                amount: DEFAULT_AMOUNTS.second,
              };
            }
          }
        } else {
          const second: string[] = [];
          for (let k = 0; k + 6 <= rest.length && second.length < 5; k += 6) {
            second.push(rest.slice(k, k + 6));
          }
          if (second.length === 5) {
            prizes.second = { numbers: second, amount: DEFAULT_AMOUNTS.second };
          }
        }
        break;
      }
    }
  }

  // ----- รางวัลที่ 3 (10 numbers) -----
  const thirdIdx = findLineIndex(lines, /^รางวัลที่\s*3\b/);
  if (thirdIdx >= 0) {
    const data = findDataLineAfter(lines, thirdIdx);
    if (data) {
      const nums = data.line.match(/\b\d{6}\b/g) ?? [];
      if (nums.length >= 10) {
        prizes.third = { numbers: nums.slice(0, 10), amount: DEFAULT_AMOUNTS.third };
      }
    }
  }

  // ----- รางวัลที่ 4 (50 numbers across 5 lines) -----
  const fourthIdx = findLineIndex(lines, /^รางวัลที่\s*4\b/);
  if (fourthIdx >= 0) {
    const collected: string[] = [];
    for (let i = fourthIdx + 1; i < lines.length && collected.length < 50; i++) {
      const line = lines[i].trim();
      if (/^รางวัลที่\s*5/.test(line)) break;
      if (/รางวัลละ|บาท/.test(line)) continue;
      const nums = line.match(/\b\d{6}\b/g) ?? [];
      collected.push(...nums);
    }
    if (collected.length >= 50) {
      prizes.fourth = { numbers: collected.slice(0, 50), amount: DEFAULT_AMOUNTS.fourth };
    }
  }

  // ----- รางวัลที่ 5 (100 numbers across 10 lines) -----
  const fifthIdx = findLineIndex(lines, /^รางวัลที่\s*5\b/);
  if (fifthIdx >= 0) {
    const collected: string[] = [];
    for (let i = fifthIdx + 1; i < lines.length && collected.length < 100; i++) {
      const line = lines[i].trim();
      if (/ผลการออก|รางวัลสาม|นโยบาย/.test(line)) break;
      if (/รางวัลละ|บาท/.test(line)) continue;
      const nums = line.match(/\b\d{6}\b/g) ?? [];
      collected.push(...nums);
    }
    if (collected.length >= 100) {
      prizes.fifth = { numbers: collected.slice(0, 100), amount: DEFAULT_AMOUNTS.fifth };
    }
  }

  // ----- N3: รางวัลสามตรง + รางวัลสามสลับหลัก -----
  // Line: "184 148 418 481 814 841" → straight = first, permutation = next 5
  const n3StraightIdx = findLineIndex(lines, /รางวัลสามตรง/);
  if (n3StraightIdx >= 0) {
    for (let i = n3StraightIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || /รางวัลละ|บาท|รางวัลสาม/.test(line)) continue;
      if (/นโยบาย|วิสัยทัศ|ผลการออก/.test(line)) break;
      const threes = line.split(/\s+/).filter((t) => /^\d{3}$/.test(t));
      if (threes.length >= 6) {
        prizes.n3Straight = {
          numbers: [threes[0]],
          amount: DEFAULT_AMOUNTS.n3Straight,
        };
        prizes.n3Permutation = {
          numbers: threes.slice(1, 6),
          amount: DEFAULT_AMOUNTS.n3Permutation,
        };
        break;
      }
    }
  }

  // ----- N3: รางวัลสองตรง + รางวัลพิเศษ -----
  // 2-digit token (สองตรง) and a longer numeric token (รางวัลพิเศษ) follow.
  const n3TwoIdx = findLineIndex(lines, /รางวัลสองตรง|รางวัลพิเศษ/);
  if (n3TwoIdx >= 0) {
    for (let i = n3TwoIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || /รางวัลละ|บาท/.test(line)) continue;
      if (/นโยบาย|วิสัยทัศ|ผลการออก/.test(line)) break;
      const tokens = line.split(/\s+/);
      for (const tok of tokens) {
        if (/^\d{2}$/.test(tok) && !prizes.n3Two) {
          prizes.n3Two = { numbers: [tok], amount: DEFAULT_AMOUNTS.n3Two };
        } else if (/^\d{8,}$/.test(tok) && !prizes.n3Special) {
          prizes.n3Special = { numbers: [tok], amount: DEFAULT_AMOUNTS.n3Special };
        }
      }
      if (prizes.n3Two && prizes.n3Special) break;
    }
  }

  return { drawDate, drawLabel, prizes };
}

export function drawToTemplateRows(draw: DrawResult): (string | number)[][] {
  const j = (arr: string[] | undefined) => (arr ?? []).join(", ");
  const get = (t: PrizeTier) => draw.prizes[t]?.numbers;

  return [
    ["ประเภทรางวัล", "หมายเลข", "คำอธิบาย"],
    ["งวด", draw.drawLabel || draw.drawDate, "วันที่งวด"],
    ["รางวัลที่ 1", j(get("first")), "1 หมายเลข 6 หลัก"],
    ["รางวัลข้างเคียงรางวัลที่ 1", j(get("firstAdjacent")), "2 หมายเลข"],
    ["รางวัลที่ 2", j(get("second")), "5 หมายเลข"],
    ["รางวัลที่ 3", j(get("third")), "10 หมายเลข"],
    ["รางวัลที่ 4", j(get("fourth")), "50 หมายเลข"],
    ["รางวัลที่ 5", j(get("fifth")), "100 หมายเลข"],
    ["เลขหน้า 3 ตัว", j(get("front3")), "2 หมายเลข"],
    ["เลขท้าย 3 ตัว", j(get("back3")), "2 หมายเลข"],
    ["เลขท้าย 2 ตัว", j(get("back2")), "1 หมายเลข"],
    ["รางวัลสามตรง (N3)", j(get("n3Straight")), "1 หมายเลข 3 หลัก"],
    ["รางวัลสามสลับหลัก (N3)", j(get("n3Permutation")), "5 หมายเลข"],
    ["รางวัลสองตรง (N3)", j(get("n3Two")), "1 หมายเลข 2 หลัก"],
    ["รางวัลพิเศษ (N3)", j(get("n3Special")), "1 หมายเลข"],
  ];
}
