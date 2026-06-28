export type PrizeTier =
  | "first"
  | "firstAdjacent"
  | "second"
  | "third"
  | "fourth"
  | "fifth"
  | "front3"
  | "back3"
  | "back2"
  | "n3Straight"
  | "n3Permutation"
  | "n3Two"
  | "n3Special";

export interface PrizeEntry {
  numbers: string[];
  amount: number;
}

export type Prizes = Partial<Record<PrizeTier, PrizeEntry>>;

export interface DrawResult {
  drawDate: string;
  drawLabel: string;
  prizes: Prizes;
}

export interface Ticket {
  number: string;
  source: string;
  cellIndex?: number;
}

export interface WinRecord {
  ticket: Ticket;
  tier: PrizeTier;
  amount: number;
  reason: string;
}

export interface CheckSummary {
  drawResult: DrawResult;
  tickets: Ticket[];
  wins: WinRecord[];
  totalAmount: number;
  totalWinTickets: number;
  warnings: string[];
}

export interface HistoryRecord {
  id: string;
  savedAt: string;
  summary: CheckSummary;
}
