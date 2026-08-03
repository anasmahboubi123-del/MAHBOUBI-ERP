"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ArrowRight, Plus, Loader2, Scissors } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { OrderDraft, Seddari } from "@/lib/types";
import StitchStyleCard, { StitchStyle } from "./StitchStyleCard";
import StitchGallery from "./StitchGallery";
import StitchAddModal from "./StitchAddModal";
import PinLock from "@/components/ui/PinLock";

interface Step03StitchProps {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface SedariStitchSelection {
  seddariId: string;
  styleId: string;
  styleName: string;
  price: number;
}

export default function Step03Stitch({ draft, onChange, onNext, onBack }: Step03StitchProps) {
  const [styles, setStyles] = useState<StitchStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<Record<string, SedariStitchSelection>>({});
  const [galleryStyle, setGalleryStyle] = useState<StitchStyle | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  /* تعديل ثمن */
  const [editStyle, setEditStyle] = useState<StitchStyle | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [adminOk, setAdminOk] = useState(false);
  const [newPrice, setNewPrice] = useState("");

  /* تعديل المجموع */
  const [totalEditOpen, setTotalEditOpen] = useState(false);
  const [totalAdminOk, setTotalAdminOk] = useState(false);
  const [manualTotal, setManualTotal] = useState("");
  const [totalOverride, setTotalOverride] = useState<number | null>(null);

  /* ── جلب الأشكال من Supabase ── */
  useEffect(() => {
    async function fetchStyles() {
      setLoading(true);
      const { data, error } = await supabase
        .from("stitch_styles")
        .select("id, name, price, image_url, gallery, description")
        .eq("target", "seddari")
        .eq("active", true)
        .order("name");

      if (!error && data) {
        setStyles(data as StitchStyle[]);
      }
      setLoading(false);
    }
    fetchStyles();
  }, []);

  /* ── استعادة التحديدات من الطلبية ── */
  useEffect(() => {
    const saved = (draft as any).sedariStitches as SedariStitchSelection[] | undefined;
    if (saved) {
      const map: Record<string, SedariStitchSelection> = {};
      saved.forEach((s) => { map[s.seddariId] = s; });
      setSelections(map);
    }
    if ((draft as any).stage3TotalOverride !== undefined) {
      setTotalOverride((draft as any).stage3TotalOverride);
    }
  }, [draft]);

  /* ── تحديد شكل لسداري ── */
  const handleSelect = useCallback((seddariId: string, style: StitchStyle) => {
    setSelections((prev) => {
      const next = {
        ...prev,
        [seddariId]: {
          seddariId,
          styleId: style.id,
          styleName: style.name,
          price: style.price,
        },
      };
      syncToDraft(next);
      return next;
    });
  }, []);

  /* ── مزامنة مع الطلبية ── */
  const syncToDraft = (selMap: Record<string, SedariStitchSelection>) => {
    const list = Object.values(selMap);
    const computed = list.reduce((sum, s) => sum + s.price, 0);
    const total = totalOverride ?? computed;
    onChange({
      sedariStitches: list,
      stage3Total: total,
    } as any);
  };

  /* ── تعديل ثمن شكل ── */
  const handleEditPrice = (style: StitchStyle) => {
    setEditStyle(style);
    setNewPrice(String(style.price));
    setEditOpen(true);
    setAdminOk(false);
  };

  const handleSavePrice = async () => {
    const priceNum = Number(newPrice);
    if (!editStyle || priceNum <= 0) return;

    const { error } = await supabase
      .from("stitch_styles")
      .update({ price: priceNum })
      .eq("id", editStyle.id);

    if (!error) {
      setStyles((prev) =>
        prev.map((s) => (s.id === editStyle.id ? { ...s, price: priceNum } : s))
      );
      setSelections((prev) => {
        const next: Record<string, SedariStitchSelection> = {};
        Object.entries(prev).forEach(([sid, sel]) => {
          next[sid] = sel.styleId === editStyle.id
            ? { ...sel, price: priceNum }
            : sel;
        });
        syncToDraft(next);
        return next;
      });
      setEditOpen(false);
      setAdminOk(false);
    }
  };

  /* ── إضافة شكل جديد ── */
  const handleAdded = (style: StitchStyle) => {
    setStyles((prev) => [...prev, style]);
  };

  /* ── تعديل المجموع ── */
  const handleSaveTotal = () => {
    const val = Number(manualTotal);
    if (val >= 0) {
      setTotalOverride(val);
      onChange({ stage3TotalOverride: val, stage3Total: val } as any);
      setTotalEditOpen(false);
      setTotalAdminOk(false);
    }
  };

  /* ── حسابات ── */
  const seddars: Seddari[] = draft.seddars || [];
  const computedTotal = Object.values(selections).reduce((sum, s) => sum + s.price, 0);
  const displayTotal = totalOverride ?? computedTotal;
  const allSelected = seddars.length > 0 && seddars.every((s) => selections[s.id]);

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
              ✂️ خياطة السدادر
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              اختر شكل الخياطة لكل سداري
            </p>
          </div>

          <button
            onClick={onNext}
            disabled={!allSelected}
            className={`
              flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition
              ${allSelected
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
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-[#1B5E3B]" />
            <p className="text-gray-500">جاري تحميل أشكال الخياطة...</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* ═══ العمود الأيمن: اختيار الخياطة ═══ */}
            <div className="lg:col-span-2 space-y-6">
              {seddars.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                  <Scissors className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-4 text-lg font-medium text-gray-600">
                    لا توجد سدادر — ارجع للمرحلة السابقة
                  </p>
                </div>
              ) : (
                seddars.map((seddari, idx) => {
                  const sel = selections[seddari.id];
                  return (
                    <div
                      key={seddari.id}
                      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-[#0D1F17]">
                            سداري {idx + 1}
                          </h3>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {seddari.length} × {seddari.width || 70} × {seddari.height} سم
                          </p>
                        </div>
                        {sel ? (
                          <div className="rounded-xl bg-[#F5F0E8] px-4 py-2 border border-[#C9A84C]/20">
                            <p className="text-xs text-gray-500">الشكل المختار</p>
                            <p className="font-bold text-[#1B5E3B]">{sel.styleName}</p>
                            <p className="text-sm font-bold text-[#1B5E3B]">
                              {sel.price.toLocaleString("fr-MA")} DH
                            </p>
                          </div>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600 border border-amber-100">
                            ⚠️ لم يُختَر
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {styles.map((style) => (
                          <StitchStyleCard
                            key={style.id}
                            style={style}
                            selected={sel?.styleId === style.id}
                            onSelect={() => handleSelect(seddari.id, style)}
                            onEditPrice={() => handleEditPrice(style)}
                            onShowInfo={() => {
                              setGalleryStyle(style);
                              setGalleryOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}

              {/* زر إضافة شكل جديد */}
              <button
                onClick={() => setAddOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-white py-4 text-gray-600 transition hover:border-[#1B5E3B]/40 hover:bg-[#F5F0E8] hover:text-[#1B5E3B]"
              >
                <Plus className="h-5 w-5" />
                <span className="font-bold">إضافة شكل خياطة جديد للكتالوج</span>
              </button>
            </div>

            {/* ═══ العمود الأيسر: الملخص ═══ */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 bg-[#F5F0E8] px-5 py-3">
                  <h3 className="font-bold text-[#0D1F17]">💰 ملخص الخياطة</h3>
                </div>

                <div className="divide-y divide-gray-100">
                  {seddars.map((s, idx) => {
                    const sel = selections[s.id];
                    return (
                      <div key={s.id} className="px-5 py-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            سداري {idx + 1}
                          </span>
                          <span className="font-bold text-[#0D1F17]">
                            {sel
                              ? `${sel.price.toLocaleString("fr-MA")} DH`
                              : "—"
                            }
                          </span>
                        </div>
                        {sel && (
                          <p className="mt-0.5 text-xs text-gray-400">{sel.styleName}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-gray-200 bg-[#F5F0E8] px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">المجموع</p>
                      <p className="mt-1 text-2xl font-extrabold text-[#1B5E3B]">
                        {displayTotal.toLocaleString("fr-MA")} DH
                      </p>
                      {totalOverride !== null && (
                        <p className="mt-0.5 text-xs text-amber-600">
                          ⚠️ مُعدّل يدوياً
                        </p>
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
            </div>
          </div>
        )}
      </div>

      {/* ═══════ نوافذ منبثقة ═══════ */}

      <StitchGallery
        style={galleryStyle}
        open={galleryOpen}
        onClose={() => {
          setGalleryOpen(false);
          setGalleryStyle(null);
        }}
      />

      <StitchAddModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={handleAdded}
      />

      {/* تعديل ثمن شكل */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => { setEditOpen(false); setAdminOk(false); }}
              className="absolute left-3 top-3 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="mb-4 text-center text-lg font-bold text-[#0D1F17]">
              تعديل ثمن الخياطة
            </h3>

            {!adminOk ? (
              <div className="py-4">
                <p className="mb-4 text-center text-gray-600">
                  أدخل كود المدير للتعديل
                </p>
                <PinLock
                  role="admin"
                  onSuccess={() => setAdminOk(true)}
                  onCancel={() => { setEditOpen(false); setAdminOk(false); }}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-[#F5F0E8] p-4 text-center border border-[#C9A84C]/20">
                  <p className="text-sm text-gray-500">{editStyle?.name}</p>
                  <p className="mt-1 text-2xl font-bold text-[#1B5E3B]">
                    {editStyle?.price.toLocaleString("fr-MA")} DH
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    الثمن الجديد (DH)
                  </label>
                  <input
                    type="number"
                    dir="ltr"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20"
                    autoFocus
                  />
                </div>

                <button
                  onClick={handleSavePrice}
                  disabled={!newPrice || Number(newPrice) <= 0}
                  className="w-full rounded-xl bg-[#1B5E3B] py-3 text-base font-bold text-white transition hover:bg-[#144d30] disabled:opacity-40"
                >
                  💾 حفظ
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* تعديل المجموع */}
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
              تعديل مجموع الخياطة
            </h3>

            {!totalAdminOk ? (
              <div className="py-4">
                <p className="mb-4 text-center text-gray-600">
                  أدخل كود المدير
                </p>
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