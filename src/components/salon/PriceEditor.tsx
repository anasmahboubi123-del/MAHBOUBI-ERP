'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { FabricItem } from '@/lib/types';
import PinLock from '@/components/ui/PinLock';

interface PriceEditorProps {
  fabric: FabricItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (newPrice: number) => void;
}

export default function PriceEditor({ fabric, open, onClose, onSave }: PriceEditorProps) {
  const [adminOk, setAdminOk] = useState(false);
  const [newPrice, setNewPrice] = useState('');

  if (!open || !fabric) return null;

  const handleSave = () => {
    const price = Number(newPrice);
    if (price > 0) {
      onSave(price);
      onClose();
      setAdminOk(false);
      setNewPrice('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute left-3 top-3 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-6 text-center text-xl font-bold text-[#0D1F17]">
          تعديل ثمن الثوب
        </h2>

        {!adminOk ? (
          <div className="py-4">
            <p className="mb-4 text-center text-gray-600">
              أدخل كود المدير للتعديل على هذه الطلبية
            </p>
            <PinLock
              role="admin"
              onSuccess={() => setAdminOk(true)}
              onCancel={onClose}
            />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl bg-[#F5F0E8] p-4 text-center border border-[#C9A84C]/20">
              <p className="text-sm text-gray-600 mb-1">{fabric.name}</p>
              <p className="text-sm text-gray-500">الثمن الحالي</p>
              <p className="text-3xl font-bold text-[#1B5E3B] mt-1">
                {fabric.price_per_meter.toLocaleString('fr-MA')} DH
                <span className="mr-1 text-base font-normal text-gray-500">/متر</span>
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                الثمن الجديد (DH/متر)
              </label>
              <input
                type="number"
                dir="ltr"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="أدخل الثمن الجديد"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20 transition"
                autoFocus
              />
            </div>

            <button
              onClick={handleSave}
              disabled={!newPrice || Number(newPrice) <= 0}
              className="w-full rounded-xl bg-[#1B5E3B] py-3.5 text-lg font-bold text-white transition hover:bg-[#144d30] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#1B5E3B]/20"
            >
              💾 حفظ للطلبية
            </button>

            <p className="text-center text-xs text-gray-400 leading-relaxed">
              هذا التعديل يخص <b>هذه الطلبية فقط</b> — لا يغيّر سعر الثوب في الكتالوج
            </p>
          </div>
        )}
      </div>
    </div>
  );
}