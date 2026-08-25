"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, User, DollarSign, FileText, CheckCircle,
  Plus, Settings, Printer, ArrowRight, ArrowLeft, Trash2,
} from "lucide-react";
// ← FIXED: use OrderCartContext instead of OrderContext
import { useOrderCart } from "@/contexts/OrderCartContext";

const C = { green: "#1B5E38", gold: "#C9A84C", dark: "#0D1F17", cream: "#F5F0E8" };

const STEPS = [
  { key: "cart", label: "السلة", icon: ShoppingCart },
  { key: "customer", label: "الزبون", icon: User },
  { key: "financial", label: "المالية", icon: DollarSign },
  { key: "review", label: "المراجعة", icon: FileText },
];

/* ═══════════════════════════════════════════════════════════════
   Customer Panel
   ═══════════════════════════════════════════════════════════════ */
function CustomerPanel() {
  const { cart, updateCustomerInfo, updateDeliveryDate } = useOrderCart();
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: C.dark }}>بيانات الزبون</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل *</label>
          <input
            type="text"
            value={cart.customerInfo.name}
            onChange={(e) => updateCustomerInfo({ name: e.target.value })}
            placeholder="اسم الزبون"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1B5E3B] focus:outline-none text-right"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف *</label>
          <input
            type="tel"
            value={cart.customerInfo.phone}
            onChange={(e) => updateCustomerInfo({ phone: e.target.value })}
            placeholder="06XXXXXXXX"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1B5E3B] focus:outline-none text-left"
            dir="ltr"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">هاتف ثانوي</label>
          <input
            type="tel"
            value={cart.customerInfo.phone2 || ""}
            onChange={(e) => updateCustomerInfo({ phone2: e.target.value })}
            placeholder="06XXXXXXXX"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1B5E3B] focus:outline-none text-left"
            dir="ltr"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">المدينة</label>
          <input
            type="text"
            value={cart.customerInfo.city || ""}
            onChange={(e) => updateCustomerInfo({ city: e.target.value })}
            placeholder="الدار البيضاء"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1B5E3B] focus:outline-none text-right"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">العنوان</label>
          <input
            type="text"
            value={cart.customerInfo.address || ""}
            onChange={(e) => updateCustomerInfo({ address: e.target.value })}
            placeholder="عنوان التوصيل"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1B5E3B] focus:outline-none text-right"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">موعد التسليم المتوقع *</label>
          <input
            type="date"
            value={cart.deliveryDate}
            onChange={(e) => updateDeliveryDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1B5E3B] focus:outline-none text-left"
            dir="ltr"
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Financial Panel
   ═══════════════════════════════════════════════════════════════ */
function FinancialPanel() {
  const { cart, updateFinancials, getCartTotals } = useOrderCart();
  const totals = getCartTotals();

  const handleDiscountChange = (val: string) => {
    const discount = parseFloat(val) || 0;
    const total = Math.max(0, totals.subtotal - discount);
    const remaining = Math.max(0, total - totals.deposit);
    updateFinancials({ discount, total, remaining });
  };

  const handleDepositChange = (val: string) => {
    const deposit = parseFloat(val) || 0;
    const remaining = Math.max(0, totals.total - deposit);
    updateFinancials({ deposit, remaining });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: C.dark }}>التفاصيل المالية</h2>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex justify-between py-2 border-b">
          <span className="text-gray-600">المجموع الفرعي</span>
          <span className="font-bold">{totals.subtotal.toFixed(2)} د.م</span>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">الخصم (د.م)</label>
          <input
            type="number"
            min="0"
            value={cart.financials.discount || ""}
            onChange={(e) => handleDiscountChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1B5E3B] focus:outline-none text-left"
            dir="ltr"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">العربون (د.م)</label>
          <input
            type="number"
            min="0"
            value={cart.financials.deposit || ""}
            onChange={(e) => handleDepositChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1B5E3B] focus:outline-none text-left"
            dir="ltr"
          />
        </div>
        <div className="flex justify-between py-2 border-b">
          <span className="text-gray-600">المجموع بعد الخصم</span>
          <span className="font-bold" style={{ color: C.gold }}>{totals.total.toFixed(2)} د.م</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-gray-600">المتبقي</span>
          <span className="font-bold text-red-600">{totals.remaining.toFixed(2)} د.م</span>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">طريقة الدفع</label>
          <select
            value={cart.financials.paymentMethod}
            onChange={(e) => updateFinancials({ paymentMethod: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1B5E3B] focus:outline-none text-right"
          >
            <option value="cash">نقدي</option>
            <option value="card">بطاقة بنكية</option>
            <option value="transfer">حوالة بنكية</option>
            <option value="cheque">شيك</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات مالية</label>
          <textarea
            value={cart.financials.notes || ""}
            onChange={(e) => updateFinancials({ notes: e.target.value })}
            placeholder="أي ملاحظات إضافية..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1B5E3B] focus:outline-none text-right resize-none"
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Cart Review Panel
   ═══════════════════════════════════════════════════════════════ */
function CartReviewPanel() {
  const { cart, removeFromCart, getCartTotals } = useOrderCart();
  const totals = getCartTotals();

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: C.dark }}>محتوى السلة</h2>
      {cart.items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>السلة فارغة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cart.items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex justify-between items-center">
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
                  onClick={() => removeFromCart(item.id)}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mt-1"
                >
                  <Trash2 className="w-3 h-3" /> حذف
                </button>
              </div>
            </div>
          ))}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex justify-between font-bold text-lg">
              <span>المجموع</span>
              <span style={{ color: C.gold }}>{totals.subtotal.toFixed(2)} د.م</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Order Wizard
   ═══════════════════════════════════════════════════════════════ */
