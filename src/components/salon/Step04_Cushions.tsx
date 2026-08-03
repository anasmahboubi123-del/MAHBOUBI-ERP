"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ArrowRight, Plus, Minus, Loader2, BedDouble } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { OrderDraft, Seddari, CushionPlan } from "@/lib/types";
import PinLock from "@/components/ui/PinLock";

interface StitchStyle {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

interface Step04CushionsProps {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

const SIZES = [75, 80, 100];
const DEFAULT_STUFFING_PRICE = 100;

export default function Step04Cushions({ draft, onChange, onNext, onBack }: Step04CushionsProps) {
  const seddars: Seddari[] = draft.seddars || [];

  const [selectedSize, setSelectedSize] = useState<number | null>(
    (draft as any).cushionSize ?? null
  );
  const [counts, setCounts] = useState<Record<string, number>>(
    (draft as any).cushionCounts ?? {}
  );
  const [stitchStyles, setStitchStyles] = useState<StitchStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStitch, setSelectedStitch] = useState<StitchStyle | null>(
    (draft as any).cushionStitch ?? null
  );
  const [stuffing, setStuffing] = useState<boolean>(
    (draft as any).cushionStuffing ?? false
  );
  const [stuffingPrice, setStuffingPrice] = useState<number>(
    (draft as any).cushionStuffingPrice ?? DEFAULT_STUFFING_PRICE
  );

  /* تعديل المجموع */
  const [totalEditOpen, setTotalEditOpen] = useState(false);
  const [totalAdminOk, setTotalAdminOk] = useState(false);
  const [manualTotal, setManualTotal] = useState("");
  const [totalOverride, setTotalOverride] = useState<number | null>(
    (draft as any).stage4TotalOverride ?? null
  );

  /* ── جلب أشكال خياطة المخاد ── */
  useEffect(() => {
    async function fetchStyles() {
      setLoading(true);
      const { data } = await supabase
        .from("stitch_styles")
        .select("id, name, price, image_url")
        .eq("target", "cushion")
        .eq("active", true)
        .order("name");
      if (data) setStitchStyles(data as StitchStyle[]);
      setLoading(false);
    }
    fetchStyles();
  }, []);

  /* ── اقتراح تلقائي عند اختيار الحجم ── */
  const handleSelectSize = (size: number) => {
    setSelectedSize(size);
    const newCounts: Record<string, number> = {};
    seddars.forEach((s) => {
      const existing = counts[s.id];
      if (existing) {
        newCounts[s.id] = existing;
      } else {
        newCounts[s.id] = Math.max(1, Math.round(s.length / size));
      }
    });
    setCounts(newCounts);
    syncToDraft(size, newCounts, selectedStitch, stuffing, stuffingPrice);
  };

  /* ── تعديل العدد ── */
  const adjustCount = (seddariId: string, delta: number) => {
    setCounts((prev) => {
      const next = { ...prev, [seddariId]: Math.max(0, (prev[seddariId] || 0) + delta) };
      syncToDraft(selectedSize, next, selectedStitch, stuffing, stuffingPrice);
      return next;
    });
  };

  /* ── اختيار شكل الخياطة ── */
  const handleSelectStitch = (style: StitchStyle) => {
    setSelectedStitch(style);
    syncToDraft(selectedSize, counts, style, stuffing, stuffingPrice);
  };

  /* ── الحشوة ── */
  const handleStuffing = (val: boolean) => {
    setStuffing(val);
    syncToDraft(selectedSize, counts, selectedStitch, val, stuffingPrice);
  };

  /* ── مزامنة ── */
  const syncToDraft = (
    size: number | null,
    cts: Record<string, number>,
    stitch: StitchStyle | null,
    stuff: boolean,
    stuffPrice: number
  ) => {
    if (!size || !stitch) return;

    const cushionPlans: CushionPlan[] = seddars.map((s) => ({
      seddariId: s.id,
      size,
      count: cts[s.id] || 0,
      stitchPrice: stitch.price,
      stuffing: stuff,
    }));

    const totalCount = Object.values(cts).reduce((a, b) => a + b, 0);
    const stitchTotal = totalCount * stitch.price;
    const stuffingTotal = stuff ? totalCount * stuffPrice : 0;
    const computed = stitchTotal + stuffingTotal;
    const total = totalOverride ?? computed;

    onChange({
      cushions: cushionPlans,
      cushionSize: size,
      cushionCounts: cts,
      cushionStitch: stitch,
      cushionStuffing: stuff,
      cushionStuffingPrice: stuffPrice,
      stage4Total: total,
    } as any);
  };

  /* ── تعديل المجموع ── */
  const handleSaveTotal = () => {
    const val = Number(manualTotal);
    if (val >= 0) {
      setTotalOverride(val);
      onChange({ stage4TotalOverride: val, stage4Total: val } as any);
      setTotalEditOpen(false);
      setTotalAdminOk(false);
    }
  };

