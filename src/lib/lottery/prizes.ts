import type { PrizeTier } from "./types";

export const PRIZE_LABELS: Record<PrizeTier, string> = {
  first: "รางวัลที่ 1",
  firstAdjacent: "รางวัลข้างเคียงรางวัลที่ 1",
  second: "รางวัลที่ 2",
  third: "รางวัลที่ 3",
  fourth: "รางวัลที่ 4",
  fifth: "รางวัลที่ 5",
  front3: "เลขหน้า 3 ตัว",
  back3: "เลขท้าย 3 ตัว",
  back2: "เลขท้าย 2 ตัว",
  n3Straight: "สลาก N3 สามตรง",
  n3Permutation: "สลาก N3 สามสลับหลัก",
  n3Two: "สลาก N3 สองตรง",
  n3Special: "สลาก N3 รางวัลพิเศษ",
};

export const PRIZE_ORDER: PrizeTier[] = [
  "first",
  "firstAdjacent",
  "second",
  "third",
  "fourth",
  "fifth",
  "front3",
  "back3",
  "back2",
  "n3Straight",
  "n3Permutation",
  "n3Two",
  "n3Special",
];

export const DEFAULT_AMOUNTS: Record<PrizeTier, number> = {
  first: 6_000_000,
  firstAdjacent: 100_000,
  second: 200_000,
  third: 80_000,
  fourth: 40_000,
  fifth: 20_000,
  front3: 4_000,
  back3: 4_000,
  back2: 2_000,
  n3Straight: 3_963,
  n3Permutation: 683,
  n3Two: 231,
  n3Special: 810_198,
};

export function formatThaiBaht(n: number): string {
  return n.toLocaleString("th-TH") + " บาท";
}
