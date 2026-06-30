import { getDocumentProxy } from "unpdf";

interface ItemWithPos {
  text: string;
  x: number;
  y: number;
}

interface UnpdfTextItem {
  str: string;
  transform: number[];
}

function cleanText(text: string): string {
  return text
    .replace(/[-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function pdfBufferToLines(buf: Buffer): Promise<string[]> {
  const doc = await getDocumentProxy(new Uint8Array(buf), {
    useSystemFonts: true,
  });

  const lines: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const items: ItemWithPos[] = (tc.items as UnpdfTextItem[])
      .filter((it) => typeof it.str === "string")
      .map((it) => ({
        text: it.str,
        x: it.transform[4],
        y: it.transform[5],
      }));

    const buckets = new Map<number, ItemWithPos[]>();
    for (const it of items) {
      const key = Math.round(it.y);
      const arr = buckets.get(key) ?? [];
      arr.push(it);
      buckets.set(key, arr);
    }

    const ys = [...buckets.keys()].sort((a, b) => b - a);
    for (const y of ys) {
      const row = (buckets.get(y) ?? []).sort((a, b) => a.x - b.x);
      const text = row.map((r) => r.text).join(" ").replace(/\s+/g, " ").trim();
      const cleaned = cleanText(text);
      if (cleaned) lines.push(cleaned);
    }
  }

  doc.destroy();
  return lines;
}
