import type { CheckSummary } from "@/lib/lottery/types";
import { PRIZE_LABELS, formatThaiBaht } from "@/lib/lottery/prizes";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(summary: CheckSummary): string {
  const draw = summary.drawResult;
  const rows = summary.wins
    .map(
      (w) => `<tr>
      <td class="num">${escapeHtml(w.ticket.number)}</td>
      <td>${escapeHtml(PRIZE_LABELS[w.tier])}</td>
      <td class="amt">${escapeHtml(formatThaiBaht(w.amount))}</td>
      <td class="src">${escapeHtml(w.ticket.source)}</td>
    </tr>`,
    )
    .join("");

  const title = `รายงานผลตรวจสลาก – ${draw.drawLabel || draw.drawDate || ""}`;

  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Sarabun", "Tahoma", "TH Sarabun New", "Noto Sans Thai", sans-serif;
    color: #111;
    margin: 0;
    padding: 0;
    font-size: 12pt;
    line-height: 1.4;
  }
  h1 { font-size: 18pt; margin: 0 0 4mm; }
  .meta { font-size: 11pt; color: #444; margin-bottom: 4mm; }
  .total {
    background: #ecfdf5;
    border: 1px solid #34d399;
    border-radius: 6px;
    padding: 4mm;
    margin: 4mm 0;
  }
  .total .big { font-size: 20pt; font-weight: 700; color: #047857; }
  table { width: 100%; border-collapse: collapse; margin-top: 3mm; }
  th, td { padding: 2mm 3mm; text-align: left; border-bottom: 1px solid #ddd; }
  th { background: #f3f4f6; font-weight: 600; font-size: 11pt; }
  .num { font-family: "Consolas", "Courier New", monospace; font-weight: 700; }
  .amt { text-align: right; font-family: "Consolas", "Courier New", monospace; }
  .src { font-size: 10pt; color: #555; }
  .warnings {
    background: #fef3c7; border: 1px solid #fbbf24; border-radius: 4px;
    padding: 3mm; margin-top: 4mm; font-size: 10pt;
  }
  .actions { padding: 8mm; text-align: center; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
  .actions button {
    padding: 8px 18px; font-size: 14px; cursor: pointer;
    background: #2563eb; color: #fff; border: 0; border-radius: 6px;
    margin: 0 4px;
  }
  .actions button.secondary { background: #6b7280; }
  @media print { .actions { display: none; } body { font-size: 10pt; } }
</style>
</head>
<body>
  <div class="actions">
    <button onclick="window.print()">🖨️ พิมพ์ / Save as PDF</button>
    <button class="secondary" onclick="window.close()">ปิด</button>
    <div style="margin-top:6px;font-size:12px;color:#666;">
      กด "พิมพ์" แล้วเลือก <em>Destination: Save as PDF</em> เพื่อบันทึกเป็นไฟล์ PDF
    </div>
  </div>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">
    งวด: ${escapeHtml(draw.drawLabel || draw.drawDate || "-")}<br />
    จำนวนใบทั้งหมดที่ตรวจ: ${summary.tickets.length} ใบ
  </div>
  <div class="total">
    <div>ยอดรวมเงินรางวัล</div>
    <div class="big">${escapeHtml(formatThaiBaht(summary.totalAmount))}</div>
    <div>ถูกรางวัล ${summary.totalWinTickets} ใบ</div>
  </div>
  ${
    summary.wins.length === 0
      ? '<p style="color:#666;">ไม่มีเลขที่ถูกรางวัลในครั้งนี้</p>'
      : `<table>
    <thead>
      <tr><th>เลขสลาก</th><th>ประเภทรางวัล</th><th style="text-align:right;">จำนวนเงิน</th><th>ที่มา</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`
  }
  ${
    summary.warnings.length > 0
      ? `<div class="warnings">
      <strong>ข้อมูลเพิ่มเติม:</strong>
      <ul>${summary.warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul>
    </div>`
      : ""
  }
</body>
</html>`;
}

export function openPrintReport(summary: CheckSummary) {
  const html = buildHtml(summary);
  const win = window.open("", "_blank", "width=900,height=900");
  if (!win) {
    alert("ไม่สามารถเปิดหน้าต่างพิมพ์ได้ — โปรดอนุญาต popup สำหรับเว็บนี้");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
