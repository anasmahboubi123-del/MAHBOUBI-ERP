"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ArrowLeft, Calculator, ChevronUp, ChevronDown } from "lucide-react";
import { RomaniSeddari } from "@/types/romani.types";

interface SeddariCalculatorProps {
  pricePerMeter: number;
  seddars: RomaniSeddari[];
  onSeddarsChange: (seddars: RomaniSeddari[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function SeddariCalculator({
  pricePerMeter,
  seddars,
  onSeddarsChange,
  onNext,
  onBack,
}: SeddariCalculatorProps) {
  const [currentLength, setCurrentLength] = useState<string>("");
  const [hasKotik, setHasKotik] = useState(false);
  const [kotikCount, setKotikCount] = useState(1);
  const [hasFormaja, setHasFormaja] = useState(false);

  const calculateSeddariTotal = useCallback((lengthCm: number, kotikCnt: number, price: number): number => {
    const lengthMeters = lengthCm / 100;
    const kotikMeters = kotikCnt * 1;
    const totalMeters = lengthMeters + kotikMeters;
    return Number((totalMeters * price).toFixed(2));
  }, []);

  const addSeddari = () => {
    const lengthCm = parseFloat(currentLength);
    if (isNaN(lengthCm) || lengthCm <= 0) return;

    const lengthMeters = lengthCm / 100;
    const kotikMeters = hasKotik ? kotikCount * 1 : 0;

    const newSeddari: RomaniSeddari = {
      id: `seddari_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      length_cm: lengthCm,
      has_kotik: hasKotik,
      kotik_count: hasKotik ? kotikCount : 0,
      has_formaja: hasFormaja,
      formaja_length_meters: hasFormaja ? Number(lengthMeters.toFixed(2)) : 0,
      price_per_meter: pricePerMeter,
      total_price: calculateSeddariTotal(lengthCm, kotikMeters, pricePerMeter),
    };

    onSeddarsChange([...seddars, newSeddari]);
    setCurrentLength("");
    setHasKotik(false);
    setKotikCount(1);
    setHasFormaja(false);
  };

  const removeSeddari = (id: string) => {
    onSeddarsChange(seddars.filter((s) => s.id !== id));
  };

  const updateSeddariPrice = (id: string, newPrice: number) => {
    onSeddarsChange(
      seddars.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            price_per_meter: newPrice,
            total_price: calculateSeddariTotal(s.length_cm, s.has_kotik ? s.kotik_count : 0, newPrice),
          };
        }
        return s;
      })
    );
  };

  const totalLengthMeters = seddars.reduce((sum, s) => sum + s.length_cm / 100, 0);
  const totalKotikMeters = seddars.reduce((sum, s) => sum + (s.has_kotik ? s.kotik_count : 0), 0);
  const totalFormajaMeters = seddars.reduce((sum, s) => sum + (s.has_formaja ? s.formaja_length_meters : 0), 0);
  const totalMeters = totalLengthMeters + totalKotikMeters;
  const totalPrice = seddars.reduce((sum, s) => sum + s.total_price, 0);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">حساب السدادر</h2>
        <p className="text-gray-500">
          أدخل طول كل سداري بالسنتيمتر. السعر الحالي:{" "}
          <span className="font-bold text-[#C9A84C]">{pricePerMeter.toLocaleString()} درهم/متر</span>
        </p>
      </div>

      {/* Add New Seddari Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Length Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
              طول السداري (سم)
            </label>
            <input
              type="number"
              value={currentLength}
              onChange={(e) => setCurrentLength(e.target.value)}
              placeholder="مثال: 200"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-right text-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20 focus:border-[#1B5E3B]/30 transition-all"
            />
            {currentLength && (
              <p className="text-xs text-gray-400 mt-1 text-right">
                = {(parseFloat(currentLength) / 100).toFixed(2)} متر
              </p>
            )}
          </div>

          {/* Kotik Toggle */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
              هل يوجد كوتيك؟
            </label>
            <button
              onClick={() => setHasKotik(!hasKotik)}
              className={`w-full px-4 py-3 rounded-xl border-2 text-right font-bold transition-all ${
                hasKotik
                  ? "border-[#1B5E3B] bg-[#1B5E3B]/5 text-[#1B5E3B]"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {hasKotik ? "نعم، يوجد كوتيك" : "لا يوجد كوتيك"}
            </button>
          </div>
        </div>

        {/* Kotik Count */}
        <AnimatePresence>
          {hasKotik && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#F5F0E8] rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <p className="font-bold text-gray-900">عدد الكوتيك</p>
                    <p className="text-sm text-gray-500">كل كوتية = 1 متر إضافي</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setKotikCount(Math.max(1, kotikCount - 1))}
                      className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    </button>
                    <span className="w-12 text-center font-bold text-xl text-[#1B5E3B]">{kotikCount}</span>
                    <button
                      onClick={() => setKotikCount(kotikCount + 1)}
                      className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
                <p className="text-right text-sm text-[#C9A84C] font-bold mt-2">
                  +{kotikCount} متر إضافي = {kotikCount * pricePerMeter} درهم
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Formaja Toggle */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
            هل تريد إضافة فورمجة؟
          </label>
          <button
            onClick={() => setHasFormaja(!hasFormaja)}
            className={`w-full px-4 py-3 rounded-xl border-2 text-right font-bold transition-all ${
              hasFormaja
                ? "border-[#C9A84C] bg-[#C9A84C]/5 text-[#C9A84C]"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {hasFormaja ? "نعم، مع فورمجة" : "بدون فورمجة"}
          </button>
        </div>

        {/* Formaja Length Preview */}
        <AnimatePresence>
          {hasFormaja && currentLength && parseFloat(currentLength) > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#C9A84C]/10 rounded-xl p-4 mb-4 border border-[#C9A84C]/20">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <p className="font-bold text-[#C9A84C]">كمية الفورمجة المطلوبة</p>
                    <p className="text-sm text-gray-600">
                      طول الفورمجة = طول السداري
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-[#C9A84C]">
                      {(parseFloat(currentLength) / 100).toFixed(2)} متر
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Button */}
        <button
          onClick={addSeddari}
          disabled={!currentLength || parseFloat(currentLength) <= 0}
          className="w-full py-3 bg-[#1B5E3B] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1B5E3B]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          إضافة هذا السداري
        </button>
      </div>

      {/* Seddars List */}
      <AnimatePresence>
        {seddars.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h3 className="font-bold text-gray-900 text-lg text-right">السدادر المضافة</h3>

            {seddars.map((seddari, index) => (
              <motion.div
                key={seddari.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => removeSeddari(seddari.id)}
                      className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        سداري #{index + 1}
                      </p>
                      <p className="text-sm text-gray-500">
                        {seddari.length_cm} سم = {(seddari.length_cm / 100).toFixed(2)} متر
                        {seddari.has_kotik && (
                          <span className="text-[#C9A84C] mr-1">
                            {" "}+ {seddari.kotik_count} كوتيك
                          </span>
                        )}
                        {seddari.has_formaja && (
                          <span className="text-[#1B5E3B] mr-1 block mt-0.5">
                            🧽 فورمجة: {seddari.formaja_length_meters} متر
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="number"
                        value={seddari.price_per_meter}
                        onChange={(e) => updateSeddariPrice(seddari.id, parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 text-left text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20"
                      />
                      <span className="text-xs text-gray-400">درهم/م</span>
                    </div>
                    <p className="font-bold text-[#1B5E3B] text-lg">
                      {seddari.total_price.toLocaleString()} درهم
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Totals */}
            <div className="bg-[#0D1F17] rounded-2xl p-6 text-white">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-gray-400 text-sm mb-1">عدد السدادر</p>
                  <p className="text-2xl font-bold">{seddars.length}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">الطول الكلي</p>
                  <p className="text-2xl font-bold">{totalLengthMeters.toFixed(2)} م</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">الكوتيك</p>
                  <p className="text-2xl font-bold text-[#C9A84C]">+{totalKotikMeters} م</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">الفورمجة</p>
                  <p className="text-2xl font-bold text-emerald-400">{totalFormajaMeters.toFixed(2)} م</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">المجموع الكلي</p>
                  <p className="text-2xl font-bold text-[#C9A84C]">{totalMeters.toFixed(2)} م</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 text-center">
                <p className="text-gray-400 text-sm mb-1">السعر الإجمالي</p>
                <p className="text-3xl font-bold text-[#C9A84C]">{totalPrice.toLocaleString()} درهم</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          رجوع
        </button>
        <button
          onClick={onNext}
          disabled={seddars.length === 0}
          className="flex-[2] py-3 px-4 rounded-xl bg-[#1B5E3B] text-white font-bold hover:bg-[#1B5E3B]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Calculator className="w-5 h-5" />
          الانتقال للملخص
        </button>
      </div>
    </div>
  );
}