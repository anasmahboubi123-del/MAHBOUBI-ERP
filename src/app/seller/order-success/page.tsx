"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Printer, Settings, MessageCircle, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const C = { green: "#1B5E38", gold: "#C9A84C", dark: "#0D1F17" };

interface OrderData {
  id: string;
  order_number: string | null;
  customer_name: string;
  customer_phone: string;
  total: number;
  total_amount: number | null;
  deposit: number;
  deposit_amount: number | null;
  status: string;
  delivery_expected_date: string | null;
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
        .select("id, order_number, customer_name, customer_phone, total, total_amount, deposit, deposit_amount, status, delivery_expected_date, created_at")
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

  // ✅ استخدام order_number من قاعدة البيانات، وإلا استخدام أول 8 أحرف من UUID
  const orderNumber = order?.order_number || orderId?.slice(0, 8).toUpperCase() || "—";

  // ✅ المجموع: total أولاً، ثم total_amount كاحتياطي
  const displayTotal = order ? (order.total || order.total_amount || 0) : 0;

  // ✅ العربون: deposit أولاً، ثم deposit_amount كاحتياطي
  const displayDeposit = order ? (order.deposit || order.deposit_amount || 0) : 0;

  // ✅ موعد التسليم
  const deliveryDate = order?.delivery_expected_date
    ? new Date(order.delivery_expected_date).toLocaleDateString("ar-MA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  // ✅ رابط WhatsApp مع رسالة كاملة
  const getWhatsAppLink = () => {
    if (!order?.customer_phone) return "#";

    const phone = order.customer_phone.replace(/[^0-9]/g, "");
    const cleanPhone = phone.startsWith("0") ? phone.slice(1) : phone;

    const message =
      `🎉 شكراً لاختياركم *مؤسسة محبوبي*!\n\n` +
      `📋 *تفاصيل طلبكم:*\n` +
      `• رقم الطلب: *${orderNumber}*\n` +
      `• المبلغ الإجمالي: *${displayTotal.toFixed(2)} د.م*\n` +
      `${displayDeposit > 0 ? `• العربون المدفوع: *${displayDeposit.toFixed(2)} د.م*\n` : ""}` +
      `${deliveryDate ? `• موعد التسليم المتوقع: *${deliveryDate}*\n` : ""}\n` +
      `⏳ *سنرسل لكم رسالة فور جاهزية الطلبية.*\n\n` +
      `📲 *تابعونا على مواقع التواصل الاجتماعي:*\n` +
      `• Instagram: @mahboubi.ma\n` +
      `• Facebook: mahboubi.ma\n\n` +
      `🙏 نشكر ثقتكم بنا ونتمنى لكم يوماً سعيداً!`;

    return `https://wa.me/212${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

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

          {/* ✅ المجموع الإجمالي */}
          <p className="text-2xl font-bold mt-3" style={{ color: C.dark }}>
            {displayTotal.toFixed(2)} د.م
          </p>

          {/* ✅ العربون */}
          {displayDeposit > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              العربون: {displayDeposit.toFixed(2)} د.م
            </p>
          )}

          {/* ✅ موعد التسليم */}
          {deliveryDate && (
            <p className="text-sm mt-2" style={{ color: C.green }}>
              📅 موعد التسليم المتوقع: {deliveryDate}
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

          {/* ✅ زر WhatsApp محسّن */}
          {order.customer_phone && (
            <a
              href={getWhatsAppLink()}
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