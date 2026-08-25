"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Printer, ArrowRight, Loader2 } from "lucide-react";

const C = { green: "#1B5E38", gold: "#C9A84C", dark: "#0D1F17" };
const fmt = (n: number) => (Number(n) || 0).toFixed(2);

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface OrderItem {
  id: string;
  product_type: string;
  product_name: string;
  thumbnail_url?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  technical_details: Record<string, any>;
  cost_breakdown: Record<string, any>;
  item_notes?: string;
}

interface OrderData {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_city?: string;
  customer_address?: string;
  delivery_expected_date?: string;
  subtotal: number;
  discount: number;
  total: number;
  deposit: number;
  remaining: number;
  payment_method: string;
  status: string;
  created_at: string;
  notes?: string;
  order_items: OrderItem[];
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS — مرونة في أسماء الحقول
   ═══════════════════════════════════════════════════════════════ */

/** تجربة عدة أسماء للحقل وإرجاع الأول الموجود */
function getField(obj: any, ...names: string[]): any {
  if (!obj || typeof obj !== "object") return undefined;
  for (const name of names) {
    if (name in obj) return obj[name];
  }
  return undefined;
}

/** تحويل القيمة إلى مصفوفة دائماً (تعامل مع المفرد والجمع) */
function toArray(val: any): any[] {
  if (val === undefined || val === null) return [];
  if (Array.isArray(val)) return val;
  return [val];
}

/** الحصول على مصفوفة من حقلين محتملين */
function getArray(obj: any, ...names: string[]): any[] {
  for (const name of names) {
    const val = obj?.[name];
    if (val !== undefined && val !== null) return toArray(val);
  }
  return [];
}

/* ═══════════════════════════════════════════════════════════════
   COST LABELS — تسميات تفصيل التكاليف حسب المنتج
   ═══════════════════════════════════════════════════════════════ */

const COST_LABELS: Record<string, string> = {
  fabricCost: "الثوب",
  laborCost: "الخياطة",
  materialCost: "المادة",
  cushionsCost: "المخاد",
  decorCost: "الكيدور",
  extrasCost: "الإضافات",
  seddariTotal: "السدادر",
  itemsTotal: "القطع",
  formageCost: "الفورمجة",
  sewingTotalPrice: "الخياطة",
  aqiqCost: "العقيق",
  bgCost: "الخلفية",
  customAdditionsCost: "إضافات مخصصة",
  catalogAdditionsCost: "إضافات الكتالوج",
  subtotal: "المجموع الفرعي",
  finalTotal: "الإجمالي النهائي",
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function InvoicePage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("لا يوجد رقم طلب");
      setLoading(false);
      return;
    }
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select(`*, order_items(*)`)
        .eq("id", orderId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("الطلب غير موجود");
      setOrder(data as OrderData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const orderNum = order?.id
    ? `ORD-${order.id.slice(0, 8).toUpperCase()}`
    : "—";
  const orderDate = order?.created_at
    ? new Date(order.created_at).toLocaleDateString("ar-MA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>جاري تحميل الفاتورة...</span>
        </div>
      </div>
    );

  if (error || !order)
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        dir="rtl"
      >
        <div className="text-center">
          <div className="text-red-500 text-lg font-bold mb-2">❌ خطأ</div>
          <p className="text-gray-600">{error || "الطلب غير موجود"}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8" dir="rtl">
      {/* Buttons */}
      <div className="max-w-3xl mx-auto mb-4 flex gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-[#1B5E3B] text-white px-6 py-2.5 rounded-lg hover:bg-[#144d2f] font-medium"
        >
          <Printer className="w-5 h-5" /> طباعة
        </button>
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 bg-white border border-gray-300 px-6 py-2.5 rounded-lg hover:bg-gray-50 font-medium"
        >
          <ArrowRight className="w-5 h-5" /> رجوع
        </button>
      </div>

      {/* Invoice */}
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-none">
        {/* Header */}
        <div className="p-8 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: C.green }}>
                بون دي كوموند
              </h1>
              <p className="text-gray-500 mt-1">
                نظام المحبوبي لإدارة الورشة
              </p>
            </div>
            <div className="text-left">
              <div className="text-sm text-gray-500">رقم الطلب</div>
              <div
                className="text-xl font-bold font-mono"
                style={{ color: C.gold }}
              >
                {orderNum}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                التاريخ: {orderDate}
              </div>
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="p-8 border-b border-gray-200 bg-gray-50/50">
          <h2 className="text-lg font-bold mb-4" style={{ color: C.dark }}>
            بيانات الزبون
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-500 block">الاسم</span>
              <span className="font-bold">
                {order.customer_name || "—"}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">الهاتف</span>
              <span className="font-bold">
                {order.customer_phone || "—"}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">المدينة</span>
              <span className="font-bold">
                {order.customer_city || "—"}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">العنوان</span>
              <span className="font-bold">
                {order.customer_address || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="p-8 border-b border-gray-200">
          <h2 className="text-lg font-bold mb-4" style={{ color: C.dark }}>
            المنتجات
          </h2>
          <div className="space-y-6">
            {order.order_items?.map((item, idx) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                {/* Item Header */}
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#1B5E3B] text-white flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="font-bold">{item.product_name}</h3>
                      <ProductTypeBadge type={item.product_type} details={item.technical_details} />
                    </div>
                  </div>
                  <div className="text-left">
                    <div
                      className="font-bold text-lg"
                      style={{ color: C.gold }}
                    >
                      {fmt(item.total_price)} د.م
                    </div>
                    <div className="text-xs text-gray-400">
                      {item.quantity} × {fmt(item.unit_price)} د.م
                    </div>
                  </div>
                </div>

                {/* Item Details */}
                <div className="p-5">{renderItemDetails(item)}</div>

                {/* Cost Breakdown */}
                {renderCostBreakdown(item.cost_breakdown)}

                {item.item_notes && (
                  <div className="px-5 py-2 bg-gray-50 border-t border-gray-100">
                    <span className="text-xs text-gray-500">ملاحظات:</span>
                    <p className="text-sm text-gray-700">{item.item_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="p-8">
          <div className="max-w-xs mr-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">المجموع الفرعي</span>
              <span className="font-bold">{fmt(order.subtotal)} د.م</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>الخصم</span>
                <span className="font-bold">-{fmt(order.discount)} د.م</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold">
              <span>الإجمالي</span>
              <span style={{ color: C.gold }}>{fmt(order.total)} د.م</span>
            </div>
            {order.deposit > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>العربون المدفوع</span>
                <span>{fmt(order.deposit)} د.م</span>
              </div>
            )}
            {order.remaining > 0 && (
              <div className="flex justify-between text-sm font-bold text-red-600">
                <span>الباقي المستحق</span>
                <span>{fmt(order.remaining)} د.م</span>
              </div>
            )}
          </div>
          {order.notes && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <span className="text-xs text-gray-500 block mb-1">
                ملاحظات الطلب:
              </span>
              <p className="text-sm text-gray-700">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            شكراً لثقتكم بنا · للاستفسار: 0522-XXXXXX
          </p>
          <p className="text-xs text-gray-400 mt-1">
            حالة الطلب:{" "}
            {order.status === "confirmed"
              ? "مؤكد"
              : order.status === "draft"
              ? "مسودة"
              : order.status}
          </p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRODUCT TYPE BADGE
   ═══════════════════════════════════════════════════════════════ */

function ProductTypeBadge({
  type,
  details,
}: {
  type: string;
  details: Record<string, any>;
}) {
  const isRomani = details?.isRomani === true;

  const labels: Record<string, string> = {
    salon: isRomani ? "صالون رومي" : "صالون مغربي",
    tapis: "زربية",
    wood: "عود",
    foam: "بونج",
    khamiya: "خامية",
  };

  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-bold">
      {labels[type] || type}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COST BREAKDOWN — تفصيل التكاليف المرن
   ═══════════════════════════════════════════════════════════════ */

function renderCostBreakdown(cb: Record<string, any> | null) {
  if (!cb || typeof cb !== "object") return null;

  const entries = Object.entries(cb).filter(([key, val]) => {
    if (key === "subtotal" || key === "finalTotal") return false; // نعرضها في الأسفل
    if (val === undefined || val === null) return false;
    if (typeof val === "object") return false; // نتجاهل الكائنات
    if (typeof val === "number" && val === 0) return false;
    return true;
  });

  if (entries.length === 0) return null;

  return (
    <div className="px-5 py-3 bg-amber-50/50 border-t border-gray-100">
      <h4 className="text-xs font-bold text-amber-700 mb-2">
        تفصيل التكاليف
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
        {entries.map(([key, val]) => (
          <div key={key} className="flex justify-between">
            <span className="text-gray-500">
              {COST_LABELS[key] || key}
            </span>
            <span className="font-semibold">{fmt(val as number)} د.م</span>
          </div>
        ))}
      </div>
      {(cb.subtotal !== undefined || cb.finalTotal !== undefined) && (
        <div className="border-t border-amber-200 mt-2 pt-2 flex justify-between text-sm font-bold">
          <span>
            {cb.finalTotal !== undefined && cb.finalTotal !== cb.subtotal
              ? "المجموع الفرعي"
              : "الإجمالي"}
          </span>
          <span>
            {fmt(cb.finalTotal !== undefined ? cb.finalTotal : cb.subtotal)} د.م
          </span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RENDER ITEM DETAILS — عرض تفاصيل كل منتج حسب نوعه
   ═══════════════════════════════════════════════════════════════ */

function renderItemDetails(item: OrderItem) {
  const d = item.technical_details || {};
  const type = item.product_type;

  // ─── 1. صالون (salon) — مغربي أو رومي ───
  if (type === "salon") {
    if (d.isRomani) {
      return <RenderRomaniDetails d={d} />;
    }
    return <RenderSalonDetails d={d} />;
  }

  // ─── 2. عود (wood) ───
  if (type === "wood") {
    return <RenderWoodDetails d={d} />;
  }

  // ─── 3. زربية (tapis) ───
  if (type === "tapis") {
    return <RenderTapisDetails d={d} />;
  }

  // ─── 4. بونج (foam) ───
  if (type === "foam") {
    return <RenderFoamDetails d={d} />;
  }

  // ─── 5. خامية (khamiya) ───
  if (type === "khamiya") {
    return <RenderKhamiyaDetails d={d} />;
  }

  // ─── 6. منتج غير معروف — عرض JSON ───
  return (
    <div className="text-sm text-gray-400">
      <pre className="bg-gray-50 p-3 rounded-lg overflow-auto text-xs">
        {JSON.stringify(d, null, 2)}
      </pre>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS لكل منتج
   ═══════════════════════════════════════════════════════════════ */

/** صالون مغربي */
function RenderSalonDetails({ d }: { d: Record<string, any> }) {
  const seddars = getArray(d, "seddars", "seddari");
  const stitches = getArray(d, "stitches", "stitch");

  return (
    <div className="space-y-3 text-sm">
      {d.fabric && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">الثوب</span>
          <span className="font-semibold">{d.fabric.name}</span>
          <span className="text-gray-400 text-xs mr-2">
            ({fmt(d.fabric.pricePerMeter)} د.م/م × {fmt(d.fabric.consumptionM)}م
            = {fmt(d.fabric.totalCost ?? d.fabric.pricePerMeter * d.fabric.consumptionM)} د.م)
          </span>
        </div>
      )}

      {seddars.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 block mb-1">
            السدادر ({seddars.length}):
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {seddars.map((s: any, i: number) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-lg p-2"
              >
                <span className="font-bold">سداري {s.index ?? i + 1}:</span>{" "}
                {s.lengthCm ?? s.length_cm}×{s.widthCm ?? s.width_cm}×
                {s.heightCm ?? s.height_cm} سم
                <span className="text-gray-400 text-xs block">
                  الشكل:{" "}
                  {s.shape === "square"
                    ? "مربع"
                    : s.shape === "triangle"
                    ? "مثلث"
                    : s.shape}
                  {s.shapeCustom ? ` (${s.shapeCustom})` : ""}
                </span>
                {s.fabricConsumptionM !== undefined && (
                  <span className="text-gray-400 text-xs block">
                    استهلاك الثوب: {fmt(s.fabricConsumptionM)}م
                  </span>
                )}
                {s.price !== undefined && (
                  <span className="text-gray-400 text-xs block">
                    السعر: {fmt(s.price)} د.م
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {stitches.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 block mb-1">الخياطة:</span>
          {stitches.map((s: any, i: number) => (
            <span
              key={i}
              className="inline-block ml-2 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs"
            >
              {s.styleName ?? s.name ?? "خياطة"} ({fmt(s.price ?? s.pricePerMeter ?? 0)} د.م)
            </span>
          ))}
        </div>
      )}

      {d.cushions && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">المخاد</span>
          <span className="font-semibold">{d.cushions.count} وسادة</span>
          <span className="text-gray-400 text-xs mr-2">
            (× {fmt(d.cushions.unitPrice)} د.م = {fmt(d.cushions.totalPrice)} د.م)
          </span>
        </div>
      )}

      {d.decor && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">الكيدور</span>
          <span className="font-semibold">{d.decor.type ?? d.decor.name}</span>
          <span className="text-gray-400 text-xs mr-2">
            ({fmt(d.decor.price)} د.م)
          </span>
        </div>
      )}

      {d.lhayef && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">الحايف</span>
          <span>
            {d.lhayef.lengthM} متر × {fmt(d.lhayef.pricePerMeter)} د.م ={" "}
            {fmt(d.lhayef.total)} د.م
          </span>
        </div>
      )}

      {d.tabouria && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">الطابورية</span>
          <span>
            {d.tabouria.count} قطعة × {fmt(d.tabouria.unitPrice)} د.م ={" "}
            {fmt(d.tabouria.total)} د.م
          </span>
        </div>
      )}
    </div>
  );
}

/** صالون رومي */
function RenderRomaniDetails({ d }: { d: Record<string, any> }) {
  const seddars = getArray(d, "seddars", "seddari");

  return (
    <div className="space-y-3 text-sm">
      {d.model && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">الموديل</span>
          <span className="font-bold">{d.model.name}</span>
          <span className="text-gray-400 text-xs mr-2">
            ({fmt(d.model.price_per_meter ?? d.model.pricePerMeter)} د.م/م)
          </span>
        </div>
      )}

      {d.color && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">اللون</span>
          <span className="font-bold">{d.color.name}</span>
        </div>
      )}

      {seddars.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 block mb-1">
            السدادر ({seddars.length}):
          </span>
          <div className="grid grid-cols-1 gap-2">
            {seddars.map((s: any, i: number) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-lg p-2"
              >
                <div className="flex justify-between">
                  <span className="font-bold">سداري {i + 1}</span>
                  <span className="font-semibold text-amber-700">
                    {fmt(s.total_price ?? s.totalPrice ?? 0)} د.م
                  </span>
                </div>
                <div className="text-gray-500 text-xs mt-1">
                  الطول: {fmt((s.length_cm ?? s.lengthCm ?? 0) / 100)} م
                  {s.has_kotik && (
                    <span className="mr-2 text-blue-600">
                      · كوتيك: {s.kotik_count} ({fmt((s.kotik_count ?? 0) * (s.price_per_meter ?? s.pricePerMeter ?? 0))} د.م)
                    </span>
                  )}
                  {s.has_formaja && (
                    <span className="mr-2 text-purple-600">
                      · فورمجة: {fmt(s.formaja_length_meters ?? s.formajaLengthMeters ?? 0)} م
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** عود */
function RenderWoodDetails({ d }: { d: Record<string, any> }) {
  const seddars = getArray(d, "seddars", "seddari");
  const woodItems = getArray(d, "woodItems", "items", "extraItems");

  return (
    <div className="space-y-3 text-sm">
      {d.model && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">الموديل</span>
          <span className="font-bold">{d.model.name}</span>
          <span className="text-gray-400 text-xs mr-2">
            ({d.model.woodType ?? d.model.wood_type})
          </span>
        </div>
      )}

      {d.salonShape && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">شكل الصالون</span>
          <span className="font-bold">
            {d.salonShape === "straight"
              ? "مستقيم"
              : d.salonShape === "L"
              ? "L"
              : d.salonShape === "U"
              ? "U"
              : d.salonShape}
          </span>
        </div>
      )}

      {seddars.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 block mb-1">السدادر:</span>
          {seddars.map((s: any, i: number) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-lg p-2 mb-1"
            >
              سداري {s.index ?? i + 1}: {s.lengthCm ?? s.length_cm}×
              {s.widthCm ?? s.width_cm}×{s.heightCm ?? s.height_cm} سم —{" "}
              {fmt(s.price ?? s.totalPrice ?? 0)} د.م
            </div>
          ))}
        </div>
      )}

      {woodItems.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 block mb-1">
            القطع الإضافية:
          </span>
          {woodItems.map((w: any, i: number) => (
            <div
              key={i}
              className="flex justify-between bg-white border border-gray-100 rounded-lg p-2 mb-1"
            >
              <span>
                {w.name} ({w.type}) × {w.quantity}
              </span>
              <span className="font-semibold">
                {fmt(w.totalPrice ?? w.total_price ?? w.price ?? 0)} د.م
              </span>
            </div>
          ))}
        </div>
      )}

      {d.finish && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">التشطيب</span>
          <span>
            {d.finish.type ?? d.finish.name} — {fmt(d.finish.price)} د.م
          </span>
        </div>
      )}
    </div>
  );
}

/** زربية */
function RenderTapisDetails({ d }: { d: Record<string, any> }) {
  const material = getField(d, "material", "selectedTapis", "tapis");
  const dimensions = d.dimensions || {};

  return (
    <div className="space-y-3 text-sm">
      {material && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">المادة</span>
          <span className="font-bold">{material.name}</span>
          <span className="text-gray-400 text-xs mr-2">
            ({fmt(material.pricePerSqm ?? material.price_per_m2)} د.م/م²)
          </span>
        </div>
      )}

      {(dimensions.lengthCm !== undefined ||
        dimensions.widthCm !== undefined ||
        dimensions.areaSqm !== undefined) && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">الأبعاد</span>
          <span>
            {dimensions.lengthCm !== undefined
              ? `${fmt(dimensions.lengthCm)} سم`
              : dimensions.originalLength !== undefined
              ? `${fmt(dimensions.originalLength)} م`
              : ""}
            {dimensions.widthCm !== undefined || dimensions.originalWidth !== undefined
              ? " × "
              : ""}
            {dimensions.widthCm !== undefined
              ? `${fmt(dimensions.widthCm)} سم`
              : dimensions.originalWidth !== undefined
              ? `${fmt(dimensions.originalWidth)} م`
              : ""}
          </span>
          {dimensions.areaSqm !== undefined && (
            <span className="text-gray-400 text-xs mr-2">
              (المساحة: {fmt(dimensions.areaSqm)} م²)
            </span>
          )}
        </div>
      )}

      {d.cutMarginCm !== undefined && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">هامش القص</span>
          <span>{fmt(d.cutMarginCm)} سم</span>
        </div>
      )}

      {d.wastePercent !== undefined && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">نسبة الهدر</span>
          <span>{fmt(d.wastePercent)}%</span>
        </div>
      )}

      {d.rounding && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">التقريب</span>
          <span>
            {d.rounding === "half"
              ? "نصف متر"
              : d.rounding === "whole"
              ? "متر كامل"
              : "بدون تقريب"}
          </span>
        </div>
      )}

      {d.backing && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">الخلفية</span>
          <span>
            {d.backing.name} — {fmt(d.backing.price)} د.م
          </span>
        </div>
      )}
    </div>
  );
}

/** بونج */
function RenderFoamDetails({ d }: { d: Record<string, any> }) {
  const product = getField(d, "product", "selectedProduct", "foamProduct");
  const seddars = getArray(d, "foamSeddars", "seddars", "seddari");

  return (
    <div className="space-y-3 text-sm">
      {product && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">المنتج</span>
          <span className="font-bold">{product.name}</span>
          {product.density && (
            <span className="text-gray-400 text-xs mr-2">
              (كثافة: {product.density})
            </span>
          )}
        </div>
      )}

      {(d.heightCm !== undefined || d.widthCm !== undefined) && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">الأبعاد</span>
          <span>
            {d.heightCm !== undefined ? `${fmt(d.heightCm)} سم` : ""}
            {d.heightCm !== undefined && d.widthCm !== undefined ? " × " : ""}
            {d.widthCm !== undefined ? `${fmt(d.widthCm)} سم` : ""}
          </span>
        </div>
      )}

      {seddars.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">السدادر</span>
          <span>
            {seddars.length} سداري: {seddars.map((s: any) => fmt(s)).join("م، ")}م
          </span>
        </div>
      )}

      {(d.squareCorners > 0 || d.triangleCorners > 0) && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">الزوايا</span>
          {d.squareCorners > 0 && (
            <span className="inline-block ml-2">
              مربعة: {d.squareCorners}
            </span>
          )}
          {d.triangleCorners > 0 && (
            <span className="inline-block ml-2">
              مثلثة: {d.triangleCorners}
            </span>
          )}
        </div>
      )}

      {d.priceAdjustment && (
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
          <span className="text-xs text-amber-600 block mb-1">
            تعديل السعر
          </span>
          <span className="font-bold text-amber-700">
            {d.priceAdjustment.type === "discount" ? "خصم" : "زيادة"}:{" "}
            {fmt(d.priceAdjustment.value)} د.م
          </span>
          <span className="text-gray-400 text-xs mr-2">
            ({d.priceAdjustment.reason})
          </span>
        </div>
      )}
    </div>
  );
}

/** خامية */
function RenderKhamiyaDetails({ d }: { d: Record<string, any> }) {
  const khamiya = getField(d, "selectedKhamiya", "fabric", "khamiya");
  const sewing = getField(d, "selectedSewing", "sewing", "stitch");
  const aqiq = getField(d, "selectedAqiq", "aqiq");
  const background = getField(d, "selectedBackground", "background");
  const customAdditions = getArray(d, "customAdditions", "custom_additions");
  const catalogAdditions = getArray(d, "catalogAdditions", "catalog_additions");
  const selectedCatalogIds = toArray(
    getField(d, "selectedCatalogAdditions", "selected_catalog_additions")
  );

  return (
    <div className="space-y-3 text-sm">
      {khamiya && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">القماش</span>
          <span className="font-bold">{khamiya.name}</span>
          <span className="text-gray-400 text-xs mr-2">
            ({fmt(khamiya.price_per_m2 ?? khamiya.pricePerSqm)} د.م/م²)
          </span>
        </div>
      )}

      {(d.width !== undefined || d.height !== undefined) && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">الأبعاد</span>
          <span>
            {d.width !== undefined ? `العرض: ${fmt(d.width)} م` : ""}
            {d.width !== undefined && d.height !== undefined ? " · " : ""}
            {d.height !== undefined ? `الارتفاع: ${fmt(d.height)} م` : ""}
          </span>
          {d.fabricMeters !== undefined && (
            <span className="text-gray-400 text-xs mr-2">
              (استهلاك: {fmt(d.fabricMeters)} م)
            </span>
          )}
        </div>
      )}

      {d.shape && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">الشكل</span>
          <span>
            {d.shape === "solid_piece" || d.khamiyaShape === "solid_piece"
              ? "قطعة واحدة"
              : d.shape === "cut_middle" || d.khamiyaShape === "cut_middle"
              ? "قص من الوسط"
              : d.shape ?? d.khamiyaShape}
          </span>
        </div>
      )}

      {sewing && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">الخياطة</span>
          <span>
            {sewing.name ?? sewing.type} —{" "}
            {fmt(sewing.price_per_meter ?? sewing.price ?? 0)} د.م
          </span>
        </div>
      )}

      {aqiq && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">العقيق</span>
          <span className="font-bold">{aqiq.name}</span>
          <span className="text-gray-400 text-xs mr-2">
            ({fmt(aqiq.price_per_meter ?? aqiq.price ?? 0)} د.م/م)
          </span>
        </div>
      )}

