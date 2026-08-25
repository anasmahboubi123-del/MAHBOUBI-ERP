"use client";

// ============================================================
// El Mahboubi Salon ERP — Tapis (Carpet) Seller Flow (Cart Mode)
// تدفق البائع لطلبات الزرابي — يُرسل للسلة المشتركة
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// ← FIXED: use OrderCartContext instead of OrderContext
import { useOrderCart } from "@/contexts/OrderCartContext";
import Head from "next/head";
import {
  ArrowRight, ArrowLeft, Ruler, Scissors, Percent,
  Calculator, CheckCircle, ImageIcon, Info,
  ShoppingCart, AlertCircle
} from "lucide-react";
import { fetchTapis } from "@/lib/supabase-tapis";
import type { Tapis } from "@/lib/supabase-tapis";
const C = {
  green: "#1B5E38",
  greenLight: "#2E7D52",
  gold: "#C9A84C",
  cream: "#F5F0E8",
  dark: "#0D1F17",
  white: "#FFFFFF",
  red: "#C0392B",
};

interface CalculationState {
  originalLength: number;
  originalWidth: number;
  cutMarginCm: number;
  wastePercent: number;
  rounding: "none" | "half" | "one";
}

function calcFinalArea(calc: CalculationState): number {
  const finalLength = calc.originalLength + calc.cutMarginCm / 100;
  const finalWidth = calc.originalWidth + calc.cutMarginCm / 100;
  let area = finalLength * finalWidth;
  area = area * (1 + calc.wastePercent / 100);
  if (calc.rounding === "half") area = Math.ceil(area * 2) / 2;
  else if (calc.rounding === "one") area = Math.ceil(area);
  return area;
}

