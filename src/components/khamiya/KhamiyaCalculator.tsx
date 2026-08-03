'use client';

import { KhamiyaCalculationBreakdown } from '@/types/khamiya';
import { formatCurrency, formatDimension } from '@/lib/khamiya-utils';
import { Receipt, Scissors, Gem, Layers, PlusCircle, Ruler } from 'lucide-react';

interface KhamiyaCalculatorProps {
  breakdown: KhamiyaCalculationBreakdown;
  customerWidth: number;
  customerHeight: number;
}

export default function KhamiyaCalculator({
  breakdown,
  customerWidth,
  customerHeight,
}: KhamiyaCalculatorProps) {
  const items = [
    {
      icon: <Ruler className="w-5 h-5 text-amber-700" />,
      label: 'القماش الأساسي',
      detail: `${formatDimension(breakdown.fabricLength)} طول × العرض ${formatDimension(customerWidth)}`,
      value: breakdown.fabricCost,
      highlight: true,
    },
    {
      icon: <Layers className="w-5 h-5 text-blue-600" />,
      label: 'الطبقة السفلية (البطانة)',
      detail: breakdown.bottomFabricCost > 0 ? 'مطلوبة' : 'غير مطلوبة',
      value: breakdown.bottomFabricCost,
      visible: breakdown.bottomFabricCost > 0,
    },
    {
      icon: <Gem className="w-5 h-5 text-yellow-600" />,
      label: 'العقاق (الخرز)',
      detail: 'حسب العرض المُدخل',
      value: breakdown.aqaqCost,
      visible: breakdown.aqaqCost > 0,
    },
    {
      icon: <Gem className="w-5 h-5 text-purple-600" />,
      label: 'الكبالة (بالأزواج)',
      detail: `${breakdown.kabalaCost / 150} زوج`,
      value: breakdown.kabalaCost,
      visible: breakdown.kabalaCost > 0,
    },
    {
      icon: <Gem className="w-5 h-5 text-pink-600" />,
      label: 'أشكال أخرى',
      detail: 'إكسسوارات إضافية',
      value: breakdown.otherShapesCost,
      visible: breakdown.otherShapesCost > 0,
    },
    {
      icon: <Scissors className="w-5 h-5 text-emerald-600" />,
      label: 'الخياطة',
      detail: 'السعر الأساسي + طريقة الخياطة',
      value: breakdown.sewingCost,
    },
    {
      icon: <PlusCircle className="w-5 h-5 text-indigo-600" />,
      label: 'إضافات مخصصة',
      detail: 'حسب الطلب',
      value: breakdown.customAdditionsTotal,
      visible: breakdown.customAdditionsTotal > 0,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-amber-100 overflow-hidden">
      <div className="bg-amber-900 px-6 py-4 flex items-center gap-3">
        <Receipt className="w-6 h-6 text-amber-300" />
        <h2 className="text-white font-bold text-xl">تفاصيل التكلفة</h2>
      </div>

      <div className="p-6 space-y-3">
        {/* معلومات القماش المطلوب */}
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-amber-900 font-semibold">الكمية المطلوبة من القماش:</span>
            <span className="text-2xl font-bold text-amber-800">
              {formatDimension(breakdown.fabricLength)}
            </span>
          </div>
          <p className="text-amber-700 text-sm mt-1">
            عرض الرول الثابت: 280 سم | العرض المطلوب: {formatDimension(customerWidth)} | الارتفاع: {formatDimension(customerHeight)}
          </p>
        </div>

        {items.map((item, idx) => {
          if (item.visible === false) return null;
          return (
            <div
              key={idx}
              className={`
                flex items-center justify-between p-4 rounded-xl transition-all
                ${item.highlight 
                  ? 'bg-amber-50 border-2 border-amber-300' 
                  : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.highlight ? 'bg-amber-200' : 'bg-white'}`}>
                  {item.icon}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.detail}</p>
                </div>
              </div>
              <span className={`font-bold text-lg ${item.highlight ? 'text-amber-800' : 'text-gray-700'}`}>
                {formatCurrency(item.value)}
              </span>
            </div>
          );
        })}

        {/* الخط الفاصل */}
        <div className="border-t-2 border-dashed border-amber-300 my-4" />

        {/* المجموع الكلي */}
        <div className="bg-amber-900 rounded-xl p-5 text-center">
          <p className="text-amber-200 text-sm mb-1">المجموع الإجمالي</p>
          <p className="text-white text-4xl font-bold">
            {formatCurrency(breakdown.grandTotal)}
          </p>
        </div>
      </div>
    </div>
  );
}