"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";
import type { FoamOrder } from "@/types/foam-types";

type DbOrder = Database["public"]["Tables"]["orders"]["Row"];
type DbOrderPart = Database["public"]["Tables"]["order_parts"]["Row"];
type DbTailor = Database["public"]["Tables"]["tailors"]["Row"];
type DbTimeline = Database["public"]["Tables"]["order_timeline"]["Row"];
type DbWoodOrder = any;
type FoamOrderWithProduct = FoamOrder & {
  foam_products?: { name: string } | null;
  suppliers?: { name: string } | null;
};

type OrderPartWithStatus = DbOrderPart & { status?: string | null };

interface OrderWithParts extends DbOrder {
  parts: OrderPartWithStatus[];
}

type Period = "today" | "week" | "month";

/* ─── Helpers ─── */
function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function getPeriodStart(period: Period): string {
  const d = new Date();
  if (period === "today") return getTodayStr();
  if (period === "week") {
    d.setDate(d.getDate() - 7);
  } else {
    d.setDate(d.getDate() - 30);
  }
  return d.toISOString();
}

function formatCurrency(n: number) {
  return `DH ${Math.round(n).toLocaleString()}`;
}

function getPressureLevel(weeklyOrders: number) {
  if (weeklyOrders < 8) return { label: "أقل من العادي", color: "bg-blue-100 text-blue-700", bar: "bg-blue-500", percent: Math.min((weeklyOrders / 8) * 33, 33), icon: "😌" };
  if (weeklyOrders <= 14) return { label: "ضغط عادي", color: "bg-green-100 text-green-700", bar: "bg-green-500", percent: 33 + ((weeklyOrders - 8) / 6) * 34, icon: "✅" };
  return { label: "ضغط مرتفع جداً", color: "bg-red-100 text-red-700", bar: "bg-red-500", percent: Math.min(67 + ((weeklyOrders - 14) / 10) * 33, 100), icon: "🔥" };
}

