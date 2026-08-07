"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";
import type { FoamOrder } from "@/types/foam-types";

type DbOrder = Database["public"]["Tables"]["orders"]["Row"];
type DbOrderPart = Database["public"]["Tables"]["order_parts"]["Row"];
type OrderPart = DbOrderPart & {
  status?: string | null;
  supplier_phone?: string | null;
  whatsapp_message?: string | null;
};
type DbTailor = Database["public"]["Tables"]["tailors"]["Row"];

type OrderStatus = "new" | "review" | "sent" | "in_progress" | "partial" | "ready" | "late" | "delivered" | "all";
type FoamOrderStatus = string;

interface OrderWithParts extends DbOrder {
  parts: OrderPart[];
}

type FoamOrderWithProduct = FoamOrder & {
  foam_products?: { name: string } | null;
  suppliers?: { name: string } | null;
};

/* ─── Helpers ─── */
const partIcons: Record<string, string> = {
  salon: "🛋️",
  bounge: "🧽",
  tapis: "🧶",
  bois: "🪵",
  rembourrage: "🪶",
  khamiya: "🧵",
  default: "📦",
};

function getPartIcon(type: string | null | undefined): string {
  return partIcons[type ?? "default"] || partIcons.default;
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    new: "جديد",
    review: "قيد المراجعة",
    sent: "مرسل",
    in_progress: "قيد التنفيذ",
    partial: "جزئي",
    ready: "جاهز",
    delivered: "مُسلّم",
    late: "متأخر",
  };
  return map[status] || status;
}

function getPartStatusLabel(status: string | null | undefined): string {
  const map: Record<string, string> = {
    pending: "بانتظار الإرسال",
    sent: "مرسل",
    in_progress: "قيد التنفيذ",
    ready: "جاهز",
    done: "تم",
  };
  return map[status || ""] || "—";
}

function getDaysLeft(deliveryDate: string | null): number {
  if (!deliveryDate) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(deliveryDate);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getPartsSummary(parts: DbOrderPart[]): React.ReactNode {
  const types = Array.from(
    new Set(parts.map((p) => p.part_type).filter((t): t is string => t !== null && t !== undefined))
  );
  return (
    <>
      {types.map((t) => (
        <span key={t} className="text-lg" title={t}>
          {partIcons[t] || partIcons.default}
        </span>
      ))}
    </>
  );
}

/* ─── Tabs ─── */
const statusTabs: { id: OrderStatus; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "new", label: "🟡 جديد" },
  { id: "review", label: "🟠 قيد المراجعة" },
  { id: "sent", label: "🔵 مرسل" },
  { id: "in_progress", label: "🟣 قيد التنفيذ" },
  { id: "partial", label: "⚪ جزئي" },
  { id: "ready", label: "🟢 جاهز" },
  { id: "late", label: "🔴 متأخر" },
];

const foamStatusTabs: { id: FoamOrderStatus; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "pending", label: "🟡 معلق" },
  { id: "sent_to_supplier", label: "🔵 مرسل للمورد" },
  { id: "in_production", label: "🟣 قيد الإنتاج" },
  { id: "ready", label: "🟢 جاهز" },
  { id: "delivered", label: "✅ مُسلّم" },
  { id: "cancelled", label: "❌ ملغى" },
];

const foamStatusMap: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "معلق", bg: "bg-amber-100", text: "text-amber-700" },
  sent_to_supplier: { label: "مرسل للمورد", bg: "bg-blue-100", text: "text-blue-700" },
  in_production: { label: "قيد الإنتاج", bg: "bg-purple-100", text: "text-purple-700" },
  ready: { label: "جاهز", bg: "bg-green-100", text: "text-green-700" },
  delivered: { label: "مُسلّم", bg: "bg-gray-100", text: "text-gray-700" },
  cancelled: { label: "ملغى", bg: "bg-red-100", text: "text-red-700" },
};