  /* ── حسابات ── */
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const stitchTotal = selectedStitch ? totalCount * selectedStitch.price : 0;
  const stuffingTotal = stuffing ? totalCount * stuffingPrice : 0;
  const computedTotal = stitchTotal + stuffingTotal;
  const displayTotal = totalOverride ?? computedTotal;

  const canProceed = selectedSize !== null && selectedStitch !== null && totalCount > 0;

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* ═══════ الهيدر ═══════ */}
      <div className="sticky top-0 z-30 border-b border-[#1B5E3B]/10 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            <ArrowRight className="h-4 w-4" />
            رجوع
          </button>

          <div className="text-center">
            <h1 className="text-xl font-bold text-[#0D1F17] md:text-2xl">
              🛏️ المخاد
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              اختر الحجم والعدد والخياطة
            </p>
          </div>

          <button
            onClick={onNext}
            disabled={!canProceed}
            className={`
              flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition
              ${canProceed
                ? "bg-[#1B5E3B] text-white hover:bg-[#144d30] shadow-lg shadow-[#1B5E3B]/20"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
              }
            `}
          >
            التالي
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ═══════ المحتوى ═══════ */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {seddars.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <BedDouble className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-600">
              لا توجد سدادر — ارجع للمرحلة السابقة
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* ═══ العمود الأيمن ═══ */}
            <div className="lg:col-span-2 space-y-6">