function formatMoney(n: number) {
  return n.toLocaleString("ar-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " د.م";
}

// ════════════════════════════════════════════════════════════
// Local builder aligned to ProductResult expected by useOrderCart
// ════════════════════════════════════════════════════════════
function buildTapisCartItem({
  selectedTapis,
  calc,
  finalArea,
  notes,
}: {
  selectedTapis: Tapis;
  calc: CalculationState;
  finalArea: number;
  notes: string;
}) {
  const totalPrice = finalArea * selectedTapis.price_per_m2;

  return {
    id: `tapis-${selectedTapis.id}-${Date.now()}`,
    productType: "tapis" as const,          // ← FIXED: literal type so it matches ProductType
    productName: selectedTapis.name,
    unitPrice: selectedTapis.price_per_m2,
    quantity: finalArea,
    totalPrice,
    thumbnailUrl: selectedTapis.image_url ?? "",
    notes,
    addedAt: new Date().toISOString(),
    calculations: {
      subtotal: totalPrice,          // ← FIXED: required by ProductResult
      originalLength: calc.originalLength,
      originalWidth: calc.originalWidth,
      cutMarginCm: calc.cutMarginCm,
      wastePercent: calc.wastePercent,
      rounding: calc.rounding,
      finalArea,
    },
    details: {
      productId: selectedTapis.id,
      originalLength: calc.originalLength,
      originalWidth: calc.originalWidth,
      cutMarginCm: calc.cutMarginCm,
      wastePercent: calc.wastePercent,
      rounding: calc.rounding,
      finalArea,
    },
  };
}

export default function TapisOrderFlow() {
  const router = useRouter();
  // ← FIXED: use useOrderCart instead of useOrder
  const { addToCart } = useOrderCart();
  const [tapisList, setTapisList] = useState<Tapis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTapis, setSelectedTapis] = useState<Tapis | null>(null);
  const [step, setStep] = useState(0);
  const [calc, setCalc] = useState<CalculationState>({
    originalLength: 0, originalWidth: 0, cutMarginCm: 10, wastePercent: 0, rounding: "none",
  });
  const [marginConfirmed, setMarginConfirmed] = useState(false);
  const [wasteConfirmed, setWasteConfirmed] = useState(false);
  const [roundConfirmed, setRoundConfirmed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTapis()
      .then(setTapisList)
      .catch(() => setError("تعذر تحميل الزرابي من السيرفر"))
      .finally(() => setLoading(false));
  }, []);

  const finalArea = calcFinalArea(calc);
  const totalPrice = selectedTapis ? finalArea * selectedTapis.price_per_m2 : 0;

  const canProceed = () => {
    switch (step) {
      case 0: return !!selectedTapis;
      case 1: return calc.originalLength > 0 && calc.originalWidth > 0;
      case 2: return marginConfirmed;
      case 3: return wasteConfirmed;
      case 4: return roundConfirmed;
      case 5: return true;
      default: return true;
    }
  };

  const nextStep = () => { if (canProceed() && step < 5) { setStep(s => s + 1); setError(""); } };
  const prevStep = () => { if (step > 0) { setStep(s => s - 1); setError(""); } };

  const handleAddToCart = () => {
    if (!selectedTapis) return;

    const cartItem = buildTapisCartItem({
      selectedTapis,
      calc,
      finalArea,
      notes: '',
    });

    addToCart(cartItem);
    resetAll();
    router.push('/seller/order-center');
  };

  const resetAll = () => {
    setStep(0); setSelectedTapis(null);
    setCalc({ originalLength: 0, originalWidth: 0, cutMarginCm: 10, wastePercent: 0, rounding: "none" });
    setMarginConfirmed(false); setWasteConfirmed(false); setRoundConfirmed(false); setError("");
  };

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: C.cream }}>
      <Head><title>طلبية زربية — El Mahboubi</title></Head>
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
          <div className="text-sm" style={{ color: C.cream }}>الخطوة {step + 1} / 6</div>
        </div>
        <div className="h-1 w-full" style={{ background: "#1a3c2a" }}>
          <div className="h-full transition-all duration-500" style={{ width: `${((step + 1) / 6) * 100}%`, background: C.gold }} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg text-white text-center" style={{ background: C.red }}>{error}</div>
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
                  <button key={t.id} onClick={() => setSelectedTapis(t)}
                    className="relative rounded-xl overflow-hidden border-2 transition-all hover:shadow-xl text-right"
                    style={{
                      borderColor: selectedTapis?.id === t.id ? C.gold : "transparent",
                      background: "#fff",
                      boxShadow: selectedTapis?.id === t.id ? `0 0 0 3px ${C.gold}40` : "0 1px 3px rgba(0,0,0,0.1)",
                    }}>
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
                <input type="number" step="0.01" min="0.1"
                  value={calc.originalLength || ""}
                  onChange={(e) => setCalc({ ...calc, originalLength: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-lg border-2 text-lg outline-none transition-colors"
                  style={{ borderColor: calc.originalLength > 0 ? C.green : "#ddd" }}
                  placeholder="مثال: 3.50" />
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: "#e5e5e5" }}>
                <label className="block font-bold mb-2" style={{ color: C.dark }}>العرض الداخلي (متر)</label>
                <input type="number" step="0.01" min="0.1"
                  value={calc.originalWidth || ""}
                  onChange={(e) => setCalc({ ...calc, originalWidth: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-lg border-2 text-lg outline-none transition-colors"
                  style={{ borderColor: calc.originalWidth > 0 ? C.green : "#ddd" }}
                  placeholder="مثال: 2.80" />
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
                <p className="text-sm opacity-80">يُنصح بإضافة هامش قص قدره <strong>10 سم</strong> لكل بعد.</p>
              </div>
              <label className="block font-bold mb-3" style={{ color: C.dark }}>الهامش (سم)</label>
              <div className="flex gap-3 mb-4">
                {[0, 5, 10, 15, 20].map((m) => (
                  <button key={m} onClick={() => { setCalc({ ...calc, cutMarginCm: m }); setMarginConfirmed(true); }}
                    className="flex-1 py-3 rounded-lg border-2 font-bold transition-all"
                    style={{
                      borderColor: calc.cutMarginCm === m && marginConfirmed ? C.gold : "#ddd",
                      background: calc.cutMarginCm === m && marginConfirmed ? `${C.gold}15` : "#fff",
                      color: calc.cutMarginCm === m && marginConfirmed ? C.dark : "#666",
                    }}>
                    {m === 0 ? "بدون" : `+${m} سم`}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm opacity-60">هامش مخصص:</span>
                <input type="number" min="0" max="100" value={calc.cutMarginCm}
                  onChange={(e) => { const val = parseInt(e.target.value) || 0; setCalc({ ...calc, cutMarginCm: val }); setMarginConfirmed(true); }}
                  className="w-24 px-3 py-2 rounded-lg border-2 text-center" style={{ borderColor: C.green }} />
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
                {[{ label: "بدون هدر", val: 0 }, { label: "2%", val: 2 }, { label: "5%", val: 5 },
                  { label: "10%", val: 10 }, { label: "15%", val: 15 }, { label: "20%", val: 20 }].map((opt) => (
                  <button key={opt.val} onClick={() => { setCalc({ ...calc, wastePercent: opt.val }); setWasteConfirmed(true); }}
                    className="py-3 rounded-lg border-2 font-bold transition-all"
                    style={{
                      borderColor: calc.wastePercent === opt.val && wasteConfirmed ? C.gold : "#ddd",
                      background: calc.wastePercent === opt.val && wasteConfirmed ? `${C.gold}15` : "#fff",
                      color: calc.wastePercent === opt.val && wasteConfirmed ? C.dark : "#666",
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm opacity-60">نسبة مخصصة:</span>
                <input type="number" min="0" max="100" value={calc.wastePercent}
                  onChange={(e) => { const val = parseFloat(e.target.value) || 0; setCalc({ ...calc, wastePercent: val }); setWasteConfirmed(true); }}
                  className="w-24 px-3 py-2 rounded-lg border-2 text-center" style={{ borderColor: C.green }} />
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
                {[{ key: "none" as const, label: "بدون تقريب", desc: "احتفظ بالرقم كما هو" },
                  { key: "half" as const, label: "تقريب لأقرب 0.5 م²", desc: "مثال: 17.62 ← 18.0" },
                  { key: "one" as const, label: "تقريب لأقرب 1 م²", desc: "مثال: 17.62 ← 18" }].map((opt) => (
                  <button key={opt.key} onClick={() => { setCalc({ ...calc, rounding: opt.key }); setRoundConfirmed(true); }}
                    className="w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all text-right"
                    style={{
                      borderColor: calc.rounding === opt.key && roundConfirmed ? C.gold : "#ddd",
                      background: calc.rounding === opt.key && roundConfirmed ? `${C.gold}15` : "#fff",
                    }}>
                    <div>
                      <p className="font-bold" style={{ color: calc.rounding === opt.key && roundConfirmed ? C.dark : "#333" }}>{opt.label}</p>
                      <p className="text-xs opacity-60">{opt.desc}</p>
                    </div>
                    {calc.rounding === opt.key && roundConfirmed && <CheckCircle className="w-6 h-6" style={{ color: C.gold }} />}
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
                <p className="text-sm opacity-60">راجع جميع القيم قبل إضافتها للسلة</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: "#e5e5e5" }}>
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
              <div className="p-6">
                <table className="w-full">
                  <tbody className="divide-y" style={{ borderColor: "#f0f0f0" }}>
                    <tr><td className="py-3 text-sm opacity-60">القياسات الأصلية</td>
                      <td className="py-3 text-left font-bold">{calc.originalLength.toFixed(2)} م × {calc.originalWidth.toFixed(2)} م</td></tr>
                    <tr><td className="py-3 text-sm opacity-60">هامش القص</td>
                      <td className="py-3 text-left font-bold">{calc.cutMarginCm === 0 ? "بدون" : `+${calc.cutMarginCm} سم لكل بعد`}</td></tr>
                    <tr><td className="py-3 text-sm opacity-60">القياسات بعد الهامش</td>
                      <td className="py-3 text-left font-bold">{(calc.originalLength + calc.cutMarginCm / 100).toFixed(2)} م × {(calc.originalWidth + calc.cutMarginCm / 100).toFixed(2)} م</td></tr>
                    <tr><td className="py-3 text-sm opacity-60">المساحة</td>
                      <td className="py-3 text-left font-bold">{((calc.originalLength + calc.cutMarginCm / 100) * (calc.originalWidth + calc.cutMarginCm / 100)).toFixed(3)} م²</td></tr>
                    <tr><td className="py-3 text-sm opacity-60">نسبة الهدر</td>
                      <td className="py-3 text-left font-bold">{calc.wastePercent === 0 ? "بدون" : `${calc.wastePercent}%`}</td></tr>
                    <tr><td className="py-3 text-sm opacity-60">نوع التقريب</td>
                      <td className="py-3 text-left font-bold">
                        {calc.rounding === "none" && "بدون تقريب"}
                        {calc.rounding === "half" && "أقرب 0.5 م²"}
                        {calc.rounding === "one" && "أقرب 1 م²"}
                      </td></tr>
                    <tr style={{ background: "#f9f9f9" }}>
                      <td className="py-3 text-sm font-bold" style={{ color: C.green }}>المساحة النهائية</td>
                      <td className="py-3 text-left font-bold text-lg" style={{ color: C.green }}>{finalArea.toFixed(2)} م²</td></tr>
                    <tr className="border-t-2" style={{ borderColor: C.gold }}>
                      <td className="py-4 text-lg font-bold" style={{ color: C.dark }}>السعر النهائي</td>
                      <td className="py-4 text-left text-2xl font-bold" style={{ color: C.gold }}>{formatMoney(totalPrice)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Navigation Buttons */}
        <div className="max-w-xl mx-auto mt-8 flex gap-3">
          {step > 0 && (
            <button onClick={prevStep}
              className="px-6 py-3 rounded-lg font-bold border-2 flex items-center gap-2 transition-all hover:bg-gray-50"
              style={{ borderColor: "#ddd", color: "#666" }}>
              <ArrowRight className="w-5 h-5" />
              السابق
            </button>
          )}
          <div className="flex-1" />
          {step < 5 ? (
            <button onClick={nextStep} disabled={!canProceed()}
              className="px-8 py-3 rounded-lg font-bold text-white flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: canProceed() ? C.green : "#ccc" }}>
              التالي
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={handleAddToCart} disabled={!canProceed()}
              className="px-8 py-3 rounded-lg font-bold text-white flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: canProceed() ? C.gold : "#ccc", color: C.dark }}>
              <ShoppingCart className="w-5 h-5" />
              أضف للسلة
            </button>
          )}
        </div>
      </main>
    </div>
  );
}