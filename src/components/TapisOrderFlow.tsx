"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  fetchTapis,
  insertTapisOrder,
  Tapis,
  TapisOrderPayload,
} from "@/lib/supabase-tapis";
import {
  ArrowRight,
  ArrowLeft,
  Ruler,
  Scissors,
  Percent,
  Calculator,
  User,
  Phone,
  Calendar,
  Printer,
  CheckCircle,
  ImageIcon,
  Info,
  Save,
  Send,
} from "lucide-react";

// ─── Colors ───
const C = {
  green: "#1B5E38",
  greenLight: "#2E7D52",
  gold: "#C9A84C",
  cream: "#F5F0E8",
  dark: "#0D1F17",
  white: "#FFFFFF",
  red: "#C0392B",
};

// ─── Types ───
interface CustomerInfo {
  name: string;
  phone: string;
  deliveryDate: string;
}

interface CalculationState {
  originalLength: number;
  originalWidth: number;
  cutMarginCm: number;
  wastePercent: number;
  rounding: "none" | "half" | "one";
}

// ─── Helpers ───
function calcFinalArea(calc: CalculationState): number {
  const finalLength = calc.originalLength + calc.cutMarginCm / 100;
  const finalWidth = calc.originalWidth + calc.cutMarginCm / 100;
  let area = finalLength * finalWidth;
  area = area * (1 + calc.wastePercent / 100);

  if (calc.rounding === "half") {
    area = Math.ceil(area * 2) / 2;
  } else if (calc.rounding === "one") {
    area = Math.ceil(area);
  }
  return area;
}