      {d.hasBackground && background && (
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block mb-1">الخلفية</span>
          <span>
            {background.name} —{" "}
            {fmt(background.price_per_m2 ?? background.price ?? background.cost ?? 0)} د.م
          </span>
          {(d.bgWidth !== undefined || d.bgHeight !== undefined) && (
            <span className="text-gray-400 text-xs block">
              الأبعاد: {fmt(d.bgWidth ?? 0)}×{fmt(d.bgHeight ?? 0)} م
              {d.bgFabricMeters !== undefined &&
                ` (استهلاك: ${fmt(d.bgFabricMeters)} م)`}
            </span>
          )}
        </div>
      )}

      {customAdditions.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 block mb-1">
            إضافات مخصصة:
          </span>
          {customAdditions.map((a: any, i: number) => (
            <span
              key={i}
              className="inline-block ml-2 px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-xs"
            >
              {a.name} ({fmt(a.price)} د.م)
            </span>
          ))}
        </div>
      )}

      {catalogAdditions.length > 0 && selectedCatalogIds.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 block mb-1">
            إضافات الكتالوج:
          </span>
          {catalogAdditions
            .filter((a: any) => selectedCatalogIds.includes(String(a.id)))
            .map((a: any, i: number) => (
              <span
                key={i}
                className="inline-block ml-2 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs"
              >
                {a.name} ({fmt(a.price)} د.م)
              </span>
            ))}
        </div>
      )}

      {d.costEditReasons && Object.keys(d.costEditReasons).length > 0 && (
        <div className="bg-red-50 rounded-lg p-3 border border-red-100">
          <span className="text-xs text-red-600 block mb-1">
            أسباب تعديل التكاليف:
          </span>
          {Object.entries(d.costEditReasons).map(([key, reason]: [string, any]) => (
            <div key={key} className="text-xs text-red-700">
              · {key}: {String(reason)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}