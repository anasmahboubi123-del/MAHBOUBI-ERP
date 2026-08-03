'use client';

import { Trash2 } from 'lucide-react';
import { Seddari } from '@/lib/types';

interface Props {
  seddars: Seddari[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  totalOverride: number | null;
  onTotalOverride: (val: number | null) => void;
}

export default function SeddariList({ seddars, selectedId, onSelect, onDelete, totalOverride, onTotalOverride }: Props) {
  const fabricCm = (s: Seddari) => s.length + s.height * 2;
  const totalCm = seddars.reduce((sum, s) => sum + fabricCm(s), 0);
  const formajaExtra = seddars.filter((s) => s.junction === 'formaja').length * 250;
  const grandTotal = totalCm + formajaExtra;

  return (
    <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="font-bold text-[#0D1F17] mb-3 text-right">السدادر المضافة</h3>
      <div className="space-y-2">
        {seddars.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id === selectedId ? null : s.id)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-right ${
              s.id === selectedId
                ? 'border-[#1B5E3B] bg-[#F5F0E8]'
                : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div>
              <p className="font-bold text-sm text-[#0D1F17]">
                {s.length} × {s.width} × {s.height} cm
              </p>
              <p className="text-xs text-gray-500">
                ثوب: {fabricCm(s)} سم
                {s.junction === 'formaja' && ' + 250 سم فورمجة'}
                {s.junction === 'insert' && s.insertDirection === 'into_next' && ' (يدخل في التالي)'}
                {s.junction === 'insert' && s.insertDirection === 'from_next' && ' (يدخل فيه السابق)'}
                {s.junction === 'wooden_box' && ' (صندوق خشبي)'}
              </p>
            </div>
          </button>
        ))}
      </div>

      {seddars.length > 0 && (
        <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">المجموع الكلي للثوب</p>
            <div className="flex items-center gap-2">
              {totalOverride !== null && (
                <>
                  <span className="text-xs text-gray-400 line-through">{grandTotal} سم</span>
                  <button onClick={() => onTotalOverride(null)} className="text-xs text-red-400 underline">إلغاء</button>
                </>
              )}
              <p className="font-bold text-[#1B5E3B]">
                {totalOverride ?? grandTotal} سم = {((totalOverride ?? grandTotal) / 100).toFixed(1)} م
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}