function getDaysLeft(deliveryDate: string | null | undefined): number {
  if (!deliveryDate) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(deliveryDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/* ─── Components ─── */
function KPICard({ title, value, sub, trend, trendUp, icon, bg, textColor }: any) {
  return (
    <div className={`${bg} rounded-2xl p-5 shadow-sm border border-white/50 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{trend}</span>
      </div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <h3 className="text-lg font-bold text-[#1B5E3B] mb-4 flex items-center gap-2">
      <span>{icon}</span> {title}
    </h3>
  );
}

/* ─── Main Page ─── */
export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderWithParts[]>([]);
  const [tailors, setTailors] = useState<DbTailor[]>([]);
  const [timeline, setTimeline] = useState<DbTimeline[]>([]);
  const [target, setTarget] = useState(15000);
  const [foamOrders, setFoamOrders] = useState<FoamOrderWithProduct[]>([]);
  const [woodOrders, setWoodOrders] = useState<DbWoodOrder[]>([]);

  const todayStr = getTodayStr();

  /* Fetch all data */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const since = getPeriodStart(period);

      const [{ data: ordersData }, { data: partsData }, { data: tailorsData }, { data: timelineData }, { data: targetData }, { data: foamData }, { data: woodData }] = await Promise.all([
        supabase.from("orders").select("*").gte("created_at", since).order("created_at", { ascending: false }),
        supabase.from("order_parts").select("*").order("created_at", { ascending: false }),
        supabase.from("tailors").select("*").eq("is_active", true).order("full_name", { ascending: true }),
        supabase.from("order_timeline").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("settings").select("value").eq("key", "monthly_target").single(),
        supabase.from("foam_orders").select("*, foam_products(name), suppliers(name)").gte("created_at", since).order("created_at", { ascending: false }).limit(100),
        supabase.from("wood_orders").select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(100),
      ]);

      const ordersWithParts: OrderWithParts[] = (ordersData || []).map((o) => ({
        ...o,
        parts: (partsData || []).filter((p) => p.order_id === o.id),
      }));

      setOrders(ordersWithParts);
      setTailors(tailorsData || []);
      setTimeline(timelineData || []);
      setFoamOrders(foamData || []);
      setWoodOrders(woodData || []);
      if (targetData?.value) setTarget(Number(targetData.value) || 15000);
    } catch (err) {
      console.error("فشل تحميل لوحة التحكم:", err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ─── Derived Data ─── */

  // KPIs
 const totalSales = orders.reduce((s, o) => s + ((o as any).total_amount || (o as any).total || 0), 0);
  const totalOrders = orders.length;
  const uniqueCustomers = useMemo(() => new Set(orders.map((o) => o.customer_name).filter(Boolean)).size, [orders]);
  const targetPercent = Math.min(Math.round((totalSales / target) * 100), 100);

  // Foam stats
  const foamTotalSales = useMemo(() => foamOrders.reduce((s, o) => s + (o.final_total || 0), 0), [foamOrders]);
  const foamPending = useMemo(() => foamOrders.filter(o => o.status === 'pending').length, [foamOrders]);
  const foamInProduction = useMemo(() => foamOrders.filter(o => o.status === 'in_production').length, [foamOrders]);
  const foamReady = useMemo(() => foamOrders.filter(o => o.status === 'ready').length, [foamOrders]);
  const foamUrgent = useMemo(() => {
    return foamOrders.filter(o => {
      const days = getDaysLeft(o.delivery_date);
      return o.status !== 'delivered' && o.status !== 'ready' && days <= 3 && days >= 0;
    });
  }, [foamOrders]);

  // Wood stats
  const woodTotalSales = useMemo(() => woodOrders.reduce((s, o) => s + (o.final_total || 0), 0), [woodOrders]);
  const woodPending = useMemo(() => woodOrders.filter(o => o.status === 'new' || o.status === 'pending').length, [woodOrders]);
  const woodInProgress = useMemo(() => woodOrders.filter(o => o.status === 'in_progress').length, [woodOrders]);
  const woodReady = useMemo(() => woodOrders.filter(o => o.status === 'ready').length, [woodOrders]);

  // Tapis orders count
  const tapisOrdersCount = useMemo(() => {
    return orders.filter((o) =>
      o.parts.some((p) => p.part_type === "tapis" && p.status !== "done" && p.status !== "ready")
    ).length;
  }, [orders]);

  // Tapis urgent (<=5 days)
  const tapisUrgentCount = useMemo(() => {
    return orders.filter((o) => {
      const hasTapis = o.parts.some((p) => p.part_type === "tapis" && p.status !== "done" && p.status !== "ready");
      if (!hasTapis) return false;
      const days = getDaysLeft(o.delivery_date);
      return days <= 5 && days >= 0;
    }).length;
  }, [orders]);

  // Today's deliveries
  const todayDeliveries = useMemo(
    () => orders.filter((o) => o.delivery_date === todayStr && o.status !== "delivered" && o.status !== "ready"),
    [orders, todayStr]
  );

  // Tailor stats
  const tailorStats = useMemo(() => {
    const stats: Record<string, { id: string; name: string; count: number; completed: number }> = {};
    orders.forEach((o) => {
      o.parts.forEach((p) => {
        if (!p.tailor_id) return;
        if (!stats[p.tailor_id]) {
          const t = tailors.find((tl) => tl.id === p.tailor_id);
          stats[p.tailor_id] = { id: p.tailor_id, name: t?.full_name || "خياط", count: 0, completed: 0 };
        }
        stats[p.tailor_id].count++;
        if (p.status === "done" || p.status === "ready") stats[p.tailor_id].completed++;
      });
    });
    return Object.values(stats);
  }, [orders, tailors]);

  // Work pressure (active orders this week)
  const weeklyActiveOrders = useMemo(
    () => orders.filter((o) => ["pending", "sent", "in_progress", "partial"].includes(o.status)).length,
    [orders]
  );
  const pressure = getPressureLevel(weeklyActiveOrders);

  // Best customer
  const bestCustomer = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    orders.forEach((o) => {
      const name = o.customer_name || "—";
      if (!map[name]) map[name] = { name, total: 0, count: 0 };
      map[name].total += (o as any).total_amount || (o as any).total || 0 || 0;
      map[name].count++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total)[0] || null;
  }, [orders]);

  // Best product (from order_parts)
  const bestProduct = useMemo(() => {
    const map: Record<string, { name: string; count: number; revenue: number }> = {};
    orders.forEach((o) => {
      o.parts.forEach((p) => {
        const name = p.label || p.part_type || "—";
        if (!map[name]) map[name] = { name, count: 0, revenue: 0 };
        map[name].count++;
        const orderPartsCount = o.parts.length || 1;
        map[name].revenue += ((o as any).total_amount || (o as any).total || 0) / orderPartsCount;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue)[0] || null;
  }, [orders]);

  // Smart recommendations
  const recommendations = useMemo(() => {
    const recs: { title: string; desc: string; type: "product" | "customer" | "inventory" }[] = [];
    const lateOrders = orders.filter((o) => o.delivery_date && new Date(o.delivery_date) < new Date(todayStr) && o.status !== "delivered" && o.status !== "ready");
    if (lateOrders.length > 0) {
      recs.push({ type: "product", title: `${lateOrders.length} طلبات متأخرة`, desc: "راجع قائمة الطلبيات المتأخرة وتواصل مع الزبائن" });
    }
    if (bestCustomer && bestCustomer.count >= 3) {
      recs.push({ type: "customer", title: `${bestCustomer.name} زبون دائم`, desc: `قيمة مشترياته DH ${Math.round(bestCustomer.total).toLocaleString()} — اعرض له خصماً` });
    }
    const pendingCount = orders.filter((o) => o.status === "pending" || o.status === "new").length;
    if (pendingCount > 5) {
      recs.push({ type: "inventory", title: "ضغط على الطلبات الجديدة", desc: `${pendingCount} طلبات بانتظار المراجعة — راجعها الآن` });
    }
    if (tapisUrgentCount > 0) {
      recs.push({ type: "product", title: `${tapisUrgentCount} زربية تحتاج اتصال عاجل`, desc: "اتصل بشركة الزرابي قبل فوات الأوان" });
    }
    return recs;
  }, [orders, todayStr, bestCustomer, tapisUrgentCount]);

  // Chart data (last 30 days)
  const salesChartData = useMemo(() => {
    const days: { day: string; sales: number; target: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      const dayLabel = d.getDate().toString();
      const sales = orders
        .filter((o) => o.created_at && o.created_at.startsWith(dayStr))
        .reduce((s, o) => s + ((o as any).total_amount || (o as any).total || 0), 0);
      days.push({ day: dayLabel, sales, target: Math.round(target / 30) });
    }
    return days;
  }, [orders, target]);

  // Order status donut
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const ORDER_STATUS_DATA = useMemo(() => {
    const statusMap: Record<string, { name: string; color: string }> = {
      ready: { name: "مكتمل", color: "#1B5E3B" },
      in_progress: { name: "قيد التنفيذ", color: "#C9A84C" },
      delivered: { name: "مُسلّم", color: "#16A34A" },
      sent: { name: "مرسل", color: "#3B82F6" },
      new: { name: "جديد", color: "#F59E0B" },
      review: { name: "قيد المراجعة", color: "#F97316" },
      partial: { name: "جزئي", color: "#94A3B8" },
      pending: { name: "معلق", color: "#94A3B8" },
      late: { name: "متأخر", color: "#DC2626" },
    };
    return Object.entries(statusCounts)
      .map(([status, value]) => ({
        name: statusMap[status]?.name || status,
        value,
        color: statusMap[status]?.color || "#94A3B8",
      }))
      .filter((d) => d.value > 0);
  }, [statusCounts]);

  // Activities from timeline
  const activities = useMemo(() => {
    return timeline.slice(0, 5).map((t) => ({
      id: t.id,
      time: t.created_at ? new Date(t.created_at).toLocaleDateString("ar-MA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—",
      text: `${t.actor}: ${t.event_type}${t.note ? ` — ${t.note}` : ""}`,
      type: t.event_type.includes("tailor") ? "tailor" : t.event_type.includes("delivery") ? "delivery" : t.event_type.includes("catalog") ? "catalog" : "order",
    }));
  }, [timeline]);

  // Notifications (derived from real data)
  const notifications = useMemo(() => {
    const notifs: { id: string; type: "danger" | "warning" | "info" | "success" | "reminder"; message: string; action: string; actionLabel: string }[] = [];
    const lateCount = orders.filter((o) => o.delivery_date && new Date(o.delivery_date) < new Date(todayStr) && o.status !== "delivered" && o.status !== "ready").length;
    if (lateCount > 0) {
      notifs.push({ id: "n1", type: "danger", message: `${lateCount} طلبات متأخرة عن موعد التسليم`, action: "/admin/orders", actionLabel: "مراجعة فورية" });
    }
    if (todayDeliveries.length > 0) {
      const first = todayDeliveries[0];
      notifs.push({ id: "n2", type: "warning", message: `اليوم: تسليم ${first.customer_name || "—"} (ORD-${first.order_number})`, action: `/admin/orders/${first.id}`, actionLabel: "فتح الطلب" });
    }
    const pendingReview = orders.filter((o) => o.status === "new" || o.status === "review").length;
    if (pendingReview > 0) {
      notifs.push({ id: "n3", type: "info", message: `${pendingReview} طلبات بانتظار المراجعة والإرسال`, action: "/admin/orders", actionLabel: "مراجعة" });
    }
    if (tapisUrgentCount > 0) {
      notifs.push({ id: "n4", type: "warning", message: `${tapisUrgentCount} زربية تحتاج اتصال بشركة الزرابي خلال 5 أيام`, action: "/admin/orders", actionLabel: "مراجعة الزرابي" });
    }
    return notifs;
  }, [orders, todayDeliveries, todayStr, tapisUrgentCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0EDE8] flex items-center justify-center" dir="rtl">
        <div className="text-[#1B5E3B] font-bold animate-pulse">جاري تحميل لوحة التحكم...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EDE8]" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E4DC] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1B5E3B] rounded-xl flex items-center justify-center text-white text-lg">🏠</div>
            <h1 className="text-xl font-bold text-[#1B5E3B]">لوحة التحكم</h1>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="bg-[#F5F0E8] border border-[#E8E4DC] rounded-xl px-4 py-2 text-sm text-[#1B5E3B] font-bold outline-none focus:ring-2 focus:ring-[#C9A84C]"
            >
              <option value="today">اليوم</option>
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
            </select>
            <Link href="/admin/notifications" className="relative w-10 h-10 bg-[#F5F0E8] rounded-xl flex items-center justify-center text-xl hover:bg-[#E8E4DC] transition">
              🔔
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{notifications.length}</span>
              )}
            </Link>
            <div className="w-10 h-10 rounded-full bg-[#1B5E3B] flex items-center justify-center text-white font-bold text-sm">م</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <KPICard title="إجمالي المبيعات" value={formatCurrency(totalSales)} sub="الصالون" trend="▲" trendUp={true} icon="💰" bg="bg-[#E8F5E9]" textColor="text-[#1B5E3B]" />
          <KPICard title="مبيعات البونج" value={formatCurrency(foamTotalSales)} sub="البونج" trend="▲" trendUp={true} icon="🧽" bg="bg-[#FFF3E0]" textColor="text-orange-700" />
          <KPICard title="مبيعات العود" value={formatCurrency(woodTotalSales)} sub="العود" trend="▲" trendUp={true} icon="🪵" bg="bg-[#F3E5F5]" textColor="text-purple-700" />
          <KPICard title="عدد الطلبات" value={totalOrders} sub="طلب جديد" trend="▲" trendUp={true} icon="📦" bg="bg-[#E3F2FD]" textColor="text-blue-700" />
          <KPICard title="الزبائن النشطون" value={uniqueCustomers} sub="زبون هذا الشهر" trend="▲" trendUp={true} icon="👥" bg="bg-[#FFF3E0]" textColor="text-orange-700" />
          <div className="bg-[#F3E5F5] rounded-2xl p-5 shadow-sm border border-white/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">🎯</span>
              <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">{targetPercent}%</span>
            </div>
            <p className="text-sm text-gray-500 mb-1">الهدف الشهري</p>
            <p className="text-2xl font-bold text-purple-700">{formatCurrency(target)}</p>
            <div className="w-full bg-purple-200 rounded-full h-2 mt-3">
              <div className="bg-[#C9A84C] h-2 rounded-full transition-all" style={{ width: `${targetPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Status Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tapis */}
          <div className={`rounded-2xl p-5 shadow-sm border border-white/50 ${tapisUrgentCount > 0 ? "bg-red-50" : "bg-blue-50"}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">🧶</span>
              {tapisUrgentCount > 0 && (
                <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full">{tapisUrgentCount} عاجلة</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-1">طلبات الزرابي المعلقة</p>
            <p className={`text-3xl font-bold ${tapisOrdersCount > 0 ? "text-blue-700" : "text-gray-400"}`}>{tapisOrdersCount}</p>
            <p className="text-xs text-gray-400 mt-1">
              {tapisUrgentCount > 0 
                ? `⚠️ ${tapisUrgentCount} تحتاج اتصال بشركة الزرابي خلال 5 أيام`
                : "لا توجد طلبات زرابي عاجلة"
              }
            </p>
            <Link href="/admin/orders" className="mt-3 inline-block text-xs font-bold text-[#1B5E3B] hover:text-[#C9A84C] transition">
              عرض الطلبيات ←
            </Link>
          </div>

          {/* Today's Deliveries */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E4DC]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">📅</span>
              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">{todayDeliveries.length}</span>
            </div>
            <p className="text-sm text-gray-500 mb-1">تسليمات اليوم</p>
            <p className="text-3xl font-bold text-[#1B5E3B]">{todayDeliveries.length}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString("ar-MA", { weekday: "long", day: "numeric", month: "long" })}</p>
          </div>

          {/* Tailors */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E4DC]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">👔</span>
            </div>
            <p className="text-sm text-gray-500 mb-1">الخياطون النشطون</p>
            <p className="text-3xl font-bold text-[#1B5E3B]">{tailors.length}</p>
            <p className="text-xs text-gray-400 mt-1">
              {tailorStats.length > 0 
                ? `${tailorStats.reduce((s, t) => s + t.completed, 0)} مهمة مكتملة`
                : "لا توجد مهام مسندة"
              }
            </p>
          </div>

          {/* Foam Orders */}
          <div className={`rounded-2xl p-5 shadow-sm border border-white/50 ${foamUrgent.length > 0 ? "bg-orange-50" : "bg-green-50"}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">🧽</span>
              {foamUrgent.length > 0 && (
                <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded-full">{foamUrgent.length} عاجلة</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-1">طلبيات البونج</p>
            <div className="flex gap-2 text-center mb-2">
              <div className="flex-1"><p className="text-xl font-bold text-[#1B5E3B]">{foamPending}</p><p className="text-[10px] text-gray-400">معلقة</p></div>
              <div className="flex-1"><p className="text-xl font-bold text-[#C9A84C]">{foamInProduction}</p><p className="text-[10px] text-gray-400">قيد الإنتاج</p></div>
              <div className="flex-1"><p className="text-xl font-bold text-green-600">{foamReady}</p><p className="text-[10px] text-gray-400">جاهزة</p></div>
            </div>
            <p className="text-xs text-gray-400">
              {foamUrgent.length > 0
                ? `⚠️ ${foamUrgent.length} طلب بونج يحتاج متابعة عاجلة`
                : "لا توجد طلبات بونج عاجلة"
              }
            </p>
            <Link href="/admin/foam-orders" className="mt-3 inline-block text-xs font-bold text-[#1B5E3B] hover:text-[#C9A84C] transition">
              عرض الطلبيات ←
            </Link>
          </div>
        </div>

        {/* Wood Orders Widget */}
        {(woodPending > 0 || woodInProgress > 0 || woodReady > 0) && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E4DC]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-[#1B5E3B] flex items-center gap-2">
                <span>🪵</span> طلبيات العود
              </h3>
              <Link href="/admin/wood-orders" className="text-xs font-bold text-[#1B5E3B] hover:text-[#C9A84C] transition">
                عرض الكل ←
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-[#F5F0E8] rounded-xl p-3">
                <p className="text-2xl font-bold text-[#1B5E3B]">{woodPending}</p>
                <p className="text-xs text-gray-500">جديدة / معلقة</p>
              </div>
              <div className="bg-[#FFF3E0] rounded-xl p-3">
                <p className="text-2xl font-bold text-[#C9A84C]">{woodInProgress}</p>
                <p className="text-xs text-gray-500">قيد التنفيذ</p>
              </div>
              <div className="bg-[#E8F5E9] rounded-xl p-3">
                <p className="text-2xl font-bold text-green-600">{woodReady}</p>
                <p className="text-xs text-gray-500">جاهزة</p>
              </div>
            </div>
          </div>
        )}

        {/* Foam Reminders */}
        {foamUrgent.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-2">
              🧽 تذكيرات البونج — متابعة عاجلة
            </h3>
            <div className="space-y-2">
              {foamUrgent.map((o) => (
                <div key={o.id} className="flex items-center justify-between bg-white rounded-xl p-3">
                  <div>
                    <p className="text-sm font-bold text-[#1B5E3B]">{o.customer_name} — FOAM-{o.order_number}</p>
                    <p className="text-xs text-gray-500">{o.foam_products?.name || "—"} | تسليم: {o.delivery_date ? new Date(o.delivery_date).toLocaleDateString("ar-MA") : "—"} | باقي <strong>{getDaysLeft(o.delivery_date)} أيام</strong></p>
                  </div>
                  <Link href={`/admin/foam-orders/${o.id}`} className="px-3 py-1.5 bg-[#1B5E3B] text-white rounded-lg text-xs font-bold hover:bg-[#C9A84C] transition">
                    فتح الطلب
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Area Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC]">
            <SectionTitle icon="📈" title="المبيعات — 30 يوم" />
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B5E3B" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1B5E3B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} 
                    formatter={(value) => [`DH ${Number(value ?? 0).toLocaleString()}`, "المبيعات"]} 
                  />
                  <Area type="monotone" dataKey="sales" stroke="#1B5E3B" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="target" stroke="#C9A84C" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC] flex flex-col items-center justify-center">
            <SectionTitle icon="🍩" title="حالة الطلبات" />
            <div className="h-56 w-full relative">
              {ORDER_STATUS_DATA.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ORDER_STATUS_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                      {ORDER_STATUS_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">لا توجد بيانات</div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-[#1B5E3B]">{totalOrders}</span>
                <span className="text-xs text-gray-400">طلباً</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {ORDER_STATUS_DATA.map((s) => (
                <div key={s.name} className="flex items-center gap-1 text-xs">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-gray-600">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Triple: Deliveries + Tailors + Pressure */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Today's Deliveries */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC]">
            <SectionTitle icon="📅" title={`تسليمات اليوم — ${new Date().toLocaleDateString("ar-MA", { weekday: "long", day: "numeric", month: "long" })}`} />
            <div className="space-y-3">
              {todayDeliveries.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">لا توجد تسليمات اليوم 🎉</div>
              ) : (
                todayDeliveries.map((order) => (
                  <div key={order.id} className="bg-[#F5F0E8] rounded-xl p-3 border border-dashed border-[#C9A84C]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#1B5E3B] text-sm">{order.customer_name || "—"}</span>
                      <span className="text-xs bg-white px-2 py-0.5 rounded-lg text-gray-500">ORD-{order.order_number}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{order.delivery_date}</p>
                    <div className="flex gap-2">
                      <Link href={`/admin/orders/${order.id}`} className="flex-1 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold text-center hover:bg-green-700 transition">فتح الطلب</Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tailor Performance */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC]">
            <SectionTitle icon="👔" title="أداء الخياطين" />
            <div className="space-y-5">
              {tailorStats.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">لا توجد بيانات خياطين</div>
              ) : (
                tailorStats.map((t) => (
                  <div key={t.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-[#1B5E3B]">{t.name}</span>
                      <span className="text-xs text-gray-500">{t.count} طلب ({t.completed} مكتمل)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div className="bg-[#1B5E3B] h-3 rounded-full transition-all" style={{ width: `${t.count > 0 ? (t.completed / t.count) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Work Pressure */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC]">
            <SectionTitle icon="🌡️" title="ضغط العمل الأسبوعي" />
            <div className="flex flex-col items-center py-4">
              <div className="text-5xl mb-2">{pressure.icon}</div>
              <div className={`px-4 py-1.5 rounded-full text-sm font-bold mb-4 ${pressure.color}`}>{pressure.label}</div>
              <div className="w-full bg-gray-100 rounded-full h-4 mb-2">
                <div className={`${pressure.bar} h-4 rounded-full transition-all`} style={{ width: `${pressure.percent}%` }} />
              </div>
              <p className="text-xs text-gray-400">{weeklyActiveOrders} طلب نشط هذا الأسبوع</p>
            </div>
            <div className="mt-4 pt-4 border-t border-[#E8E4DC] space-y-2">
              <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-gray-500">أقل من 8: أقل من العادي</span></div>
              <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-gray-500">8 إلى 14: ضغط عادي</span></div>
              <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-gray-500">أكثر من 14: ضغط مرتفع</span></div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC]">
            <SectionTitle icon="🏆" title="أفضل زبون" />
            {bestCustomer ? (
              <div className="text-center py-2">
                <div className="w-16 h-16 bg-[#1B5E3B] rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold mb-3">{bestCustomer.name.charAt(0)}</div>
                <h4 className="font-bold text-[#1B5E3B] text-lg">{bestCustomer.name}</h4>
                <p className="text-2xl font-bold text-[#C9A84C] my-1">{formatCurrency(bestCustomer.total)}</p>
                <p className="text-sm text-gray-500">{bestCustomer.count} طلبات | زبون دائم</p>
                <Link href="/admin/orders" className="mt-3 inline-block px-4 py-2 bg-[#F5F0E8] text-[#1B5E3B] rounded-xl text-xs font-bold hover:bg-[#E8E4DC] transition">عرض السجل</Link>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm">لا توجد بيانات كافية</div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC]">
            <SectionTitle icon="🥇" title="الأكثر مبيعاً" />
            {bestProduct ? (
              <div className="text-center py-2">
                <div className="text-4xl mb-3">🛋️</div>
                <h4 className="font-bold text-[#1B5E3B] text-lg">{bestProduct.name}</h4>
                <p className="text-2xl font-bold text-[#C9A84C] my-1">{formatCurrency(bestProduct.revenue)}</p>
                <p className="text-sm text-gray-500">باعت {bestProduct.count} مرة</p>
                <div className="mt-3 inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full"><span>▲</span> 25% عن الشهر الماضي</div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm">لا توجد بيانات كافية</div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC]">
            <SectionTitle icon="💡" title="توصية ذكية" />
            <div className="space-y-3">
              {recommendations.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">كل شيء على ما يرام ✅</div>
              ) : (
                recommendations.map((rec, i) => (
                  <div key={i} className="bg-[#F5F0E8] rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{rec.type === "product" ? "📦" : rec.type === "customer" ? "👤" : "📊"}</span>
                      <div>
                        <p className="text-sm font-bold text-[#1B5E3B]">{rec.title}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{rec.desc}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC]">
          <SectionTitle icon="🔔" title="آخر النشاطات" />
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">لا توجد نشاطات مسجلة</div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${act.type === "order" ? "bg-blue-500" : act.type === "tailor" ? "bg-[#1B5E3B]" : act.type === "delivery" ? "bg-green-500" : "bg-[#C9A84C]"}`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 leading-relaxed">{act.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{act.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC]">
          <SectionTitle icon="⚠️" title="تنبيهات وإشعارات" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {notifications.length === 0 ? (
              <div className="col-span-full text-center py-6 text-gray-400 text-sm">لا توجد تنبيهات حالياً 🎉</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`rounded-xl p-4 border-r-4 ${n.type === "danger" ? "bg-red-50 border-red-500" : n.type === "warning" ? "bg-amber-50 border-amber-500" : n.type === "info" ? "bg-blue-50 border-blue-500" : "bg-purple-50 border-purple-500"}`}>
                  <p className="text-sm text-gray-800 leading-relaxed mb-2">{n.message}</p>
                  <Link href={n.action} className={`inline-block text-xs font-bold px-3 py-1.5 rounded-lg transition ${n.type === "danger" ? "bg-red-500 text-white hover:bg-red-600" : n.type === "warning" ? "bg-amber-500 text-white hover:bg-amber-600" : n.type === "info" ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-purple-500 text-white hover:bg-purple-600"}`}>
                    {n.actionLabel}
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}