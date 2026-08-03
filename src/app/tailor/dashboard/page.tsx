"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTailorAuth } from "@/hooks/useTailorAuth";
import { supabase } from "@/lib/supabase-tailors";
import {
  LogOut, MessageCircle, Package, Clock, CheckCircle,
  Scissors, AlertCircle, ArrowLeft
} from "lucide-react";

type OrderStatus = "new" | "in_progress" | "completed";

interface TailorOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  status: OrderStatus;
  delivery_date?: string;
  product_type?: string;
  created_at: string;
}

const tabs: { id: OrderStatus; label: string; icon: any }[] = [
  { id: "new", label: "الجديدة", icon: Package },
  { id: "in_progress", label: "قيد العمل", icon: Clock },
  { id: "completed", label: "المكتملة", icon: CheckCircle },
];

export default function TailorDashboardPage() {
  const { session, logout, loading: authLoading } = useTailorAuth();
  const [orders, setOrders] = useState<TailorOrder[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus>("new");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!session) return;
    fetchOrders();
  }, [session]);

  async function fetchOrders() {
    setLoading(true);
    try {
      // جلب الطلبيات من Supabase
      // نفترض أن الطلبية تحتوي على payload->tailor_id أو نبحث في order_items
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, customer_phone, status, delivery_date, payload, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // فلترة الطلبيات المُسندة لهذا الخياط
      const tailorId = session!.tailor_id;
      const mapped: TailorOrder[] = (data || [])
        .filter((o: any) => {
          // إذا كان payload يحتوي على tailor_id
          const payloadTailorId = o.payload?.tailor_id;
          if (payloadTailorId && payloadTailorId !== tailorId) return false;
          // إذا لم يكن هناك tailor_id محدد، نعرض للجميع (مؤقتاً)
          return true;
        })
        .map((o: any) => ({
          id: o.id,
          order_number: o.order_number || o.id.slice(-6).toUpperCase(),
          customer_name: o.customer_name || "زبون غير معروف",
          customer_phone: o.customer_phone,
          status: normalizeStatus(o.status),
          delivery_date: o.delivery_date,
          product_type: o.payload?.product_type || "صالون",
          created_at: o.created_at,
        }));

      setOrders(mapped);
    } catch (err) {
      console.error("فشل جلب الطلبيات:", err);
    } finally {
      setLoading(false);
    }
  }

  function normalizeStatus(s: string): OrderStatus {
    if (s === "in-progress" || s === "in_progress") return "in_progress";
    if (s === "completed") return "completed";
    return "new";
  }

  async function startWork(orderId: string) {
    try {
      await supabase.from("orders").update({ status: "in_progress" }).eq("id", orderId);
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = orders.filter((o) => o.status === activeTab);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="animate-pulse text-[#1B5E38] font-bold">جاري التحقق...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]" dir="rtl">
      {/* Header */}
      <header className="bg-[#1B5E38] text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C9A84C] flex items-center justify-center font-bold text-[#1A1A1A] text-lg">
              {session?.full_name?.charAt(0)}
            </div>
            <div>
              <h1 className="font-bold text-sm">{session?.full_name}</h1>
              <p className="text-[10px] text-[#C9A84C]">لوحة العمل</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/tailor/chat"
              className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition flex items-center gap-2 text-sm"
            >
              <MessageCircle size={18} />
              <span className="hidden sm:inline">المحادثة</span>
            </Link>
            <button
              onClick={logout}
              className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition"
              title="خروج"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pb-24">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const count = orders.filter((o) => o.status === tab.id).length;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-[#1B5E38] text-white shadow-lg"
                    : "bg-white text-[#1B5E38] border border-[#E5E7EB] hover:shadow-md"
                }`}
              >
                <Icon size={16} />
                {tab.label}
                <span className="text-xs opacity-70 bg-white/20 px-1.5 py-0.5 rounded-md">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12 text-[#6B7280]">جاري تحميل الطلبيات...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto mb-4 text-[#D1D5DB]" />
            <p className="text-[#6B7280] font-medium">لا توجد طلبات في هذا القسم</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => {
              const remaining = order.delivery_date
                ? Math.ceil(
                    (new Date(order.delivery_date).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )
                : null;
              const isUrgent = remaining !== null && remaining <= 2 && order.status !== "completed";

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-[#1A1A1A]">{order.customer_name}</h3>
                        <p className="text-sm text-[#6B7280] mt-1">{order.product_type}</p>
                      </div>
                      {isUrgent && (
                        <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 flex items-center gap-1">
                          <AlertCircle size={12} />
                          عاجل
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-[#6B7280]">
                      <span className="bg-[#F3F4F6] px-2 py-1 rounded-md">
                        #{order.order_number}
                      </span>
                      {order.delivery_date && (
                        <span className={remaining! < 0 ? "text-red-500 font-bold" : ""}>
                          {remaining! < 0
                            ? "متأخر"
                            : `باقي ${Math.ceil(remaining!)} أيام`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[#E5E7EB] p-3 flex gap-2 bg-[#FAFAF8]">
                    <Link
                      href={`/tailor/order/${order.id}`}
                      className="flex-1 py-2.5 bg-[#1B5E38] text-white rounded-xl text-sm font-bold text-center hover:bg-[#2D7A4E] transition-colors flex items-center justify-center gap-2"
                    >
                      <Scissors size={16} />
                      التفاصيل
                    </Link>
                    {order.status === "new" && (
                      <button
                        onClick={() => startWork(order.id)}
                        className="flex-1 py-2.5 bg-[#C9A84C] text-[#1A1A1A] rounded-xl text-sm font-bold hover:bg-[#1B5E38] hover:text-white transition-colors"
                      >
                        بدأ العمل
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}