"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  User,
  DollarSign,
  FileText,
  CheckCircle,
  Plus,
  Settings,
} from "lucide-react";
import { useOrder } from "../context/OrderContext";
import { CustomerPanel } from "./CustomerPanel";
import { FinancialPanel } from "./FinancialPanel";

const C = { green: "#1B5E38", gold: "#C9A84C", dark: "#0D1F17", cream: "#F5F0E8" };

const STEPS = [
  { key: "cart", label: "السلة", icon: ShoppingCart },
  { key: "customer", label: "الزبون", icon: User },
  { key: "financial", label: "المالية", icon: DollarSign },
  { key: "review", label: "المراجعة", icon: FileText },
];

// Simple cart review component inline
function CartReviewPanel() {
  const { cart, cartTotals, removeFromCart } = useOrder();
  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: C.dark }}>محتوى السلة</h2>
      {cart.items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>السلة فارغة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cart.items.map((item) => (
            <div key={item.orderItemId} className="bg-white rounded-xl border border-gray-200 p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {item.thumbnailUrl && (
                  <img src={item.thumbnailUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div>
                  <p className="font-bold">{item.productName}</p>
                  <p className="text-sm text-gray-400">{item.productType}</p>
                </div>
              </div>
              <div className="text-left">
                <p className="font-bold">{item.totalPrice.toFixed(2)} د.م</p>
                <button
                  onClick={() => removeFromCart(item.orderItemId)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex justify-between font-bold text-lg">
              <span>المجموع</span>
              <span style={{ color: C.gold }}>{cartTotals.subtotal.toFixed(2)} د.م</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function OrderWizard() {
  const router = useRouter();
  const { cart, cartTotals, createOrder, clearCart, isSubmitting } = useOrder();
  const [step, setStep] = useState(0);
  const [savedOrder, setSavedOrder] = useState<{ id: string; orderNumber: string; status: "draft" | "confirmed" } | null>(null);

  const canProceed = () => {
    if (step === 1) {
      return !!cart.customer.name.trim() && !!cart.customer.phone.trim() && !!cart.delivery.expectedDate;
    }
    if (step === 0) return cart.items.length > 0;
    return true;
  };

  const handleSave = async (status: "draft" | "confirmed") => {
    const result = await createOrder(status);
    if (result) {
      setSavedOrder({ id: result.id, orderNumber: result.orderNumber, status });
    }
  };

  const goCustomize = () => {
    if (!savedOrder) return;
    const docType = savedOrder.status === "draft" ? "devis" : "bon_de_commande";
    router.push(`/seller/order-customize?orderId=${savedOrder.id}&type=${docType}`);
  };

  const goNewOrder = () => {
    clearCart();
    setSavedOrder(null);
    setStep(0);
  };

  /* ═══ Success Screen ═══ */
  if (savedOrder) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" style={{ color: C.green }} />
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: C.dark }}>
              {savedOrder.status === "confirmed" ? "تم تأكيد الطلب!" : "تم حفظ المسودة!"}
            </h2>
            <p className="text-gray-500">رقم الطلب:</p>
            <p className="text-3xl font-bold mt-1" style={{ color: C.gold }}>
              {savedOrder.orderNumber}
            </p>
            {cart.customer.name && (
              <p className="text-sm text-gray-400 mt-2">الزبون: {cart.customer.name}</p>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={goCustomize}
              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition hover:opacity-90"
              style={{ background: C.green }}
            >
              <Settings className="w-5 h-5" />
              تخصيص وطباعة
            </button>

            <button
              onClick={() => router.push(`/seller/order-success?orderId=${savedOrder.id}&type=${savedOrder.status === "draft" ? "devis" : "bc"}`)}
              className="w-full py-3 rounded-xl font-bold border-2 flex items-center justify-center gap-2 transition hover:bg-gray-50"
              style={{ borderColor: C.gold, color: C.dark }}
            >
              طباعة سريعة
            </button>

            <button
              onClick={goNewOrder}
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

  /* ═══ Wizard Steps ═══ */
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = i < step;
          return (
            <div key={s.key} className="flex items-center gap-2">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${
                  active
                    ? "text-white"
                    : done
                    ? "text-green-700 bg-green-50"
                    : "text-gray-400 bg-gray-50"
                }`}
                style={active ? { background: C.green } : {}}
              >
                <Icon className="w-4 h-4" />
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${done ? "bg-green-600" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {step === 0 && <CartReviewPanel />}
        {step === 1 && <CustomerPanel />}
        {step === 2 && <FinancialPanel />}
        {step === 3 && (
          <div className="max-w-xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-center" style={{ color: C.dark }}>
              مراجعة نهائية
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">الزبون</span>
                <span className="font-bold">{cart.customer.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">الهاتف</span>
                <span className="font-bold text-left">{cart.customer.phone || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">موعد التسليم</span>
                <span className="font-bold">{cart.delivery.expectedDate || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">عدد المنتجات</span>
                <span className="font-bold">{cart.items.length}</span>
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>المجموع الفرعي</span>
                  <span>{cartTotals.subtotal.toFixed(2)} د.م</span>
                </div>
                {cartTotals.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>الخصم</span>
                    <span>-{cartTotals.discount.toFixed(2)} د.م</span>
                  </div>
                )}
                {cartTotals.delivery > 0 && (
                  <div className="flex justify-between">
                    <span>التوصيل</span>
                    <span>{cartTotals.delivery.toFixed(2)} د.م</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-2 border-t">
                  <span>الإجمالي</span>
                  <span style={{ color: C.gold }}>{cartTotals.total.toFixed(2)} د.م</span>
                </div>
                {cartTotals.deposit > 0 && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>التسبيق</span>
                    <span>{cartTotals.deposit.toFixed(2)} د.م</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition"
              >
                رجوع
              </button>
              <button
                onClick={() => handleSave("draft")}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl border-2 border-amber-400 text-amber-800 font-bold hover:bg-amber-50 transition disabled:opacity-50"
              >
                {isSubmitting ? "..." : "💾 حفظ مسودة"}
              </button>
              <button
                onClick={() => handleSave("confirmed")}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl text-white font-bold transition hover:opacity-90 disabled:opacity-50"
                style={{ background: C.green }}
              >
                {isSubmitting ? "..." : "✅ تأكيد الطلب"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      {step < 3 && (
        <div className="flex justify-between max-w-xl mx-auto pt-4">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-bold disabled:opacity-30"
          >
            رجوع
          </button>
          <button
            onClick={() => canProceed() && setStep(Math.min(3, step + 1))}
            disabled={!canProceed()}
            className="px-6 py-2 rounded-lg text-white font-bold disabled:opacity-50 transition hover:opacity-90"
            style={{ background: C.green }}
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}