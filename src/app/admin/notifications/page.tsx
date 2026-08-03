"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";
import type { FoamOrder } from "@/types/foam-types";

type DbOrder = Database["public"]["Tables"]["orders"]["Row"];
type DbOrderPart = Database["public"]["Tables"]["order_parts"]["Row"];

interface OrderWithParts extends DbOrder {
  parts: DbOrderPart[];
}

type FoamOrderWithProduct = FoamOrder & {
  foam_products?: { name: string } | null;
};

type NotifType = "danger" | "warning" | "info" | "success" | "reminder";

interface NotificationItem {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  action: string;
  actionLabel: string;
  orderId?: string;
  createdAt: string;
}

/* ─── Helpers ─── */
function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function getDaysLeft(deliveryDate: string | null): number {
  if (!deliveryDate) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(deliveryDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatCurrency(n: number) {
  return `DH ${Math.round(n).toLocaleString()}`;
}

function typeLabel(type: NotifType) {
  switch (type) {
    case "danger": return { text: "خطير", bg: "bg-red-100 text-red-700", border: "border-red-500", icon: "🔴", dot: "bg-red-500" };
    case "warning": return { text: "تحذير", bg: "bg-amber-100 text-amber-700", border: "border-amber-500", icon: "🟠", dot: "bg-amber-500" };
    case "info": return { text: "معلومة", bg: "bg-blue-100 text-blue-700", border: "border-blue-500", icon: "🔵", dot: "bg-blue-500" };
    case "success": return { text: "نجاح", bg: "bg-green-100 text-green-700", border: "border-green-500", icon: "🟢", dot: "bg-green-500" };
    case "reminder": return { text: "تذكير", bg: "bg-purple-100 text-purple-700", border: "border-purple-500", icon: "🟣", dot: "bg-purple-500" };
  }
}

/* ─── Components ─── */
function NotifCard({ notif }: { notif: NotificationItem }) {
  const style = typeLabel(notif.type);
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border-r-4 ${style.border} hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${style.bg}`}>
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-[#1B5E3B] text-sm">{notif.title}</h4>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg}`}>{style.text}</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">{notif.message}</p>
          <Link
            href={notif.action}
            className={`inline-block text-xs font-bold px-4 py-2 rounded-xl transition ${
              notif.type === "danger"
                ? "bg-red-500 text-white hover:bg-red-600"
                : notif.type === "warning"
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : notif.type === "info"
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : notif.type === "success"
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-purple-500 text-white hover:bg-purple-600"
            }`}
          >
            {notif.actionLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatPill({ count, label, colorClass, icon }: { count: number; label: string; colorClass: string; icon: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8E4DC] flex items-center gap-3">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#1B5E3B]">{count}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderWithParts[]>([]);
  const [foamOrders, setFoamOrders] = useState<FoamOrderWithProduct[]>([]);
  const [activeFilter, setActiveFilter] = useState<NotifType | "all">("all");

  const todayStr = getTodayStr();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - 60); // آخر 60 يوماً لتغطية المتأخرات

      const [{ data: ordersData }, { data: partsData }, { data: foamData }] = await Promise.all([
        supabase.from("orders").select("*").gte("created_at", since.toISOString()).order("created_at", { ascending: false }),
        supabase.from("order_parts").select("*"),
        supabase.from("foam_orders").select("*, foam_products(name)").order("created_at", { ascending: false }).limit(200),
      ]);

      const ordersWithParts: OrderWithParts[] = (ordersData || []).map((o) => ({
        ...o,
        parts: (partsData || []).filter((p) => p.order_id === o.id),
      }));

      setOrders(ordersWithParts);
      setFoamOrders(foamData || []);
    } catch (err) {
      console.error("فشل تحميل الإشعارات:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ─── Build Notifications ─── */
  const notifications = useMemo(() => {
    const notifs: NotificationItem[] = [];

    // 1. طلبات متأخرة
    const lateOrders = orders.filter(
      (o) => o.delivery_date && new Date(o.delivery_date) < new Date(todayStr) && o.status !== "delivered" && o.status !== "ready"
    );
    lateOrders.forEach((o) => {
      const daysLate = Math.abs(getDaysLeft(o.delivery_date));
      notifs.push({
        id: `late-${o.id}`,
        type: "danger",
        title: `طلب متأخر — ${o.customer_name || "—"}`,
        message: `ORD-${o.order_number} متأخر بـ ${daysLate} يوم عن موعد التسليم (${o.delivery_date}). يجب التواصل مع الزبون فوراً.`,
        action: `/admin/orders/${o.id}`,
        actionLabel: "فتح الطلب",
        orderId: o.id,
        createdAt: o.delivery_date || todayStr,
      });
    });

    // 2. تسليمات اليوم
    const todayDeliveries = orders.filter(
      (o) => o.delivery_date === todayStr && o.status !== "delivered" && o.status !== "ready"
    );
    todayDeliveries.forEach((o) => {
      notifs.push({
        id: `today-${o.id}`,
        type: "warning",
        title: `تسليم اليوم — ${o.customer_name || "—"}`,
        message: `ORD-${o.order_number} موعد تسليمه اليوم (${todayStr}). المجموع: ${formatCurrency(o.total || 0)}.`,
        action: `/admin/orders/${o.id}`,
        actionLabel: "فتح الطلب",
        orderId: o.id,
        createdAt: todayStr,
      });
    });

    // 3. تسليمات غداً (تذكير)
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const tomorrowDeliveries = orders.filter(
      (o) => o.delivery_date === tomorrowStr && o.status !== "delivered" && o.status !== "ready"
    );
    tomorrowDeliveries.forEach((o) => {
      notifs.push({
        id: `tomorrow-${o.id}`,
        type: "reminder",
        title: `تسليم غداً — ${o.customer_name || "—"}`,
        message: `ORD-${o.order_number} موعد تسليمه غداً (${tomorrowStr}). تأكد من جاهزية الطلبية.`,
        action: `/admin/orders/${o.id}`,
        actionLabel: "فتح الطلب",
        orderId: o.id,
        createdAt: tomorrowStr,
      });
    });

    // 4. طلبات بانتظار المراجعة
    const pendingReview = orders.filter((o) => o.status === "new" || o.status === "review");
    pendingReview.forEach((o) => {
      notifs.push({
        id: `review-${o.id}`,
        type: "info",
        title: `بانتظار المراجعة — ${o.customer_name || "—"}`,
        message: `ORD-${o.order_number} بانتظار مراجعتك وإرسالها للخياط. المجموع: ${formatCurrency(o.total || 0)}.`,
        action: `/admin/orders/${o.id}`,
        actionLabel: "مراجعة الطلب",
        orderId: o.id,
        createdAt: o.created_at || todayStr,
      });
    });

    // 5. زرابي عاجلة (<= 5 أيام)
    const tapisUrgent = orders.filter((o) => {
      const hasTapis = o.parts.some((p) => p.part_type === "tapis" && p.status !== "done" && p.status !== "ready");
      if (!hasTapis) return false;
      const days = getDaysLeft(o.delivery_date);
      return days <= 5 && days >= 0;
    });
    tapisUrgent.forEach((o) => {
      const days = getDaysLeft(o.delivery_date);
      notifs.push({
        id: `tapis-${o.id}`,
        type: "warning",
        title: `زربية عاجلة — ${o.customer_name || "—"}`,
        message: `ORD-${o.order_number} تحتوي على زربية وموعد التسليم بعد ${days} أيام فقط. اتصل بشركة الزرابي الآن.`,
        action: `/admin/orders/${o.id}`,
        actionLabel: "فتح الطلب",
        orderId: o.id,
        createdAt: o.delivery_date || todayStr,
      });
    });

    // 6. طلبات معلقة (pending) منذ أكثر من 3 أيام
    const stalePending = orders.filter((o) => {
      if (o.status !== "pending") return false;
      const created = new Date(o.created_at || todayStr);
      const diffDays = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 3;
    });
    stalePending.forEach((o) => {
      notifs.push({
        id: `stale-${o.id}`,
        type: "info",
        title: `طلب معلق — ${o.customer_name || "—"}`,
        message: `ORD-${o.order_number} معلق منذ أكثر من 3 أيام. المجموع: ${formatCurrency(o.total || 0)}. راجع حالته.`,
        action: `/admin/orders/${o.id}`,
        actionLabel: "مراجعة",
        orderId: o.id,
        createdAt: o.created_at || todayStr,
      });
    });

    // 7. طلبات قيد التنفيذ بدون خياط مسند
    const unassigned = orders.filter(
      (o) => o.status === "in_progress" && o.parts.some((p) => p.part_type === "salon" && !p.tailor_id)
    );
    unassigned.forEach((o) => {
      notifs.push({
        id: `unassigned-${o.id}`,
        type: "danger",
        title: `بدون خياط — ${o.customer_name || "—"}`,
        message: `ORD-${o.order_number} قيد التنفيذ لكن بعض أجزاء الصالون غير مسندة لأي خياط.`,
        action: `/admin/orders/${o.id}`,
        actionLabel: "إسناد الآن",
        orderId: o.id,
        createdAt: o.created_at || todayStr,
      });
    });

    // 8. طلبيات بونج متأخرة
    const foamLate = foamOrders.filter(o => o.delivery_date && new Date(o.delivery_date) < new Date(todayStr) && o.status !== 'delivered' && o.status !== 'ready');
    foamLate.forEach(o => {
      const daysLate = Math.abs(getDaysLeft(o.delivery_date));
      notifs.push({
        id: `foam-late-${o.id}`,
        type: "danger",
        title: `طلب بونج متأخر — ${o.customer_name || "—"}`,
        message: `FOAM-${o.order_number} متأخر بـ ${daysLate} يوم. المنتج: ${o.foam_products?.name || "—"}.`,
        action: `/admin/foam-orders/${o.id}`,
        actionLabel: "فتح الطلب",
        orderId: o.id,
        createdAt: o.delivery_date || todayStr,
      });
    });

    // 9. تسليمات بونج اليوم
    const foamToday = foamOrders.filter(o => o.delivery_date === todayStr && o.status !== 'delivered' && o.status !== 'ready');
    foamToday.forEach(o => {
      notifs.push({
        id: `foam-today-${o.id}`,
        type: "warning",
        title: `تسليم بونج اليوم — ${o.customer_name || "—"}`,
        message: `FOAM-${o.order_number} موعد تسليمه اليوم. المتبقي: ${formatCurrency((o.final_price || 0) - (o.deposit || 0))}.`,
        action: `/admin/foam-orders/${o.id}`,
        actionLabel: "فتح الطلب",
        orderId: o.id,
        createdAt: todayStr,
      });
    });

    // 10. تسليمات بونج غداً
    const foamTomorrow = foamOrders.filter(o => o.delivery_date === tomorrowStr && o.status !== 'delivered' && o.status !== 'ready');
    foamTomorrow.forEach(o => {
      notifs.push({
        id: `foam-tomorrow-${o.id}`,
        type: "reminder",
        title: `تسليم بونج غداً — ${o.customer_name || "—"}`,
        message: `FOAM-${o.order_number} موعد تسليمه غداً. تأكد من جاهزية الطلبية.`,
        action: `/admin/foam-orders/${o.id}`,
        actionLabel: "فتح الطلب",
        orderId: o.id,
        createdAt: tomorrowStr,
      });
    });

    // 11. بونج معلق منذ أكثر من يومين
    const foamStalePending = foamOrders.filter(o => {
      if (o.status !== 'pending') return false;
      const created = new Date(o.created_at || todayStr);
      const diffDays = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 2;
    });
    foamStalePending.forEach(o => {
      notifs.push({
        id: `foam-stale-${o.id}`,
        type: "info",
        title: `بونج معلق — ${o.customer_name || "—"}`,
        message: `FOAM-${o.order_number} معلق منذ أكثر من يومين ولم يُرسل للمورد بعد.`,
        action: `/admin/foam-orders/${o.id}`,
        actionLabel: "إرسال للمورد",
        orderId: o.id,
        createdAt: o.created_at || todayStr,
      });
    });

    // 12. بونج جاهز للتسليم
    const foamReadyForDelivery = foamOrders.filter(o => o.status === 'ready');
    foamReadyForDelivery.forEach(o => {
      notifs.push({
        id: `foam-ready-${o.id}`,
        type: "success",
        title: `بونج جاهز — ${o.customer_name || "—"}`,
        message: `FOAM-${o.order_number} جاهز للتسليم. اتصل بالزبون لتحديد موعد.`,
        action: `/admin/foam-orders/${o.id}`,
        actionLabel: "فتح الطلب",
        orderId: o.id,
        createdAt: o.updated_at || todayStr,
      });
    });

    // ترتيب حسب الأولوية ثم التاريخ
    const priorityOrder: Record<NotifType, number> = { danger: 0, warning: 1, reminder: 2, info: 3, success: 4 };
    return notifs.sort((a, b) => {
      const pa = priorityOrder[a.type];
      const pb = priorityOrder[b.type];
      if (pa !== pb) return pa - pb;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [orders, todayStr]);

  const filtered = useMemo(() => {
    if (activeFilter === "all") return notifications;
    return notifications.filter((n) => n.type === activeFilter);
  }, [notifications, activeFilter]);

  const counts = useMemo(() => ({
    all: notifications.length,
    danger: notifications.filter((n) => n.type === "danger").length,
    warning: notifications.filter((n) => n.type === "warning").length,
    info: notifications.filter((n) => n.type === "info").length,
    reminder: notifications.filter((n) => n.type === "reminder").length,
    success: notifications.filter((n) => n.type === "success").length,
  }), [notifications]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0EDE8] flex items-center justify-center" dir="rtl">
        <div className="text-[#1B5E3B] font-bold animate-pulse">جاري تحميل الإشعارات...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EDE8]" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E4DC] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1B5E3B] rounded-xl flex items-center justify-center text-white text-lg">🔔</div>
            <div>
              <h1 className="text-xl font-bold text-[#1B5E3B]">الإشعارات والتنبيهات</h1>
              <p className="text-xs text-gray-400">جميع التنبيهات المشتقة من حالة الطلبيات</p>
            </div>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-2 bg-[#F5F0E8] hover:bg-[#E8E4DC] text-[#1B5E3B] px-4 py-2 rounded-xl text-sm font-bold transition"
          >
            <span>←</span> لوحة التحكم
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button onClick={() => setActiveFilter("all")} className={`text-right transition ${activeFilter === "all" ? "ring-2 ring-[#C9A84C] rounded-2xl" : ""}`}>
            <StatPill count={counts.all} label="الكل" colorClass="bg-gray-100 text-gray-700" icon="📬" />
          </button>
          <button onClick={() => setActiveFilter("danger")} className={`text-right transition ${activeFilter === "danger" ? "ring-2 ring-red-400 rounded-2xl" : ""}`}>
            <StatPill count={counts.danger} label="خطير" colorClass="bg-red-100 text-red-700" icon="🔴" />
          </button>
          <button onClick={() => setActiveFilter("warning")} className={`text-right transition ${activeFilter === "warning" ? "ring-2 ring-amber-400 rounded-2xl" : ""}`}>
            <StatPill count={counts.warning} label="تحذير" colorClass="bg-amber-100 text-amber-700" icon="🟠" />
          </button>
          <button onClick={() => setActiveFilter("reminder")} className={`text-right transition ${activeFilter === "reminder" ? "ring-2 ring-purple-400 rounded-2xl" : ""}`}>
            <StatPill count={counts.reminder} label="تذكير" colorClass="bg-purple-100 text-purple-700" icon="🟣" />
          </button>
          <button onClick={() => setActiveFilter("info")} className={`text-right transition ${activeFilter === "info" ? "ring-2 ring-blue-400 rounded-2xl" : ""}`}>
            <StatPill count={counts.info} label="معلومة" colorClass="bg-blue-100 text-blue-700" icon="🔵" />
          </button>
          <button onClick={() => setActiveFilter("success")} className={`text-right transition ${activeFilter === "success" ? "ring-2 ring-green-400 rounded-2xl" : ""}`}>
            <StatPill count={counts.success} label="نجاح" colorClass="bg-green-100 text-green-700" icon="🟢" />
          </button>
        </div>

        {/* Notifications Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-[#E8E4DC] text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-[#1B5E3B] mb-2">لا توجد إشعارات {activeFilter !== "all" ? "في هذا التصنيف" : ""}</h3>
            <p className="text-gray-500 text-sm">كل شيء تحت السيطرة! لا توجد طلبيات متأخرة أو عاجلة حالياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((notif) => (
              <NotifCard key={notif.id} notif={notif} />
            ))}
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC]">
          <h3 className="text-lg font-bold text-[#1B5E3B] mb-4 flex items-center gap-2">
            <span>🔗</span> روابط سريعة
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/admin/orders" className="bg-[#F5F0E8] hover:bg-[#E8E4DC] rounded-xl p-4 text-center transition">
              <div className="text-2xl mb-1">📦</div>
              <p className="text-sm font-bold text-[#1B5E3B]">قائمة الطلبيات</p>
            </Link>
            <Link href="/admin/tailors" className="bg-[#F5F0E8] hover:bg-[#E8E4DC] rounded-xl p-4 text-center transition">
              <div className="text-2xl mb-1">🪡</div>
              <p className="text-sm font-bold text-[#1B5E3B]">إدارة الخياطين</p>
            </Link>
            <Link href="/admin/catalogue" className="bg-[#F5F0E8] hover:bg-[#E8E4DC] rounded-xl p-4 text-center transition">
              <div className="text-2xl mb-1">📚</div>
              <p className="text-sm font-bold text-[#1B5E3B]">الكتالوج</p>
            </Link>
            <Link href="/admin/settings" className="bg-[#F5F0E8] hover:bg-[#E8E4DC] rounded-xl p-4 text-center transition">
              <div className="text-2xl mb-1">⚙️</div>
              <p className="text-sm font-bold text-[#1B5E3B]">الإعدادات</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}