"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Eye, FileText, Settings, ChevronRight,
  ArrowRight, Globe, Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import PrintModal from "@/features/order-center/components/PrintModal";

const C = { green: "#1B5E38", gold: "#C9A84C", dark: "#0D1F17", cream: "#F5F0E8" };

export type DocumentType = "devis" | "bon_de_commande" | "facture";
export type DocumentLanguage = "ar" | "fr" | "es" | "it" | "bilingual";

export interface PrintOptions {
  documentType: DocumentType;
  printVariant: "client" | "internal";
  language: DocumentLanguage;
  includeProductionDetails: boolean;
  includePrices: boolean;
  includeCosts: boolean;
  includeSignatures: boolean;
  includeQrCode: boolean;
  includeStamp: boolean;
  includeLocation: boolean;
}

interface OrderItemData {
  id: string;
  product_type: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  thumbnail_url: string | null;
  technical_details: any;
  cost_breakdown: any;
}

interface OrderData {
  id: string;
  order_number: string | null;  // ← user's custom order number
  customer_name: string;
  customer_phone: string;
  customer_city: string | null;
  total: number;
  discount: number;
  deposit: number;
  status: string;
  created_at: string;
  delivery_expected_date: string | null;
}

function docTitle(type: DocumentType, lang: DocumentLanguage): string {
  const titles: Record<DocumentType, Record<DocumentLanguage, string>> = {
    devis: { ar: "عرض سعر", fr: "Devis", es: "Presupuesto", it: "Preventivo", bilingual: "عرض سعر / Devis" },
    bon_de_commande: { ar: "بون دي كوموند", fr: "Bon de Commande", es: "Orden de Compra", it: "Ordine d'Acquisto", bilingual: "بون دي كوموند / Bon de Commande" },
    facture: { ar: "فاتورة", fr: "Facture", es: "Factura", it: "Fattura", bilingual: "فاتورة / Facture" },
  };
  return titles[type]?.[lang] || titles[type]?.["ar"] || type;
}

/* ═══════════════════════════════════════════════════════════════
   Date formatter — Arabic locale
   ═══════════════════════════════════════════════════════════════ */
function fmtDateAr(dateStr: string | null): string {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    try {
      return new Date(dateStr).toLocaleDateString("ar-MA", {
        year: "numeric", month: "long", day: "numeric"
      });
    } catch { return dateStr; }
  }
  return dateStr;
}

