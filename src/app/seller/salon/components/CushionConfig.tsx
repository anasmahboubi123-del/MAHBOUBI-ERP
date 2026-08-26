'use client';
import { useEffect } from 'react';
import { Seddari } from '@/lib/types';
import { DEFAULTS, suggestedCushionCount } from '@/lib/calculations';
import Card from '@/components/ui/Card';

type CushionPlan = {
  seddariId: string;
  size: number;
  count: number;
  stitchPrice: number;
  stuffing: boolean;
};

/** المرحلة 3: المخاد مع الحساب التلقائي الذكي */
export default function CushionConfig({
  seddars,
  cushions,
  onChange
}: {
  seddars: Seddari[];
  cushions: CushionPlan[];
  onChange: (c: CushionPlan[]) => void;
}) {
  // مزامنة خطط المخاد مع السدادر + اقتراح تلقائي
  useEffect(() => {
    const synced = seddars.map((s) => {
      const existing = cushions.find((c) => c.seddariId === s.id);
      if (existing) return existing;
      const size = 100;
      return { seddariId: s.id, size, count: suggestedCushionCount(s.length, size), stitchPrice: DEFAULTS.cushionStitchPrices[0], stuffing: false };
    });
    if (JSON.stringify(synced) !== JSON.stringify(cushions)) onChange(synced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seddars]);

  function patch(seddariId: string, p: Partial<CushionPlan>) {
    onChange(cushions.map((c) => (c.seddariId === seddariId ? { ...c, ...p } : c)));
  }

  return (
    <div className="space-y-4">
      {seddars.map((s, i) => {
        const c = cushions.find((x) => x.seddariId === s.id);
        if (!c) return null;
        return (
          <Card key={s.id}>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-bold">سداري {i + 1} <span className="text-sm font-normal text-gray-500">({s.length} cm)</span></span>
              <span className="text-sm text-brand-700">💡 المقترح: {suggestedCushionCount(s.length, c.size)} وسادة</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <span className="block text-sm font-semibold text-gray-600">حجم الوسادة</span>
                <div className="flex gap-2">
                  {DEFAULTS.cushionSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => patch(s.id, { size, count: suggestedCushionCount(s.length, size) })}
                      className={`rounded-xl px-4 py-2 font-bold ${c.size === size ? 'bg-brand-600 text-white' : 'bg-gray-100'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="block text-sm font-semibold text-gray-600">العدد</span>
                <div className="flex items-center gap-3" dir="ltr">
                  <button onClick={() => patch(s.id, { count: Math.max(0, c.count - 1) })} className="h-10 w-10 rounded-full bg-gray-100 text-xl font-bold">-</button>
                  <span className="w-8 text-center text-xl font-bold">{c.count}</span>
                  <button onClick={() => patch(s.id, { count: c.count + 1 })} className="h-10 w-10 rounded-full bg-gray-100 text-xl font-bold">+</button>
                </div>
              </div>
              <div>
                <span className="block text-sm font-semibold text-gray-600">ثمن الخياطة (DH/وسادة)</span>
                <div className="flex gap-2">
                  {DEFAULTS.cushionStitchPrices.map((p) => (
                    <button
                      key={p}
                      onClick={() => patch(s.id, { stitchPrice: p })}
                      className={`rounded-xl px-3 py-2 font-bold ${c.stitchPrice === p ? 'bg-brand-600 text-white' : 'bg-gray-100'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={c.stuffing} onChange={(e) => patch(s.id, { stuffing: e.target.checked })} className="h-5 w-5" />
                <span className="font-semibold">حشو (لواط) +{DEFAULTS.stuffingPrice} DH/وسادة</span>
              </label>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
