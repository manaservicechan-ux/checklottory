import { get, set, keys, del } from "idb-keyval";
import type { HistoryRecord, CheckSummary } from "@/lib/lottery/types";

const PREFIX = "draw:";

function makeId(): string {
  return PREFIX + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

export async function saveHistory(summary: CheckSummary): Promise<HistoryRecord> {
  const record: HistoryRecord = {
    id: makeId(),
    savedAt: new Date().toISOString(),
    summary,
  };
  await set(record.id, record);
  return record;
}

export async function listHistory(): Promise<HistoryRecord[]> {
  const allKeys = await keys();
  const records: HistoryRecord[] = [];
  for (const k of allKeys) {
    if (typeof k === "string" && k.startsWith(PREFIX)) {
      const r = await get<HistoryRecord>(k);
      if (r) records.push(r);
    }
  }
  return records.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export async function getHistory(id: string): Promise<HistoryRecord | undefined> {
  return get<HistoryRecord>(id);
}

export async function deleteHistory(id: string): Promise<void> {
  await del(id);
}
