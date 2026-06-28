import type { TextItem } from "pdfjs-dist/types/src/display/api";

interface ItemWithPos {
  text: string;
  x: number;
  y: number;
}

// pdfjs may emit codepoints from the font's Private Use Area (U+F700–U+F8FF)
// when a Thai font uses custom glyph mappings. Strip them so regexes still match.
function cleanText(text: string): string {
  return text
    .replace(/[-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function pdfBufferToLines(buf: Buffer): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Disable fake worker setup in Node; legacy build can parse on the main thread.
  pdfjs.GlobalWorkerOptions.workerSrc =
    "pdfjs-dist/legacy/build/pdf.worker.mjs";
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buf),
    useSystemFonts: true,
  }).promise;

  const lines: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const items: ItemWithPos[] = (tc.items as TextItem[])
      .filter((it) => typeof it.str === "string")
      .map((it) => ({
        text: it.str,
        x: it.transform[4],
        y: it.transform[5],
      }));

    // Group by y (rounded). PDF y-axis: larger y = higher on page.
    const buckets = new Map<number, ItemWithPos[]>();
    for (const it of items) {
      const key = Math.round(it.y);
      const arr = buckets.get(key) ?? [];
      arr.push(it);
      buckets.set(key, arr);
    }

    // Sort buckets top-down (descending y)
    const ys = [...buckets.keys()].sort((a, b) => b - a);
    for (const y of ys) {
      const row = (buckets.get(y) ?? []).sort((a, b) => a.x - b.x);
      const text = row.map((r) => r.text).join(" ").replace(/\s+/g, " ").trim();
      const cleaned = cleanText(text);
      if (cleaned) lines.push(cleaned);
    }
  }

  doc.cleanup();
  return lines;
}
