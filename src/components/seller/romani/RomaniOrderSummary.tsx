"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowLeft, Check, ImageIcon, FileText } from "lucide-react";
import Image from "next/image";
import { RomaniModel, RomaniColor, RomaniSeddari } from "@/types/romani.types";
import { getPublicImageUrl } from "@/lib/supabase-seller";

interface RomaniOrderSummaryProps {
  model: RomaniModel;
  color: RomaniColor;
  seddars: RomaniSeddari[];
  onBack: () => void;
  onAddToCart: (notes: string) => void;
}

export default function RomaniOrderSummary({
  model,
  color,
  seddars,
  onBack,
  onAddToCart,
}: RomaniOrderSummaryProps) {
  const [notes, setNotes] = useState("");
  const [added, setAdded] = useState(false);

  const modelImage = model.image_url
    ? getPublicImageUrl("site-assets", model.image_url)
    : null;
  const colorImage = color.image_url
    ? getPublicImageUrl("site-assets", color.image_url)
    : null;

  const totalLengthMeters = seddars.reduce((sum, s) => sum + s.length_cm / 100, 0);
  const totalKotikMeters = seddars.reduce(
    (sum, s) => sum + (s.has_kotik ? s.kotik_count : 0),
    0
  );
  const totalFormajaMeters = seddars.reduce(
    (sum, s) => sum + (s.has_formaja ? s.formaja_length_meters : 0),
    0
  );
  const totalMeters = totalLengthMeters + totalKotikMeters;
  const totalPrice = seddars.reduce((sum, s) => sum + s.total_price, 0);

  const handleAdd = () => {
    onAddToCart(notes);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ملخص الطلب</h2>
        <p className="text-gray-500">راجِع تفاصيل طلبك قبل الإضافة للسلة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-bold mb-2 text-right">الشكل المختار</p>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#F5F0E8] flex-shrink-0">
              {modelImage ? (
                <Image src={modelImage} alt={model.name} fill className="object-cover" sizes="80px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-300" />
                </div>
              )}
            </div>
            <div className="text-right flex-1">
              <h3 className="font-bold text-gray-900">{model.name}</h3>
              <p className="text-[#C9A84C] font-bold">
                {model.price_per_meter.toLocaleString()} درهم/متر
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-bold mb-2 text-right">اللون المختار</p>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#F5F0E8] flex-shrink-0">
              {colorImage ? (
                <Image src={colorImage} alt={color.name} fill className="object-cover" sizes="80px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-300" />
                </div>
              )}
            </div>
            <div className="text-right flex-1">
              <h3 className="font-bold text-gray-900">{color.name}</h3>
              <p className="text-gray-500 text-sm">لون القماش</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-right">تفاصيل السدادر</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">#</th>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">الطول</th>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">الكوتيك</th>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">الفورمجة</th>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">السعر/م</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">المجموع</th>
              </tr>
            </thead>
            <tbody>
              {seddars.map((s, i) => (
                <tr key={s.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 text-right text-sm text-gray-600">{i + 1}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {s.length_cm} سم
                    <span className="text-gray-400 mr-1">({(s.length_cm / 100).toFixed(2)} م)</span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {s.has_kotik ? (
                      <span className="text-[#C9A84C] font-bold">
                        {s.kotik_count} كوتية (+{s.kotik_count} م)
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {s.has_formaja ? (
                      <span className="text-emerald-600 font-bold">
                        🧽 {s.formaja_length_meters} م
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {s.price_per_meter.toLocaleString()} درهم
                  </td>
                  <td className="px-4 py-3 text-left text-sm font-bold text-[#1B5E3B]">
                    {s.total_price.toLocaleString()} درهم
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0D1F17] rounded-2xl p-6 text-white"
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center mb-4">
          <div>
            <p className="text-gray-400 text-sm mb-1">عدد السدادر</p>
            <p className="text-xl font-bold">{seddars.length}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">الطول الكلي</p>
            <p className="text-xl font-bold">{totalLengthMeters.toFixed(2)} م</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">الكوتيك</p>
            <p className="text-xl font-bold text-[#C9A84C]">+{totalKotikMeters} م</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">الفورمجة</p>
            <p className="text-xl font-bold text-emerald-400">{totalFormajaMeters.toFixed(2)} م</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">المجموع الكلي</p>
            <p className="text-xl font-bold text-[#C9A84C]">{totalMeters.toFixed(2)} م</p>
          </div>
        </div>
        <div className="pt-4 border-t border-white/10 text-center">
          <p className="text-gray-400 text-sm mb-1">السعر الإجمالي</p>
          <p className="text-4xl font-bold text-[#C9A84C]">
            {totalPrice.toLocaleString()} درهم
          </p>
        </div>
      </motion.div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <label className="text-sm font-bold text-gray-700">ملاحظات (اختياري)</label>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="أي ملاحظات خاصة بالطلب..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20 focus:border-[#1B5E3B]/30 resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          رجوع
        </button>
        <motion.button
          onClick={handleAdd}
          disabled={added}
          whileTap={{ scale: 0.98 }}
          className={`flex-[2] py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
            added
              ? "bg-green-500 text-white"
              : "bg-[#1B5E3B] text-white hover:bg-[#1B5E3B]/90"
          }`}
        >
          {added ? (
            <>
              <Check className="w-5 h-5" />
              تمت الإضافة!
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              إضافة إلى السلة
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}