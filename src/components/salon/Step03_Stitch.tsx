"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, ArrowRight, Plus, Loader2, Scissors, RotateCcw, Lock, ImageIcon, Camera, X, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { OrderDraft, Seddari, SedariStitchSelection } from "@/lib/types";
import PinLock from "@/components/ui/PinLock";

interface StitchStyle {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  gallery: string[] | null;
  description: string | null;
  isCustom?: boolean;
}

interface Step03Props {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step03_Stitch({ draft, onChange, onNext, onBack }: Step03Props) {
  const [styles, setStyles] = useState<StitchStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<Record<string, SedariStitchSelection>>({});

  const [editSeddariId, setEditSeddariId] = useState<string | null>(null);
  const [editPriceOpen, setEditPriceOpen] = useState(false);
  const [priceAdminOk, setPriceAdminOk] = useState(false);
  const [newPriceInput, setNewPriceInput] = useState("");

  const [totalEditOpen, setTotalEditOpen] = useState(false);
  const [totalAdminOk, setTotalAdminOk] = useState(false);
  const [manualTotal, setManualTotal] = useState("");

  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [customAdminOk, setCustomAdminOk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── refs لتجنب loops ── */
  const stageTotalsRef = useRef(draft.stageTotals);
  const onChangeRef = useRef(onChange);
  stageTotalsRef.current = draft.stageTotals;
  onChangeRef.current = onChange;

  // جلب الأشكال من Supabase (مرة واحدة فقط)
  useEffect(() => {
    async function fetchStyles() {
      setLoading(true);
      const { data, error } = await supabase
        .from("stitch_styles")
        .select("id, name, price, image_url, gallery, description")
        .eq("target", "seddari")
        .eq("active", true)
        .order("name");

      const dbStyles = (!error && data) ? data as StitchStyle[] : [];
      const customStyles = draft.customStitchStyles || [];
      setStyles([...dbStyles, ...customStyles]);
      setLoading(false);
    }
    fetchStyles();
  }, []); // ← فارغ: يشغل مرة واحدة فقط

  // تحميل الاختيارات المحفوظة (مرة واحدة فقط)
  useEffect(() => {
    const saved = draft.sedariStitches;
    if (saved?.length) {
      const map: Record<string, SedariStitchSelection> = {};
      saved.forEach((s) => { map[s.seddariId] = s; });
      setSelections(map);
    }
  }, []); // ← فارغ: يشغل مرة واحدة فقط

  // ✅ FIXED: تزامن selections مع Draft عبر useEffect (وليس داخل setState updater)
  useEffect(() => {
    const list = Object.values(selections);
    const computed = list.reduce((sum, s) => sum + s.finalPrice, 0);
    const total = draft.stage3TotalOverride ?? computed;
    onChangeRef.current({
      sedariStitches: list,
      stageTotals: { ...(stageTotalsRef.current ?? {}), stitch: total }
    });
  }, [selections, draft.stage3TotalOverride]);

  const handleSelect = useCallback((seddariId: string, style: StitchStyle) => {
    setSelections((prev) => {
      const existing = prev[seddariId];
      return {
        ...prev,
        [seddariId]: {
          seddariId,
          styleId: style.id,
          styleName: style.name,
          basePrice: style.price,
          finalPrice: existing?.finalPrice ?? style.price,
          imageUrl: style.image_url,
        },
      };
    });
  }, []);

  const handleEditPrice = (seddariId: string) => {
    const sel = selections[seddariId];
    if (!sel) return;
    setEditSeddariId(seddariId);
    setNewPriceInput(String(sel.finalPrice));
    setEditPriceOpen(true);
    setPriceAdminOk(false);
  };

  const handleSavePrice = () => {
    const priceNum = Number(newPriceInput);
    if (!editSeddariId || priceNum < 0) return;
    setSelections((prev) => {
      const sel = prev[editSeddariId];
      if (!sel) return prev;
      return { ...prev, [editSeddariId]: { ...sel, finalPrice: priceNum } };
    });
    setEditPriceOpen(false);
    setPriceAdminOk(false);
  };

  const handleSaveTotal = () => {
    const val = Number(manualTotal);
    if (val >= 0) {
      onChange({ stage3TotalOverride: val, stageTotals: { ...draft.stageTotals, stitch: val } });
      setTotalEditOpen(false);
      setTotalAdminOk(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCustomImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddCustomStyle = () => {
    const price = Number(customPrice);
    if (!customName.trim() || price < 0) return;

    const newStyle: StitchStyle = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      price: price,
      image_url: customImage,
      gallery: customImage ? [customImage] : null,
      description: null,
      isCustom: true,
    };

    const updatedCustom = [...(draft.customStitchStyles || []), newStyle];
    setStyles((prev) => [...prev, newStyle]);
    onChange({ customStitchStyles: updatedCustom });

    setCustomName("");
    setCustomPrice("");
    setCustomImage(null);
    setCustomModalOpen(false);
    setCustomAdminOk(false);
  };

  const handleDeleteCustom = (styleId: string) => {
    const updated = (draft.customStitchStyles || []).filter(s => s.id !== styleId);
    setStyles((prev) => prev.filter(s => s.id !== styleId));
    onChange({ customStitchStyles: updated });
    setSelections((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (next[key].styleId === styleId) delete next[key];
      });
      return next;
    });
  };

  const seddars: Seddari[] = draft.seddars || [];
  const computedTotal = Object.values(selections).reduce((sum, s) => sum + s.finalPrice, 0);
  const displayTotal = draft.stage3TotalOverride ?? computedTotal;
  const allSelected = seddars.length > 0 && seddars.every((s) => selections[s.id]);

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="sticky top-0 z-30 border-b border-[#1B5E3B]/10 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <button onClick={onBack} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
            <ArrowRight className="h-4 w-4" /> رجوع
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#0D1F17] md:text-2xl">✂️ خياطة السدادر</h1>
            <p className="mt-0.5 text-sm text-gray-500">الخطوة 3 من 7 — اختر شكل الخياطة لكل سداري</p>
          </div>
          <button onClick={onNext} disabled={!allSelected} className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${allSelected ? "bg-[#1B5E3B] text-white hover:bg-[#144d30] shadow-lg shadow-[#1B5E3B]/20" : "cursor-not-allowed bg-gray-200 text-gray-400"}`}>
            التالي <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-[#1B5E3B]" />
            <p className="text-gray-500">جاري تحميل أشكال الخياطة...</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {seddars.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                  <Scissors className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-4 text-lg font-medium text-gray-600">لا توجد سدادر — ارجع للمرحلة السابقة</p>
                </div>
              ) : (
                seddars.map((seddari, idx) => {
                  const sel = selections[seddari.id];
                  const isFormaja = seddari.type === "formaja";
                  const normalIdx = seddars.filter((s, i) => i <= idx && s.type !== "formaja").length;
                  const formajaIdx = seddars.filter((s, i) => i <= idx && s.type === "formaja").length;
                  const displayIdx = isFormaja ? formajaIdx : normalIdx;

                  return (
                    <div key={seddari.id} className={`rounded-2xl border p-5 shadow-sm ${isFormaja ? "border-[#C9A84C]/40 bg-[#FFF8E1]" : "border-gray-200 bg-white"}`}>
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className={`text-lg font-bold ${isFormaja ? "text-[#C9A84C]" : "text-[#0D1F17]"}`}>
                            {isFormaja ? `🌀 فورمجة ${displayIdx}` : `سداري ${displayIdx}`}
                          </h3>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {isFormaja
                              ? `${seddari.fabricConsumption} سم — استهلاك الثوب`
                              : `${seddari.length} × ${seddari.width} × ${seddari.height} سم`
                            }
                          </p>
                        </div>
                        {sel ? (
                          <div className={`rounded-xl px-4 py-2 border ${isFormaja ? "bg-white border-[#C9A84C]/30" : "bg-[#F5F0E8] border-[#C9A84C]/20"}`}>
                            <p className="text-xs text-gray-500">الشكل المختار</p>
                            <p className="font-bold text-[#1B5E3B]">{sel.styleName}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-sm font-bold text-[#C9A84C]">{sel.finalPrice.toLocaleString("fr-MA")} DH</span>
                              <span onClick={() => handleEditPrice(seddari.id)} className="cursor-pointer rounded bg-white p-1 text-gray-400 hover:text-[#C9A84C] transition" role="button" title="تعديل السعر">
                                <Pencil className="h-3 w-3" />
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600 border border-amber-100">⚠️ لم يُختَر</span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {styles.map((style) => {
                          const isSelected = sel?.styleId === style.id;
                          return (
                            <div
                              key={style.id}
                              onClick={() => handleSelect(seddari.id, style)}
                              className={`relative rounded-2xl border-2 p-3 text-center transition cursor-pointer ${isSelected ? "border-[#C9A84C] bg-[#F5F0E8] shadow-md" : "border-gray-200 bg-white hover:border-[#1B5E3B]/30"}`}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => e.key === 'Enter' && handleSelect(seddari.id, style)}
                            >
                              {style.isCustom && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteCustom(style.id); }}
                                  className="absolute left-1.5 top-1.5 z-10 rounded-full bg-red-50 p-1 text-red-500 hover:bg-red-100 transition"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}

                              {isSelected && (
                                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#1B5E3B] text-white z-10">
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                              )}
                              <div className="aspect-square w-full rounded-xl bg-gray-100 mb-2 flex items-center justify-center overflow-hidden">
                                {style.image_url ? <img src={style.image_url} alt={style.name} className="h-full w-full object-cover" /> : <ImageIcon className="h-8 w-8 text-gray-300" />}
                              </div>
                              <p className="font-bold text-sm text-[#0D1F17]">{style.name}</p>
                              <p className="mt-1 text-base font-extrabold text-[#1B5E3B]">{style.price.toLocaleString("fr-MA")} DH</p>
                            </div>
                          );
                        })}

                        <button
                          onClick={() => { setCustomModalOpen(true); setCustomAdminOk(false); }}
                          className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#C9A84C]/40 bg-white p-3 text-[#C9A84C] transition hover:border-[#C9A84C] hover:bg-[#C9A84C]/5 min-h-[140px]"
                        >
                          <Plus className="h-6 w-6" />
                          <span className="text-xs font-bold">شكل يدوي</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 bg-[#F5F0E8] px-5 py-3">
                  <h3 className="font-bold text-[#0D1F17]">💰 ملخص الخياطة</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {seddars.map((s, idx) => {
                    const sel = selections[s.id];
                    const isFormaja = s.type === "formaja";
                    const normalIdx = seddars.filter((x, i) => i <= idx && x.type !== "formaja").length;
                    const formajaIdx = seddars.filter((x, i) => i <= idx && x.type === "formaja").length;
                    const displayIdx = isFormaja ? formajaIdx : normalIdx;

                    return (
                      <div key={s.id} className="px-5 py-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${isFormaja ? "text-[#C9A84C] font-bold" : "text-gray-600"}`}>
                            {isFormaja ? `🌀 فورمجة ${displayIdx}` : `سداري ${displayIdx}`}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1B5E3B]">{sel ? `${sel.finalPrice.toLocaleString("fr-MA")} DH` : "—"}</span>
                            {sel && (
                              <span onClick={() => handleEditPrice(s.id)} className="cursor-pointer rounded bg-gray-50 p-1 text-gray-400 hover:text-[#C9A84C] transition" role="button" title="تعديل">
                                <Pencil className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-gray-200 bg-[#F5F0E8] px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">المجموع</p>
                      <p className="mt-1 text-2xl font-extrabold text-[#1B5E3B]">{displayTotal.toLocaleString("fr-MA")} DH</p>
                      {draft.stage3TotalOverride !== null && <p className="mt-0.5 text-xs text-amber-600">⚠️ مُعدّل يدوياً</p>}
                    </div>
                    <button onClick={() => { setManualTotal(String(displayTotal)); setTotalEditOpen(true); setTotalAdminOk(false); }} className="rounded-lg bg-white border border-[#C9A84C] p-2 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition" title="تعديل المجموع">
                      <Lock className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {editPriceOpen && editSeddariId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <button onClick={() => { setEditPriceOpen(false); setPriceAdminOk(false); }} className="absolute left-3 top-3 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition"><RotateCcw className="h-5 w-5" /></button>
            <h3 className="mb-4 text-center text-lg font-bold text-[#0D1F17]">تعديل الثمن</h3>
            {!priceAdminOk ? (
              <div className="py-4">
                <p className="mb-4 text-center text-gray-600">أدخل كود المدير</p>
                <PinLock role="admin" onSuccess={() => setPriceAdminOk(true)} onCancel={() => { setEditPriceOpen(false); setPriceAdminOk(false); }} />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">السعر الجديد (DH)</label>
                  <input type="number" dir="ltr" value={newPriceInput} onChange={(e) => setNewPriceInput(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20" autoFocus />
                </div>
                <button onClick={handleSavePrice} disabled={!newPriceInput || Number(newPriceInput) < 0} className="w-full rounded-xl bg-[#1B5E3B] py-3 text-base font-bold text-white transition hover:bg-[#144d30] disabled:opacity-40">💾 حفظ</button>
              </div>
            )}
          </div>
        </div>
      )}

      {totalEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <button onClick={() => { setTotalEditOpen(false); setTotalAdminOk(false); }} className="absolute left-3 top-3 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition"><RotateCcw className="h-5 w-5" /></button>
            <h3 className="mb-4 text-center text-lg font-bold text-[#0D1F17]">تعديل مجموع الخياطة</h3>
            {!totalAdminOk ? (
              <div className="py-4">
                <p className="mb-4 text-center text-gray-600">أدخل كود المدير</p>
                <PinLock role="admin" onSuccess={() => setTotalAdminOk(true)} onCancel={() => { setTotalEditOpen(false); setTotalAdminOk(false); }} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-[#F5F0E8] p-4 text-center border border-[#C9A84C]/20">
                  <p className="text-sm text-gray-500">المجموع الحالي</p>
                  <p className="mt-1 text-3xl font-bold text-[#1B5E3B]">{displayTotal.toLocaleString("fr-MA")} DH</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">المجموع الجديد (DH)</label>
                  <input type="number" dir="ltr" value={manualTotal} onChange={(e) => setManualTotal(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20" autoFocus />
                </div>
                <button onClick={handleSaveTotal} disabled={!manualTotal || Number(manualTotal) < 0} className="w-full rounded-xl bg-[#1B5E3B] py-3 text-base font-bold text-white transition hover:bg-[#144d30] disabled:opacity-40">💾 حفظ</button>
              </div>
            )}
          </div>
        </div>
      )}

      {customModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <button onClick={() => { setCustomModalOpen(false); setCustomAdminOk(false); setCustomName(""); setCustomPrice(""); setCustomImage(null); }} className="absolute left-3 top-3 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition">
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-4 text-center text-lg font-bold text-[#0D1F17]">✨ شكل خياطة يدوي</h3>

            {!customAdminOk ? (
              <div className="py-4">
                <p className="mb-4 text-center text-gray-600">أدخل كود المدير</p>
                <PinLock role="admin" onSuccess={() => setCustomAdminOk(true)} onCancel={() => { setCustomModalOpen(false); setCustomAdminOk(false); }} />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">اسم الشكل</label>
                  <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="مثال: خياطة مخصصة" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">السعر (DH)</label>
                  <input type="number" dir="ltr" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="150" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">صورة (اختياري)</label>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                  {customImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img src={customImage} alt="معاينة" className="w-full h-32 object-cover" />
                      <button onClick={() => setCustomImage(null)} className="absolute top-2 left-2 rounded-full bg-red-500 text-white p-1 hover:bg-red-600 transition"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-3 text-gray-500 hover:border-[#1B5E3B] hover:text-[#1B5E3B] transition">
                        <ImageIcon className="h-5 w-5" /><span className="text-sm font-bold">رفع صورة</span>
                      </button>
                      <button onClick={() => { if(fileInputRef.current) { fileInputRef.current.setAttribute('capture', 'environment'); fileInputRef.current.click(); }}} className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-3 text-gray-500 hover:border-[#C9A84C] hover:text-[#C9A84C] transition">
                        <Camera className="h-5 w-5" /><span className="text-sm font-bold">كاميرا</span>
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={handleAddCustomStyle} disabled={!customName.trim() || !customPrice || Number(customPrice) < 0} className="w-full rounded-xl bg-[#1B5E3B] py-3 text-base font-bold text-white transition hover:bg-[#144d30] disabled:opacity-40">💾 إضافة الشكل</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}