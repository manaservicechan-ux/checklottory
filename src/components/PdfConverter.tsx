"use client";

import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";

export function PdfConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function handleConvert() {
    setError("");
    setDone("");
    if (files.length !== 1) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("pdf", files[0]);
      const res = await fetch("/api/pdf-to-xlsx", { method: "POST", body: form });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "แปลงไม่สำเร็จ" }));
        throw new Error(j.error || "แปลงไม่สำเร็จ");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const cd = res.headers.get("content-disposition") || "";
      const match = cd.match(/filename="?([^"]+)"?/);
      a.href = url;
      a.download = match?.[1] || files[0].name.replace(/\.pdf$/i, ".xlsx");
      a.click();
      URL.revokeObjectURL(url);
      setDone(`ดาวน์โหลด ${a.download} เรียบร้อย — ใช้ไฟล์นี้ในช่อง "ไฟล์ผลรางวัล" ด้านล่าง`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
      <h2 className="text-base font-semibold mb-1">
        🔄 แปลง PDF ผลรางวัล → Excel
      </h2>
      <p className="text-xs text-gray-500 mb-3">
        ไม่อยากกรอก Excel เอง? อัปโหลด PDF ของสำนักงานสลากฯ
        ระบบจะแปลงเป็น Excel ในรูปแบบ template ให้
      </p>
      <UploadZone
        label="ลาก PDF ผลรางวัลของสำนักงานสลากฯ มาวาง"
        accept={{ "application/pdf": [".pdf"] }}
        multiple={false}
        files={files}
        onFiles={setFiles}
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={handleConvert}
          disabled={files.length !== 1 || busy}
          className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white text-sm font-medium"
        >
          {busy ? "กำลังแปลง..." : "แปลง & ดาวน์โหลด Excel"}
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
        {done && <span className="text-sm text-emerald-600">{done}</span>}
      </div>
    </section>
  );
}
