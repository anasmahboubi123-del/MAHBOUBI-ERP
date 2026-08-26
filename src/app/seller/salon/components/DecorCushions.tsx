'use client';
import { DEFAULTS } from '@/lib/calculations';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type DecorCushionPlan = {
  shape: string;
  count: number;
  stitchPrice: number;
};

/** المرحلة 4: مخاد الديكور */
export default function DecorCushions({
  decor,
  onChange
}: {
  decor: DecorCushionPlan[];
  onChange: (d: DecorCushionPlan[]) => void;
}) {
  function patch(i: number, p: Partial<DecorCushionPlan>) {
    onChange(decor.map((d, x) => (x === i ? { ...d, ...p } : d)));
  }

  return (
    <div className="space-y-4">
      {decor.length === 0 && <p className="text-gray-400">لم تُضف مخاد ديكور بعد (اختياري)</p>}
      {decor.map((d, i) => (
        <Card key={i} className="flex flex-wrap items-center gap-4">
          <input
            value={d.shape}
            onChange={(e) => patch(i, { shape: e.target.value })}
            placeholder="الشكل (مربع، دائري، أسطوانة...)"
            className="rounded-xl border px-3 py-2"
          />
          <div className="flex items-center gap-3" dir="ltr">
            <button onClick={() => patch(i, { count: Math.max(1, d.count - 1) })} className="h-10 w-10 rounded-full bg-gray-100 text-xl font-bold">-</button>
            <span className="w-8 text-center text-xl font-bold">{d.count}</span>
            <button onClick={() => patch(i, { count: d.count + 1 })} className="h-10 w-10 rounded-full bg-gray-100 text-xl font-bold">+</button>
          </div>
          <div className="flex gap-2">
            {DEFAULTS.decorStitchPrices.map((p) => (
              <button
                key={p}
                onClick={() => patch(i, { stitchPrice: p })}
                className={`rounded-xl px-3 py-2 font-bold ${d.stitchPrice === p ? 'bg-brand-600 text-white' : 'bg-gray-100'}`}
              >
                {p} DH
              </button>
            ))}
          </div>
          <button onClick={() => onChange(decor.filter((_, x) => x !== i))} className="mr-auto rounded-lg bg-red-100 px-3 py-1">🗑️</button>
        </Card>
      ))}
      <Button variant="secondary" onClick={() => onChange([...decor, { shape: '', count: 1, stitchPrice: DEFAULTS.decorStitchPrices[0] }])}>
        + إضافة مخدة ديكور
      </Button>
    </div>
  );
}
