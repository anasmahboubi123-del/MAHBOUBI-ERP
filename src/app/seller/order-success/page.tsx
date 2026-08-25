"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Printer, Settings, MessageCircle, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const C = { green: "#1B5E38", gold: "#C9A84C", dark: "#0D1F17" };

interface OrderData {
  id: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  deposit: number;
  status: string;
  created_at: string;
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const type = searchParams.get("type") || "devis";

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    fetchOrder(orderId);
  }, [orderId]);

  async function fetchOrder(id: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, customer_name, customer_phone, total, deposit, status, created_at")
        .eq("id", id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (e) {
      console.error("fetchOrder error:", e);
    } finally {
      setLoading(false);
    }
  }

  const docType = type === "bc" ? "bon_de_commande" : "devis";
  const docLabel = type === "bc" ? "بون دي كوموند" : "دوفي";
  const orderNumber = orderId?.slice(0, 8).toUpperCase() || "—";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10" style={{ color: C.green }} />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: C.dark }}>
            {order.status === "confirmed" ? "تم تأكيد الطلب!" : "تم حفظ المسودة!"}
          </h2>
          <p className="text-gray-500 text-sm">رقم الطلب</p>
          <p className="text-4xl font-bold mt-1" style={{ color: C.gold }}>
            {orderNumber}
          </p>
          {order.customer_name && (
            <p className="text-gray-600 mt-2 font-medium">
              الزبون: {order.customer_name}
            </p>
          )}
          <p className="text-2xl font-bold mt-3" style={{ color: C.dark }}>
            {order.total?.toFixed(2) || "0.00"} د.م
          </p>
          {order.deposit > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              العربون: {order.deposit.toFixed(2)} د.م
            </p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={() =>
              router.push(`/seller/order-customize?orderId=${orderId}&type=${docType}`)
            }
            className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition hover:opacity-90"
            style={{ background: C.green }}
          >
            <Settings className="w-5 h-5" />
            تخصيص وطباعة {docLabel}
          </button>

          <button
            onClick={() =>
              router.push(`/seller/print?orderId=${orderId}&type=${docType}&quick=true`)
            }
            className="w-full py-3 rounded-xl font-bold border-2 flex items-center justify-center gap-2 transition hover:bg-gray-50"
            style={{ borderColor: C.gold, color: C.dark }}
          >
            <Printer className="w-5 h-5" style={{ color: C.gold }} />
            طباعة سريعة
          </button>

          {order.customer_phone && (
            <a
              href={`https://wa.me/${order.customer_phone.replace(/[^0-9]/g, "")}?text=مرحباً ${order.customer_name}، تم إنشاء طلبك رقم ${orderNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl font-bold border-2 border-green-200 text-green-700 flex items-center justify-center gap-2 transition hover:bg-green-50"
            >
              <MessageCircle className="w-5 h-5" />
              إرسال واتساب
            </a>
          )}

          <button
            onClick={() => router.push("/seller")}
            className="w-full py-3 rounded-xl font-bold border-2 border-gray-200 text-gray-600 flex items-center justify-center gap-2 transition hover:bg-gray-50"
          >
            <Plus className="w-5 h-5" />
            طلب جديد
          </button>
        </div>
      </div>
    </div>
  );
}