              {/* 1. اختيار الحجم */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-[#0D1F17]">
                  اختر حجم المخاد للصالون كله
                </h3>
                <div className="flex flex-wrap gap-3">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => handleSelectSize(size)}
                      className={`
                        flex flex-col items-center rounded-2xl border-2 px-8 py-5 transition
                        ${selectedSize === size
                          ? "border-[#C9A84C] bg-[#F5F0E8] shadow-md"
                          : "border-gray-200 bg-white hover:border-[#1B5E3B]/30"
                        }
                      `}
                    >
                      <BedDouble className={`h-8 w-8 mb-2 ${selectedSize === size ? "text-[#1B5E3B]" : "text-gray-400"}`} />
                      <span className="text-2xl font-extrabold text-[#0D1F17]">{size}</span>
                      <span className="text-sm text-gray-500">سم</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. العدد لكل سداري */}
              {selectedSize && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold text-[#0D1F17]">
                    العدد المقترح لكل سداري
                  </h3>
                  <div className="space-y-3">
                    {seddars.map((s, idx) => {
                      const suggested = Math.max(1, Math.round(s.length / selectedSize));
                      const count = counts[s.id] ?? suggested;
                      const remainder = s.length % selectedSize;
                      const showWarning = remainder > selectedSize * 0.4 && remainder < selectedSize * 0.6;

                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3"
                        >
                          <div>
                            <p className="font-bold text-[#0D1F17]">
                              سداري {idx + 1} — طول {s.length} سم
                            </p>
                            <p className="text-sm text-gray-500">
                              round({s.length} ÷ {selectedSize}) = {suggested} مقترح
                            </p>
                            {showWarning && (
                              <p className="mt-1 text-xs text-amber-600">
                                ⚠️ الباقي {remainder}سم — قد لا يكون مثالياً
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3" dir="ltr">
                            <button
                              onClick={() => adjustCount(s.id, -1)}
                              disabled={count <= 0}
                              className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200 text-xl font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-30 transition"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center text-xl font-bold text-[#0D1F17]">
                              {count}
                            </span>
                            <button
                              onClick={() => adjustCount(s.id, 1)}
                              className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200 text-xl font-bold text-gray-700 hover:bg-gray-50 transition"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. شكل الخياطة (للكل) */}
              {selectedSize && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold text-[#0D1F17]">
                    اختر شكل خياطة المخاد (للكل)
                  </h3>

                  {loading ? (
                    <div className="flex h-32 items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-[#1B5E3B]" />
                    </div>
                  ) : stitchStyles.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      لا توجد أشكال خياطة للمخاد في الكتالوج
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {stitchStyles.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => handleSelectStitch(style)}
                          className={`
                            relative rounded-2xl border-2 p-3 text-center transition
                            ${selectedStitch?.id === style.id
                              ? "border-[#C9A84C] bg-[#F5F0E8] shadow-md"
                              : "border-gray-200 bg-white hover:border-[#1B5E3B]/30"
                            }
                          `}
                        >
                          {selectedStitch?.id === style.id && (
                            <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#1B5E3B] text-white">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          <div className="aspect-square w-full rounded-xl bg-gray-100 mb-2 flex items-center justify-center text-2xl">
                            {style.image_url ? (
                              <img src={style.image_url} alt={style.name} className="h-full w-full rounded-xl object-cover" />
                            ) : (
                              "🛏️"
                            )}
                          </div>
                          <p className="font-bold text-sm text-[#0D1F17]">{style.name}</p>
                          <p className="mt-1 text-base font-extrabold text-[#1B5E3B]">
                            {style.price.toLocaleString("fr-MA")} DH
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. الحشوة */}
              {selectedSize && selectedStitch && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-lg font-bold text-[#0D1F17]">
                    هل تريد حشو المخاد باللواط؟
                  </h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleStuffing(true)}
                      className={`
                        flex-1 rounded-xl border-2 px-6 py-4 text-center transition
                        ${stuffing
                          ? "border-[#1B5E3B] bg-[#F5F0E8]"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                        }
                      `}
                    >
                      <p className="text-lg font-bold text-[#0D1F17]">نعم</p>
                      <p className="mt-1 text-sm text-[#1B5E3B] font-bold">
                        {stuffingPrice} DH لكل مخدة
                      </p>
                    </button>
                    <button
                      onClick={() => handleStuffing(false)}
                      className={`
                        flex-1 rounded-xl border-2 px-6 py-4 text-center transition
                        ${!stuffing
                          ? "border-[#1B5E3B] bg-[#F5F0E8]"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                        }
                      `}
                    >
                      <p className="text-lg font-bold text-[#0D1F17]">لا</p>
                      <p className="mt-1 text-sm text-gray-400">بدون حشوة</p>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ═══ العمود الأيسر: الملخص ═══ */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 bg-[#F5F0E8] px-5 py-3">
                  <h3 className="font-bold text-[#0D1F17]">💰 ملخص المخاد</h3>
                </div>

                {selectedSize ? (
                  <div className="divide-y divide-gray-100">
                    <div className="px-5 py-3">
                      <p className="text-sm text-gray-600">الحجم المختار</p>
                      <p className="text-lg font-bold text-[#0D1F17]">{selectedSize} سم</p>
                    </div>

                    <div className="px-5 py-3">
                      <p className="text-sm text-gray-600">إجمالي المخاد</p>
                      <p className="text-lg font-bold text-[#0D1F17]">{totalCount} مخدة</p>
                    </div>

                    {selectedStitch && (
                      <div className="px-5 py-3">
                        <p className="text-sm text-gray-600">خياطة ({selectedStitch.name})</p>
                        <p className="text-lg font-bold text-[#1B5E3B]">
                          {totalCount} × {selectedStitch.price} = {stitchTotal.toLocaleString("fr-MA")} DH
                        </p>
                      </div>
                    )}

                    {stuffing && (
                      <div className="px-5 py-3">
                        <p className="text-sm text-gray-600">حشوة (لواط)</p>
                        <p className="text-lg font-bold text-[#1B5E3B]">
                          {totalCount} × {stuffingPrice} = {stuffingTotal.toLocaleString("fr-MA")} DH
                        </p>
                      </div>
                    )}

                    <div className="bg-[#F5F0E8] px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">المجموع</p>
                          <p className="mt-1 text-2xl font-extrabold text-[#1B5E3B]">
                            {displayTotal.toLocaleString("fr-MA")} DH
                          </p>
                          {totalOverride !== null && (
                            <p className="mt-0.5 text-xs text-amber-600">⚠️ مُعدّل يدوياً</p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setManualTotal(String(displayTotal));
                            setTotalEditOpen(true);
                            setTotalAdminOk(false);
                          }}
                          className="rounded-lg bg-white border border-[#C9A84C] p-2 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition"
                          title="تعديل المجموع"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    اختر حجم المخاد أولاً
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════ تعديل المجموع ═══════ */}
      {totalEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => { setTotalEditOpen(false); setTotalAdminOk(false); }}
              className="absolute left-3 top-3 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="mb-4 text-center text-lg font-bold text-[#0D1F17]">
              تعديل مجموع المخاد
            </h3>

            {!totalAdminOk ? (
              <div className="py-4">
                <p className="mb-4 text-center text-gray-600">أدخل كود المدير</p>
                <PinLock
                  role="admin"
                  onSuccess={() => setTotalAdminOk(true)}
                  onCancel={() => { setTotalEditOpen(false); setTotalAdminOk(false); }}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-[#F5F0E8] p-4 text-center border border-[#C9A84C]/20">
                  <p className="text-sm text-gray-500">المجموع الحالي</p>
                  <p className="mt-1 text-3xl font-bold text-[#1B5E3B]">
                    {displayTotal.toLocaleString("fr-MA")} DH
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    المجموع الجديد (DH)
                  </label>
                  <input
                    type="number"
                    dir="ltr"
                    value={manualTotal}
                    onChange={(e) => setManualTotal(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20"
                    autoFocus
                  />
                </div>

                <button
                  onClick={handleSaveTotal}
                  disabled={!manualTotal || Number(manualTotal) < 0}
                  className="w-full rounded-xl bg-[#1B5E3B] py-3 text-base font-bold text-white transition hover:bg-[#144d30] disabled:opacity-40"
                >
                  💾 حفظ
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}