"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { FoamOrder, FoamProduct, FoamOrderSeddar, Supplier } from "@/types/foam-types";

interface FoamOrderWithDetails extends FoamOrder {
  foam_products?: FoamProduct | null;
  suppliers?: Supplier | null;
  seddars?: FoamOrderSeddar[];
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "معلق", color: "text-amber-700", bg: "bg-amber-100" },
  sent_to_supplier: { label: "مرسل للمورد", color: "text-blue-700", bg: "bg-blue-100" },
  in_production: { label: "قيد الإنتاج", color: "text-purple-700", bg: "bg-purple-100" },
  ready: { label: "جاهز", color: "text-green-700", bg: "bg-green-100" },
  delivered: { label: "مُسلّم", color: "text-gray-700", bg: "bg-gray-100" },
  cancelled: { label: "ملغى", color: "text-red-700", bg: "bg-red-100" },
};

function formatCurrency(n: number) {
  return `DH ${Math.round(n).toLocaleString("fr-MA")}`;
}

function getDaysLeft(deliveryDate: string | null | undefined): number {
  if (!deliveryDate) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(deliveryDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function FoamOrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<FoamOrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const loadOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const { data: orderData } = await supabase
        .from("foam_orders")
        .select("*, foam_products(*), suppliers(*)")
        .eq("id", orderId)
        .single();

      if (orderData) {
        const { data: seddarsData } = await supabase
          .from("foam_order_seddars")
          .select("*")
          .eq("foam_order_id", orderId)
          .order("sort_order", { ascending: true });

        setOrder({ ...orderData, seddars: seddarsData || [] });
        setNewStatus(orderData.status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const handleStatusChange = async () => {
    if (!order || !newStatus || newStatus === order.status) return;
    setSaving(true);
    await supabase
      .from("foam_orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", order.id);
    await supabase.from("audit_logs").insert({
      table_name: "foam_orders",
      record_id: order.id,
      action: "status_change",
      old_values: { status: order.status },
      new_values: { status: newStatus },
      performed_by: "المدير",
    });
    await loadOrder();
    setSaving(false);
  };

  const sendWhatsAppToSupplier = () => {
    if (!order?.suppliers?.phone) {
      alert("لا يوجد هاتف للمورد");
      return;
    }
    const msg = `مرحباً ${order.suppliers.name}،\nطلبية بونج جديدة:\nرقم: FOAM-${order.order_number}\nالمنتج: ${order.foam_products?.name || "—"}\nالارتفاع: ${order.height_cm}سم | العرض: ${order.width_cm}سم\nالكمية: ${order.total_meters} متر\nالسعر النهائي: ${formatCurrency(order.final_price || 0)}\nتاريخ التسليم: ${order.delivery_date || "—"}`;
    window.open(`https://wa.me/${order.suppliers.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const printInvoice = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0EDE8] flex items-center justify-center" dir="rtl">
        <div className="text-[#1B5E3B] font-bold animate-pulse">جاري تحميل الطلبية...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F0EDE8] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-4xl mb-4">❌</p>
          <p className="text-gray-500">الطلبية غير موجودة</p>
          <Link href="/admin/foam-orders" className="text-[#1B5E3B] underline mt-4 inline-block">العودة للقائمة</Link>
        </div>
      </div>
    );
  }

  const daysLeft = getDaysLeft(order.delivery_date);
  const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const remaining = (order.final_price || 0) - (order.deposit || 0);

  return (
    <div className="min-h-screen bg-[#F0EDE8]" dir="rtl">
      <div className="bg-white border-b border-[#E8E4DC]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-[#1B5E3B]">FOAM-{order.order_number}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusInfo.bg} ${statusInfo.color}`}>{statusInfo.label}</span>
              </div>
              <p className="text-sm text-gray-500">أنشئ: {new Date(order.created_at || "").toLocaleString("ar-MA")} — البائع: {order.created_by || "—"}</p>
            </div>
            <Link href="/admin/foam-orders" className="px-4 py-2 bg-[#F5F0E8] text-[#1B5E3B] rounded-xl text-sm font-bold hover:bg-[#E8E4DC] transition">← رجوع</Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#F5F0E8] rounded-xl p-3">
              <p className="text-xs text-gray-500">الزبون</p>
              <p className="font-bold text-[#1B5E3B]">{order.customer_name || "—"}</p>
              <p className="text-xs text-gray-400">{order.customer_phone || "—"}</p>
            </div>
            <div className="bg-[#F5F0E8] rounded-xl p-3">
              <p className="text-xs text-gray-500">السعر النهائي</p>
              <p className="font-bold text-[#1B5E3B]">{formatCurrency(order.final_price || 0)}</p>
              <p className="text-xs text-gray-400">تسبيق: {formatCurrency(order.deposit || 0)}</p>
            </div>
            <div className="bg-[#F5F0E8] rounded-xl p-3">
              <p className="text-xs text-gray-500">التسليم</p>
              <p className="font-bold text-[#1B5E3B]">{order.delivery_date || "—"}</p>
              <p className={`text-xs ${daysLeft < 0 ? "text-red-500" : "text-green-600"}`}>{daysLeft < 0 ? `متأخر ${Math.abs(daysLeft)} يوم` : `باقي ${daysLeft} أيام`}</p>
            </div>
            <div className="bg-[#F5F0E8] rounded-xl p-3">
              <p className="text-xs text-gray-500">المتبقي</p>
              <p className="font-bold text-[#C9A84C]">{formatCurrency(remaining)}</p>
              <p className="text-xs text-gray-400">{remaining <= 0 ? "✅ تم الدفع" : "غير مدفوع"}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC]">
          <h3 className="text-lg font-bold text-[#1B5E3B] mb-4">🧽 تفاصيل المنتج</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><p className="text-xs text-gray-500">المنتج</p><p className="font-bold text-gray-800">{order.foam_products?.name || "—"}</p></div>
            <div><p className="text-xs text-gray-500">الارتفاع</p><p className="font-bold text-gray-800">{order.height_cm} سم</p></div>
            <div><p className="text-xs text-gray-500">العرض</p><p className="font-bold text-gray-800">{order.width_cm} سم</p></div>
            <div><p className="text-xs text-gray-500">المورد</p><p className="font-bold text-gray-800">{order.suppliers?.name || "—"}</p></div>
            <div><p className="text-xs text-gray-500">الفورمجة</p><p className="font-bold text-gray-800">{order.formage_enabled ? `نعم (${order.formage_count} ${order.formage_type === "square" ? "مربع" : "مثلث"})` : "لا"}</p></div>
            <div><p className="text-xs text-gray-500">إجمالي الأطوال</p><p className="font-bold text-gray-800">{order.total_meters} متر</p></div>
          </div>
        </div>

        {order.seddars && order.seddars.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC]">
            <h3 className="text-lg font-bold text-[#1B5E3B] mb-4">📏 السدادر</h3>
            <div className="space-y-2">
              {order.seddars.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between bg-[#F5F0E8] rounded-xl p-3">
                  <span className="text-sm font-bold text-gray-700">سدار #{i + 1}</span>
                  <span className="text-sm text-gray-600">{s.length_cm} سم</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-[#1B5E3B] text-white rounded-xl p-3 mt-2">
                <span className="text-sm font-bold">الإجمالي</span>
                <span className="text-sm font-bold">{order.total_meters} متر</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC]">
          <h3 className="text-lg font-bold text-[#1B5E3B] mb-4">💰 تفصيل السعر</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">السعر الأساسي</span><span className="font-bold">{formatCurrency(order.base_price || 0)}</span></div>
            {order.price_adjustment !== 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{order.price_adjustment && order.price_adjustment > 0 ? "زيادة" : "خصم"}</span>
                <span className={`font-bold ${order.price_adjustment && order.price_adjustment > 0 ? "text-red-600" : "text-green-600"}`}>{formatCurrency(Math.abs(order.price_adjustment || 0))}</span>
              </div>
            )}
            <div className="flex justify-between text-sm"><span className="text-gray-500">السعر النهائي</span><span className="font-bold text-[#1B5E3B]">{formatCurrency(order.final_price || 0)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">التسبيق</span><span className="font-bold text-[#C9A84C]">{formatCurrency(order.deposit || 0)}</span></div>
            <div className="border-t border-[#E8E4DC] pt-2 flex justify-between text-sm"><span className="text-gray-500">المتبقي</span><span className="font-bold text-[#C9A84C]">{formatCurrency(remaining)}</span></div>
            {order.price_adjustment_reason && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
                <p className="text-xs text-amber-800 font-bold">سبب تعديل السعر:</p>
                <p className="text-xs text-amber-700 mt-1">{order.price_adjustment_reason}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC]">
          <h3 className="text-lg font-bold text-[#1B5E3B] mb-4">⚙️ إدارة الحالة</h3>
          <div className="flex flex-col md:flex-row gap-3">
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="flex-1 bg-[#F5F0E8] border border-[#E8E4DC] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C9A84C]">
              {Object.entries(STATUS_MAP).map(([key, info]) => (
                <option key={key} value={key}>{info.label}</option>
              ))}
            </select>
            <button onClick={handleStatusChange} disabled={saving || newStatus === order.status} className="px-6 py-3 bg-[#1B5E3B] text-white rounded-xl text-sm font-bold hover:bg-[#C9A84C] transition disabled:opacity-50">
              {saving ? "⏳ جاري..." : "💾 تحديث الحالة"}
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <button onClick={sendWhatsAppToSupplier} className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition flex items-center justify-center gap-2">📱 واتساب للمورد</button>
          <button onClick={printInvoice} className="flex-1 py-3 bg-[#1B5E3B] text-white rounded-xl text-sm font-bold hover:bg-[#C9A84C] transition flex items-center justify-center gap-2">🖨️ طباعة الفاتورة</button>
        </div>

        {order.notes && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC]">
            <h3 className="text-lg font-bold text-[#1B5E3B] mb-2">📝 ملاحظات</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{order.notes}</p>
          </div>
        )}
      </main>
    </div>
  );
}