/* ─── Page ─── */
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithParts[]>([]);
  const [tailors, setTailors] = useState<DbTailor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderStatus>("all");
  const [viewMode, setViewMode] = useState<"regular" | "foam">("regular");
  const [foamOrders, setFoamOrders] = useState<FoamOrderWithProduct[]>([]);
  const [foamActiveTab, setFoamActiveTab] = useState<FoamOrderStatus>("all");
  const [selectedFoamOrder, setSelectedFoamOrder] = useState<FoamOrderWithProduct | null>(null);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithParts | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: ordersData, error: ordersErr }, { data: foamData }] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("foam_orders").select("*, foam_products(name), suppliers(name)").order("created_at", { ascending: false }).limit(100),
      ]);
      setFoamOrders(foamData || []);

      if (ordersErr) throw ordersErr;

      const orderIds = (ordersData || []).map((o) => o.id);
      let partsData: DbOrderPart[] = [];
      if (orderIds.length > 0) {
        const { data: p } = await supabase
          .from("order_parts")
          .select("*")
          .in("order_id", orderIds);
        partsData = p || [];
      }

      const combined: OrderWithParts[] = (ordersData || []).map((o) => ({
        ...o,
        parts: partsData.filter((p) => p.order_id === o.id),
      }));

      setOrders(combined);

      const { data: tailorsData } = await supabase
        .from("tailors")
        .select("*")
        .eq("is_active", true)
        .order("full_name", { ascending: true });

      setTailors(tailorsData || []);
    } catch (err) {
      console.error("فشل تحميل الطلبيات:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchTab = activeTab === "all" || o.status === activeTab;
      const q = search.trim();
      const matchSearch =
        q === "" ||
        (o.customer_name || "").includes(q) ||
        (o.id || "").includes(q) ||
        (o.customer_phone || "").includes(q);
      return matchTab && matchSearch;
    });
  }, [activeTab, search, orders]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    orders.forEach((o) => {
      c[o.status] = (c[o.status] || 0) + 1;
    });
    return c;
  }, [orders]);

  const foamCounts = useMemo(() => {
    const c: Record<string, number> = { all: foamOrders.length };
    foamOrders.forEach((o) => {
      c[o.status] = (c[o.status] || 0) + 1;
    });
    return c;
  }, [foamOrders]);

  const foamFiltered = useMemo(() => {
    return foamOrders.filter((o) => {
      const matchTab = foamActiveTab === "all" || o.status === foamActiveTab;
      const q = search.trim();
      const matchSearch = q === "" || (o.customer_name || "").includes(q) || (o.order_number || "").includes(q) || (o.customer_phone || "").includes(q);
      return matchTab && matchSearch;
    });
  }, [foamActiveTab, search, foamOrders]);

  const mustafaReminders = useMemo(() => {
    const reminders: { orderId: string; customer: string; daysLeft: number; partLabel: string }[] = [];
    orders.forEach((o) => {
      const remPart = o.parts.find(
        (p) => p.part_type === "rembourrage" && p.status !== "done"
      );
      if (remPart) {
        const days = getDaysLeft(o.delivery_date);
        if (days <= 3 && days >= 0) {
          reminders.push({
            orderId: o.id,
            customer: o.customer_name || "—",
            daysLeft: days,
            partLabel: remPart.label ?? "",
          });
        }
      }
    });
    return reminders;
  }, [orders]);

  const tapisReminders = useMemo(() => {
    const reminders: { orderId: string; customer: string; daysLeft: number; partLabel: string; deliveryDate: string }[] = [];
    orders.forEach((o) => {
      const tapisPart = o.parts.find(
        (p) => p.part_type === "tapis" && p.status !== "done" && p.status !== "ready"
      );
      if (tapisPart) {
        const days = getDaysLeft(o.delivery_date);
        if (days <= 5 && days >= 0) {
          reminders.push({
            orderId: o.id,
            customer: o.customer_name || "—",
            daysLeft: days,
            partLabel: tapisPart.label ?? "",
            deliveryDate: o.delivery_date || "",
          });
        }
      }
    });
    return reminders;
  }, [orders]);

  const openDrawer = (order: OrderWithParts) => {
    setSelectedOrder(order);
    setShowDrawer(true);
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    setTimeout(() => setSelectedOrder(null), 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0EDE8] flex items-center justify-center" dir="rtl">
        <div className="text-[#1B5E3B] font-bold animate-pulse">جاري تحميل الطلبيات...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EDE8]" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E4DC] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1B5E3B] rounded-xl flex items-center justify-center text-white text-lg">📦</div>
              <h1 className="text-xl font-bold text-[#1B5E3B]">إدارة الطلبيات</h1>
            </div>
            <Link href="/admin" className="text-sm text-[#6B7B6E] hover:text-[#1B5E3B]">← رجوع للوحة</Link>
          </div>

          <div className="flex bg-[#F5F0E8] rounded-xl p-1 mb-4">
            <button onClick={() => setViewMode("regular")} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${viewMode === "regular" ? "bg-white text-[#1B5E3B] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              📦 الطلبيات العامة
            </button>
            <button onClick={() => setViewMode("foam")} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${viewMode === "foam" ? "bg-white text-[#1B5E3B] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              🧽 طلبيات البونج
            </button>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="🔍 بحث باسم الزبون، رقم الطلب، أو الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F5F0E8] border border-[#E8E4DC] rounded-xl px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-[#C9A84C]"
            />
          </div>

          {viewMode === "regular" ? (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {statusTabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${activeTab === tab.id ? "bg-[#1B5E3B] text-white shadow-md" : "bg-white text-[#6B7B6E] border border-[#E8E4DC] hover:bg-[#F5F0E8]"}`}>
                  {tab.label}<span className="mr-1 text-xs opacity-70">({counts[tab.id] || 0})</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {foamStatusTabs.map((tab) => (
                <button key={tab.id} onClick={() => setFoamActiveTab(tab.id)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${foamActiveTab === tab.id ? "bg-[#C9A84C] text-white shadow-md" : "bg-white text-[#6B7B6E] border border-[#E8E4DC] hover:bg-[#F5F0E8]"}`}>
                  {tab.label}<span className="mr-1 text-xs opacity-70">({foamCounts[tab.id] || 0})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {tapisReminders.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
              📞 تذكيرات الزرابي — اتصال بالشركة
            </h3>
            <div className="space-y-2">
              {tapisReminders.map((r) => (
                <div key={`${r.orderId}-${r.partLabel}`} className="flex items-center justify-between bg-white rounded-xl p-3">
                  <div>
                    <p className="text-sm font-bold text-[#1B5E3B]">{r.customer} — ORD-{r.orderId.slice(0,8)}</p>
                    <p className="text-xs text-gray-500">{r.partLabel} | تسليم: {r.deliveryDate ? new Date(r.deliveryDate).toLocaleDateString("ar-MA") : "—"} | اتصل قبل <strong>{r.daysLeft} أيام</strong></p>
                  </div>
                  <button
                    onClick={async () => {
                      await supabase.from("order_parts").update({ status: "sent" }).eq("order_id", r.orderId).eq("part_type", "tapis");
                      loadData();
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                  >
                    ✅ تم الاتصال
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mustafaReminders.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
              🔔 تذكيرات مصطفى (ملء الوسائد)
            </h3>
            <div className="space-y-2">
              {mustafaReminders.map((r) => (
                <div key={`${r.orderId}-${r.partLabel}`} className="flex items-center justify-between bg-white rounded-xl p-3">
                  <div>
                    <p className="text-sm font-bold text-[#1B5E3B]">{r.customer} — {r.orderId}</p>
                    <p className="text-xs text-gray-500">{r.partLabel} | باقي {r.daysLeft} أيام على التسليم</p>
                  </div>
                  <button
                    onClick={async () => {
                      await supabase.from("order_parts").update({ status: "done" }).eq("order_id", r.orderId).eq("part_type", "rembourrage");
                      loadData();
                    }}
                    className="px-3 py-1.5 bg-[#1B5E3B] text-white rounded-lg text-xs font-bold hover:bg-[#C9A84C] transition"
                  >
                    ✅ تم الملء
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Orders Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === "regular" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((order) => {
                const daysLeft = getDaysLeft(order.delivery_date);
                const isUrgent = daysLeft <= 2 && order.status !== "delivered" && order.status !== "ready";
                const partsSummary = getPartsSummary(order.parts);
                const depositPercent = (order.total_amount || 0) > 0 ? Math.round(((order.deposit_amount || 0) / (order.total_amount || 0)) * 100) : 0;
                const hasTapis = order.parts.some((p) => p.part_type === "tapis");
                // ✅ جديد: التحقق من وجود رومي
                // details can be JSON (string|number|boolean|object|array). Type-guard to ensure it's an object with isRomani
                const hasRomani = order.parts.some((p) =>
                  p.part_type === "salon" && typeof p.details === "object" && p.details !== null && (p.details as any).isRomani
                );

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E4DC] hover:shadow-md transition cursor-pointer"
                    onClick={() => openDrawer(order)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        order.status === "late" ? "bg-red-100 text-red-600" :
                        order.status === "ready" ? "bg-green-100 text-green-600" :
                        order.status === "new" ? "bg-amber-100 text-amber-600" :
                        "bg-blue-100 text-blue-600"
                      }`}>
                        {getStatusLabel(order.status)}
                      </span>
                      <div className="flex items-center gap-2">
                        {hasTapis && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">🧶 زربية</span>
                        )}
                        {hasRomani && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">🛋️ رومي</span>
                        )}
                        <span className="text-xs text-gray-400 font-mono">ORD-{order.order_number}</span>
                      </div>
                    </div>

                    <h3 className="font-bold text-[#1B5E3B] text-lg mb-1">{order.customer_name || "—"}</h3>
                    <p className="text-sm text-gray-500 mb-3">📞 {order.customer_phone || "—"}</p>

                    <div className="flex items-center gap-2 mb-3 text-lg">{partsSummary}</div>

                    <div className="flex items-center justify-between bg-[#F5F0E8] rounded-xl p-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">المجموع</p>
                        <p className="font-bold text-[#1B5E3B]">DH {(order.total_amount || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-gray-500">التسبيق ({depositPercent}%)</p>
                        <p className="font-bold text-[#C9A84C]">DH {(order.deposit_amount || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        📅 تسليم: {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString("ar-MA") : "—"}
                      </span>
                      {isUrgent ? (
                        <span className="text-red-500 font-bold">🔥 عاجل ({daysLeft} يوم)</span>
                      ) : daysLeft < 0 ? (
                        <span className="text-red-500 font-bold">⚠️ متأخر {Math.abs(daysLeft)} يوم</span>
                      ) : (
                        <span className="text-green-600">باقي {daysLeft} أيام</span>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t border-[#E8E4DC]">
                      <button
                        onClick={(e) => { e.stopPropagation(); openDrawer(order); }}
                        className="flex-1 py-2 bg-[#1B5E3B] text-white rounded-xl text-xs font-bold hover:bg-[#C9A84C] transition"
                      >
                        👁️ مراجعة
                      </button>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 py-2 bg-white border border-[#E8E4DC] text-[#1B5E3B] rounded-xl text-xs font-bold text-center hover:bg-[#F5F0E8] transition"
                      >
                        ✏️ تفاصيل كاملة
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <p className="text-4xl mb-4">📭</p>
                <p>لا توجد طلبيات في هذا القسم</p>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {foamFiltered.map((order) => {
              const daysLeft = getDaysLeft(order.delivery_date);
              const isUrgent = daysLeft <= 2 && order.status !== "delivered" && order.status !== "ready" && order.status !== "cancelled";
              const st = foamStatusMap[order.status] || foamStatusMap.pending;
              return (
                <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E4DC] hover:shadow-md transition cursor-pointer" onClick={() => setSelectedFoamOrder(order)}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${st.bg} ${st.text}`}>{st.label}</span>
                    <span className="text-xs text-gray-400 font-mono">FOAM-{order.order_number}</span>
                  </div>
                  <h3 className="font-bold text-[#1B5E3B] text-lg mb-1">{order.customer_name || "—"}</h3>
                  <p className="text-sm text-gray-500 mb-3">📞 {order.customer_phone || "—"}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🧽</span>
                    <span className="text-sm text-gray-700">{order.foam_products?.name || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#F5F0E8] rounded-xl p-3 mb-3">
                    <div><p className="text-xs text-gray-500">السعر النهائي</p><p className="font-bold text-[#1B5E3B]">DH {(order.final_total || 0).toLocaleString()}</p></div>
                    <div className="text-left"><p className="text-xs text-gray-500">التسبيق</p><p className="font-bold text-[#C9A84C]">DH {(order.deposit_amount || 0).toLocaleString()}</p></div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">📅 تسليم: {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString("ar-MA") : "—"}</span>
                    {isUrgent ? <span className="text-red-500 font-bold">🔥 عاجل ({daysLeft} يوم)</span> : daysLeft < 0 ? <span className="text-red-500 font-bold">⚠️ متأخر {Math.abs(daysLeft)} يوم</span> : <span className="text-green-600">باقي {daysLeft} أيام</span>}
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-[#E8E4DC]">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedFoamOrder(order); }} className="flex-1 py-2 bg-[#1B5E3B] text-white rounded-xl text-xs font-bold hover:bg-[#C9A84C] transition">👁️ مراجعة</button>
                    <Link href={`/admin/foam-orders/${order.id}`} onClick={(e) => e.stopPropagation()} className="flex-1 py-2 bg-white border border-[#E8E4DC] text-[#1B5E3B] rounded-xl text-xs font-bold text-center hover:bg-[#F5F0E8] transition">✏️ تفاصيل</Link>
                  </div>
                </div>
              );
            })}
            {foamFiltered.length === 0 && (
              <div className="text-center py-20 text-gray-400 col-span-full"><p className="text-4xl mb-4">📭</p><p>لا توجد طلبيات بونج في هذا القسم</p></div>
            )}
          </div>
        )}
      </main>

      {showDrawer && selectedOrder && (
        <QuickReviewDrawer order={selectedOrder} tailors={tailors} onClose={closeDrawer} onRefresh={loadData} />
      )}
      {selectedFoamOrder && (
        <FoamOrderDrawer order={selectedFoamOrder} onClose={() => setSelectedFoamOrder(null)} onRefresh={loadData} />
      )}
    </div>
  );
}

/* ─── Foam Order Drawer ─── */
function FoamOrderDrawer({ order, onClose, onRefresh }: { order: FoamOrderWithProduct; onClose: () => void; onRefresh: () => void }) {
  const [status, setStatus] = useState<string>(order.status);
  const [saving, setSaving] = useState(false);

  const handleStatusChange = async () => {
    if (status === order.status) return;
    setSaving(true);
    await supabase.from("foam_orders").update({ status, updated_at: new Date().toISOString() }).eq("id", order.id);
    await supabase.from("audit_logs").insert({ table_name: "foam_orders", record_id: order.id, action: "status_change", old_values: { status: order.status }, new_values: { status }, performed_by: "المدير" });
    setSaving(false); onRefresh(); onClose();
  };

  const sendWhatsApp = () => {
    if (!order.suppliers?.name) { alert("لا يوجد هاتف للمورد"); return; }
    const msg = `مرحباً ${order.suppliers.name}،
طلبية بونج: FOAM-${order.order_number}
المنتج: ${order.foam_products?.name || "—"}
الكمية: ${order.total_length_meters || 0} متر
السعر: ${order.final_total || 0} درهم`;
    window.open(`https://wa.me/${(order.suppliers as any).phone?.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const st = foamStatusMap[order.status] || foamStatusMap.pending;

  return (
    <><div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
    <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-[#F0EDE8] z-50 shadow-2xl overflow-y-auto">
      <div className="bg-white border-b border-[#E8E4DC] p-4 sticky top-0 z-10 flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-[#1B5E3B]">FOAM-{order.order_number}</h2><p className="text-xs text-gray-500">{st.label}</p></div>
        <button onClick={onClose} className="w-10 h-10 bg-[#F5F0E8] rounded-xl flex items-center justify-center text-xl hover:bg-[#E8E4DC] transition">✕</button>
      </div>
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8E4DC]">
          <h3 className="text-sm font-bold text-[#1B5E3B] mb-3">👤 معلومات الزبون</h3>
          <p className="font-bold text-lg">{order.customer_name || "—"}</p>
          <p className="text-sm text-gray-500">📞 {order.customer_phone || "—"}</p>
          <div className="flex items-center justify-between mt-3 bg-[#F5F0E8] rounded-xl p-3">
            <div><p className="text-xs text-gray-500">السعر النهائي</p><p className="font-bold text-[#1B5E3B]">DH {(order.final_total || 0).toLocaleString()}</p></div>
            <div className="text-left"><p className="text-xs text-gray-500">التسبيق</p><p className="font-bold text-[#C9A84C]">DH {(order.deposit_amount || 0).toLocaleString()}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8E4DC]">
          <h3 className="text-sm font-bold text-[#1B5E3B] mb-3">🧽 تفاصيل المنتج</h3>
          <p className="text-sm"><span className="text-gray-500">المنتج:</span> <span className="font-bold">{order.foam_products?.name || "—"}</span></p>
          <p className="text-sm"><span className="text-gray-500">الارتفاع:</span> <span className="font-bold">{order.height_cm} سم</span></p>
          <p className="text-sm"><span className="text-gray-500">العرض:</span> <span className="font-bold">{order.width_cm} سم</span></p>
          <p className="text-sm"><span className="text-gray-500">الكمية:</span> <span className="font-bold">{order.total_length_meters || 0} متر</span></p>
          <p className="text-sm"><span className="text-gray-500">المورد:</span> <span className="font-bold">{order.suppliers?.name || "—"}</span></p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8E4DC]">
          <h3 className="text-sm font-bold text-[#1B5E3B] mb-3">⚙️ تغيير الحالة</h3>
          <select value={status} onChange={(e) => setStatus(e.target.value as FoamOrderStatus)} className="w-full bg-[#F5F0E8] border border-[#E8E4DC] rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C9A84C] mb-2">
            {Object.entries(foamStatusMap).map(([key, info]) => <option key={key} value={key}>{info.label}</option>)}
          </select>
          <button onClick={handleStatusChange} disabled={saving || status === order.status} className="w-full py-2 bg-[#1B5E3B] text-white rounded-xl text-xs font-bold hover:bg-[#C9A84C] transition disabled:opacity-50">{saving ? "⏳ جاري..." : "💾 تحديث الحالة"}</button>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={sendWhatsApp} className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition">📱 واتساب للمورد</button>
          <button onClick={onClose} className="flex-1 py-3 bg-white border border-[#E8E4DC] text-gray-600 rounded-xl text-sm font-bold hover:bg-[#F5F0E8] transition">❌ إغلاق</button>
        </div>
      </div>
    </div></>
  );
}

/* ─── Drawer ─── */
function QuickReviewDrawer({
  order,
  tailors,
  onClose,
  onRefresh,
}: {
  order: OrderWithParts;
  tailors: DbTailor[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [selectedTailor, setSelectedTailor] = useState<string>("");
  const [quickNote, setQuickNote] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(order.delivery_date || "");
  const [saving, setSaving] = useState(false);

  const daysLeft = getDaysLeft(deliveryDate);
  const hasTapis = order.parts.some((p) => p.part_type === "tapis");
  const tapisPart = order.parts.find((p) => p.part_type === "tapis");
  const tapisDaysLeft = getDaysLeft(order.delivery_date);
  const needsTapisCall = hasTapis && tapisPart && tapisPart.status !== "done" && tapisPart.status !== "ready" && tapisDaysLeft <= 5 && tapisDaysLeft >= 0;

  const handleSaveDate = async () => {
    await supabase.from("orders").update({ delivery_date: deliveryDate }).eq("id", order.id);
    onRefresh();
  };

  const handleSendToTailor = async () => {
    if (!selectedTailor) {
      alert("اختر خياطاً أولاً");
      return;
    }
    const salonPart = order.parts.find((p) => p.part_type === "salon");
    if (salonPart) {
      await supabase
        .from("order_parts")
        .update({ status: "sent", tailor_id: selectedTailor })
        .eq("id", salonPart.id);
    }
    await supabase.from("order_timeline").insert({
      order_id: order.id,
      event_type: "sent_to_tailor",
      actor: "المدير",
      note: `أُرسل للخياط ${tailors.find((t) => t.id === selectedTailor)?.full_name}`,
    });
    onRefresh();
    onClose();
  };

  const handleSendWhatsApp = (phone: string, message: string) => {
    const url = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const depositPercent = (order.total_amount || 0) > 0 ? Math.round(((order.deposit_amount || 0) / (order.total_amount || 0)) * 100) : 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-[#F0EDE8] z-50 shadow-2xl overflow-y-auto animate-slide-in-right">
        <div className="bg-white border-b border-[#E8E4DC] p-4 sticky top-0 z-10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1B5E3B]">ORD-{order.order_number}</h2>
            <p className="text-xs text-gray-500">{getStatusLabel(order.status)}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-[#F5F0E8] rounded-xl flex items-center justify-center text-xl hover:bg-[#E8E4DC] transition">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {needsTapisCall && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📞</span>
                <div className="flex-1">
                  <h4 className="font-bold text-blue-800 text-sm mb-1">تذكير: اتصال بشركة الزرابي</h4>
                  <p className="text-xs text-blue-600 mb-2">هذه الطلبية تحتوي على زربية. يجب الاتصال بالشركة قبل {tapisDaysLeft} أيام من التسليم.</p>
                  <button
                    onClick={async () => {
                      if (tapisPart) {
                        await supabase.from("order_parts").update({ status: "sent" }).eq("id", tapisPart.id);
                        onRefresh();
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                  >
                    ✅ تم الاتصال بالشركة
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8E4DC]">
            <h3 className="text-sm font-bold text-[#1B5E3B] mb-3">👤 معلومات الزبون</h3>
            <p className="font-bold text-lg">{order.customer_name || "—"}</p>
            <p className="text-sm text-gray-500">📞 {order.customer_phone || "—"}</p>
            <div className="flex items-center justify-between mt-3 bg-[#F5F0E8] rounded-xl p-3">
              <div>
                <p className="text-xs text-gray-500">المجموع</p>
                <p className="font-bold text-[#1B5E3B]">DH {(order.total_amount || 0).toLocaleString()}</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-500">التسبيق ({depositPercent}%)</p>
                <p className="font-bold text-[#C9A84C]">DH {(order.deposit_amount || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8E4DC]">
            <h3 className="text-sm font-bold text-[#1B5E3B] mb-3">📅 موعد التسليم</h3>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full bg-[#F5F0E8] border border-[#E8E4DC] rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C9A84C]"
            />
            <p className={`text-xs mt-2 font-bold ${daysLeft < 0 ? "text-red-500" : daysLeft <= 2 ? "text-amber-600" : "text-green-600"}`}>
              {daysLeft < 0 ? `⚠️ متأخر ${Math.abs(daysLeft)} يوم` : `باقي ${daysLeft} أيام`}
            </p>
            <button onClick={handleSaveDate} className="mt-2 w-full py-2 bg-[#1B5E3B] text-white rounded-xl text-xs font-bold hover:bg-[#C9A84C] transition">
              💾 حفظ التاريخ
            </button>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8E4DC]">
            <h3 className="text-sm font-bold text-[#1B5E3B] mb-3">📦 أجزاء الطلبية ({order.parts.length})</h3>
            <div className="space-y-3">
              {order.parts.map((part) => (
                <div key={part.id} className="bg-[#F5F0E8] rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">{getPartIcon(part.part_type)}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-white text-gray-600">
                      {getPartStatusLabel(part.status)}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#1B5E3B]">{part.label}</p>

                  {part.part_type === "salon" && part.status === "pending" && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">👤 اختر الخياط:</p>
                      <div className="flex gap-2">
                        {tailors.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTailor(t.id)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                              selectedTailor === t.id
                                ? "bg-[#1B5E3B] text-white"
                                : "bg-white border border-[#E8E4DC] text-[#1B5E3B]"
                            }`}
                          >
                            {t.full_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {part.supplier_phone && part.status === "pending" && (
                    <button
                      onClick={() => handleSendWhatsApp(part.supplier_phone!, part.whatsapp_message || "")}
                      className="mt-2 w-full py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition flex items-center justify-center gap-1"
                    >
                      📱 إرسال واتساب
                    </button>
                  )}

                  {part.part_type === "rembourrage" && part.status === "pending" && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-500">👤 مصطفى</span>
                      <button
                        onClick={async () => {
                          await supabase.from("order_parts").update({ status: "sent" }).eq("id", part.id);
                          onRefresh();
                        }}
                        className="flex-1 py-1.5 bg-[#C9A84C] text-[#1B5E3B] rounded-lg text-xs font-bold"
                      >
                        تكليف
                      </button>
                    </div>
                  )}

                  {part.part_type === "tapis" && part.status !== "done" && part.status !== "ready" && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-xs text-blue-700 font-bold">🧶 زربية — اتصل بالشركة قبل التسليم</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8E4DC]">
            <h3 className="text-sm font-bold text-[#1B5E3B] mb-3">📝 ملاحظة سريعة للخياط</h3>
            <textarea
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              placeholder="اكتب ملاحظة..."
              rows={3}
              className="w-full bg-[#F5F0E8] border border-[#E8E4DC] rounded-xl px-4 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-[#C9A84C]"
            />
            <div className="flex gap-2 mt-2">
              {["جودة عالية", "عاجل", "تأكد من اللون", "مخاد إضافية"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuickNote((prev) => (prev ? prev + "، " : "") + tag)}
                  className="px-2 py-1 bg-[#F5F0E8] text-[#1B5E3B] rounded-lg text-[10px] font-bold border border-[#E8E4DC] hover:bg-[#E8E4DC] transition"
                >
                  + {tag}
                </button>
              ))}
            </div>
            <button
              onClick={async () => {
                if (!quickNote.trim()) return;
                await supabase.from("messages").insert({
                  order_id: order.id,
                  sender_role: "admin",
                  sender_name: "المدير",
                  body: quickNote,
                });
                setQuickNote("");
                alert("تم إرسال الملاحظة");
              }}
              className="mt-2 w-full py-2 bg-[#1B5E3B] text-white rounded-xl text-xs font-bold hover:bg-[#C9A84C] transition"
            >
              ➤ إرسال ملاحظة
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 bg-white border border-[#E8E4DC] text-gray-600 rounded-xl text-sm font-bold hover:bg-[#F5F0E8] transition">
              ❌ إلغاء
            </button>
            <button
              onClick={handleSendToTailor}
              disabled={!selectedTailor}
              className="flex-1 py-3 bg-[#1B5E3B] text-white rounded-xl text-sm font-bold hover:bg-[#C9A84C] transition disabled:opacity-50"
            >
              ✅ إرسال للخياط
            </button>
          </div>
        </div>
      </div>
    </>
  );
}