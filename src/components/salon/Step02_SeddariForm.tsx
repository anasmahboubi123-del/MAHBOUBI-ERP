"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Plus, Trash2, Ruler, RotateCcw, Lock, Sparkles } from "lucide-react";
import { OrderDraft, Seddari } from "@/lib/types";
import PinLock from "@/components/ui/PinLock";

interface Step02Props {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

type SeddariEntry = Seddari & {
  type: "normal" | "formaja";
  hasFormaja: boolean;
};

export default function Step02_SeddariForm({ draft, onChange, onNext, onBack }: Step02Props) {
  const [seddars, setSeddars] = useState<SeddariEntry[]>(
    draft.seddars.length > 0 ? (draft.seddars as unknown as SeddariEntry[]) : []
  );
  const [editFabricOpen, setEditFabricOpen] = useState(false);
  const [fabricAdminOk, setFabricAdminOk] = useState(false);
  const [manualFabricTotal, setManualFabricTotal] = useState("");

  // تتبع السدادر التي تستخدم ارتفاع مخصص
  const [customHeights, setCustomHeights] = useState<Record<string, boolean>>({});

  /* ── حساب استهلاك الثوب التلقائي للسداري العادي ── */
  const calcAutoFabric = (s: SeddariEntry): number => {
    // استهلاك الثوب = الطول + (2 × الارتفاع)
    const base = s.length + (2 * s.height);
    return Math.ceil(base);
  };

  /* ── إضافة سداري عادي جديد ── */
  const handleAddNormal = () => {
    const newSeddari: SeddariEntry = {
      id: `sd-${Date.now()}`,
      type: "normal",
      length: 0,           // ← فارغ — يجب على البائع إدخاله
      width: 70,
      height: 30,
      fabricConsumption: 0,
      hasFormaja: false,
    };
    // لا نحسب الاستهلاك إلا بعد إدخال الطول
    const updated = [...seddars, newSeddari];
    setSeddars(updated);
    syncToDraft(updated, draft.seddarsFabricTotalOverride);
  };

  /* ── إضافة فورمجة جديدة ── */
  const handleAddFormaja = () => {
    const newFormaja: SeddariEntry = {
      id: `fm-${Date.now()}`,
      type: "formaja",
      length: 0,
      width: 0,
      height: 0,
      fabricConsumption: 250, // افتراضي 250 سم
      hasFormaja: true,
      shape: "square",        // ← الشكل يخص الفورمجة فقط
    };
    const updated = [...seddars, newFormaja];
    setSeddars(updated);
    syncToDraft(updated, draft.seddarsFabricTotalOverride);
  };

  /* ── تحديث سداري ── */
  const handleUpdate = (id: string, patch: Partial<SeddariEntry>) => {
    const updated = seddars.map((s) => {
      if (s.id !== id) return s;
      const next = { ...s, ...patch } as SeddariEntry;
      // إذا كان سداري عادي وتم تغيير الأبعاد → إعادة حساب
      if (next.type === "normal" && ("length" in patch || "height" in patch)) {
        if (next.length > 0 && next.height > 0) {
          next.fabricConsumption = calcAutoFabric(next);
        }
      }
      return next;
    });
    setSeddars(updated);
    syncToDraft(updated, draft.seddarsFabricTotalOverride);
  };

  /* ── حذف سداري ── */
  const handleDelete = (id: string) => {
    const updated = seddars.filter((s) => s.id !== id);
    setSeddars(updated);
    // نظف حالة الارتفاع المخصص
    setCustomHeights(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    syncToDraft(updated, draft.seddarsFabricTotalOverride);
  };

  /* ── مزامنة مع الطلبية ── */
  const syncToDraft = (list: Seddari[], override: number | null) => {
    const computedTotal = list.reduce((sum, s) => sum + s.fabricConsumption, 0);
    const fabricTotal = override ?? computedTotal;

    onChange({
      seddars: list,
      seddarsFabricTotalOverride: override,
      stageTotals: {
        ...draft.stageTotals,
        fabric: fabricTotal,
        seddars: list.filter((s) => ("type" in s && s.type === "normal")).length,
      },
    });
  };

  /* ── تعديل المجموع بكود المدير ── */
  const handleSaveFabricTotal = () => {
    const val = Number(manualFabricTotal);
    if (val >= 0) {
      syncToDraft(seddars, val);
      setEditFabricOpen(false);
      setFabricAdminOk(false);
    }
  };

  /* ── حسابات ── */
  const computedFabricTotal = seddars.reduce((sum, s) => sum + s.fabricConsumption, 0);
  const displayFabricTotal = draft.seddarsFabricTotalOverride ?? computedFabricTotal;
  const fabricInMeters = (displayFabricTotal / 100).toFixed(2);
  const fabricCost = draft.fabric ? (displayFabricTotal / 100) * draft.fabric.price_per_meter : 0;

  const normalCount = seddars.filter((s) => ("type" in s && s.type === "normal")).length;
  const formajaCount = seddars.filter((s) => ("type" in s && s.type === "formaja")).length;

  // التحقق: كل سداري عادي يجب أن يكون طوله > 0 وارتفاعه > 0
  const canProceed = normalCount > 0 && seddars.every((s) => {
    if (s.type === "normal") {
      return s.length > 0 && s.width > 0 && s.height > 0 && s.fabricConsumption > 0;
    }
    return s.fabricConsumption > 0;
  });

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="sticky top-0 z-30 border-b border-[#1B5E3B]/10 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <button onClick={onBack} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
            <ArrowRight className="h-4 w-4" /> رجوع
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#0D1F17] md:text-2xl">🛋️ السدادر</h1>
            <p className="mt-0.5 text-sm text-gray-500">الخطوة 2 من 7 — أدخل أبعاد كل سداري</p>
          </div>
          <button onClick={onNext} disabled={!canProceed} className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${canProceed ? "bg-[#1B5E3B] text-white hover:bg-[#144d30] shadow-lg shadow-[#1B5E3B]/20" : "cursor-not-allowed bg-gray-200 text-gray-400"}`}>
            التالي <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* أزرار الإضافة */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <button onClick={handleAddNormal} className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#1B5E3B]/30 bg-white py-4 text-[#1B5E3B] transition hover:border-[#1B5E3B] hover:bg-[#F5F0E8]">
            <Plus className="h-5 w-5" /><span className="font-bold">إضافة سداري جديد</span>
          </button>
          <button onClick={handleAddFormaja} className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#C9A84C]/40 bg-white py-4 text-[#C9A84C] transition hover:border-[#C9A84C] hover:bg-[#C9A84C]/5">
            <Sparkles className="h-5 w-5" /><span className="font-bold">إضافة فورمجة</span>
          </button>
        </div>

        {seddars.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <Ruler className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-600">لا توجد سدادر بعد — اضغط "إضافة سداري جديد"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {seddars.map((s, idx) => (
              <div key={s.id} className={`rounded-2xl border p-5 shadow-sm ${s.type === "formaja" ? "border-[#C9A84C]/40 bg-[#C9A84C]/5" : "border-gray-200 bg-white"}`}>
                {/* عنوان مختلف حسب النوع */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {s.type === "formaja" ? (
                      <>
                        <Sparkles className="h-5 w-5 text-[#C9A84C]" />
                        <h3 className="text-lg font-bold text-[#C9A84C]">فورمجة {formajaCount > 1 ? seddars.filter((x, i) => x.type === "formaja" && i <= idx).length : ""}</h3>
                      </>
                    ) : (
                      <h3 className="text-lg font-bold text-[#0D1F17]">سداري {seddars.filter((x, i) => x.type === "normal" && i <= idx).length}</h3>
                    )}
                  </div>
                  <button onClick={() => handleDelete(s.id)} className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition">
                    <Trash2 className="h-3.5 w-3.5" /> حذف
                  </button>
                </div>

                {/* محتوى مختلف حسب النوع */}
                {s.type === "normal" ? (
                  /* ── سداري عادي ── لا يوجد حقل شكل هنا */
                  <>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-600">الطول (سم)</label>
                        <input 
                          type="number" 
                          min={1} 
                          value={s.length || ""} 
                          onChange={(e) => handleUpdate(s.id, { length: Number(e.target.value) })} 
                          className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-center font-bold text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none" 
                          placeholder="أدخل الطول"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-600">العرض (سم)</label>
                        <input type="number" min={1} value={s.width} onChange={(e) => handleUpdate(s.id, { width: Number(e.target.value) })} className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-center font-bold text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-600">الارتفاع (سم)</label>
                        {!customHeights[s.id] ? (
                          <select 
                            value={s.height} 
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (val === -1) {
                                setCustomHeights(prev => ({ ...prev, [s.id]: true }));
                              } else {
                                handleUpdate(s.id, { height: val });
                              }
                            }} 
                            className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-center font-bold text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none"
                          >
                            <option value={30}>30</option>
                            <option value={50}>50</option>
                            <option value={70}>70</option>
                            <option value={-1}>أخرى...</option>
                          </select>
                        ) : (
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              min={1} 
                              value={s.height || ""} 
                              onChange={(e) => handleUpdate(s.id, { height: Number(e.target.value) })} 
                              className="w-full rounded-xl border-2 border-[#C9A84C] px-3 py-2.5 text-center font-bold text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none" 
                              placeholder="ادخل الارتفاع"
                            />
                            <button 
                              onClick={() => {
                                setCustomHeights(prev => ({ ...prev, [s.id]: false }));
                                handleUpdate(s.id, { height: 30 });
                              }}
                              className="rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-500 hover:bg-gray-50 whitespace-nowrap"
                            >
                              إلغاء
                            </button>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-600">استهلاك الثوب (سم)</label>
                        <input type="number" min={0} value={s.fabricConsumption} onChange={(e) => handleUpdate(s.id, { fabricConsumption: Number(e.target.value) })} className="w-full rounded-xl border-2 border-[#C9A84C] px-3 py-2.5 text-center font-bold text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 w-fit">
                      <span className="font-mono">{s.length || 0} + (2×{s.height}) = </span>
                      <span className="font-bold text-[#1B5E3B]">{s.fabricConsumption} سم</span>
                    </div>
                  </>
                ) : (
                  /* ── فورمجة منفصلة ── هنا يوجد حقل الشكل */
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      <div className="md:col-span-2">
                        <label className="mb-1.5 block text-xs font-semibold text-[#C9A84C]">الشكل</label>
                        <div className="flex gap-2">
                          <select 
                            value={s.shape === 'custom' ? 'custom' : (s.shape || 'square')} 
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'custom') {
                                handleUpdate(s.id, { shape: 'custom', shapeCustom: '' });
                              } else {
                                handleUpdate(s.id, { shape: val, shapeCustom: undefined });
                              }
                            }}
                            className="w-full rounded-xl border-2 border-[#C9A84C] px-3 py-2.5 text-center font-bold text-[#0D1F17] focus:border-[#C9A84C] focus:outline-none"
                          >
                            <option value="square">⬜ مربع</option>
                            <option value="triangle">🔺 مثلث</option>
                            <option value="custom">✏️ أخرى...</option>
                          </select>
                          {s.shape === 'custom' && (
                            <input 
                              type="text" 
                              value={s.shapeCustom || ''} 
                              onChange={(e) => handleUpdate(s.id, { shapeCustom: e.target.value })}
                              placeholder="مثال: L، دائري..."
                              className="w-full rounded-xl border-2 border-[#C9A84C] px-3 py-2.5 text-center text-sm font-bold text-[#0D1F17] focus:border-[#C9A84C] focus:outline-none"
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-[#C9A84C]">استهلاك الثوب (سم)</label>
                        <input 
                          type="number" 
                          min={0} 
                          value={s.fabricConsumption} 
                          onChange={(e) => handleUpdate(s.id, { fabricConsumption: Number(e.target.value) })} 
                          className="w-full rounded-xl border-2 border-[#C9A84C] px-3 py-2.5 text-center font-bold text-[#0D1F17] focus:border-[#C9A84C] focus:outline-none" 
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">افتراضي: 250 سم — قابل للتعديل</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {seddars.length > 0 && (
          <div className="mt-6 rounded-2xl border-2 border-[#C9A84C] bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">مجموع استهلاك الثوب</p>
                <p className="mt-1 text-3xl font-extrabold text-[#1B5E3B]">{displayFabricTotal.toLocaleString("fr-MA")} سم</p>
                <p className="text-sm text-gray-400">= {fabricInMeters} متر</p>
                {draft.fabric && <p className="mt-1 text-sm font-bold text-[#C9A84C]">≈ {fabricCost.toLocaleString("fr-MA")} DH (ثمن الثوب)</p>}
                {draft.seddarsFabricTotalOverride !== null && <p className="mt-1 text-xs text-amber-600">⚠️ مُعدّل يدوياً بالمدير</p>}
              </div>
              <button onClick={() => { setManualFabricTotal(String(displayFabricTotal)); setEditFabricOpen(true); setFabricAdminOk(false); }} className="flex items-center gap-2 rounded-xl bg-[#F5F0E8] border border-[#C9A84C] px-4 py-2.5 text-sm font-bold text-[#C9A84C] hover:bg-[#C9A84C]/10 transition">
                <Lock className="h-4 w-4" /> تعديل (كود المدير)
              </button>
            </div>
          </div>
        )}
      </div>

      {editFabricOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <button onClick={() => { setEditFabricOpen(false); setFabricAdminOk(false); }} className="absolute left-3 top-3 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition"><RotateCcw className="h-5 w-5" /></button>
            <h3 className="mb-4 text-center text-lg font-bold text-[#0D1F17]">تعديل مجموع استهلاك الثوب</h3>
            {!fabricAdminOk ? (
              <div className="py-4">
                <p className="mb-4 text-center text-gray-600">أدخل كود المدير</p>
                <PinLock role="admin" onSuccess={() => setFabricAdminOk(true)} onCancel={() => { setEditFabricOpen(false); setFabricAdminOk(false); }} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-[#F5F0E8] p-4 text-center border border-[#C9A84C]/20">
                  <p className="text-sm text-gray-500">المجموع الحالي</p>
                  <p className="mt-1 text-3xl font-bold text-[#1B5E3B]">{displayFabricTotal.toLocaleString("fr-MA")} سم</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">المجموع الجديد (سم)</label>
                  <input type="number" dir="ltr" value={manualFabricTotal} onChange={(e) => setManualFabricTotal(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20" autoFocus />
                </div>
                <button onClick={handleSaveFabricTotal} disabled={!manualFabricTotal || Number(manualFabricTotal) < 0} className="w-full rounded-xl bg-[#1B5E3B] py-3 text-base font-bold text-white transition hover:bg-[#144d30] disabled:opacity-40">💾 حفظ</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}