export function OrderWizard() {
  const router = useRouter();
  const { cart, getCartTotals, saveOrder, clearCart } = useOrderCart();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedOrder, setSavedOrder] = useState<{ id: string; orderNumber: string; status: "draft" | "confirmed" } | null>(null);

  const totals = getCartTotals();

  const canProceed = () => {
    if (step === 0) return cart.items.length > 0;
    if (step === 1) return !!cart.customerInfo.name.trim() && !!cart.customerInfo.phone.trim() && !!cart.deliveryDate;
    return true;
  };

  const handleSave = async (status: "draft" | "confirmed") => {
    setIsSubmitting(true);
    const result = await saveOrder(status);
    setIsSubmitting(false);
    if (result.success && result.orderId) {
      // Generate order number from ID
      const orderNumber = result.orderId.slice(0, 8).toUpperCase();
      setSavedOrder({ id: result.orderId, orderNumber, status });
    } else {
      alert(result.error || "فشل حفظ الطلب");
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
            {cart.customerInfo.name && (
              <p className="text-sm text-gray-400 mt-2">الزبون: {cart.customerInfo.name}</p>
            )}
            <p className="text-2xl font-bold mt-3" style={{ color: C.dark }}>
              {totals.total.toFixed(2)} د.م
            </p>
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
              onClick={() => router.push(`/seller/print?orderId=${savedOrder.id}&type=${savedOrder.status === "draft" ? "devis" : "bc"}&quick=true`)}
              className="w-full py-3 rounded-xl font-bold border-2 flex items-center justify-center gap-2 transition hover:bg-gray-50"
              style={{ borderColor: C.gold, color: C.dark }}
            >
              <Printer className="w-5 h-5" style={{ color: C.gold }} />
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
                <span className="font-bold">{cart.customerInfo.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">الهاتف</span>
                <span className="font-bold text-left">{cart.customerInfo.phone || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">موعد التسليم</span>
                <span className="font-bold">{cart.deliveryDate || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">عدد المنتجات</span>
                <span className="font-bold">{cart.items.length}</span>
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>المجموع الفرعي</span>
                  <span>{totals.subtotal.toFixed(2)} د.م</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>الخصم</span>
                    <span>-{totals.discount.toFixed(2)} د.م</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-2 border-t">
                  <span>الإجمالي</span>
                  <span style={{ color: C.gold }}>{totals.total.toFixed(2)} د.م</span>
                </div>
                {totals.deposit > 0 && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>العربون</span>
                    <span>{totals.deposit.toFixed(2)} د.م</span>
                  </div>
                )}
                {totals.remaining > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>المتبقي</span>
                    <span>{totals.remaining.toFixed(2)} د.م</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" /> رجوع
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
                className="flex-1 py-3 rounded-xl text-white font-bold transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
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
            className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-bold disabled:opacity-30 flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" /> رجوع
          </button>
          <button
            onClick={() => canProceed() && setStep(Math.min(3, step + 1))}
            disabled={!canProceed()}
            className="px-6 py-2 rounded-lg text-white font-bold disabled:opacity-50 transition hover:opacity-90 flex items-center gap-2"
            style={{ background: C.green }}
          >
            التالي <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}