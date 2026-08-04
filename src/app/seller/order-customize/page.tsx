"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Printer, Eye, FileText, Settings, Check, ChevronRight,
  ArrowRight, Tag, Info, FileCheck, PenTool, QrCode, Stamp,
  Globe, Phone, Download,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import PrintModal from "@/features/order-center/components/PrintModal";
import type { OrderItem, DocumentType, PrintOptions } from "@/features/order-center/types";

const C = { green: "#1B5E38", gold: "#C9A84C", dark: "#0D1F17", cream: "#F5F0E8" };

// ✅ FIX: Wrap in Suspense boundary
export default function OrderCustomizePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full" />
      </div>
    }>
      <OrderCustomizeContent />
    </Suspense>
  );
}

function OrderCustomizeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const typeParam = searchParams.get("type") as DocumentType;

  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    documentType: typeParam || "devis",
    printVariant: "client",
    language: "ar",
    includeProductionDetails: true,
    includePrices: true,
    includeCosts: false,
    includeSignatures: true,
    includeQrCode: false,
    includeStamp: false,
  });

  useEffect(() => {
    if (!orderId) return;
    loadData();
  }, [orderId]);

  async function loadData() {
    setLoading(true);
    const [{ data: orderData }, { data: itemsData }] = await Promise.all([
      supabase.from("orders").select("*").eq("id", orderId).single(),
      supabase.from("order_items").select("*").eq("order_id", orderId),
    ]);

    setOrder(orderData);
    const convertedItems: OrderItem[] = (itemsData || []).map((it: any) => ({
      id: it.id,
      orderItemId: it.id,
      productType: it.product_type,
      productName: it.product_name,
      quantity: it.quantity,
      unitPrice: it.unit_price,
      totalPrice: it.total_price,
      details: it.details || {},
      calculations: it.calculations || {},
      thumbnailUrl: it.thumbnail_url,
      addedAt: it.created_at,
    }));
    setItems(convertedItems);
    setLoading(false);
  }

  const toggleOption = (key: keyof PrintOptions) => {
    setPrintOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const documentTypeLabel =
    printOptions.documentType === "devis"
      ? "عرض سعر (Devis)"
      : printOptions.documentType === "bon_de_commande"
      ? "بون دي كوموند (BC)"
      : "فاتورة";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 bg-gray-50">
        لم يتم العثور على الطلب
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>تخصيص المستند</span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-bold" style={{ color: C.dark }}>
              طلب #{order.order_number}
            </span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: C.dark }}>
            {documentTypeLabel}
          </h1>
          <p className="text-gray-500">اختر ما يظهر في الورقة قبل الطباعة</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Document Type */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" style={{ color: C.gold }} />
                نوع المستند
              </h3>
              <div className="space-y-2">
                {(["devis", "bon_de_commande"] as DocumentType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPrintOptions((p) => ({ ...p, documentType: t }))}
                    className={`w-full p-3 rounded-lg border-2 text-right font-medium transition ${
                      printOptions.documentType === t
                        ? "border-green-600 bg-green-50 text-green-800"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {t === "devis" ? "عرض سعر" : "بون دي كوموند"}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Options */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" style={{ color: C.gold }} />
                محتوى الورقة
              </h3>
              <div className="space-y-3">
                <ToggleRow
                  label="عرض الأسعار"
                  checked={printOptions.includePrices}
                  onChange={() => toggleOption("includePrices")}
                />
                <ToggleRow
                  label="التفاصيل التقنية"
                  checked={printOptions.includeProductionDetails}
                  onChange={() => toggleOption("includeProductionDetails")}
                />
                <ToggleRow
                  label="التوقيعات"
                  checked={printOptions.includeSignatures}
                  onChange={() => toggleOption("includeSignatures")}
                />
                <ToggleRow
                  label="الشروط والأحكام"
                  checked={true}
                  onChange={() => {}}
                  disabled
                />
                <ToggleRow
                  label="ختم المحل"
                  checked={printOptions.includeStamp}
                  onChange={() => toggleOption("includeStamp")}
                />
                <ToggleRow
                  label="QR Code"
                  checked={printOptions.includeQrCode}
                  onChange={() => toggleOption("includeQrCode")}
                />
              </div>
            </div>

            {/* Language */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" style={{ color: C.gold }} />
                اللغة
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {(["ar", "fr", "bilingual"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setPrintOptions((p) => ({ ...p, language: lang }))}
                    className={`p-2 rounded-lg border-2 text-sm font-bold transition ${
                      printOptions.language === lang
                        ? "border-green-600 bg-green-50 text-green-800"
                        : "border-gray-200"
                    }`}
                  >
                    {lang === "ar" ? "عربي" : lang === "fr" ? "Français" : "مزدوج"}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Button */}
            <button
              onClick={() => setShowPreview(true)}
              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition hover:opacity-90"
              style={{ background: C.green }}
            >
              <Eye className="w-5 h-5" />
              معاينة قبل الطباعة
            </button>

            <button
              onClick={() => router.push("/seller")}
              className="w-full py-3 rounded-xl font-bold border-2 border-gray-200 text-gray-600 flex items-center justify-center gap-2 transition hover:bg-gray-50"
            >
              <ArrowRight className="w-5 h-5" />
              العودة للرئيسية
            </button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold mb-4">ملخص الطلب</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">الزبون</span>
                  <span className="font-bold">{order.customer_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">الهاتف</span>
                  <span className="font-bold text-left">{order.customer_phone}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">عدد المنتجات</span>
                  <span className="font-bold">{items.length}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">المجموع</span>
                  <span className="font-bold" style={{ color: C.gold }}>
                    {order.total?.toFixed(2)} د.م
                  </span>
                </div>
                {order.deposit_amount > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">العربون</span>
                    <span className="font-bold">{order.deposit_amount.toFixed(2)} د.م</span>
                  </div>
                )}
              </div>

              {/* Product List */}
              <div className="mt-6">
                <h4 className="font-bold mb-3 text-sm text-gray-500">المنتجات:</h4>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.orderItemId}
                      className="p-3 rounded-lg border border-gray-100 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        {item.thumbnailUrl && (
                          <img src={item.thumbnailUrl} alt="" className="w-10 h-10 rounded object-cover" />
                        )}
                        <div>
                          <p className="font-bold text-sm">{item.productName}</p>
                          <p className="text-xs text-gray-400">{item.productType}</p>
                        </div>
                      </div>
                      <span className="font-bold text-sm">
                        {item.totalPrice.toFixed(2)} د.م
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Modal Preview */}
      {showPreview && (
        <PrintModal
          orderItems={items}
          orderNumber={order.order_number}
          customerName={order.customer_name}
          customerPhone={order.customer_phone}
          customerCity={order.customer_city}
          totalAmount={order.total}
          discountAmount={order.discount_amount}
          depositAmount={order.deposit_amount}
          deliveryCost={order.delivery_cost}
          documentType={printOptions.documentType}
          printOptions={printOptions}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

/* ─── Toggle Row ─── */
function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className={`w-full flex items-center justify-between p-3 rounded-lg border transition ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
      } ${checked ? "border-green-600 bg-green-50/30" : "border-gray-200"}`}
    >
      <span className="font-medium text-sm">{label}</span>
      <div
        className={`w-10 h-6 rounded-full flex items-center transition px-1 ${
          checked ? "justify-end" : "justify-start"
        }`}
        style={{ background: checked ? C.green : "#e5e7eb" }}
      >
        <div className="w-4 h-4 rounded-full bg-white shadow" />
      </div>
    </button>
  );
}