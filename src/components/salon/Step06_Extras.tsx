"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ArrowLeft, Plus, Trash2, Layers } from "lucide-react";
import type { OrderDraft, LhayefSelection, TabouriaSelection, CustomExtraItem } from "@/lib/types";

interface Step06Props {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

const DEFAULT_LHAYEF: LhayefSelection = {
  enabled: false,
  lengthM: 0,
  lengthOverridden: false,
  colorName: "",
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

export default function Step06_Extras({ draft, onChange, onNext, onBack }: Step06Props) {
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
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");

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
    const stageTotal = lhayefTotal + tabouriaTotal + customTotal;

    onChange({
      extrasStage: {
        lhayef: nextLhayef,
        tabouria: nextTabouria,
        customItems: nextCustomItems,
        stageTotalOverride: draft.extrasStage?.stageTotalOverride ?? null,
      },
      stageTotals: {
        ...draft.stageTotals,
        extras: stageTotal,
      },
    });
  };

  const updateLhayef = (patch: Partial<LhayefSelection>) => {
    const next = { ...lhayef, ...patch };
    setLhayef(next);
    commit(next, tabouria, customItems);
  };

  const updateTabouria = (patch: Partial<TabouriaSelection>) => {
    const next = { ...tabouria, ...patch };
    setTabouria(next);
    commit(lhayef, next, customItems);
  };

  const addCustomItem = () => {
    const price = Number(customPrice);
    if (!customName || price <= 0) return;
    const item: CustomExtraItem = {
      id: `extra-${Date.now()}`,
      name: customName,
      imageUrl: null,
      price,
    };
    const next = [...customItems, item];
    setCustomItems(next);
    commit(lhayef, tabouria, next);
    setCustomName("");
    setCustomPrice("");
    setShowCustomForm(false);
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
  const grandStageTotal = lhayefTotal + tabouriaTotal + customTotal;

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-28">
      {/* Header */}
      <div className="px-4 pt-5 pb-2">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="p-2 rounded-xl bg-gray-100 text-gray-600">
            <ArrowRight className="h-5 w-5" />
          </button>
          <div>
            <p className="text-gray-400 text-xs">الخطوة 6 من 7</p>
            <h2 className="text-xl font-bold text-[#0D1F17]">➕ الإضافات</h2>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: "85%", background: "#C9A84C" }} />
        </div>
      </div>

      {/* اللحايف */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#0D1F17]">🧵 اللحايف</h3>
          <div className="flex overflow-hidden rounded-full border border-gray-200">
            <button
              onClick={() => updateLhayef({ enabled: true, lengthM: autoLengthM })}
              className={`px-4 py-1.5 text-sm font-semibold transition ${
                lhayef.enabled ? "bg-[#1B5E3B] text-white" : "bg-white text-gray-500"
              }`}
            >
              نعم
            </button>
            <button
              onClick={() => updateLhayef({ enabled: false })}
              className={`px-4 py-1.5 text-sm font-semibold transition ${
                !lhayef.enabled ? "bg-gray-200 text-[#0D1F17]" : "bg-white text-gray-500"
              }`}
            >
              لا
            </button>
          </div>
        </div>

        {lhayef.enabled && (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-dashed border-gray-200 pt-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">الطول (متر)</label>
              <input
                type="number"
                step="0.1"
                value={lhayef.lengthM}
                onChange={(e) => updateLhayef({ lengthM: Number(e.target.value), totalOverride: null })}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-center font-semibold focus:border-[#1B5E3B] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">السعر لكل متر</label>
              <input
                type="number"
                value={lhayef.pricePerMeter}
                onChange={(e) => updateLhayef({ pricePerMeter: Number(e.target.value), totalOverride: null })}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-center font-semibold focus:border-[#1B5E3B] focus:outline-none"
              />
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-xl bg-[#F5F0E8] px-4 py-2.5">
              <span className="text-sm font-medium text-[#0D1F17]">مجموع اللحايف</span>
              <span className="font-bold text-[#1B5E3B]">{lhayefTotal.toFixed(2)} DH</span>
            </div>
          </div>
        )}
      </div>

      {/* الطابورية */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#0D1F17]">🛋️ الطابورية</h3>
          <div className="flex overflow-hidden rounded-full border border-gray-200">
            <button
              onClick={() => updateTabouria({ enabled: true })}
              className={`px-4 py-1.5 text-sm font-semibold transition ${
                tabouria.enabled ? "bg-[#1B5E3B] text-white" : "bg-white text-gray-500"
              }`}
            >
              نعم
            </button>
            <button
              onClick={() => updateTabouria({ enabled: false })}
              className={`px-4 py-1.5 text-sm font-semibold transition ${
                !tabouria.enabled ? "bg-gray-200 text-[#0D1F17]" : "bg-white text-gray-500"
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
              <label className="mb-1 block text-xs font-medium text-gray-500">الثمن للوحدة (DH)</label>
              <input
                type="number"
                min={0}
                value={tabouria.unitPrice}
                onChange={(e) => updateTabouria({ unitPrice: Number(e.target.value), totalOverride: null })}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-center font-semibold focus:border-[#1B5E3B] focus:outline-none"
              />
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-xl bg-[#F5F0E8] px-4 py-2.5">
              <span className="text-sm font-medium text-[#0D1F17]">مجموع الطابورية</span>
              <span className="font-bold text-[#1B5E3B]">{tabouriaTotal.toFixed(2)} DH</span>
            </div>
          </div>
        )}
      </div>

      {/* عناصر مخصصة */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#0D1F17]">✨ عناصر مخصصة</h3>
          <button
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="flex items-center gap-1 rounded-lg bg-[#F5F0E8] px-3 py-1.5 text-xs font-bold text-[#1B5E3B]"
          >
            <Plus className="h-3.5 w-3.5" />
            إضافة
          </button>
        </div>

        {showCustomForm && (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-dashed border-gray-200 pt-3">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="اسم العنصر"
              className="rounded-xl border-2 border-gray-200 px-3 py-2 text-sm focus:border-[#1B5E3B] focus:outline-none"
            />
            <input
              type="number"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              placeholder="الثمن (DH)"
              className="rounded-xl border-2 border-gray-200 px-3 py-2 text-sm text-center focus:border-[#1B5E3B] focus:outline-none"
            />
            <button
              onClick={addCustomItem}
              disabled={!customName || Number(customPrice) <= 0}
              className="col-span-2 rounded-xl bg-[#1B5E3B] py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              حفظ
            </button>
          </div>
        )}

        {customItems.length > 0 && (
          <div className="mt-3 space-y-2">
            {customItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-sm text-gray-700">{item.name}</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#1B5E3B]">{item.price.toFixed(2)} DH</span>
                  <button onClick={() => removeCustomItem(item.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* المجموع */}
      <div className="rounded-2xl border-2 border-[#C9A84C] bg-white p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">مجموع الإضافات</p>
            <p className="mt-1 text-3xl font-extrabold text-[#1B5E3B]">
              {grandStageTotal.toFixed(2)} DH
            </p>
          </div>
          <Layers className="h-10 w-10 text-[#C9A84C]" />
        </div>
      </div>

      {/* زر التالي */}
      <div className="px-4">
        <button
          onClick={onNext}
          className="w-full rounded-xl bg-[#1B5E3B] py-3.5 text-lg font-bold text-white shadow-lg shadow-[#1B5E3B]/20 transition hover:bg-[#144d30]"
        >
          <span className="flex items-center justify-center gap-2">
            التالي
            <ArrowLeft className="h-5 w-5" />
          </span>
        </button>
      </div>
    </div>
  );
}
