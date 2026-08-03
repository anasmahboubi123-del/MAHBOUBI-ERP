"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Printer, Settings, MessageCircle, Plus } from "lucide-react";

// NOTE: Update this import path to match your actual supabase client location
import { supabase } from "@/lib/supabaseClient";

const C = { green: "#1B5E38", gold: "#C9A84C", dark: "#0D1F17", cream: "#F5F0E8" };

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const type = searchParams.get("type") || "devis";

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, status, total, deposit_amount")
      .eq("id", orderId)
      .single()
      .then(({ data }) => {
        setOrder(data);
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        لم يتم العثور على الطلب
      </div>
    );
  }

  const docType = type === "bc" ? "bon_de_commande" : "devis";
  const docLabel = type === "bc" ? "بون دي كوموند" : "دوفي";

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
            {order.order_number}
          </p>
          {order.customer_name && (
            <p className="text-gray-600 mt-2 font-medium">
              الزبون: {order.customer_name}
            </p>
          )}
          <p className="text-2xl font-bold mt-3" style={{ color: C.dark }}>
            {order.total?.toFixed(2)} د.م
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() =>
              router.push(
                `/seller/order-customize?orderId=${order.id}&type=${docType}`
              )
            }
            className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition hover:opacity-90"
            style={{ background: C.green }}
          >
            <Settings className="w-5 h-5" />
            تخصيص وطباعة {docLabel}
          </button>

          <button
            onClick={() =>
              router.push(
                `/seller/print?orderId=${order.id}&type=${docType}&quick=true`
              )
            }
            className="w-full py-3 rounded-xl font-bold border-2 flex items-center justify-center gap-2 transition hover:bg-gray-50"
            style={{ borderColor: C.gold, color: C.dark }}
          >
            <Printer className="w-5 h-5" style={{ color: C.gold }} />
            طباعة سريعة
          </button>

          {order.customer_phone && (
            <a
              href={`https://wa.me/${order.customer_phone.replace(/[^0-9]/g, "")}?text=مرحباً ${order.customer_name}، تم إنشاء طلبك رقم ${order.order_number}`}
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