'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, RotateCcw, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { LhayefSelection } from '@/lib/types';

interface LhayefCardProps {
  value: LhayefSelection;
  autoLengthM: number;
  onChange: (next: LhayefSelection) => void;
}

export default function LhayefCard({ value, autoLengthM, onChange }: LhayefCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const total = value.totalOverride ?? Math.round(value.lengthM * value.pricePerMeter * 100) / 100;

  const patch = (p: Partial<LhayefSelection>) => onChange({ ...value, ...p });

  const handleToggle = (enabled: boolean) => {
    if (enabled && !value.lengthOverridden) {
      patch({ enabled, lengthM: autoLengthM });
    } else {
      patch({ enabled });
    }
  };

  const resetToAutoLength = () => {
    patch({ lengthM: autoLengthM, lengthOverridden: false });
  };

  const handlePhotoPick = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `lhayef/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('extras').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('extras').getPublicUrl(path);
      patch({ photoUrl: data.publicUrl });
    } catch (err) {
      console.error('لم يتم رفع صورة اللون:', err);
      alert('تعذّر رفع الصورة، حاول مرة أخرى');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[#0D1F17]">🧵 اللحايف</h3>
        <div className="flex overflow-hidden rounded-full border border-gray-200">
          <button
            onClick={() => handleToggle(true)}
            className={`px-4 py-1.5 text-sm font-semibold transition ${
              value.enabled ? 'bg-[#1B5E3B] text-white' : 'bg-white text-gray-500'
            }`}
          >
            نعم
          </button>
          <button
            onClick={() => handleToggle(false)}
            className={`px-4 py-1.5 text-sm font-semibold transition ${
              !value.enabled ? 'bg-gray-200 text-[#0D1F17]' : 'bg-white text-gray-500'
            }`}
          >
            لا
          </button>
        </div>
      </div>

      {value.enabled && (
        <div className="mt-4 space-y-4 border-t border-dashed border-gray-200 pt-4">
          {/* الطول */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              الطول (متر) — محسوب تلقائياً من مجموع السدادر
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min={0}
                value={value.lengthM}
                onChange={(e) =>
                  patch({ lengthM: Number(e.target.value), lengthOverridden: true })
                }
                className="w-28 rounded-xl border-2 border-gray-200 px-3 py-2 text-center font-semibold focus:border-[#1B5E3B] focus:outline-none"
              />
              <span className="text-sm text-gray-500">متر</span>
              {value.lengthOverridden && (
                <button
                  onClick={resetToAutoLength}
                  className="mr-auto flex items-center gap-1 text-xs text-[#1B5E3B] hover:underline"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  إعادة للحساب التلقائي ({autoLengthM} م)
                </button>
              )}
            </div>
          </div>

          {/* اللون: صورة أو اسم */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              اللون / النوع — صورة أو اسم مكتوب (ليعرف الخياط)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={value.colorName}
                onChange={(e) => patch({ colorName: e.target.value })}
                placeholder="مثال: أحمر جاكار"
                className="flex-1 rounded-xl border-2 border-gray-200 px-3 py-2 focus:border-[#1B5E3B] focus:outline-none"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handlePhotoPick(e.target.files?.[0])}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F0E8] text-[#1B5E3B] hover:bg-[#ECE3D2] disabled:opacity-50"
                title="التقاط / اختيار صورة اللون"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              </button>
            </div>
            {value.photoUrl && (
              <div className="mt-2 flex items-center gap-2">
                <img
                  src={value.photoUrl}
                  alt="لون اللحايف"
                  className="h-14 w-14 rounded-lg border border-gray-200 object-cover"
                />
                <button
                  onClick={() => patch({ photoUrl: null })}
                  className="text-xs text-red-500 hover:underline"
                >
                  إزالة الصورة
                </button>
              </div>
            )}
          </div>

          {/* السعر لكل متر (يدوي) */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              الثمن لكل متر (يدوي — يختلف حسب الثوب)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={value.pricePerMeter}
                onChange={(e) => patch({ pricePerMeter: Number(e.target.value), totalOverride: null })}
                className="w-28 rounded-xl border-2 border-gray-200 px-3 py-2 text-center font-semibold focus:border-[#1B5E3B] focus:outline-none"
              />
              <span className="text-sm text-gray-500">DH / متر</span>
            </div>
          </div>

          {/* المجموع + تعديل يدوي */}
          <div className="flex items-center justify-between rounded-xl bg-[#F5F0E8] px-4 py-3">
            <span className="text-sm font-medium text-[#0D1F17]">مجموع اللحايف</span>
            <div className="flex items-center gap-2">
              {value.totalOverride == null ? (
                <span className="font-bold text-[#1B5E3B]">{total} DH</span>
              ) : (
                <input
                  type="number"
                  min={0}
                  value={value.totalOverride}
                  onChange={(e) => patch({ totalOverride: Number(e.target.value) })}
                  className="w-24 rounded-lg border-2 border-[#C9A84C] px-2 py-1 text-center font-bold text-[#1B5E3B] focus:outline-none"
                />
              )}
              <button
                onClick={() =>
                  patch({
                    totalOverride:
                      value.totalOverride == null
                        ? Math.round(value.lengthM * value.pricePerMeter * 100) / 100
                        : null,
                  })
                }
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#C9A84C] hover:bg-[#C9A84C] hover:text-white"
                title="تعديل الثمن الإجمالي يدوياً"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}