import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { pdfBufferToLines } from "@/lib/pdf/pdfToLines";
import { parseLines, drawToTemplateRows } from "@/lib/pdf/parsePdfLines";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("pdf");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "ไม่พบไฟล์ PDF" }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());

    const lines = await pdfBufferToLines(buf);
    const draw = parseLines(lines);

    if (!draw.prizes.first) {
      return NextResponse.json(
        {
          error:
            "แปลงไม่สำเร็จ ไม่พบรางวัลที่ 1 — ไฟล์อาจไม่ใช่ผลรางวัลทางการของสำนักงานสลากฯ",
        },
        { status: 422 },
      );
    }

    const rows = drawToTemplateRows(draw);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 32 }, { wch: 60 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, "ผลรางวัล");
    const out = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

    const baseName = file.name.replace(/\.pdf$/i, "") || "draw";
    return new NextResponse(new Uint8Array(out), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${baseName}.xlsx"`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
