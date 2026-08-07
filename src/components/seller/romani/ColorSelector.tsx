"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, ImageIcon } from "lucide-react";
import Image from "next/image";
import { RomaniColor } from "@/types/romani.types";
import { getPublicImageUrl } from "@/lib/supabase-seller";

interface ColorSelectorProps {
  colors: RomaniColor[];
  selectedColor: RomaniColor | null;
  onSelect: (color: RomaniColor) => void;
}

export default function ColorSelector({ colors, selectedColor, onSelect }: ColorSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">اختيار لون القماش</h2>
        <p className="text-gray-500">اختر اللون المناسب للصالون الرومي</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {colors.map((color, index) => {
          const isSelected = selectedColor?.id === color.id;
          const imageUrl = color.image_url
            ? getPublicImageUrl("site-assets", color.image_url)
            : null;

          return (
            <motion.div
              key={color.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <button
                onClick={() => onSelect(color)}
                className={`group w-full relative overflow-hidden rounded-2xl bg-white border-2 transition-all duration-300 text-right ${
                  isSelected
                    ? "border-[#1B5E3B] shadow-lg shadow-[#1B5E3B]/10 ring-2 ring-[#1B5E3B]/20"
                    : "border-gray-100 hover:border-gray-300 hover:shadow-md"
                }`}
              >
                {/* Color Image */}
                <div className="relative h-32 overflow-hidden bg-[#F5F0E8]">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={color.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-gray-300" />
                    </div>
                  )}

                  {/* Selected Overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#1B5E3B]/20 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#1B5E3B] flex items-center justify-center shadow-lg">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Color Name */}
                <div className="p-3 text-center">
                  <span className={`font-bold text-sm ${isSelected ? "text-[#1B5E3B]" : "text-gray-700"}`}>
                    {color.name}
                  </span>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {colors.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <ImageIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">لا توجد ألوان متاحة</p>
        </div>
      )}
    </div>
  );
}