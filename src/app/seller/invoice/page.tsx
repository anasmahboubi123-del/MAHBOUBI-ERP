// src/app/seller/invoice/page.tsx
import { Suspense } from "react";
import InvoiceContent from "./InvoiceContent";

export default function InvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" dir="rtl">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            <span>جاري تحميل الفاتورة...</span>
          </div>
        </div>
      }
    >
      <InvoiceContent />
    </Suspense>
  );
}