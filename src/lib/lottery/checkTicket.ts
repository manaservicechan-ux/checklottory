import type { DrawResult, Ticket, WinRecord, PrizeTier } from "./types";
import { PRIZE_LABELS } from "./prizes";

function record(
  ticket: Ticket,
  tier: PrizeTier,
  amount: number,
  matchedNumber: string,
): WinRecord {
  return {
    ticket,
    tier,
    amount,
    reason: `${PRIZE_LABELS[tier]} ตรงกับ ${matchedNumber}`,
  };
}

export function checkTicket(ticket: Ticket, draw: DrawResult): WinRecord[] {
  const wins: WinRecord[] = [];
  const num = ticket.number;
  if (!/^\d{6}$/.test(num)) return wins;

  const p = draw.prizes;

  if (p.first?.numbers.includes(num))
    wins.push(record(ticket, "first", p.first.amount, num));

  if (p.firstAdjacent?.numbers.includes(num))
    wins.push(record(ticket, "firstAdjacent", p.firstAdjacent.amount, num));

  if (p.second?.numbers.includes(num))
    wins.push(record(ticket, "second", p.second.amount, num));

  if (p.third?.numbers.includes(num))
    wins.push(record(ticket, "third", p.third.amount, num));

  if (p.fourth?.numbers.includes(num))
    wins.push(record(ticket, "fourth", p.fourth.amount, num));

  if (p.fifth?.numbers.includes(num))
    wins.push(record(ticket, "fifth", p.fifth.amount, num));

  const front3 = num.slice(0, 3);
  if (p.front3?.numbers.includes(front3))
    wins.push(record(ticket, "front3", p.front3.amount, front3));

  const back3 = num.slice(-3);
  if (p.back3?.numbers.includes(back3))
    wins.push(record(ticket, "back3", p.back3.amount, back3));

  const back2 = num.slice(-2);
  if (p.back2?.numbers.includes(back2))
    wins.push(record(ticket, "back2", p.back2.amount, back2));

  return wins;
}

export function checkAllTickets(tickets: Ticket[], draw: DrawResult) {
  const wins: WinRecord[] = [];
  for (const t of tickets) wins.push(...checkTicket(t, draw));
  const totalAmount = wins.reduce((s, w) => s + w.amount, 0);
  const totalWinTickets = new Set(wins.map((w) => `${w.ticket.source}::${w.ticket.number}`)).size;
  return { wins, totalAmount, totalWinTickets };
}
