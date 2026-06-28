import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sarabun = Sarabun({
  variable: "--font-sans",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ระบบตรวจสลากกินแบ่งรัฐบาล",
  description: "ตรวจสลากกินแบ่งจากภาพใบจอง + PDF ผลรางวัล โดยใช้ Claude Vision",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold">
              🎟️ ระบบตรวจสลากกินแบ่งรัฐบาล
            </Link>
            <nav className="text-sm flex gap-4">
              <Link href="/" className="hover:underline">
                ตรวจรางวัล
              </Link>
              <Link href="/history" className="hover:underline">
                ประวัติย้อนหลัง
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
        <footer className="border-t border-gray-200 dark:border-gray-800 py-4 text-center text-xs text-gray-500">
          Powered by Claude Vision • ไม่เก็บข้อมูลบน server (ประวัติเก็บใน browser)
        </footer>
      </body>
    </html>
  );
}