export default function OrderCustomizePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
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

  const [order, setOrder] = useState<OrderData | null>(null);
  const [items, setItems] = useState<OrderItemData[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPreview, setShowPreview] = useState(false);
  const [agreedDeliveryDate, setAgreedDeliveryDate] = useState("");
  const [sellerNotes, setSellerNotes] = useState("");

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
    includeLocation: false,
  });

  useEffect(() => {
    if (orderId) fetchOrder(orderId);
  }, [orderId]);

  async function fetchOrder(id: string) {
    setLoading(true);
    try {
      const [{ data: orderData, error: orderErr }, { data: itemsData, error: itemsErr }] = await Promise.all([
        supabase.from("orders").select("*").eq("id", id).single(),
        supabase.from("order_items").select("*").eq("order_id", id),
      ]);

      if (orderErr) throw orderErr;
      setOrder(orderData);
      setItems(itemsData || []);

      // ← FIXED: Format delivery_expected_date in Arabic before setting
      if (orderData?.delivery_expected_date) {
        setAgreedDeliveryDate(fmtDateAr(orderData.delivery_expected_date));
      }
    } catch (e) {
      console.error("fetchOrder error:", e);
    } finally {
      setLoading(false);
    }
  }

  const toggleOption = (key: keyof PrintOptions) => {
    setPrintOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setLanguage = (lang: DocumentLanguage) => {
    setPrintOptions((prev) => ({ ...prev, language: lang }));
  };

  const documentTypeLabel = docTitle(printOptions.documentType, printOptions.language);

  // Convert DB items to PrintModal format
  const orderItems = items.map((item) => ({
    id: item.id,
    productType: item.product_type || "salon",
    productName: item.product_name || "منتج",
    quantity: item.quantity || 1,
    unitPrice: item.unit_price || 0,
    totalPrice: item.total_price || 0,
    thumbnailUrl: item.thumbnail_url || undefined,
    details: item.technical_details || {},
    calculations: item.cost_breakdown || {},
  }));

  // ← FIXED: Use order.order_number (user's custom number) instead of UUID
  const displayOrderNumber = order?.order_number || orderId?.slice(0, 8).toUpperCase() || "—";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-red-600 font-bold">لم يتم العثور على الطلب</p>
          <button
            onClick={() => router.push("/seller")}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg font-bold"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>تخصيص المستند</span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-bold" style={{ color: C.dark }}>
              طلب #{displayOrderNumber}
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
                    {t === "devis" ? "عرض سعر (Devis)" : "بون دي كوموند (BC)"}
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
                لغة المستند
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {(["ar", "fr", "es", "it", "bilingual"] as DocumentLanguage[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`p-2 rounded-lg border-2 text-sm font-bold transition ${
                      printOptions.language === lang
                        ? "border-green-600 bg-green-50 text-green-800"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {lang === "ar" ? "عربي" : lang === "fr" ? "Français" : lang === "es" ? "Español" : lang === "it" ? "Italiano" : "مزدوج"}
                  </button>
                ))}
              </div>
            </div>

            {/* Agreed Delivery Date */}
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <h3 className="font-bold mb-3 flex items-center gap-2 text-amber-800">
                <span>📅</span>
                موعد التسليم المتفق عليه
              </h3>
              <input
                type="text"
                value={agreedDeliveryDate}
                onChange={(e) => setAgreedDeliveryDate(e.target.value)}
                placeholder="مثال: 20/08/2026 أو 5-7 أسابيع"
                className="w-full p-3 rounded-lg border-2 border-amber-200 text-right font-bold text-amber-900 bg-white focus:border-amber-500 focus:outline-none transition-colors text-sm"
              />
              <p className="text-xs text-amber-600 mt-1">
                {order?.delivery_expected_date 
                  ? `📋 موعد محفوظ: ${fmtDateAr(order.delivery_expected_date)}` 
                  : "سيظهر في بون دي كوماند ويُرسل للزبون"}
              </p>
            </div>

            {/* Seller Notes */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="font-bold mb-3 flex items-center gap-2 text-blue-800">
                <span>📝</span>
                ملاحظات خاصة
              </h3>
              <textarea
                value={sellerNotes}
                onChange={(e) => setSellerNotes(e.target.value)}
                placeholder="مثال: القماش غير متوفر حالياً، سنتصل بك..."
                rows={3}
                className="w-full p-3 rounded-lg border-2 border-blue-200 text-right font-bold text-blue-900 bg-white focus:border-blue-500 focus:outline-none transition-colors text-sm resize-none"
              />
              <p className="text-xs text-blue-600 mt-1">تظهر في أسفل بيانات الزبون في PDF</p>
            </div>

            {/* Preview Button */}
            <button
              onClick={() => setShowPreview(true)}
              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition hover:opacity-90"
              style={{ background: C.green }}
            >
              <Eye className="w-5 h-5" />
              معاينة وطباعة
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
                {/* ← FIXED: Show order_number */}
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">رقم الطلب</span>
                  <span className="font-bold">{displayOrderNumber}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">الزبون</span>
                  <span className="font-bold">{order.customer_name || "—"}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">الهاتف</span>
                  <span className="font-bold text-left">{order.customer_phone || "—"}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">موعد التسليم المحفوظ</span>
                  <span className="font-bold" style={{ color: C.gold }}>
                    {fmtDateAr(order.delivery_expected_date) || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">عدد المنتجات</span>
                  <span className="font-bold">{items.length}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">المجموع</span>
                  <span className="font-bold" style={{ color: C.gold }}>
                    {order.total?.toFixed(2) || "0.00"} د.م
                  </span>
                </div>
                {order.deposit > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">العربون</span>
                    <span className="font-bold">{order.deposit.toFixed(2)} د.م</span>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <h4 className="font-bold mb-3 text-sm text-gray-500">المنتجات:</h4>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-gray-100 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        {item.thumbnail_url && (
                          <img src={item.thumbnail_url} alt="" className="w-10 h-10 rounded object-cover" />
                        )}
                        <div>
                          <p className="font-bold text-sm">{item.product_name}</p>
                          <p className="text-xs text-gray-400">{item.product_type}</p>
                        </div>
                      </div>
                      <span className="font-bold text-sm">
                        {item.total_price?.toFixed(2) || "0.00"} د.م
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Modal */}
      {showPreview && (
        <PrintModal
          orderItems={orderItems}
          orderNumber={displayOrderNumber}  // ← FIXED: use order_number
          customerName={order.customer_name}
          customerPhone={order.customer_phone}
          customerCity={order.customer_city || undefined}
          totalAmount={order.total || 0}
          discountAmount={order.discount || 0}
          depositAmount={order.deposit || 0}
          deliveryCost={0}
          documentType={printOptions.documentType}
          printOptions={printOptions}
          onClose={() => setShowPreview(false)}
          agreedDeliveryDate={agreedDeliveryDate}
          onAgreedDeliveryDateChange={setAgreedDeliveryDate}
          sellerNotes={sellerNotes}
          onSellerNotesChange={setSellerNotes}
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