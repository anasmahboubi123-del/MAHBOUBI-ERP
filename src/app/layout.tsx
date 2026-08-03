import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({ 
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "المحبوبي — نظام إدارة الورشة",
  description: "نظام إدارة محل الأثاث والتنجيد المحبوبي",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="antialiased" style={{ fontFamily: "var(--font-cairo), Cairo, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}