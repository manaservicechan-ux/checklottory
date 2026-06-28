import * as XLSX from "xlsx";

const TEMPLATE_ROWS: (string | number)[][] = [
  ["เลขสลาก 6 หลัก", "หมายเหตุ (ถ้ามี)"],
  ["287184", "ตัวอย่าง — แทนที่ด้วยเลขจริง"],
  ["123456", ""],
  ["654321", ""],
];

export function createTicketsTemplateBlob(): Blob {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(TEMPLATE_ROWS);
  ws["!cols"] = [{ wch: 20 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws, "เลขสลาก");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function downloadTicketsTemplate(filename = "tickets-template.xlsx") {
  const blob = createTicketsTemplateBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
