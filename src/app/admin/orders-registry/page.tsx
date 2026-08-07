"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";
import {
  Search, Calendar, Eye, Printer, FileText, Package, DollarSign, User, Phone, Clock,
  CheckCircle, XCircle, AlertCircle, MessageCircle, ChevronDown, ChevronUp, Filter,
  Download, Hash, Scissors, Layers, ArrowRight, MapPin, CreditCard, TrendingUp,
  Archive, RotateCcw, Copy, ExternalLink, BarChart3, PieChart as PieChartIcon,
  ArrowUpDown, ChevronLeft, ChevronRight, SkipBack, SkipForward,
  Image as ImageIcon, Plus, Save, Check, X, Trash2
} from "lucide-react";
import Link from "next/link";

// ============================================================
// TYPES
// ============================================================
type DbOrder = Database["public"]["Tables"]["orders"]["Row"];
type DbOrderItem = Database["public"]["Tables"]["order_items"]["Row"];
type DbOrderPart = Database["public"]["Tables"]["order_parts"]["Row"];
type DbOrderSeddari = Database["public"]["Tables"]["order_seddars"]["Row"];
type DbOrderCushion = Database["public"]["Tables"]["order_cushions"]["Row"];
type DbTimeline = Database["public"]["Tables"]["order_timeline"]["Row"];
type DbMessage = Database["public"]["Tables"]["messages"]["Row"];
type DbTailor = Database["public"]["Tables"]["tailors"]["Row"];
type DbUser = Database["public"]["Tables"]["users"]["Row"];

interface OrderWithDetails extends DbOrder {
  items: DbOrderItem[];
  parts: DbOrderPart[];
  seddars: DbOrderSeddari[];
  cushions: DbOrderCushion[];
  timeline: DbTimeline[];
  messages: DbMessage[];
}

interface RegistryFilters {
  search: string;
  status: string[];
  dateFrom: string;
  dateTo: string;
  productType: string;
  tailorId: string;
  minAmount: string;
  maxAmount: string;
}

// ============================================================
// COLORS
// ============================================================
const C = {
  primary: "#1B5E38", primaryLight: "#2D7A4E", gold: "#C9A84C", goldLight: "#D4BA6A",
  cream: "#F5F0E8", creamDark: "#E8E0D0", dark: "#1A1A1A", gray: "#6B7280",
  lightGray: "#F3F4F6", white: "#FFFFFF", danger: "#DC2626", success: "#16A34A",
  warning: "#D97706", info: "#2563EB", border: "#E5E7EB",
};

