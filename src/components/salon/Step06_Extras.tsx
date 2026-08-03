'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, ArrowLeft, Plus, Trash2, Layers, Box, LayoutGrid, TreePine } from 'lucide-react';
import type {
  OrderDraft,
  LhayefSelection,
  TabouriaSelection,
  CustomExtraItem,
} from '@/lib/types';
import LhayefCard from './LhayefCard';
import CustomExtraModal from './CustomExtraModal';

interface Step06ExtrasProps {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
  onBack: () => void;
  onNavigateToProductFlow?: (product: 'khamiya' | 'bounge' | 'zarbiya' | 'wood') => void;
}

const DEFAULT_LHAYEF: LhayefSelection = {
  enabled: false,
  lengthM: 0,
  lengthOverridden: false,
  colorName: '',
  photoUrl: null,
  pricePerMeter: 0,
  totalOverride: null,
};

const DEFAULT_TABOURIA: TabouriaSelection = {
  enabled: false,
  count: 1,
  unitPrice: 0,
  totalOverride: null,
};

const OTHER_PRODUCTS: { key: 'khamiya' | 'bounge' | 'zarbiya' | 'wood'; label: string; icon: React.ReactNode }[] = [
  { key: 'zarbiya', label: 'الزربية', icon: <LayoutGrid className="h-5 w-5" /> },
  { key: 'khamiya', label: 'الخامية', icon: <Layers className="h-5 w-5" /> },
  { key: 'wood', label: 'الخشب', icon: <TreePine className="h-5 w-5" /> },
  { key: 'bounge', label: 'البونج', icon: <Box className="h-5 w-5" /> },
];