function formatMoney(n: number) {
  return n.toLocaleString("ar-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " د.م";
}

function formatDate(d: string) {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("ar-MA");
}

// ─── Component ───
export default function TapisOrderFlow() {
  const [tapisList, setTapisList] = useState<Tapis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTapis, setSelectedTapis] = useState<Tapis | null>(null);
  const [step, setStep] = useState(0);
  const [calc, setCalc] = useState<CalculationState>({
    originalLength: 0,
    originalWidth: 0,
    cutMarginCm: 10,
    wastePercent: 0,
    rounding: "none",
  });
  const [marginConfirmed, setMarginConfirmed] = useState(false);
  const [wasteConfirmed, setWasteConfirmed] = useState(false);
  const [roundConfirmed, setRoundConfirmed] = useState(false);
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: "",
    phone: "",
    deliveryDate: "",
  });
  const [depositPercent, setDepositPercent] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTapis()
      .then(setTapisList)
      .catch(() => setError("تعذر تحميل الزرابي من السيرفر"))
      .finally(() => setLoading(false));
  }, []);

  const finalArea = calcFinalArea(calc);
  const totalPrice = selectedTapis ? finalArea * selectedTapis.price_per_m2 : 0;
  const depositAmount = totalPrice * (depositPercent / 100);
  const remaining = totalPrice - depositAmount;

  const canProceed = () => {
    switch (step) {
      case 0:
        return !!selectedTapis;
      case 1:
        return calc.originalLength > 0 && calc.originalWidth > 0;
      case 2:
        return marginConfirmed;
      case 3:
        return wasteConfirmed;
      case 4:
        return roundConfirmed;
      case 5:
        return true;
      case 6:
        return customer.name.trim().length >= 2 && customer.phone.trim().length >= 8;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!canProceed()) return;
    setStep((s) => Math.min(s + 1, 7));
    setError("");
  };

  const prevStep = () => {
    setStep((s) => Math.max(s - 1, 0));
    setError("");
  };

  const handleSubmit = async () => {
    if (!selectedTapis) return;
    setSubmitting(true);
    setError("");
    try {
      const payload: TapisOrderPayload = {
        tapis_id: selectedTapis.id,
        tapis_name: selectedTapis.name,
        original_length_m: calc.originalLength,
        original_width_m: calc.originalWidth,
        cut_margin_cm: calc.cutMarginCm,
        final_length_m: calc.originalLength + calc.cutMarginCm / 100,
        final_width_m: calc.originalWidth + calc.cutMarginCm / 100,
        area_m2: (calc.originalLength + calc.cutMarginCm / 100) * (calc.originalWidth + calc.cutMarginCm / 100),
        waste_percent: calc.wastePercent,
        final_area_m2: finalArea,
        rounding_type: calc.rounding,
        price_per_m2: selectedTapis.price_per_m2,
        total_price: totalPrice,
      };

      const order = await insertTapisOrder({
        customer_name: customer.name,
        customer_phone: customer.phone,
        delivery_date: customer.deliveryDate || null,
        deposit: depositAmount,
        total: totalPrice,
        payload,
      });

      setOrderId(order.id);
      setOrderComplete(true);
      setStep(7);
    } catch (e) {
      setError("فشل في حفظ الطلبية. تأكد من اتصالك بالسيرفر.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html dir="rtl" lang="ar">
      <head>
        <title>فاتورة زربية — El Mahboubi</title>
        <style>
          @import url(https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap);
          body { font-family: Tajawal, sans-serif; margin: 0; padding: 40px; background: #fff; color: #000; }
          .header { text-align: center; border-bottom: 3px solid #1B5E38; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #1B5E38; font-size: 28px; }
          .header p { margin: 5px 0; color: #555; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: 700; color: #1B5E38; border-right: 4px solid #C9A84C; padding-right: 10px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
          th { background: #1B5E38; color: #fff; }
          .total-row { font-weight: 700; font-size: 18px; background: #F5F0E8; }
          .footer { margin-top: 40px; text-align: center; color: #777; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
          .gold { color: #C9A84C; }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  const resetAll = () => {
    setStep(0);
    setSelectedTapis(null);
    setCalc({ originalLength: 0, originalWidth: 0, cutMarginCm: 10, wastePercent: 0, rounding: "none" });
    setMarginConfirmed(false);
    setWasteConfirmed(false);
    setRoundConfirmed(false);
    setCustomer({ name: "", phone: "", deliveryDate: "" });
    setDepositPercent(30);
    setOrderComplete(false);
    setOrderId(null);
    setError("");
  };

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: C.cream }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');`}</style>
      {/* Header */}
      <header className="sticky top-0 z-50 shadow-lg" style={{ background: C.dark }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: C.gold }}>
              <Ruler className="w-5 h-5" style={{ color: C.dark }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: C.gold }}>طلبية زربية</h1>
              <p className="text-xs opacity-70" style={{ color: C.cream }}>Ameublement et Déco El Mahboubi</p>
            </div>
          </div>
          <div className="text-sm" style={{ color: C.cream }}>
            الخطوة {step + 1} / 8
          </div>
        </div>
        <div className="h-1 w-full" style={{ background: "#1a3c2a" }}>
          <div className="h-full transition-all duration-500" style={{ width: `${((step + 1) / 8) * 100}%`, background: C.gold }} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg text-white text-center" style={{ background: C.red }}>
            {error}
          </div>
        )}

        {/* STEP 0: اختيار الزربية */}
        {step === 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-2" style={{ color: C.green }}>اختر الزربية</h2>
            <p className="mb-6 opacity-70">اختر نوع الزربية من الكتالوج لبدء حساب الطلبية</p>

            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin w-10 h-10 border-4 rounded-full mx-auto mb-4" style={{ borderColor: C.green, borderTopColor: "transparent" }} />
                <p>جاري تحميل الزرابي...</p>
              </div>
            ) : tapisList.length === 0 ? (
              <div className="text-center py-20 rounded-xl border-2 border-dashed" style={{ borderColor: C.green }}>
                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-bold" style={{ color: C.green }}>الكتالوج فارغ</p>
                <p className="opacity-60">أضف زربية من لوحة المدير أولاً</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tapisList.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTapis(t)}
                    className="relative rounded-xl overflow-hidden border-2 transition-all hover:shadow-xl text-right"
                    style={{
                      borderColor: selectedTapis?.id === t.id ? C.gold : "transparent",
                      background: "#fff",
                      boxShadow: selectedTapis?.id === t.id ? `0 0 0 3px ${C.gold}40` : "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div className="h-40 w-full relative" style={{ background: "#e8e4dc" }}>
                      {t.image_url ? (
                        <img src={t.image_url} alt={t.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="w-12 h-12 opacity-20" />
                        </div>
                      )}
                      {selectedTapis?.id === t.id && (
                        <div className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.gold }}>
                          <CheckCircle className="w-5 h-5" style={{ color: C.dark }} />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1" style={{ color: C.dark }}>{t.name}</h3>
                      {t.description && <p className="text-sm opacity-60 mb-2 line-clamp-2">{t.description}</p>}
                      <div className="flex items-center justify-between">
                        <span className="font-bold" style={{ color: C.green }}>
                          {formatMoney(t.price_per_m2)} <span className="text-xs font-normal opacity-60">/ م²</span>
                        </span>
                        {t.stock_m2 !== null && (
                          <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#e8f5e9", color: C.green }}>
                            مخزون: {t.stock_m2} م²
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* STEP 1: القياسات */}
        {step === 1 && selectedTapis && (
          <section className="max-w-xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#e8f5e9" }}>
                <Ruler className="w-6 h-6" style={{ color: C.green }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: C.green }}>قياسات الزربية</h2>
                <p className="text-sm opacity-60">{selectedTapis.name}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: "#e5e5e5" }}>
                <label className="block font-bold mb-2" style={{ color: C.dark }}>الطول الداخلي (متر)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={calc.originalLength || ""}
                  onChange={(e) => setCalc({ ...calc, originalLength: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-lg border-2 text-lg outline-none transition-colors"
                  style={{ borderColor: calc.originalLength > 0 ? C.green : "#ddd" }}
                  placeholder="مثال: 3.50"
                />
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: "#e5e5e5" }}>
                <label className="block font-bold mb-2" style={{ color: C.dark }}>العرض الداخلي (متر)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={calc.originalWidth || ""}
                  onChange={(e) => setCalc({ ...calc, originalWidth: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-lg border-2 text-lg outline-none transition-colors"
                  style={{ borderColor: calc.originalWidth > 0 ? C.green : "#ddd" }}
                  placeholder="مثال: 2.80"
                />
              </div>

              {calc.originalLength > 0 && calc.originalWidth > 0 && (
                <div className="p-4 rounded-lg text-sm" style={{ background: "#e8f5e9", color: C.green }}>
                  <Info className="w-4 h-4 inline ml-1" />
                  المساحة الأصلية: {(calc.originalLength * calc.originalWidth).toFixed(2)} م²
                </div>
              )}
            </div>
          </section>
        )}

        {/* STEP 2: هامش القص */}
        {step === 2 && (
          <section className="max-w-xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#e8f5e9" }}>
                <Scissors className="w-6 h-6" style={{ color: C.green }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: C.green }}>هامش القص</h2>
                <p className="text-sm opacity-60">يُنصح بإضافة هامش للقص للحصول على نتيجة احترافية</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border mb-4" style={{ borderColor: "#e5e5e5" }}>
              <div className="p-4 rounded-lg mb-6" style={{ background: "#fff8e1", borderRight: `4px solid ${C.gold}` }}>
                <p className="font-bold mb-1" style={{ color: C.dark }}>💡 توصية</p>
                <p className="text-sm opacity-80">يُنصح بإضافة هامش قص قدره <strong>10 سم</strong> لكل بعد للحصول على نتيجة مثالية.</p>
              </div>

              <label className="block font-bold mb-3" style={{ color: C.dark }}>الهامش (سم)</label>
              <div className="flex gap-3 mb-4">
                {[0, 5, 10, 15, 20].map((m) => (
                  <button
                    key={m}
                    onClick={() => { setCalc({ ...calc, cutMarginCm: m }); setMarginConfirmed(true); }}
                    className="flex-1 py-3 rounded-lg border-2 font-bold transition-all"
                    style={{
                      borderColor: calc.cutMarginCm === m && marginConfirmed ? C.gold : "#ddd",
                      background: calc.cutMarginCm === m && marginConfirmed ? `${C.gold}15` : "#fff",
                      color: calc.cutMarginCm === m && marginConfirmed ? C.dark : "#666",
                    }}
                  >
                    {m === 0 ? "بدون" : `+${m} سم`}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm opacity-60">هامش مخصص:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={calc.cutMarginCm}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setCalc({ ...calc, cutMarginCm: val });
                    setMarginConfirmed(true);
                  }}
                  className="w-24 px-3 py-2 rounded-lg border-2 text-center"
                  style={{ borderColor: C.green }}
                />
                <span className="text-sm opacity-60">سم</span>
              </div>

              {marginConfirmed && (
                <div className="mt-6 p-4 rounded-lg" style={{ background: "#e8f5e9" }}>
                  <p className="font-bold mb-2" style={{ color: C.green }}>القياسات بعد إضافة الهامش:</p>
                  <div className="flex justify-between text-sm">
                    <span>الطول: <strong>{(calc.originalLength + calc.cutMarginCm / 100).toFixed(2)} م</strong></span>
                    <span>العرض: <strong>{(calc.originalWidth + calc.cutMarginCm / 100).toFixed(2)} م</strong></span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* STEP 3: نسبة الهدر */}
        {step === 3 && (
          <section className="max-w-xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#e8f5e9" }}>
                <Percent className="w-6 h-6" style={{ color: C.green }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: C.green }}>نسبة الهدر</h2>
                <p className="text-sm opacity-60">هل تريد إضافة نسبة هدر للتعويض عن الفاقد أثناء القص؟</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: "#e5e5e5" }}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {[
                  { label: "بدون هدر", val: 0 },
                  { label: "2%", val: 2 },
                  { label: "5%", val: 5 },
                  { label: "10%", val: 10 },
                  { label: "15%", val: 15 },
                  { label: "20%", val: 20 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => { setCalc({ ...calc, wastePercent: opt.val }); setWasteConfirmed(true); }}
                    className="py-3 rounded-lg border-2 font-bold transition-all"
                    style={{
                      borderColor: calc.wastePercent === opt.val && wasteConfirmed ? C.gold : "#ddd",
                      background: calc.wastePercent === opt.val && wasteConfirmed ? `${C.gold}15` : "#fff",
                      color: calc.wastePercent === opt.val && wasteConfirmed ? C.dark : "#666",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm opacity-60">نسبة مخصصة:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={calc.wastePercent}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setCalc({ ...calc, wastePercent: val });
                    setWasteConfirmed(true);
                  }}
                  className="w-24 px-3 py-2 rounded-lg border-2 text-center"
                  style={{ borderColor: C.green }}
                />
                <span className="text-sm opacity-60">%</span>
              </div>

              {wasteConfirmed && (
                <div className="p-4 rounded-lg" style={{ background: "#e8f5e9" }}>
                  <p className="text-sm">
                    <Info className="w-4 h-4 inline ml-1" />
                    المساحة بعد الهدر: <strong>{((calc.originalLength + calc.cutMarginCm / 100) * (calc.originalWidth + calc.cutMarginCm / 100) * (1 + calc.wastePercent / 100)).toFixed(3)} م²</strong>
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* STEP 4: التقريب */}
        {step === 4 && (
          <section className="max-w-xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#e8f5e9" }}>
                <Calculator className="w-6 h-6" style={{ color: C.green }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: C.green }}>التقريب</h2>
                <p className="text-sm opacity-60">هل تريد تقريب الكمية؟</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: "#e5e5e5" }}>
              <div className="p-4 rounded-lg mb-6 text-center" style={{ background: "#f5f5f5" }}>
                <p className="text-sm opacity-60 mb-1">المساحة الحالية (بدون تقريب)</p>
                <p className="text-3xl font-bold" style={{ color: C.green }}>
                  {((calc.originalLength + calc.cutMarginCm / 100) * (calc.originalWidth + calc.cutMarginCm / 100) * (1 + calc.wastePercent / 100)).toFixed(3)} <span className="text-lg">م²</span>
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { key: "none" as const, label: "بدون تقريب", desc: "احتفظ بالرقم كما هو" },
                  { key: "half" as const, label: "تقريب لأقرب 0.5 م²", desc: "مثال: 17.62 ← 18.0" },
                  { key: "one" as const, label: "تقريب لأقرب 1 م²", desc: "مثال: 17.62 ← 18" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setCalc({ ...calc, rounding: opt.key }); setRoundConfirmed(true); }}
                    className="w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all text-right"
                    style={{
                      borderColor: calc.rounding === opt.key && roundConfirmed ? C.gold : "#ddd",
                      background: calc.rounding === opt.key && roundConfirmed ? `${C.gold}15` : "#fff",
                    }}
                  >
                    <div>
                      <p className="font-bold" style={{ color: calc.rounding === opt.key && roundConfirmed ? C.dark : "#333" }}>{opt.label}</p>
                      <p className="text-xs opacity-60">{opt.desc}</p>
                    </div>
                    {calc.rounding === opt.key && roundConfirmed && (
                      <CheckCircle className="w-6 h-6" style={{ color: C.gold }} />
                    )}
                  </button>
                ))}
              </div>

              {roundConfirmed && (
                <div className="mt-6 p-4 rounded-lg text-center" style={{ background: "#e8f5e9" }}>
                  <p className="text-sm opacity-70">المساحة النهائية</p>
                  <p className="text-2xl font-bold" style={{ color: C.green }}>{finalArea.toFixed(2)} م²</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* STEP 5: مراجعة الحسابات الكاملة */}
        {step === 5 && selectedTapis && (
          <section className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#e8f5e9" }}>
                <Calculator className="w-6 h-6" style={{ color: C.green }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: C.green }}>ملخص الحساب</h2>
                <p className="text-sm opacity-60">راجع جميع القيم قبل المتابعة</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#e5e5e5" }}>
              {/* Product Header */}
              <div className="p-6 border-b flex items-center gap-4" style={{ borderColor: "#eee", background: C.cream }}>
                {selectedTapis.image_url ? (
                  <img src={selectedTapis.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ background: "#e8e4dc" }}>
                    <ImageIcon className="w-8 h-8 opacity-30" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg">{selectedTapis.name}</h3>
                  <p className="text-sm opacity-60">سعر المتر المربع: {formatMoney(selectedTapis.price_per_m2)}</p>
                </div>
              </div>

              {/* Details Table */}
              <div className="p-6">
                <table className="w-full">
                  <tbody className="divide-y" style={{ borderColor: "#f0f0f0" }}>
                    <tr>
                      <td className="py-3 text-sm opacity-60">القياسات الأصلية</td>
                      <td className="py-3 text-left font-bold">{calc.originalLength.toFixed(2)} م × {calc.originalWidth.toFixed(2)} م</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-sm opacity-60">هامش القص</td>
                      <td className="py-3 text-left font-bold">{calc.cutMarginCm === 0 ? "بدون" : `+${calc.cutMarginCm} سم لكل بعد`}</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-sm opacity-60">القياسات بعد الهامش</td>
                      <td className="py-3 text-left font-bold">{(calc.originalLength + calc.cutMarginCm / 100).toFixed(2)} م × {(calc.originalWidth + calc.cutMarginCm / 100).toFixed(2)} م</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-sm opacity-60">المساحة</td>
                      <td className="py-3 text-left font-bold">{((calc.originalLength + calc.cutMarginCm / 100) * (calc.originalWidth + calc.cutMarginCm / 100)).toFixed(3)} م²</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-sm opacity-60">نسبة الهدر</td>
                      <td className="py-3 text-left font-bold">{calc.wastePercent === 0 ? "بدون" : `${calc.wastePercent}%`}</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-sm opacity-60">نوع التقريب</td>
                      <td className="py-3 text-left font-bold">
                        {calc.rounding === "none" && "بدون تقريب"}
                        {calc.rounding === "half" && "أقرب 0.5 م²"}
                        {calc.rounding === "one" && "أقرب 1 م²"}
                      </td>
                    </tr>
                    <tr style={{ background: "#f9f9f9" }}>
                      <td className="py-3 text-sm font-bold" style={{ color: C.green }}>المساحة النهائية</td>
                      <td className="py-3 text-left font-bold text-lg" style={{ color: C.green }}>{finalArea.toFixed(2)} م²</td>
                    </tr>
                    <tr className="border-t-2" style={{ borderColor: C.gold }}>
                      <td className="py-4 text-lg font-bold" style={{ color: C.dark }}>السعر النهائي</td>
                      <td className="py-4 text-left text-2xl font-bold" style={{ color: C.gold }}>{formatMoney(totalPrice)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* STEP 6: بيانات الزبون + التسبيق */}
        {step === 6 && (
          <section className="max-w-xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#e8f5e9" }}>
                <User className="w-6 h-6" style={{ color: C.green }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: C.green }}>بيانات الزبون</h2>
                <p className="text-sm opacity-60">أدخل بيانات الزبون ونسبة التسبيق</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border mb-6" style={{ borderColor: "#e5e5e5" }}>
              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-2 text-sm" style={{ color: C.dark }}>الاسم الكامل *</label>
                  <div className="relative">
                    <User className="absolute right-3 top-3 w-5 h-5 opacity-30" />
                    <input
                      type="text"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      className="w-full pr-10 px-4 py-3 rounded-lg border-2 outline-none transition-colors"
                      style={{ borderColor: customer.name.length >= 2 ? C.green : "#ddd" }}
                      placeholder="اسم الزبون"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-2 text-sm" style={{ color: C.dark }}>رقم الهاتف *</label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-3 w-5 h-5 opacity-30" />
                    <input
                      type="tel"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full pr-10 px-4 py-3 rounded-lg border-2 outline-none transition-colors"
                      style={{ borderColor: customer.phone.length >= 8 ? C.green : "#ddd" }}
                      placeholder="06XXXXXXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-2 text-sm" style={{ color: C.dark }}>موعد التسليم (اختياري)</label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-3 w-5 h-5 opacity-30" />
                    <input
                      type="date"
                      value={customer.deliveryDate}
                      onChange={(e) => setCustomer({ ...customer, deliveryDate: e.target.value })}
                      className="w-full pr-10 px-4 py-3 rounded-lg border-2 outline-none"
                      style={{ borderColor: "#ddd" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Deposit */}
            <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: "#e5e5e5" }}>
              <h3 className="font-bold mb-4" style={{ color: C.dark }}>التسبيق</h3>
              <div className="flex gap-3 mb-4">
                {[0, 30, 50, 100].map((p) => (
                  <button
                    key={p}
                    onClick={() => setDepositPercent(p)}
                    className="flex-1 py-2 rounded-lg border-2 font-bold transition-all text-sm"
                    style={{
                      borderColor: depositPercent === p ? C.gold : "#ddd",
                      background: depositPercent === p ? `${C.gold}15` : "#fff",
                      color: depositPercent === p ? C.dark : "#666",
                    }}
                  >
                    {p === 0 ? "بدون" : `${p}%`}
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-lg" style={{ background: C.cream }}>
                <div className="flex justify-between mb-2">
                  <span className="opacity-70">المجموع:</span>
                  <span className="font-bold">{formatMoney(totalPrice)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="opacity-70">التسبيق ({depositPercent}%):</span>
                  <span className="font-bold" style={{ color: C.green }}>{formatMoney(depositAmount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t" style={{ borderColor: "#ddd" }}>
                  <span className="font-bold">الباقي:</span>
                  <span className="font-bold" style={{ color: C.red }}>{formatMoney(remaining)}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* STEP 7: تأكيد + فاتورة */}
        {step === 7 && orderComplete && orderId && (
          <section className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#e8f5e9" }}>
                <CheckCircle className="w-10 h-10" style={{ color: C.green }} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: C.green }}>تم إنشاء الطلبية بنجاح!</h2>
              <p className="opacity-60">رقم الطلبية: <strong>{orderId.slice(0, 8).toUpperCase()}</strong></p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-white transition-all hover:opacity-90"
                style={{ background: C.green }}
              >
                <Printer className="w-5 h-5" />
                طباعة الفاتورة
              </button>
              <button
                onClick={resetAll}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold border-2 transition-all"
                style={{ borderColor: C.gold, color: C.dark, background: "#fff" }}
              >
                <Save className="w-5 h-5" />
                طلبية جديدة
              </button>
            </div>

            {/* Hidden Invoice Template for Print */}
            <div ref={printRef} className="hidden">
              <div className="header">
                <h1>🕌 Ameublement et Déco El Mahboubi</h1>
                <p>الحنصالي، بني ملال</p>
                <p className="gold">فاتورة زربية — رقم: {orderId?.slice(0, 8).toUpperCase()}</p>
              </div>

              <div className="section">
                <div className="section-title">بيانات الزبون</div>
                <p><strong>الاسم:</strong> {customer.name}</p>
                <p><strong>الهاتف:</strong> {customer.phone}</p>
                {customer.deliveryDate && <p><strong>موعد التسليم:</strong> {formatDate(customer.deliveryDate)}</p>}
              </div>

              <div className="section">
                <div className="section-title">تفاصيل الزربية</div>
                <p><strong>النوع:</strong> {selectedTapis?.name}</p>
                <p><strong>سعر المتر المربع:</strong> {selectedTapis ? formatMoney(selectedTapis.price_per_m2) : ""}</p>
              </div>

              <div className="section">
                <div className="section-title">الحسابات</div>
                <table>
                  <tbody>
                    <tr><td>القياسات الأصلية</td><td>{calc.originalLength.toFixed(2)} م × {calc.originalWidth.toFixed(2)} م</td></tr>
                    <tr><td>هامش القص</td><td>{calc.cutMarginCm === 0 ? "بدون" : `+${calc.cutMarginCm} سم`}</td></tr>
                    <tr><td>القياسات النهائية</td><td>{(calc.originalLength + calc.cutMarginCm / 100).toFixed(2)} م × {(calc.originalWidth + calc.cutMarginCm / 100).toFixed(2)} م</td></tr>
                    <tr><td>المساحة</td><td>{((calc.originalLength + calc.cutMarginCm / 100) * (calc.originalWidth + calc.cutMarginCm / 100)).toFixed(3)} م²</td></tr>
                    <tr><td>نسبة الهدر</td><td>{calc.wastePercent === 0 ? "بدون" : `${calc.wastePercent}%`}</td></tr>
                    <tr><td>نوع التقريب</td><td>{calc.rounding === "none" ? "بدون" : calc.rounding === "half" ? "أقرب 0.5 م²" : "أقرب 1 م²"}</td></tr>
                    <tr><td><strong>المساحة النهائية</strong></td><td><strong>{finalArea.toFixed(2)} م²</strong></td></tr>
                    <tr className="total-row"><td>السعر النهائي</td><td>{formatMoney(totalPrice)}</td></tr>
                    <tr><td>التسبيق ({depositPercent}%)</td><td>{formatMoney(depositAmount)}</td></tr>
                    <tr><td><strong>الباقي</strong></td><td><strong>{formatMoney(remaining)}</strong></td></tr>
                  </tbody>
                </table>
              </div>

              <div className="footer">
                <p>تم إنشاء هذه الفاتورة إلكترونياً — {new Date().toLocaleDateString("ar-MA")}</p>
                <p className="gold">شكراً لثقتكم بنا 🙏</p>
              </div>
            </div>

            {/* On-Screen Summary */}
            <div className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: "#e5e5e5" }}>
              <h3 className="font-bold mb-4 text-lg" style={{ color: C.dark }}>ملخص الطلبية</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="opacity-60">الزبون:</span><span className="font-bold">{customer.name}</span></div>
                <div className="flex justify-between"><span className="opacity-60">الهاتف:</span><span className="font-bold">{customer.phone}</span></div>
                <div className="flex justify-between"><span className="opacity-60">الزربية:</span><span className="font-bold">{selectedTapis?.name}</span></div>
                <div className="flex justify-between"><span className="opacity-60">المساحة النهائية:</span><span className="font-bold">{finalArea.toFixed(2)} م²</span></div>
                <div className="flex justify-between pt-2 border-t" style={{ borderColor: "#eee" }}>
                  <span className="font-bold">المجموع:</span>
                  <span className="font-bold text-lg" style={{ color: C.gold }}>{formatMoney(totalPrice)}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Navigation Buttons */}
        {step < 7 && (
          <div className="max-w-xl mx-auto mt-8 flex gap-3">
            {step > 0 && (
              <button
                onClick={prevStep}
                className="px-6 py-3 rounded-lg font-bold border-2 flex items-center gap-2 transition-all hover:bg-gray-50"
                style={{ borderColor: "#ddd", color: "#666" }}
              >
                <ArrowRight className="w-5 h-5" />
                السابق
              </button>
            )}
            <div className="flex-1" />
            {step < 6 ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="px-8 py-3 rounded-lg font-bold text-white flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: canProceed() ? C.green : "#ccc" }}
              >
                التالي
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className="px-8 py-3 rounded-lg font-bold text-white flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: canProceed() && !submitting ? C.gold : "#ccc", color: C.dark }}
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: C.dark, borderTopColor: "transparent" }} />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    إرسال الطلبية
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}