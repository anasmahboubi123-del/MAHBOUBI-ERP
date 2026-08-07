"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Check, X, ImageIcon } from "lucide-react";
import Image from "next/image";
import { RomaniModel } from "@/types/romani.types";
import { getPublicImageUrl } from "@/lib/supabase-seller";

interface ModelSelectorProps {
  models: RomaniModel[];
  selectedModel: RomaniModel | null;
  onSelect: (model: RomaniModel, customPrice?: number) => void;
}

export default function ModelSelector({ models, selectedModel, onSelect }: ModelSelectorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");

  const startEdit = (model: RomaniModel, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(model.id);
    setEditPrice(model.price_per_meter.toString());
  };

  const saveEdit = (model: RomaniModel, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPrice = parseFloat(editPrice);
    if (!isNaN(newPrice) && newPrice > 0) {
      onSelect({ ...model, price_per_meter: newPrice }, newPrice);
    }
    setEditingId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">اختيار شكل الصالون الرومي</h2>
        <p className="text-gray-500">اختر الشكل المناسب ويمكنك تعديل السعر عند الحاجة</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((model, index) => {
          const isSelected = selectedModel?.id === model.id;
          const isEditing = editingId === model.id;
          const imageUrl = model.image_url
            ? getPublicImageUrl("site-assets", model.image_url)
            : null;

          return (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
            >
              <div
                onClick={() => !isEditing && onSelect(model)}
                className={`group relative overflow-hidden rounded-2xl bg-white border-2 transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? "border-[#1B5E3B] shadow-lg shadow-[#1B5E3B]/10"
                    : "border-gray-100 hover:border-gray-300 hover:shadow-md"
                }`}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-[#F5F0E8]">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={model.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-300" />
                    </div>
                  )}

                  {/* Edit Price Button */}
                  {!isEditing && (
                    <button
                      onClick={(e) => startEdit(model, e)}
                      className="absolute top-3 left-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-white transition-colors"
                      title="تعديل السعر"
                    >
                      <Pencil className="w-4 h-4 text-[#1B5E3B]" />
                    </button>
                  )}

                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#1B5E3B] flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 text-right">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{model.name}</h3>

                  {isEditing ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">السعر للمتر (درهم)</label>
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20 text-right"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={(e) => saveEdit(model, e)}
                        className="p-2 rounded-lg bg-[#1B5E3B] text-white hover:bg-[#1B5E3B]/90 transition-colors mt-5"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors mt-5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-[#C9A84C] font-bold text-lg">
                        {model.price_per_meter.toLocaleString()} درهم/متر
                      </span>
                      {isSelected && (
                        <span className="text-xs text-[#1B5E3B] font-medium bg-[#1B5E3B]/10 px-2 py-1 rounded-full">
                          مختار
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {models.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <ImageIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">لا توجد نماذج متاحة</p>
        </div>
      )}
    </div>
  );
}