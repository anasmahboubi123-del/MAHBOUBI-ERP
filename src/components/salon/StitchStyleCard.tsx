"use client";

import Image from "next/image";
import { Info, Pencil, Check } from "lucide-react";

export interface StitchStyle {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  gallery?: string[] | null;
  description?: string | null;
}

interface StitchStyleCardProps {
  style: StitchStyle;
  selected: boolean;
  onSelect: () => void;
  onEditPrice: () => void;
  onShowInfo: () => void;
}

export default function StitchStyleCard({
  style,
  selected,
  onSelect,
  onEditPrice,
  onShowInfo,
}: StitchStyleCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`
        relative cursor-pointer rounded-2xl border-2 p-3 transition-all duration-200
        ${selected
          ? "border-[#C9A84C] bg-[#F5F0E8] shadow-lg shadow-[#C9A84C]/20"
          : "border-gray-200 bg-white hover:border-[#1B5E3B]/40 hover:shadow-md"
        }
      `}
    >
      {/* صورة */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
        {style.image_url ? (
          <Image
            src={style.image_url}
            alt={style.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 20vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm">
            ✂️
          </div>
        )}

        {/* أزرار */}
        <div className="absolute left-2 top-2 flex gap-1.5" dir="ltr">
          <button
            onClick={(e) => { e.stopPropagation(); onShowInfo(); }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#1B5E3B] shadow-sm backdrop-blur-sm transition hover:bg-white"
            title="معلومات"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEditPrice(); }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-amber-600 shadow-sm backdrop-blur-sm transition hover:bg-white"
            title="تعديل الثمن"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>

        {selected && (
          <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#1B5E3B] text-white shadow-md">
            <Check className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* معلومات */}
      <div className="mt-2.5 text-center">
        <h4 className="font-bold text-[#0D1F17] text-sm">{style.name}</h4>
        <p className="mt-1 text-base font-extrabold text-[#1B5E3B]">
          {style.price.toLocaleString("fr-MA")}
          <span className="mr-1 text-xs font-normal text-gray-500">DH/سداري</span>
        </p>
      </div>
    </div>
  );
}