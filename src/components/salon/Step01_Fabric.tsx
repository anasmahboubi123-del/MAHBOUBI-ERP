'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Sofa } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FabricItem, OrderDraft } from '@/lib/types';
import FabricCard from './FabricCard';
import FabricGallery from './FabricGallery';
import PriceEditor from './PriceEditor';

interface Step01FabricProps {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
}

export default function Step01Fabric({ draft, onChange, onNext }: Step01FabricProps) {
  const [fabrics, setFabrics] = useState<FabricItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFabric, setSelectedFabric] = useState<FabricItem | null>(draft.fabric);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeFabric, setActiveFabric] = useState<FabricItem | null>(null);

  /* ── جلب الأثواب من Supabase ── */
  useEffect(() => {
    async function fetchFabrics() {
      setLoading(true);
      const { data, error } = await supabase
        .from('fabrics')
        .select('id, name, color, price_per_meter, image_url, gallery')
        .eq('active', true)
        .order('name');

      if (!error && data) {
        setFabrics(data as FabricItem[]);
      }
      setLoading(false);
    }
    fetchFabrics();
  }, []);

  /* ── تحديث الطلبية عند اختيار ثوب ── */
  const handleSelect = (fabric: FabricItem) => {
    // إذا كان هناك تعديل سابق على نفس الثوب، نحتفظ به
    if (selectedFabric?.id === fabric.id) return;

    setSelectedFabric(fabric);
    onChange({ fabric });
  };

  /* ── فتح محرر الثمن ── */
  const handleEditPrice = (fabric: FabricItem) => {
    setActiveFabric(fabric);
    setEditorOpen(true);
  };

  /* ── حفظ الثمن المعدل (للطلبية فقط) ── */
  const handleSavePrice = (newPrice: number) => {
    if (!activeFabric) return;

    const updated: FabricItem = {
      ...activeFabric,
      price_per_meter: newPrice,
    };

    setActiveFabric(updated);

    // تحديث القائمة المعروضة
    setFabrics((prev) =>
      prev.map((f) => (f.id === updated.id ? updated : f))
    );

    // إذا كان هذا الثوب المختار حالياً، نحدث الطلبية
    if (selectedFabric?.id === updated.id) {
      setSelectedFabric(updated);
      onChange({ fabric: updated });
    }
  };

  /* ── فتح معرض الصور ── */
  const handleShowInfo = (fabric: FabricItem) => {
    setActiveFabric(fabric);
    setGalleryOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* ═══════ الهيدر ═══════ */}
      <div className="sticky top-0 z-30 border-b border-[#1B5E3B]/10 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B5E3B] text-white">
              <Sofa className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0D1F17] md:text-2xl">
                اختيار الثوب
              </h1>
              <p className="mt-0.5 text-sm text-gray-500">
                اختر الثوب المناسب للصالون المغربي
              </p>
            </div>
          </div>

          <button
            onClick={onNext}
            disabled={!selectedFabric}
            className={`
              flex items-center gap-2 rounded-xl px-5 py-2.5 text-base font-bold transition
              md:px-6 md:py-3 md:text-lg
              ${selectedFabric
                ? 'bg-[#1B5E3B] text-white hover:bg-[#144d30] shadow-lg shadow-[#1B5E3B]/20'
                : 'cursor-not-allowed bg-gray-200 text-gray-400'
              }
            `}
          >
            التالي
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ═══════ المحتوى ═══════ */}
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-[#1B5E3B]" />
            <p className="text-gray-500">جاري تحميل الأثواب...</p>
          </div>
        ) : fabrics.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <Sofa className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-600">
              لا توجد أثواب في الكتالوج
            </p>
            <p className="mt-2 text-sm text-gray-400">
              أضف أثواباً من واجهة المدير ← الإعدادات ← الكتالوج
            </p>
          </div>
        ) : (
          <>
            {/* شبكة الأثواب */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {fabrics.map((fabric) => (
                <FabricCard
                  key={fabric.id}
                  fabric={fabric}
                  selected={selectedFabric?.id === fabric.id}
                  onSelect={() => handleSelect(fabric)}
                  onEditPrice={() => handleEditPrice(fabric)}
                  onShowInfo={() => handleShowInfo(fabric)}
                />
              ))}
            </div>

            {/* الثوب المختار — شريط ملخص */}
            {selectedFabric && (
              <div className="mt-6 rounded-2xl border-2 border-[#C9A84C] bg-white p-5 shadow-lg shadow-[#C9A84C]/10 md:mt-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1B5E3B] text-white">
                      <Sofa className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0D1F17]">
                        ✅ الثوب المختار: {selectedFabric.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-[#1B5E3B]">
                        <span className="text-xl font-extrabold">
                          {selectedFabric.price_per_meter.toLocaleString('fr-MA')} DH
                        </span>
                        <span className="text-sm text-gray-500">/متر</span>
                        {draft.fabric &&
                          draft.fabric.price_per_meter !== selectedFabric.price_per_meter && (
                            <span className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                              مُعدّل للطلبية
                            </span>
                          )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onNext}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#1B5E3B] px-8 py-3 text-lg font-bold text-white transition hover:bg-[#144d30] shadow-lg shadow-[#1B5E3B]/20"
                  >
                    الانتقال للمقاسات
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══════ النوافذ المنبثقة ═══════ */}
      <FabricGallery
        fabric={activeFabric}
        open={galleryOpen}
        onClose={() => {
          setGalleryOpen(false);
          setActiveFabric(null);
        }}
      />

      <PriceEditor
        fabric={activeFabric}
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setActiveFabric(null);
        }}
        onSave={handleSavePrice}
      />
    </div>
  );
}