// ============================================================
// HELPERS
// ============================================================
function fc(n: number) { return `${Math.round(n).toLocaleString("ar-MA")} درهم`; }
function fd(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("ar-MA", { year: "numeric", month: "long", day: "numeric" });
}
function fdt(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("ar-MA", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function gdn(s: string | null) {
  if (!s) return "—";
  return ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"][new Date(s).getDay()];
}

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  new: { label: "جديد", bg: "#FEF3C7", text: "#92400E", icon: AlertCircle },
  review: { label: "قيد المراجعة", bg: "#FFEDD5", text: "#9A3412", icon: AlertCircle },
  sent: { label: "مرسل", bg: "#DBEAFE", text: "#1E40AF", icon: ArrowRight },
  in_progress: { label: "قيد التنفيذ", bg: "#E9D5FF", text: "#6B21A8", icon: Clock },
  partial: { label: "جزئي", bg: "#F3F4F6", text: "#374151", icon: Layers },
  ready: { label: "جاهز", bg: "#D1FAE5", text: "#065F46", icon: CheckCircle },
  delivered: { label: "مُسلّم", bg: "#D1FAE5", text: "#065F46", icon: CheckCircle },
  late: { label: "متأخر", bg: "#FEE2E2", text: "#991B1B", icon: XCircle },
  cancelled: { label: "ملغى", bg: "#FEE2E2", text: "#991B1B", icon: XCircle },
  archived: { label: "مؤرشف", bg: "#E5E7EB", text: "#374151", icon: Archive },
};

const partTypeLabels: Record<string, string> = {
  salon: "صالون", bounge: "بونج", tapis: "زربية", bois: "خشب",
  rembourrage: "لواط", khamiya: "خامية",
};
const partTypeIcons: Record<string, string> = {
  salon: "🛋️", bounge: "🧽", tapis: "🧶", bois: "🪵", rembourrage: "🪶", khamiya: "🧵",
};

// ============================================================
// CHARTS
// ============================================================
function MiniBarChart({ data, color = C.primary }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-32 px-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-lg transition-all relative group" style={{ height: `${(d.value / max) * 100}%`, backgroundColor: color, minHeight: 4 }}>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition">{fc(d.value)}</div>
          </div>
          <span className="text-[9px] font-bold" style={{ color: C.gray }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function MiniPieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let acc = 0;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
        {data.map((d, i) => {
          const pct = d.value / total;
          const dash = pct * 314;
          const offset = 314 - (acc * 314);
          acc += pct;
          return (
            <circle key={i} cx="50" cy="50" r="50" fill="none" stroke={d.color} strokeWidth="50"
              strokeDasharray={`${dash} ${314 - dash}`} strokeDashoffset={offset} />
          );
        })}
      </svg>
      <div className="space-y-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[10px]">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span style={{ color: C.gray }}>{d.label}: {d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================
function StatCard({ title, value, subtitle, icon: Icon, color }: { title: string; value: string; subtitle?: string; icon: any; color: string }) {
  return (
    <div className="rounded-2xl p-5 border transition-all hover:shadow-md" style={{ backgroundColor: C.white, borderColor: C.border }}>
      <div className="flex items-start justify-between">
        <div className="text-right">
          <p className="text-sm opacity-60 mb-1" style={{ color: C.gray }}>{title}</p>
          <p className="text-2xl font-bold" style={{ color: C.dark }}>{value}</p>
          {subtitle && <p className="text-xs mt-1 opacity-50" style={{ color: C.gray }}>{subtitle}</p>}
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function OrdersRegistryPage() {
  // ─── State ───
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState<"created_at" | "total" | "deposit" | "order_number">("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  const [filters, setFilters] = useState<RegistryFilters>({
    search: "", status: [], dateFrom: "", dateTo: "", productType: "", tailorId: "", minAmount: "", maxAmount: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showDebts, setShowDebts] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"summary" | "products" | "financial" | "timeline" | "chat">("summary");
  const [tailorsMap, setTailorsMap] = useState<Record<string, DbTailor>>({});
  const [usersMap, setUsersMap] = useState<Record<string, DbUser>>({});
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [savingAction, setSavingAction] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ─── Load supporting data ───
  useEffect(() => {
    async function loadMeta() {
      const [{ data: tailors }, { data: users }, { data: parts }] = await Promise.all([
        supabase.from("tailors").select("*"),
        supabase.from("users").select("*"),
        supabase.from("order_parts").select("part_type"),
      ]);
      const tMap: Record<string, DbTailor> = {};
      (tailors || []).forEach((t) => { tMap[t.id] = t; });
      setTailorsMap(tMap);
      const uMap: Record<string, DbUser> = {};
      (users || []).forEach((u) => { uMap[u.id] = u; });
      setUsersMap(uMap);
      const types = Array.from(new Set((parts || []).map((p: any) => p.part_type).filter(Boolean)));
      setProductTypes(types);
    }
    loadMeta();
  }, []);

  // ─── Load orders with real filters & pagination ───
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      let orderIds: string[] | null = null;

      if (filters.productType) {
        const { data } = await supabase.from("order_parts").select("order_id").eq("part_type", filters.productType);
        const ids = Array.from(new Set((data || []).map((p: any) => p.order_id as string)));
        if (ids.length === 0) { setOrders([]); setTotalCount(0); setLoading(false); return; }
        orderIds = ids;
      }

      if (filters.tailorId) {
        const { data } = await supabase.from("order_parts").select("order_id").eq("tailor_id", filters.tailorId);
        const tIds = Array.from(new Set((data || []).map((p: any) => p.order_id as string)));
        if (tIds.length === 0) { setOrders([]); setTotalCount(0); setLoading(false); return; }
        orderIds = orderIds ? orderIds.filter((id: string) => tIds.includes(id)) : tIds;
        if (orderIds.length === 0) { setOrders([]); setTotalCount(0); setLoading(false); return; }
      }

      let query = supabase.from("orders").select("*", { count: "exact" }).is("deleted_at", null);

      if (orderIds) query = query.in("id", orderIds);

      if (filters.status.length > 0) {
        const hasArchived = filters.status.includes("archived");
        const hasCancelled = filters.status.includes("cancelled");
        const hasActive = filters.status.includes("active");
        const regular = filters.status.filter((s) => !["archived", "cancelled", "active"].includes(s));

        if (regular.length > 0) query = query.in("status", regular);
        if (hasArchived) query = query.not("archived_at", "is", null);
        if (hasCancelled) query = query.not("cancelled_at", "is", null);
        if (hasActive) query = query.is("archived_at", null).is("cancelled_at", null);
      }

      if (filters.search.trim()) {
        const q = filters.search.trim();
        const num = parseInt(q);
        if (!isNaN(num)) {
          query = query.or(`customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,order_number.eq.${num}`);
        } else {
          query = query.or(`customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`);
        }
      }

      if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom + "T00:00:00");
      if (filters.dateTo) query = query.lte("created_at", filters.dateTo + "T23:59:59");

      if (filters.minAmount) query = query.gte("total", Number(filters.minAmount));
      if (filters.maxAmount) query = query.lte("total", Number(filters.maxAmount));

      query = query.order(sortColumn, { ascending: sortAsc });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      setOrders(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("فشل تحميل السجل:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize, sortColumn, sortAsc]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // ─── Stats ───
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + ((o as any).total_amount || (o as any).total || 0), 0);
    const totalDeposit = orders.reduce((s, o) => s + ((o as any).deposit_amount || (o as any).deposit || 0), 0);
    const totalRemaining = totalRevenue - totalDeposit;
    const avgOrder = orders.length > 0 ? totalRevenue / orders.length : 0;
    return { totalRevenue, totalDeposit, totalRemaining, avgOrder };
  }, [orders]);

  // ─── Customer debts ───
  const customerDebts = useMemo(() => {
    const debts: Record<string, { name: string; phone: string; total: number; deposit: number; remaining: number; count: number }> = {};
    orders.forEach((o) => {
      if (!o.customer_name) return;
      const key = o.customer_phone || o.customer_name;
      if (!debts[key]) debts[key] = { name: o.customer_name, phone: o.customer_phone || "", total: 0, deposit: 0, remaining: 0, count: 0 };
      debts[key].total += ((o as any).total_amount || (o as any).total || 0);
      debts[key].deposit += ((o as any).deposit_amount || (o as any).deposit || 0);
      debts[key].remaining += (((o as any).total_amount || (o as any).total || 0) - ((o as any).deposit_amount || (o as any).deposit || 0));
      debts[key].count += 1;
    });
    return Object.values(debts).sort((a, b) => b.remaining - a.remaining);
  }, [orders]);

  // ─── Monthly chart data ───
  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      if (!o.created_at) return;
      const key = new Date(o.created_at).toLocaleDateString("ar-MA", { year: "numeric", month: "short" });
      map[key] = (map[key] || 0) + ((o as any).total_amount || (o as any).total || 0);
    });
    return Object.entries(map).map(([label, value]) => ({ label, value })).slice(0, 12);
  }, [orders]);

  // ─── Status pie data ───
  const statusPieData = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => { map[o.status] = (map[o.status] || 0) + 1; });
    const colors = [C.primary, C.gold, C.info, C.success, C.warning, C.danger, "#8B5CF6", "#EC4899"];
    return Object.entries(map).map(([status, value], i) => ({
      label: statusConfig[status]?.label || status,
      value,
      color: colors[i % colors.length],
    }));
  }, [orders]);

  // ─── Toggle sort ───
  const toggleSort = (col: typeof sortColumn) => {
    if (sortColumn === col) setSortAsc((p) => !p);
    else { setSortColumn(col); setSortAsc(false); }
    setPage(1);
  };

  // ─── Toggle status filter ───
  const toggleStatus = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status.includes(status) ? prev.status.filter((s) => s !== status) : [...prev.status, status],
    }));
    setPage(1);
  };

  // ─── Clear filters ───
  const clearFilters = () => {
    setFilters({ search: "", status: [], dateFrom: "", dateTo: "", productType: "", tailorId: "", minAmount: "", maxAmount: "" });
    setPage(1);
  };

  // ─── Total pages ───
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // ─── Open order details ───
  const openOrderDetails = async (order: DbOrder) => {
    setDrawerTab("summary");
    setShowDrawer(true);
    setSelectedOrder(null);
    setNewNote("");
    try {
      const [itemsRes, partsRes, seddarsRes, cushionsRes, timelineRes, messagesRes] = await Promise.all([
        supabase.from("order_items").select("*").eq("order_id", order.id).order("created_at", { ascending: true }),
        supabase.from("order_parts").select("*").eq("order_id", order.id).order("sort_order", { ascending: true }),
        supabase.from("order_seddars").select("*").eq("order_id", order.id).order("sort_order", { ascending: true }),
        supabase.from("order_cushions").select("*").eq("order_id", order.id).order("created_at", { ascending: true }),
        supabase.from("order_timeline").select("*").eq("order_id", order.id).order("created_at", { ascending: true }),
        supabase.from("messages").select("*").eq("order_id", order.id).order("created_at", { ascending: true }),
      ]);
      setSelectedOrder({
        ...order,
        items: itemsRes.data || [],
        parts: partsRes.data || [],
        seddars: seddarsRes.data || [],
        cushions: cushionsRes.data || [],
        timeline: timelineRes.data || [],
        messages: messagesRes.data || [],
      });
    } catch (err) {
      console.error(err);
      alert("فشل تحميل التفاصيل");
    }
  };

  // ─── Archive / Restore / Cancel ───
  const handleArchive = async (orderId: string, archive: boolean) => {
    setSavingAction(true);
    await supabase.from("orders").update({ archived_at: archive ? new Date().toISOString() : null }).eq("id", orderId);
    await supabase.from("order_timeline").insert({ order_id: orderId, event_type: archive ? "archived" : "restored", actor: "المدير", note: archive ? "أُرشفت الطلبية" : "استُعيدت الطلبية من الأرشيف" });
    setSavingAction(false);
    loadOrders();
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => prev ? { ...prev, archived_at: archive ? new Date().toISOString() : null } : null);
    }
  };

  const handleCancel = async (orderId: string, reason: string) => {
    setSavingAction(true);
    await supabase.from("orders").update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_reason: reason }).eq("id", orderId);
    await supabase.from("order_timeline").insert({ order_id: orderId, event_type: "cancelled", actor: "المدير", note: reason });
    setSavingAction(false);
    loadOrders();
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => prev ? { ...prev, status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_reason: reason } : null);
    }
  };

  // ─── Add note ───
  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedOrder) return;
    const updated = selectedOrder.notes ? selectedOrder.notes + "\n" + newNote : newNote;
    await supabase.from("orders").update({ notes: updated }).eq("id", selectedOrder.id);
    await supabase.from("order_timeline").insert({ order_id: selectedOrder.id, event_type: "note_added", actor: "المدير", note: newNote });
    setSelectedOrder((prev) => prev ? { ...prev, notes: updated } : null);
    setNewNote("");
  };

  // ─── Copy link ───
  const copyLink = (orderId: string) => {
    const url = `${window.location.origin}/admin/orders/${orderId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── WhatsApp ───
  const openWhatsApp = (phone: string) => {
    const clean = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${clean}`, "_blank");
  };

  // ─── Export CSV ───
  const exportCSV = () => {
    const headers = ["رقم الطلبية", "التاريخ", "الزبون", "الهاتف", "البائع", "المنتجات", "المجموع", "التسبيق", "المتبقي", "الحالة"];
    const rows = orders.map((o) => {
      const types = Array.from(new Set((o.payload as any)?.parts?.map((p: any) => partTypeLabels[p.type] || p.type) || ["—"])).join(" + ");
      const remaining = (((o as any).total_amount || (o as any).total || 0) - ((o as any).deposit_amount || (o as any).deposit || 0));
      return [
        o.order_number, fd(o.created_at), o.customer_name || "—", o.customer_phone || "—",
        usersMap[o.created_by || ""]?.full_name || o.created_by || "—", types,
        (o as any).total_amount || (o as any).total || 0, (o as any).deposit_amount || (o as any).deposit || 0, remaining, statusConfig[o.status]?.label || o.status,
      ];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `سجل_الطلبيات_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // ─── Print ───
  const handlePrint = () => {
    if (!selectedOrder) return;
    const w = window.open("", "_blank");
    if (!w) return;
    const itemsHtml = selectedOrder.items.map((i) => `<tr><td>${i.label}</td><td>${i.kind}</td><td>${i.qty}</td><td>${i.unit_price}</td><td>${i.total}</td></tr>`).join("");
    const remaining = ((selectedOrder as any).total_amount || (selectedOrder as any).total || 0) - ((selectedOrder as any).deposit_amount || (selectedOrder as any).deposit || 0);
    w.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>طلبية #${selectedOrder.order_number}</title><style>body{font-family:system-ui;margin:40px;color:#1A1A1A}h1{color:#1B5E38;border-bottom:3px solid #C9A84C;padding-bottom:10px}.section{margin:20px 0;padding:15px;border:1px solid #E5E7EB;border-radius:8px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #E5E7EB;padding:8px;text-align:right}th{background:#F5F0E8}.total{font-size:1.2em;font-weight:bold;color:#1B5E38}.footer{margin-top:40px;text-align:center;color:#6B7280;font-size:.9em;border-top:1px solid #E5E7EB;padding-top:20px}</style></head><body><h1>فاتورة طلبية — El Mahboubi Salon</h1><p><strong>رقم الطلبية:</strong> ${selectedOrder.order_number}</p><p><strong>التاريخ:</strong> ${fdt(selectedOrder.created_at)}</p><p><strong>الزبون:</strong> ${selectedOrder.customer_name || "—"}</p><p><strong>الهاتف:</strong> ${selectedOrder.customer_phone || "—"}</p><p><strong>الحالة:</strong> ${statusConfig[selectedOrder.status]?.label || selectedOrder.status}</p><div class="section"><h3>البنود</h3><table><tr><th>البيان</th><th>النوع</th><th>الكمية</th><th>سعر الوحدة</th><th>المجموع</th></tr>${itemsHtml}</table></div><div class="section"><h3>الملخص المالي</h3><p class="total">المجموع الكلي: ${fc((selectedOrder as any).total_amount || (selectedOrder as any).total || 0)}</p><p>التسبيق: ${fc((selectedOrder as any).deposit_amount || (selectedOrder as any).deposit || 0)}</p><p>المتبقي: ${fc(remaining)}</p></div><div class="footer"><p>محل Ameublement et Déco El Mahboubi — الحنصالي، بني ملال</p><p>هذا السجل دائم ولا يُمسح</p></div></body></html>`);
    w.document.close();
    w.print();
  };
  // ─── RENDER ───
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAF8" }} dir="rtl">
      {/* ─── HEADER ─── */}
      <header className="bg-white border-b sticky top-0 z-30" style={{ borderColor: C.border }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl" style={{ backgroundColor: C.primary }}>
                <Archive size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: C.dark }}>سجل الطلبيات الدائم</h1>
                <p className="text-sm" style={{ color: C.gray }}>سجلّ كامل لكل الطلبيات — لا يُمسح ولا يُحذف</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setShowCharts(!showCharts)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition hover:shadow-md" style={{ backgroundColor: showCharts ? C.primary : C.white, color: showCharts ? C.white : C.dark, borderColor: C.border }}>
                <BarChart3 size={16} /> {showCharts ? "إخفاء الرسوم" : "الرسوم البيانية"}
              </button>
              <button onClick={() => setShowDebts(!showDebts)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition hover:shadow-md" style={{ backgroundColor: showDebts ? C.danger : C.white, color: showDebts ? C.white : C.dark, borderColor: C.border }}>
                <CreditCard size={16} /> {showDebts ? "إخفاء الديون" : "ديون الزبائن"}
              </button>
              <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition hover:shadow-md" style={{ backgroundColor: C.white, borderColor: C.border, color: C.dark }}>
                <Download size={16} /> تصدير CSV
              </button>
              <Link href="/admin/orders" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition hover:shadow-md" style={{ backgroundColor: C.primary }}>
                <ArrowRight size={16} className="rotate-180" /> الطلبيات النشطة
              </Link>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2" size={18} style={{ color: C.gray }} />
              <input type="text" placeholder="بحث باسم الزبون، الهاتف، أو رقم الطلبية..." value={filters.search}
                onChange={(e) => { setFilters((p) => ({ ...p, search: e.target.value })); setPage(1); }}
                className="w-full pr-10 pl-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2" style={{ borderColor: C.border, backgroundColor: C.white }} />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border transition hover:shadow-md"
              style={{ backgroundColor: showFilters ? C.primary : C.white, color: showFilters ? C.white : C.dark, borderColor: C.border }}>
              <Filter size={16} /> الفلاتر {filters.status.length > 0 || filters.productType || filters.tailorId ? <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: showFilters ? C.gold : C.primary, color: showFilters ? C.dark : C.white }}>!</span> : null}
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-3 p-4 rounded-xl border space-y-4" style={{ backgroundColor: C.white, borderColor: C.border }}>
              {/* Status */}
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: C.gray }}>حالة الطلبية</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusConfig).map(([key, cfg]) => {
                    const active = filters.status.includes(key);
                    return (
                      <button key={key} onClick={() => toggleStatus(key)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border transition"
                        style={{ backgroundColor: active ? cfg.bg : C.white, color: active ? cfg.text : C.gray, borderColor: active ? cfg.text : C.border }}>
                        {cfg.label}
                      </button>
                    );
                  })}
                  <button onClick={() => toggleStatus("active")}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border transition"
                    style={{ backgroundColor: filters.status.includes("active") ? "#D1FAE5" : C.white, color: filters.status.includes("active") ? "#065F46" : C.gray, borderColor: filters.status.includes("active") ? "#065F46" : C.border }}>
                    ✅ نشط
                  </button>
                </div>
              </div>

              {/* Product type & Tailor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: C.gray }}>نوع المنتج</label>
                  <select value={filters.productType} onChange={(e) => { setFilters((p) => ({ ...p, productType: e.target.value })); setPage(1); }}
                    className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: C.border }}>
                    <option value="">الكل</option>
                    {productTypes.map((t) => <option key={t} value={t}>{partTypeIcons[t] || "📦"} {partTypeLabels[t] || t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: C.gray }}>الخياط</label>
                  <select value={filters.tailorId} onChange={(e) => { setFilters((p) => ({ ...p, tailorId: e.target.value })); setPage(1); }}
                    className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: C.border }}>
                    <option value="">الكل</option>
                    {Object.values(tailorsMap).map((t) => <option key={t.id} value={t.id}>🧵 {t.full_name}</option>)}
                  </select>
                </div>
              </div>

              {/* Date & Amount */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><label className="block text-xs font-bold mb-1" style={{ color: C.gray }}>من تاريخ</label>
                  <input type="date" value={filters.dateFrom} onChange={(e) => { setFilters((p) => ({ ...p, dateFrom: e.target.value })); setPage(1); }} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: C.border }} /></div>
                <div><label className="block text-xs font-bold mb-1" style={{ color: C.gray }}>إلى تاريخ</label>
                  <input type="date" value={filters.dateTo} onChange={(e) => { setFilters((p) => ({ ...p, dateTo: e.target.value })); setPage(1); }} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: C.border }} /></div>
                <div><label className="block text-xs font-bold mb-1" style={{ color: C.gray }}>المبلغ الأدنى</label>
                  <input type="number" placeholder="0" value={filters.minAmount} onChange={(e) => { setFilters((p) => ({ ...p, minAmount: e.target.value })); setPage(1); }} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: C.border }} /></div>
                <div><label className="block text-xs font-bold mb-1" style={{ color: C.gray }}>المبلغ الأقصى</label>
                  <input type="number" placeholder="∞" value={filters.maxAmount} onChange={(e) => { setFilters((p) => ({ ...p, maxAmount: e.target.value })); setPage(1); }} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: C.border }} /></div>
              </div>

              <button onClick={clearFilters} className="text-xs font-bold underline" style={{ color: C.danger }}>إعادة ضبط الفلاتر</button>
            </div>
          )}
        </div>
      </header>

      {/* ─── STATS ─── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="الطلبيات المعروضة" value={orders.length.toLocaleString("ar-MA")} subtitle={`من ${totalCount.toLocaleString("ar-MA")} إجمالي`} icon={FileText} color={C.primary} />
          <StatCard title="إجمالي المبيعات" value={fc(stats.totalRevenue)} subtitle="القيمة الكلية" icon={TrendingUp} color={C.gold} />
          <StatCard title="التحصيل" value={fc(stats.totalDeposit)} subtitle="ما تم دفعه" icon={CreditCard} color={C.success} />
          <StatCard title="المتبقي" value={fc(stats.totalRemaining)} subtitle="الديون المستحقة" icon={DollarSign} color={C.danger} />
        </div>
      </div>

      {/* ─── CHARTS ─── */}
      {showCharts && (
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: C.border }}>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: C.primary }}><BarChart3 size={18} /> المبيعات الشهرية</h3>
              {monthlyData.length === 0 ? <p className="text-xs text-center py-8" style={{ color: C.gray }}>لا توجد بيانات كافية</p> : <MiniBarChart data={monthlyData} color={C.primary} />}
            </div>
            <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: C.border }}>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: C.primary }}><PieChartIcon size={18} /> توزيع الحالات</h3>
              {statusPieData.length === 0 ? <p className="text-xs text-center py-8" style={{ color: C.gray }}>لا توجد بيانات كافية</p> : <MiniPieChart data={statusPieData} />}
            </div>
          </div>
        </div>
      )}

      {/* ─── DEBTS ─── */}
      {showDebts && (
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: C.border }}>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: C.border }}>
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: C.danger }}><CreditCard size={18} /> ديون الزبائن ({customerDebts.length})</h3>
              <p className="text-xs font-bold" style={{ color: C.danger }}>إجمالي الديون: {fc(customerDebts.reduce((s, d) => s + d.remaining, 0))}</p>
            </div>
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0" style={{ backgroundColor: C.cream }}>
                  <tr><th className="px-3 py-2 text-right font-bold">الزبون</th><th className="px-3 py-2 text-right font-bold">الهاتف</th><th className="px-3 py-2 text-right font-bold">عدد الطلبيات</th><th className="px-3 py-2 text-right font-bold">المجموع</th><th className="px-3 py-2 text-right font-bold">المدفوع</th><th className="px-3 py-2 text-right font-bold">المتبقي</th></tr>
                </thead>
                <tbody>
                  {customerDebts.map((d, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: C.border }}>
                      <td className="px-3 py-2 font-bold" style={{ color: C.dark }}>{d.name}</td>
                      <td className="px-3 py-2"><button onClick={() => openWhatsApp(d.phone)} className="text-xs underline hover:text-green-600" style={{ color: C.info }}>{d.phone || "—"}</button></td>
                      <td className="px-3 py-2">{d.count}</td>
                      <td className="px-3 py-2">{fc(d.total)}</td>
                      <td className="px-3 py-2" style={{ color: C.success }}>{fc(d.deposit)}</td>
                      <td className="px-3 py-2 font-bold" style={{ color: C.danger }}>{fc(d.remaining)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TABLE ─── */}
      <main className="max-w-7xl mx-auto px-4 pb-4">
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: C.border }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: C.cream }}>
                  <th className="px-3 py-3 text-right font-bold cursor-pointer hover:opacity-70" onClick={() => toggleSort("order_number")} style={{ color: C.dark }}>
                    <span className="flex items-center gap-1">رقم الطلبية <ArrowUpDown size={12} /></span>
                  </th>
                  <th className="px-3 py-3 text-right font-bold cursor-pointer hover:opacity-70" onClick={() => toggleSort("created_at")} style={{ color: C.dark }}>
                    <span className="flex items-center gap-1">التاريخ <ArrowUpDown size={12} /></span>
                  </th>
                  <th className="px-3 py-3 text-right font-bold" style={{ color: C.dark }}>الزبون</th>
                  <th className="px-3 py-3 text-right font-bold" style={{ color: C.dark }}>الهاتف</th>
                  <th className="px-3 py-3 text-right font-bold" style={{ color: C.dark }}>البائع</th>
                  <th className="px-3 py-3 text-right font-bold cursor-pointer hover:opacity-70" onClick={() => toggleSort("total")} style={{ color: C.dark }}>
                    <span className="flex items-center gap-1">المجموع <ArrowUpDown size={12} /></span>
                  </th>
                  <th className="px-3 py-3 text-right font-bold cursor-pointer hover:opacity-70" onClick={() => toggleSort("deposit")} style={{ color: C.dark }}>
                    <span className="flex items-center gap-1">التسبيق <ArrowUpDown size={12} /></span>
                  </th>
                  <th className="px-3 py-3 text-right font-bold" style={{ color: C.dark }}>المتبقي</th>
                  <th className="px-3 py-3 text-right font-bold" style={{ color: C.dark }}>الحالة</th>
                  <th className="px-3 py-3 text-center font-bold" style={{ color: C.dark }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="text-center py-16"><div className="animate-pulse font-bold" style={{ color: C.primary }}>جاري تحميل السجل...</div></td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-16"><Archive size={40} className="mx-auto mb-3" style={{ color: "#D1D5DB" }} /><p style={{ color: C.gray }}>لا توجد طلبيات مطابقة</p></td></tr>
                ) : (
                  orders.map((order) => {
                    const cfg = statusConfig[order.status] || statusConfig.new;
                    const StatusIcon = cfg.icon;
                    const remaining = ((order as any).total_amount || (order as any).total || 0) - ((order as any).deposit_amount || (order as any).deposit || 0);
                    const seller = usersMap[order.created_by || ""];
                    const isArchived = !!order.archived_at;
                    const isCancelled = !!order.cancelled_at;
                    return (
                      <tr key={order.id} className="border-t transition hover:bg-gray-50" style={{ borderColor: C.border }}>
                        <td className="px-3 py-3 font-mono font-bold" style={{ color: C.primary }}>ORD-{order.order_number}</td>
                        <td className="px-3 py-3"><div className="text-xs">{fd(order.created_at)}</div><div className="text-[10px]" style={{ color: C.gray }}>{gdn(order.created_at)}</div></td>
                        <td className="px-3 py-3 font-bold" style={{ color: C.dark }}>{order.customer_name || "—"}</td>
                        <td className="px-3 py-3">
                          {order.customer_phone ? (
                            <button onClick={() => openWhatsApp(order.customer_phone!)} className="text-xs underline hover:text-green-600 flex items-center gap-1" style={{ color: C.info }}>
                              <Phone size={10} /> {order.customer_phone}
                            </button>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-3 text-xs" style={{ color: C.gray }}>{seller?.full_name || order.created_by || "—"}</td>
                        <td className="px-3 py-3 font-bold" style={{ color: C.dark }}>{fc((order as any).total_amount || (order as any).total || 0)}</td>
                        <td className="px-3 py-3" style={{ color: C.gold }}>{fc((order as any).deposit_amount || (order as any).deposit || 0)}</td>
                        <td className="px-3 py-3 font-bold" style={{ color: remaining > 0 ? C.danger : C.success }}>{fc(remaining)}</td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold" style={{ backgroundColor: cfg.bg, color: cfg.text }}>
                            <StatusIcon size={10} /> {cfg.label}
                          </span>
                          {isArchived && <span className="block text-[9px] mt-0.5" style={{ color: C.gray }}>📁 مؤرشف</span>}
                          {isCancelled && <span className="block text-[9px] mt-0.5" style={{ color: C.danger }}>❌ ملغى</span>}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openOrderDetails(order)} className="p-1.5 rounded-lg transition hover:shadow-md" style={{ backgroundColor: C.lightGray }} title="عرض التفاصيل">
                              <Eye size={14} style={{ color: C.primary }} />
                            </button>
                            <button onClick={() => copyLink(order.id)} className="p-1.5 rounded-lg transition hover:shadow-md" style={{ backgroundColor: C.lightGray }} title="نسخ الرابط">
                              {copiedId === order.id ? <Check size={14} style={{ color: C.success }} /> : <Copy size={14} style={{ color: C.gray }} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: C.border }}>
            <div className="text-xs font-bold" style={{ color: C.gray }}>
              عرض {orders.length} من {totalCount} طلبية | الصفحة {page} من {totalPages}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1} className="p-2 rounded-lg border disabled:opacity-30" style={{ borderColor: C.border }}><SkipBack size={14} /></button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border disabled:opacity-30" style={{ borderColor: C.border }}><ChevronRight size={14} /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = page;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button key={p} onClick={() => setPage(p)} className="w-8 h-8 rounded-lg text-xs font-bold transition"
                    style={{ backgroundColor: p === page ? C.primary : C.white, color: p === page ? C.white : C.dark, border: `1px solid ${C.border}` }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border disabled:opacity-30" style={{ borderColor: C.border }}><ChevronLeft size={14} /></button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-2 rounded-lg border disabled:opacity-30" style={{ borderColor: C.border }}><SkipForward size={14} /></button>
            </div>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="px-2 py-1 border rounded-lg text-xs" style={{ borderColor: C.border }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </main>
      {/* ─── DETAIL DRAWER ─── */}
      {showDrawer && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowDrawer(false)} />
          <div className="fixed top-0 right-0 h-full w-full sm:w-[650px] lg:w-[750px] z-50 shadow-2xl overflow-y-auto" style={{ backgroundColor: "#FAFAF8" }}>
            {!selectedOrder ? (
              <div className="flex items-center justify-center h-full"><div className="animate-pulse font-bold" style={{ color: C.primary }}>جاري تحميل التفاصيل...</div></div>
            ) : (
              <>
                {/* Drawer Header */}
                <div className="sticky top-0 z-10 bg-white border-b px-6 py-4" style={{ borderColor: C.border }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-xl font-bold" style={{ color: C.dark }}>ORD-{selectedOrder.order_number}</h2>
                      <p className="text-xs mt-1" style={{ color: C.gray }}>{fdt(selectedOrder.created_at)} — {gdn(selectedOrder.created_at)} | آخر تعديل: {fdt(selectedOrder.updated_at || null)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handlePrint} className="p-2.5 rounded-xl border transition hover:shadow-md" style={{ backgroundColor: C.white, borderColor: C.border }} title="طباعة"><Printer size={18} style={{ color: C.primary }} /></button>
                      <button onClick={() => copyLink(selectedOrder.id)} className="p-2.5 rounded-xl border transition hover:shadow-md" style={{ backgroundColor: C.white, borderColor: C.border }} title="نسخ الرابط">
                        {copiedId === selectedOrder.id ? <Check size={18} style={{ color: C.success }} /> : <Copy size={18} style={{ color: C.gray }} />}
                      </button>
                      <button onClick={() => setShowDrawer(false)} className="p-2.5 rounded-xl border transition hover:shadow-md" style={{ backgroundColor: C.white, borderColor: C.border }}><X size={18} style={{ color: C.danger }} /></button>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedOrder.archived_at ? (
                      <button onClick={() => handleArchive(selectedOrder.id, false)} disabled={savingAction}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition disabled:opacity-50" style={{ backgroundColor: C.info }}>
                        <RotateCcw size={12} /> استعادة من الأرشيف
                      </button>
                    ) : (
                      <button onClick={() => handleArchive(selectedOrder.id, true)} disabled={savingAction}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition disabled:opacity-50" style={{ backgroundColor: C.gray }}>
                        <Archive size={12} /> أرشفة
                      </button>
                    )}
                    {!selectedOrder.cancelled_at && (
                      <button onClick={() => {
                        const reason = prompt("سبب الإلغاء:");
                        if (reason) handleCancel(selectedOrder.id, reason);
                      }} disabled={savingAction}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition disabled:opacity-50" style={{ backgroundColor: C.danger }}>
                        <XCircle size={12} /> إلغاء الطلبية
                      </button>
                    )}
                    {selectedOrder.customer_phone && (
                      <button onClick={() => openWhatsApp(selectedOrder.customer_phone!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition" style={{ backgroundColor: "#25D366" }}>
                        <Phone size={12} /> واتساب
                      </button>
                    )}
                  </div>

                  {/* Status & Info */}
                  <div className="flex flex-wrap items-center gap-2">
                    {(() => {
                      const cfg = statusConfig[selectedOrder.status] || statusConfig.new;
                      const Icon = cfg.icon;
                      return (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ backgroundColor: cfg.bg, color: cfg.text }}>
                          <Icon size={14} /> {cfg.label}
                        </span>
                      );
                    })()}
                    <span className="text-xs px-3 py-1.5 rounded-lg font-bold" style={{ backgroundColor: C.cream, color: C.primary }}><User size={12} className="inline ml-1" /> {selectedOrder.customer_name || "—"}</span>
                    <span className="text-xs px-3 py-1.5 rounded-lg font-bold" style={{ backgroundColor: C.cream, color: C.primary }}><Phone size={12} className="inline ml-1" /> {selectedOrder.customer_phone || "—"}</span>
                    <span className="text-xs px-3 py-1.5 rounded-lg font-bold" style={{ backgroundColor: C.cream, color: C.primary }}><Package size={12} className="inline ml-1" /> {selectedOrder.parts.length} جزء</span>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
                    {[
                      { id: "summary" as const, label: "📋 ملخص", icon: FileText },
                      { id: "products" as const, label: "🛋️ المنتجات", icon: Layers },
                      { id: "financial" as const, label: "💰 مالي", icon: DollarSign },
                      { id: "timeline" as const, label: "📊 سير العمل", icon: Clock },
                      { id: "chat" as const, label: "💬 محادثات", icon: MessageCircle },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = drawerTab === tab.id;
                      return (
                        <button key={tab.id} onClick={() => setDrawerTab(tab.id)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition ${isActive ? "text-white shadow-md" : "hover:bg-gray-50"}`}
                          style={isActive ? { backgroundColor: C.primary } : { backgroundColor: "transparent", color: C.gray }}>
                          <Icon size={14} /> {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Drawer Content */}
                <div className="p-6 space-y-6">
                  {/* ─── TAB: SUMMARY ─── */}
                  {drawerTab === "summary" && (
                    <div className="space-y-4">
                      {/* Customer */}
                      <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: C.border }}>
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: C.primary }}><User size={18} /> بيانات الزبون</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div><p className="text-xs" style={{ color: C.gray }}>الاسم</p><p className="font-bold" style={{ color: C.dark }}>{selectedOrder.customer_name || "—"}</p></div>
                          <div><p className="text-xs" style={{ color: C.gray }}>الهاتف</p><p className="font-bold" style={{ color: C.dark }}>{selectedOrder.customer_phone ? <button onClick={() => openWhatsApp(selectedOrder.customer_phone!)} className="underline hover:text-green-600" style={{ color: C.info }}>{selectedOrder.customer_phone}</button> : "—"}</p></div>
                          <div><p className="text-xs" style={{ color: C.gray }}>تاريخ الطلب</p><p className="font-bold" style={{ color: C.dark }}>{fdt(selectedOrder.created_at)}</p></div>
                          <div><p className="text-xs" style={{ color: C.gray }}>موعد التسليم</p><p className="font-bold" style={{ color: C.dark }}>{fd(selectedOrder.delivery_date)}</p></div>
                          <div><p className="text-xs" style={{ color: C.gray }}>البائع</p><p className="font-bold" style={{ color: C.dark }}>{usersMap[selectedOrder.created_by || ""]?.full_name || selectedOrder.created_by || "—"}</p></div>
                          <div><p className="text-xs" style={{ color: C.gray }}>آخر تعديل</p><p className="font-bold" style={{ color: C.dark }}>{fdt(selectedOrder.updated_at || null)}</p></div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: C.border }}>
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: C.primary }}><Package size={18} /> بنود الطلبية ({selectedOrder.items.length})</h3>
                        {selectedOrder.items.length === 0 ? (
                          <p className="text-sm text-center py-4" style={{ color: C.gray }}>لا توجد بنود مسجلة</p>
                        ) : (
                          <div className="space-y-2">
                            {selectedOrder.items.map((item, idx) => (
                              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: C.lightGray }}>
                                <div className="flex items-center gap-3">
                                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: C.primary }}>{idx + 1}</span>
                                  <div>
                                    <p className="font-bold text-sm" style={{ color: C.dark }}>{item.label}</p>
                                    <p className="text-[10px]" style={{ color: C.gray }}>{item.kind}</p>
                                  </div>
                                </div>
                                <div className="text-left">
                                  <p className="font-bold text-sm" style={{ color: C.primary }}>{fc(item.total || 0)}</p>
                                  <p className="text-[10px]" style={{ color: C.gray }}>{item.qty} × {fc(item.unit_price || 0)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Parts */}
                      <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: C.border }}>
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: C.primary }}><Layers size={18} /> أجزاء الطلبية ({selectedOrder.parts.length})</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedOrder.parts.map((part) => {
                            const partType = part.part_type || "";
                            const tailor = part.tailor_id ? tailorsMap[part.tailor_id] : undefined;
                            return (
                              <span key={part.id} className="px-3 py-1.5 rounded-lg text-xs font-bold border" style={{ backgroundColor: C.cream, borderColor: C.border, color: C.dark }}>
                                {partTypeIcons[partType] || "📦"} {part.label} — {partTypeLabels[partType] || partType}
                                {tailor && <span style={{ color: C.primary }}> ({tailor.full_name})</span>}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Product Images from payload */}
                      {(() => {
                        const imgs: string[] = [];
                        try {
                          const p = selectedOrder.payload as any;
                          if (p?.images) imgs.push(...p.images);
                          if (p?.photos) imgs.push(...p.photos);
                          if (p?.fabric?.image_url) imgs.push(p.fabric.image_url);
                        } catch {}
                        return imgs.length > 0 ? (
                          <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: C.border }}>
                            <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: C.primary }}><ImageIcon size={18} /> صور المنتجات</h3>
                            <div className="flex flex-wrap gap-2">
                              {imgs.map((img, i) => (
                                <img key={i} src={img} alt={`صورة ${i + 1}`} className="w-20 h-20 object-cover rounded-xl border cursor-pointer hover:opacity-80 transition" style={{ borderColor: C.border }} onClick={() => img && window.open(img, "_blank")} />
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* Notes */}
                      <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: C.border }}>
                        <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: C.primary }}><FileText size={18} /> الملاحظات</h3>
                        {selectedOrder.notes ? <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3 p-3 rounded-xl" style={{ color: C.dark, backgroundColor: C.lightGray }}>{selectedOrder.notes}</p> : <p className="text-sm mb-3" style={{ color: C.gray }}>لا توجد ملاحظات</p>}
                        <div className="flex gap-2">
                          <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddNote()} placeholder="أضف ملاحظة جديدة..."
                            className="flex-1 px-3 py-2 border rounded-lg text-sm" style={{ borderColor: C.border }} />
                          <button onClick={handleAddNote} disabled={!newNote.trim()} className="px-4 py-2 rounded-lg text-white text-xs font-bold transition disabled:opacity-50" style={{ backgroundColor: C.primary }}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── TAB: PRODUCTS ─── */}
                  {drawerTab === "products" && (
                    <div className="space-y-4">
                      {/* Salon: Seddars */}
                      {selectedOrder.seddars.length > 0 && (
                        <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: C.border }}>
                          <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: C.primary }}>🛋️ السدادر ({selectedOrder.seddars.length})</h3>
                          <div className="space-y-3">
                            {selectedOrder.seddars.map((s, idx) => {
                              const fabricLength = (s.length_cm || 0) + ((s.height_cm || 0) * 2);
                              return (
                                <div key={s.id} className="p-4 rounded-xl border" style={{ backgroundColor: C.lightGray, borderColor: C.border }}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-sm" style={{ color: C.dark }}>سداري #{idx + 1}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: C.primary }}>{fabricLength} سم قماش</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="bg-white rounded-lg p-2"><p className="text-[10px]" style={{ color: C.gray }}>الطول</p><p className="font-bold text-sm" style={{ color: C.dark }}>{s.length_cm} سم</p></div>
                                    <div className="bg-white rounded-lg p-2"><p className="text-[10px]" style={{ color: C.gray }}>العرض</p><p className="font-bold text-sm" style={{ color: C.dark }}>{s.width_cm} سم</p></div>
                                    <div className="bg-white rounded-lg p-2"><p className="text-[10px]" style={{ color: C.gray }}>الارتفاع</p><p className="font-bold text-sm" style={{ color: C.dark }}>{s.height_cm} سم</p></div>
                                  </div>
                                  {s.junction && (
                                    <div className="mt-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-white inline-block" style={{ color: C.gold }}>
                                      🔗 ربط: {s.junction === "formaja" ? "فورماجة" : s.junction === "overlap_into_next" ? "يدخل في التالي" : s.junction === "overlap_from_prev" ? "السابق يدخل فيه" : s.junction === "wooden_divider" ? "صندوق خشبي" : s.junction}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Cushions */}
                      {selectedOrder.cushions.length > 0 && (
                        <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: C.border }}>
                          <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: C.primary }}><Hash size={18} /> المخاد ({selectedOrder.cushions.length})</h3>
                          <div className="space-y-2">
                            {selectedOrder.cushions.map((c, idx) => (
                              <div key={c.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: C.lightGray }}>
                                <div className="flex items-center gap-3">
                                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: C.gold }}>{idx + 1}</span>
                                  <div>
                                    <p className="font-bold text-sm" style={{ color: C.dark }}>{c.is_decor ? "🎀 مخدة ديكور" : "🛋️ مخدة عادية"} — {c.size_cm} سم</p>
                                    <p className="text-[10px]" style={{ color: C.gray }}>{c.count} قطعة | {c.stuffing ? "✅ باللواط" : "❌ بدون لواط"} {c.shape ? `| الشكل: ${c.shape}` : ""}</p>
                                  </div>
                                </div>
                                <div className="text-left">
                                  <p className="font-bold text-sm" style={{ color: C.primary }}>{fc((c.stitch_price || 0) * (c.count || 0))}</p>
                                  <p className="text-[10px]" style={{ color: C.gray }}>{c.count} × {fc(c.stitch_price || 0)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Non-salon products */}
                      {selectedOrder.items.filter((i) => i.kind !== "salon").length > 0 && (
                        <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: C.border }}>
                          <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: C.primary }}><Package size={18} /> منتجات أخرى</h3>
                          <div className="space-y-2">
                            {selectedOrder.items.filter((i) => i.kind !== "salon").map((item, idx) => (
                              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: C.lightGray }}>
                                <div className="flex items-center gap-3">
                                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: C.info }}>{idx + 1}</span>
                                  <div>
                                    <p className="font-bold text-sm" style={{ color: C.dark }}>{item.label}</p>
                                    <p className="text-[10px]" style={{ color: C.gray }}>{item.kind ? partTypeLabels[item.kind] || item.kind : "غير محدد"}</p>
                                  </div>
                                </div>
                                <div className="text-left">
                                  <p className="font-bold text-sm" style={{ color: C.primary }}>{fc(item.total || 0)}</p>
                                  <p className="text-[10px]" style={{ color: C.gray }}>{item.qty} × {fc(item.unit_price || 0)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedOrder.seddars.length === 0 && selectedOrder.cushions.length === 0 && selectedOrder.items.filter((i) => i.kind !== "salon").length === 0 && (
                        <div className="text-center py-12 bg-white rounded-2xl border" style={{ borderColor: C.border }}>
                          <Layers size={40} className="mx-auto mb-3" style={{ color: "#D1D5DB" }} />
                          <p style={{ color: C.gray }}>لا توجد تفاصيل منتجات مسجلة لهذه الطلبية</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─── TAB: FINANCIAL ─── */}
                  {drawerTab === "financial" && (
                    <div className="space-y-4">
                      <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: C.border }}>
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: C.primary }}><DollarSign size={18} /> الملخص المالي</h3>

                        {/* Items */}
                        <div className="space-y-2 mb-4">
                          {selectedOrder.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: C.lightGray }}>
                              <span className="text-sm" style={{ color: C.dark }}>{item.label} <span className="text-[10px]" style={{ color: C.gray }}>({item.kind})</span></span>
                              <span className="font-bold text-sm" style={{ color: C.dark }}>{fc(item.total || 0)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Totals */}
                        <div className="space-y-3 pt-3 border-t" style={{ borderColor: C.border }}>
                          <div className="flex justify-between"><span className="text-sm font-bold" style={{ color: C.dark }}>المجموع الكلي</span><span className="font-bold" style={{ color: C.dark }}>{fc((selectedOrder as any).total_amount || (selectedOrder as any).total || 0)}</span></div>
                          <div className="flex justify-between"><span className="text-sm" style={{ color: C.gray }}>التسبيق المدفوع</span><span className="font-bold" style={{ color: C.gold }}>{fc((selectedOrder as any).deposit_amount || (selectedOrder as any).deposit || 0)}</span></div>
                          <div className="flex justify-between items-center p-3 rounded-xl" style={{ backgroundColor: ((selectedOrder as any).total_amount || (selectedOrder as any).total || 0) - ((selectedOrder as any).deposit_amount || (selectedOrder as any).deposit || 0) > 0 ? "#FEF2F2" : "#F0FDF4" }}>
                            <span className="text-sm font-bold" style={{ color: ((selectedOrder as any).total_amount || (selectedOrder as any).total || 0) - ((selectedOrder as any).deposit_amount || (selectedOrder as any).deposit || 0) > 0 ? C.danger : C.success }}>
                              {((selectedOrder as any).total_amount || (selectedOrder as any).total || 0) - ((selectedOrder as any).deposit_amount || (selectedOrder as any).deposit || 0) > 0 ? "المتبقي على الزبون" : "✅ تم الدفع كاملاً"}
                            </span>
                            <span className="font-bold text-lg" style={{ color: ((selectedOrder as any).total_amount || (selectedOrder as any).total || 0) - ((selectedOrder as any).deposit_amount || (selectedOrder as any).deposit || 0) > 0 ? C.danger : C.success }}>{fc(Math.abs(((selectedOrder as any).total_amount || (selectedOrder as any).total || 0) - ((selectedOrder as any).deposit_amount || (selectedOrder as any).deposit || 0)))}</span>
                          </div>
                        </div>
                      </div>

                      {/* Profit estimate */}
                      <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: C.border }}>
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: C.primary }}><TrendingUp size={18} /> تقدير الربح الصافي</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span style={{ color: C.gray }}>إيرادات البيع</span><span className="font-bold" style={{ color: C.dark }}>{fc((selectedOrder as any).total_amount || (selectedOrder as any).total || 0)}</span></div>
                          <div className="flex justify-between"><span style={{ color: C.gray }}>− تكلفة القماش (تقديرية)</span><span className="font-bold" style={{ color: C.danger }}>—</span></div>
                          <div className="flex justify-between"><span style={{ color: C.gray }}>− أجر الخياط (تقديري)</span><span className="font-bold" style={{ color: C.danger }}>—</span></div>
                          <div className="flex justify-between"><span style={{ color: C.gray }}>− تكاليف أخرى</span><span className="font-bold" style={{ color: C.danger }}>—</span></div>
                          <div className="border-t pt-2 flex justify-between font-bold" style={{ borderColor: C.border }}>
                            <span style={{ color: C.primary }}>الربح الصافي (تقديري)</span>
                            <span style={{ color: C.primary }}>يتطلب بيانات التكلفة</span>
                          </div>
                        </div>
                        <p className="text-[10px] mt-3 p-2 rounded-lg" style={{ color: C.gray, backgroundColor: C.lightGray }}>
                          💡 لحساب الربح بدقة، يجب ربط تكاليف القماش والخياطة بكل طلبية في جداول التكاليف.
                        </p>
                      </div>

                      {/* Customer debt summary */}
                      {(() => {
                        const debt = customerDebts.find((d) => d.name === selectedOrder.customer_name && d.phone === (selectedOrder.customer_phone || ""));
                        return debt && debt.count > 1 ? (
                          <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: C.border }}>
                            <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: C.danger }}><CreditCard size={18} /> ملخص ديون الزبون</h3>
                            <p className="text-sm">هذا الزبون لديه <strong>{debt.count}</strong> طلبيات بإجمالي <strong>{fc(debt.total)}</strong></p>
                            <div className="flex justify-between mt-2 p-3 rounded-xl" style={{ backgroundColor: "#FEF2F2" }}>
                              <span className="font-bold text-sm" style={{ color: C.danger }}>إجمالي الديون المستحقة</span>
                              <span className="font-bold text-lg" style={{ color: C.danger }}>{fc(debt.remaining)}</span>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  {/* ─── TAB: TIMELINE ─── */}
                  {drawerTab === "timeline" && (
                    <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: C.border }}>
                      <h3 className="font-bold text-sm mb-6 flex items-center gap-2" style={{ color: C.primary }}><Clock size={18} /> سير العمل</h3>
                      {selectedOrder.timeline.length === 0 ? (
                        <p className="text-sm text-center py-4" style={{ color: C.gray }}>لا توجد أحداث مسجلة</p>
                      ) : (
                        <div className="relative pr-4">
                          <div className="absolute right-2 top-0 bottom-0 w-0.5" style={{ backgroundColor: C.border }} />
                          {selectedOrder.timeline.map((ev, idx) => (
                            <div key={ev.id} className="relative flex items-start gap-4 mb-6 last:mb-0">
                              <div className="absolute right-0 top-1 w-4 h-4 rounded-full border-2 border-white shadow" style={{ backgroundColor: idx === selectedOrder.timeline.length - 1 ? C.primary : C.gray }} />
                              <div className="mr-8">
                                <p className="text-xs" style={{ color: C.gray }}>{fdt(ev.created_at)}</p>
                                <p className="font-bold text-sm" style={{ color: C.dark }}>{ev.event_type}</p>
                                <p className="text-xs" style={{ color: C.gray }}>{ev.actor} {ev.note ? `— ${ev.note}` : ""}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─── TAB: CHAT ─── */}
                  {drawerTab === "chat" && (
                    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: C.border }}>
                      <div className="p-4 border-b" style={{ borderColor: C.border }}>
                        <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: C.primary }}><MessageCircle size={18} /> المحادثات ({selectedOrder.messages.length})</h3>
                      </div>
                      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                        {selectedOrder.messages.length === 0 ? (
                          <p className="text-sm text-center py-4" style={{ color: C.gray }}>لا توجد رسائل مسجلة</p>
                        ) : (
                          selectedOrder.messages.map((msg) => {
                            const isAdmin = msg.sender_role === "admin";
                            return (
                              <div key={msg.id} className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isAdmin ? "rounded-tr-sm" : "rounded-tl-sm"}`} style={{ backgroundColor: isAdmin ? C.primary : C.white, color: isAdmin ? C.white : C.dark, border: isAdmin ? "none" : `1px solid ${C.border}` }}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold opacity-80">{msg.sender_name || msg.sender_role}</span>
                                    <span className="text-[10px] opacity-50">{fdt(msg.created_at)}</span>
                                  </div>
                                  {msg.media_url ? (
                                    <div>
                                      <img src={msg.media_url} alt="صورة" className="max-w-48 max-h-36 rounded-lg object-cover cursor-pointer hover:opacity-90" onClick={() => msg.media_url && window.open(msg.media_url, "_blank")} />
                                      {msg.body && msg.body !== "صورة" && <p className="text-xs mt-1 opacity-80">{msg.body}</p>}
                                    </div>
                                  ) : (
                                    <p className="text-sm leading-relaxed">{msg.body}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}