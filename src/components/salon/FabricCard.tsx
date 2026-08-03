'use client';

import Image from 'next/image';
import { Info, Pencil, Check } from 'lucide-react';
import { FabricItem } from '@/lib/types';

interface FabricCardProps {
  fabric: FabricItem;
  selected: boolean;
  onSelect: () => void;
  onEditPrice: () => void;
  onShowInfo: () => void;
}

export default function FabricCard({
  fabric,
  selected,
  onSelect,
  onEditPrice,
  onShowInfo,
}: FabricCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`
        relative cursor-pointer rounded-2xl border-2 p-3 transition-all duration-200
        ${selected
          ? 'border-[#C9A84C] bg-[#F5F0E8] shadow-lg shadow-[#C9A84C]/20'
          : 'border-gray-200 bg-white hover:border-[#1B5E3B]/40 hover:shadow-md'
        }
      `}
    >
      {/* صورة الثوب */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100">
        {fabric.image_url ? (
          <Image
            src={fabric.image_url}
            alt={fabric.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm">
            لا توجد صورة
          </div>
        )}

        {/* أزرار الإجراءات */}
        <div className="absolute left-2 top-2 flex gap-1.5" dir="ltr">
          <button
            onClick={(e) => { e.stopPropagation(); onShowInfo(); }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#1B5E3B] shadow-sm backdrop-blur-sm transition hover:bg-white hover:scale-105"
            title="معلومات ومعرض الصور"
          >
            <Info className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEditPrice(); }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-amber-600 shadow-sm backdrop-blur-sm transition hover:bg-white hover:scale-105"
            title="تعديل الثمن (كود مدير)"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        {/* علامة التحديد */}
        {selected && (
          <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#1B5E3B] text-white shadow-md">
            <Check className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* معلومات الثوب */}
      <div className="mt-3 text-center">
        <h3 className="font-bold text-[#0D1F17] text-base">{fabric.name}</h3>
        {fabric.color && (
          <p className="mt-0.5 text-sm text-gray-500">{fabric.color}</p>
        )}
        <p className="mt-1.5 text-lg font-extrabold text-[#1B5E3B]">
          {fabric.price_per_meter.toLocaleString('fr-MA')}
          <span className="mr-1 text-sm font-normal text-gray-500">DH/متر</span>
        </p>
      </div>
    </div>
  );
}