export default function Step06_Extras({
  draft,
  onChange,
  onNext,
  onBack,
  onNavigateToProductFlow,
}: Step06ExtrasProps) {
  const autoLengthM = useMemo(() => {
    const totalCm = draft.seddars.reduce((sum, s) => sum + s.length, 0);
    return Math.round((totalCm / 100) * 10) / 10;
  }, [draft.seddars]);

  const [lhayef, setLhayef] = useState<LhayefSelection>(
    draft.extrasStage?.lhayef ?? { ...DEFAULT_LHAYEF, lengthM: autoLengthM }
  );
  const [tabouria, setTabouria] = useState<TabouriaSelection>(
    draft.extrasStage?.tabouria ?? DEFAULT_TABOURIA
  );
  const [customItems, setCustomItems] = useState<CustomExtraItem[]>(
    draft.extrasStage?.customItems ?? []
  );
  const [showCustomModal, setShowCustomModal] = useState(false);

  const commit = (
    nextLhayef: LhayefSelection,
    nextTabouria: TabouriaSelection,
    nextCustomItems: CustomExtraItem[]
  ) => {
    const lhayefTotal = nextLhayef.enabled
      ? nextLhayef.totalOverride ?? Math.round(nextLhayef.lengthM * nextLhayef.pricePerMeter * 100) / 100
      : 0;
    const tabouriaTotal = nextTabouria.enabled
      ? nextTabouria.totalOverride ?? nextTabouria.count * nextTabouria.unitPrice
      : 0;
    const customTotal = nextCustomItems.reduce((s, i) => s + i.price, 0);
    const otherFlowsTotal = (draft.extras ?? []).reduce((s, e) => s + e.price * e.qty, 0);
    const stageTotal = lhayefTotal + tabouriaTotal + customTotal + otherFlowsTotal;

    onChange({
      extrasStage: {
        lhayef: nextLhayef,
        tabouria: nextTabouria,
        customItems: nextCustomItems,
        stageTotalOverride: draft.extrasStage?.stageTotalOverride ?? null,
      },
      stageTotals: {
        fabric: 0,
        seddars: 0,
        stitch: 0,
        cushions: 0,
        decor: 0,
        ...draft.stageTotals,
        extras: draft.extrasStage?.stageTotalOverride ?? stageTotal,
      },
    });
  };

  const updateLhayef = (next: LhayefSelection) => {
    setLhayef(next);
    commit(next, tabouria, customItems);
  };

  const updateTabouria = (patch: Partial<TabouriaSelection>) => {
    const next = { ...tabouria, ...patch };
    setTabouria(next);
    commit(lhayef, next, customItems);
  };

  const addCustomItem = (item: CustomExtraItem) => {
    const next = [...customItems, item];
    setCustomItems(next);
    commit(lhayef, tabouria, next);
  };

  const removeCustomItem = (id: string) => {
    const next = customItems.filter((i) => i.id !== id);
    setCustomItems(next);
    commit(lhayef, tabouria, next);
  };

  const tabouriaTotal = tabouria.enabled
    ? tabouria.totalOverride ?? tabouria.count * tabouria.unitPrice
    : 0;
  const lhayefTotal = lhayef.enabled
    ? lhayef.totalOverride ?? Math.round(lhayef.lengthM * lhayef.pricePerMeter * 100) / 100
    : 0;
  const customTotal = customItems.reduce((s, i) => s + i.price, 0);
  const otherFlowsTotal = (draft.extras ?? []).reduce((s, e) => s + e.price * e.qty, 0);
  const grandStageTotal = lhayefTotal + tabouriaTotal + customTotal + otherFlowsTotal;

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-28">
      {/* Header */}
      <div className="px-4 pt-5 pb-2">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="p-2 rounded-xl bg-gray-100 text-gray-600">
            <ArrowRight className="h-5 w-5" />
          </button>
          <div>
            <p className="text-gray-400 text-xs">الخطوة 6 من 9</p>
            <h2 className="text-xl font-bold text-[#0D1F17]">➕ الإضافات</h2>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: '66%', background: '#C9A84C' }} />
        </div>
      </div>

      {/* اللحايف */}
      <LhayefCard value={lhayef} autoLengthM={autoLengthM} onChange={updateLhayef} />

      {/* الطابورية */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#0D1F17]">🛋️ الطابورية</h3>
          <div className="flex overflow-hidden rounded-full border border-gray-200">
            <button
              onClick={() => updateTabouria({ enabled: true })}
              className={`px-4 py-1.5 text-sm font-semibold transition ${
                tabouria.enabled ? 'bg-[#1B5E3B] text-white' : 'bg-white text-gray-500'
              }`}
            >
              نعم
            </button>
            <button
              onClick={() => updateTabouria({ enabled: false })}
              className={`px-4 py-1.5 text-sm font-semibold transition ${
                !tabouria.enabled ? 'bg-gray-200 text-[#0D1F17]' : 'bg-white text-gray-500'
              }`}
            >
              لا
            </button>
          </div>
        </div>

        {tabouria.enabled && (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-dashed border-gray-200 pt-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">العدد</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateTabouria({ count: Math.max(1, tabouria.count - 1) })}
                  className="h-8 w-8 rounded-full bg-[#F5F0E8] text-[#1B5E3B] font-bold"
                >
                  −
                </button>
                <span className="w-6 text-center font-bold">{tabouria.count}</span>
                <button
                  onClick={() => updateTabouria({ count: tabouria.count + 1 })}
                  className="h-8 w-8 rounded-full bg-[#F5F0E8] text-[#1B5E3B] font-bold"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">الثمن للوحدة (يدوي)</label>
              <input
                type="number"
                min={0}
                value={tabouria.unitPrice}
                onChange={(e) => updateTabouria({ unitPrice: Number(e.target.value), totalOverride: null })}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-1.5 text-center font-semibold focus:border-[#1B5E3B] focus:outline-none"
              />
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-xl bg-[#F5F0E8] px-4 py-2.5">
              <span className="text-sm font-medium text-[#0D1F17]">مجموع الطابورية</span>
              <span className="font-bold text-[#1B5E3B]">{tabouriaTotal} DH</span>
            </div>
          </div>
        )}
      </div>

      {/* منتجات أخرى بمسار خاص */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-bold text-[#0D1F17]">🗂️ منتجات أخرى</h3>
        <p className="mb-3 text-xs text-gray-500">
          كل منتج له مسار اختيار خاص — بعد إتمامه يعود هنا تلقائياً بالعنصر مضافاً.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {OTHER_PRODUCTS.map((p) => (
            <button
              key={p.key}
              onClick={() => onNavigateToProductFlow?.(p.key)}
              disabled={!onNavigateToProductFlow}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 py-3 text-[#1B5E3B] transition hover:border-[#1B5E3B] hover:bg-[#F5F0E8] disabled:opacity-40"
            >
              {p.icon}
              <span className="text-xs font-semibold text-[#0D1F17]">{p.label}</span>
            </button>
          ))}
        </div>
        {(draft.extras ?? []).length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-dashed border-gray-200 pt-3">
            {(draft.extras ?? []).map((e, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {e.name} × {e.qty}
                </span>
                <span className="font-semibold text-[#0D1F17]">{e.price * e.qty} DH</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* عناصر مخصصة */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#0D1F17]">🧩 عناصر مخصصة</h3>
          <button
            onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-1 rounded-lg bg-[#1B5E3B] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#164a30]"
          >
            <Plus className="h-3.5 w-3.5" /> إضافة
          </button>
        </div>
        {customItems.length === 0 ? (
          <p className="mt-2 text-xs text-gray-400">لا توجد عناصر مخصصة بعد.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {customItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-[#F5F0E8] px-3 py-2">
                <div className="flex items-center gap-2">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                  )}
                  <span className="text-sm font-medium text-[#0D1F17]">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1B5E3B]">{item.price} DH</span>
                  <button onClick={() => removeCustomItem(item.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ملخص المرحلة */}
      <div className="sticky bottom-0 -mx-4 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">مجموع الإضافات</p>
            <p className="text-lg font-bold text-[#1B5E3B]">{grandStageTotal} DH</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-2.5 font-medium text-gray-600 hover:bg-gray-50"
            >
              <ArrowRight className="h-4 w-4" /> السابق
            </button>
            <button
              onClick={onNext}
              className="flex items-center gap-1 rounded-xl bg-[#1B5E3B] px-6 py-2.5 font-bold text-white hover:bg-[#164a30]"
            >
              التالي <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <CustomExtraModal
        open={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onAdd={addCustomItem}
      />
    </div>
  );
}