'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ExtraLine } from '@/lib/types';
import Card from '@/components/ui/Card';

const FALLBACK: ExtraLine[] = [
  { name: 'لحايف', price: 100, qty: 0 },
  { name: 'طابورية', price: 400, qty: 0 },
  { name: 'بونج', price: 0, qty: 0 }
];

/** المرحلة 5: الإضافات */
export default function ExtrasSelector({
  extras,
  onChange
}: {
  extras: ExtraLine[];
  onChange: (e: ExtraLine[]) => void;
}) {
  const [items, setItems] = useState<ExtraLine[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('extras').select('name, price').eq('active', true).order('name');
      const source: { name: string; price: number }[] = data?.length ? data : FALLBACK;
      const base: ExtraLine[] = source.map((x) => ({
        name: x.name,
        price: Number(x.price ?? 0),
        qty: extras.find((e) => e.name === x.name)?.qty ?? 0
      }));
      setItems(base);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setQty(name: string, qty: number) {
    const next = items.map((i) => (i.name === name ? { ...i, qty: Math.max(0, qty) } : i));
    setItems(next);
    onChange(next.filter((i) => i.qty > 0));
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {items.map((i) => (
        <Card key={i.name} className="flex items-center justify-between">
          <div>
            <div className="font-bold">{i.name}</div>
            <div className="text-brand-700">{i.price} DH</div>
          </div>
          <div className="flex items-center gap-3" dir="ltr">
            <button onClick={() => setQty(i.name, i.qty - 1)} className="h-10 w-10 rounded-full bg-gray-100 text-xl font-bold">-</button>
            <span className="w-8 text-center text-xl font-bold">{i.qty}</span>
            <button onClick={() => setQty(i.name, i.qty + 1)} className="h-10 w-10 rounded-full bg-gray-100 text-xl font-bold">+</button>
          </div>
        </Card>
      ))}
    </div>
  );
}
