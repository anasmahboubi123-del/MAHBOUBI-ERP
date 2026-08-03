'use client';

import { useState, useMemo } from 'react';
import { 
  KhamiyaOrder, 
  CustomAddition, 
  KhamiyaCalculationBreakdown,
  Fabric 
} from '@/types/khamiya';
import { 
  calculateKhamiyaBreakdown, 
  formatCurrency 
} from '@/lib/khamiya-utils';
import KhamiyaSVG from './KhamiyaSVG';
import KhamiyaCalculator from './KhamiyaCalculator';
import BackButton from '@/components/ui/BackButton';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Check,
  Scissors,
  Layers,
  Gem,
  Ruler,
  Sparkles,
  User,
  Phone,
  Save
} from 'lucide-react';

const SAMPLE_FABRICS: Fabric[] = [
  { id: '1', name: 'قماش مخملي أحمر', imageUrl: '/fabrics/velvet-red.jpg', pricePerMeter: 120, color: '#8B0000' },
  { id: '2', name: 'قماش مخملي أخضر', imageUrl: '/fabrics/velvet-green.jpg', pricePerMeter: 120, color: '#006400' },
  { id: '3', name: 'قماش حريري ذهبي', imageUrl: '/fabrics/silk-gold.jpg', pricePerMeter: 180, color: '#DAA520' },
  { id: '4', name: 'قماش قطني بيج', imageUrl: '/fabrics/cotton-beige.jpg', pricePerMeter: 80, color: '#F5F5DC' },
];

type Step = 1 | 2 | 3 | 4 | 5 | 6;

export default function KhamiyaConfigurator() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState<Partial<KhamiyaOrder>>({
    customerName: '',
    customerPhone: '',
    width: 2,
    height: 2.5,
    shape: 'solid_piece',
    hasBottomFabric: false,
    bottomFabricWidth: undefined,
    aqaqWidth: 0,
    kabalaCount: 0,
    otherShapesCount: 0,
    sewingType: 'standard',
    customSewingPrice: undefined,
    customAdditions: [],
    fabricType: SAMPLE_FABRICS[0].id,
  });

  const [selectedFabric, setSelectedFabric] = useState<Fabric>(SAMPLE_FABRICS[0]);
  const [newAddition, setNewAddition] = useState({ name: '', price: '' });

  const updateField = <K extends keyof KhamiyaOrder>(
    field: K, 
    value: KhamiyaOrder[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addCustomAddition = () => {
    if (!newAddition.name || !newAddition.price) return;
    const addition: CustomAddition = {
      id: Date.now().toString(),
      name: newAddition.name,
      price: parseFloat(newAddition.price),
    };
    setFormData(prev => ({
      ...prev,
      customAdditions: [...(prev.customAdditions || []), addition],
    }));
    setNewAddition({ name: '', price: '' });
  };

  const removeAddition = (id: string) => {
    setFormData(prev => ({
      ...prev,
      customAdditions: prev.customAdditions?.filter(a => a.id !== id) || [],
    }));
  };

  const breakdown: KhamiyaCalculationBreakdown = useMemo(() => {
    const order = {
      customerName: formData.customerName || '',
      customerPhone: formData.customerPhone || '',
      width: formData.width || 0,
      height: formData.height || 0,
      shape: formData.shape || 'solid_piece',
      hasBottomFabric: formData.hasBottomFabric || false,
      bottomFabricWidth: formData.bottomFabricWidth,
      aqaqWidth: formData.aqaqWidth || 0,
      kabalaCount: formData.kabalaCount || 0,
      otherShapesCount: formData.otherShapesCount || 0,
      sewingType: formData.sewingType || 'standard',
      customSewingPrice: formData.customSewingPrice,
      customAdditions: formData.customAdditions || [],
      fabricType: formData.fabricType || '',
    };
    return calculateKhamiyaBreakdown(order, selectedFabric.pricePerMeter);
  }, [formData, selectedFabric]);

  const handleNext = () => {
    if (currentStep < 6) setCurrentStep((prev) => (prev + 1) as Step);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as Step);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const orderData = {
        ...formData,
        total_price: breakdown.grandTotal,
        fabric_length_needed: breakdown.fabricLength,
        status: 'pending',
      };
      
      const response = await fetch('/api/orders/khamiya', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        setShowSuccess(true);
      }
    } catch (error) {
      console.error('Error saving order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'العميل والأبعاد', icon: <User className="w-4 h-4" /> },
    { num: 2, label: 'الشكل', icon: <Scissors className="w-4 h-4" /> },
    { num: 3, label: 'البطانة', icon: <Layers className="w-4 h-4" /> },
    { num: 4, label: 'الإكسسوارات', icon: <Gem className="w-4 h-4" /> },
    { num: 5, label: 'الخياطة', icon: <Ruler className="w-4 h-4" /> },
    { num: 6, label: 'الإضافات', icon: <Sparkles className="w-4 h-4" /> },
  ];

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">تم حفظ الطلب بنجاح!</h2>
          <p className="text-gray-600 mb-6">سيتم إرسال رسالة تأكيد للعميل عبر واتساب</p>
          <BackButton label="العودة للرئيسية" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 pb-20">
      <div className="bg-amber-900 text-white px-6 py-4 sticky top-0 z-40 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <BackButton label="رجوع" className="!bg-amber-800 !border-amber-700 !text-amber-100 hover:!bg-amber-700" />
          <h1 className="text-xl font-bold">إعداد خامية جديدة</h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10 rounded-full" />
            <div 
              className="absolute top-1/2 left-0 h-1 bg-amber-600 -z-10 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
            />
            {steps.map(step => (
              <div
                key={step.num}
                className={`flex flex-col items-center gap-1 ${
                  currentStep >= step.num ? 'text-amber-600' : 'text-gray-400'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  currentStep === step.num 
                    ? 'bg-amber-600 text-white ring-4 ring-amber-200 scale-110' 
                    : currentStep > step.num
                      ? 'bg-amber-600 text-white'
                      : 'bg-white text-gray-400 border-2 border-gray-200'
                }`}>
                  {currentStep > step.num ? <Check className="w-5 h-5" /> : step.num}
                </div>
                <span className="text-xs font-medium hidden md:block">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                  <User className="w-6 h-6" />
                  معلومات العميل والأبعاد
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-amber-900 font-semibold mb-2">اسم العميل</label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={e => updateField('customerName', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                      placeholder="أدخل اسم العميل"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-900 font-semibold mb-2">رقم الهاتف</label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={e => updateField('customerPhone', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                      placeholder="05XX-XXXXXX"
                      dir="rtl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-amber-900 font-semibold mb-2">
                      عرض الخامية (متر) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="10"
                      value={formData.width}
                      onChange={e => updateField('width', parseFloat(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-left"
                    />
                    <p className="text-sm text-amber-700 mt-1">عرض الرول الثابت: 280 سم</p>
                  </div>
                  <div>
                    <label className="block text-amber-900 font-semibold mb-2">
                      ارتفاع الخامية (متر) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="5"
                      value={formData.height}
                      onChange={e => updateField('height', parseFloat(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-left"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-amber-900 font-semibold mb-3">نوع القماش</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {SAMPLE_FABRICS.map(fabric => (
                      <button
                        key={fabric.id}
                        onClick={() => {
                          setSelectedFabric(fabric);
                          updateField('fabricType', fabric.id);
                        }}
                        className={`relative p-3 rounded-xl border-2 transition-all text-right ${
                          selectedFabric.id === fabric.id
                            ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-200'
                            : 'border-gray-200 hover:border-amber-300 bg-white'
                        }`}
                      >
                        <div 
                          className="w-full h-16 rounded-lg mb-2 border border-gray-200"
                          style={{ backgroundColor: fabric.color }}
                        />
                        <p className="font-bold text-sm text-gray-900">{fabric.name}</p>
                        <p className="text-xs text-amber-700">{formatCurrency(fabric.pricePerMeter)}/م</p>
                        {selectedFabric.id === fabric.id && (
                          <div className="absolute top-2 left-2 w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                  <Scissors className="w-6 h-6" />
                  شكل القص
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => updateField('shape', 'solid_piece')}
                    className={`p-6 rounded-2xl border-2 transition-all text-right ${
                      formData.shape === 'solid_piece'
                        ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-200'
                        : 'border-gray-200 hover:border-amber-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-16 h-16 bg-amber-100 rounded-lg flex items-center justify-center">
                        <div className="w-12 h-12 bg-amber-300 rounded border-2 border-amber-600" />
                      </div>
                      {formData.shape === 'solid_piece' && (
                        <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-gray-900">قطعة واحدة صلبة</h3>
                    <p className="text-gray-600 text-sm mt-1">الخامية من قطعة قماش واحدة بدون قص في الوسط</p>
                  </button>
                  <button
                    onClick={() => updateField('shape', 'cut_middle')}
                    className={`p-6 rounded-2xl border-2 transition-all text-right ${
                      formData.shape === 'cut_middle'
                        ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-200'
                        : 'border-gray-200 hover:border-amber-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-16 h-16 bg-amber-100 rounded-lg flex items-center justify-center relative">
                        <div className="w-5 h-12 bg-amber-300 rounded-l border-2 border-amber-600 border-r-0" />
                        <div className="w-5 h-12 bg-amber-300 rounded-r border-2 border-amber-600 border-l-0" />
                        <div className="absolute w-0.5 h-12 bg-red-500" />
                      </div>
                      {formData.shape === 'cut_middle' && (
                        <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-gray-900">قص من الوسط</h3>
                    <p className="text-gray-600 text-sm mt-1">قطعتان منفصلتان تلتقيان في الوسط</p>
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                  <Layers className="w-6 h-6" />
                  الطبقة السفلية (البطانة)
                </h2>
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">إضافة طبقة سفلية؟</h3>
                      <p className="text-gray-600 text-sm">طبقة رقيقة من القماش في الأسفل لإعطاء مظهر أنيق</p>
                    </div>
                    <button
                      onClick={() => updateField('hasBottomFabric', !formData.hasBottomFabric)}
                      className={`relative w-14 h-8 rounded-full transition-all ${
                        formData.hasBottomFabric ? 'bg-amber-600' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                        formData.hasBottomFabric ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>
                  {formData.hasBottomFabric && (
                    <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 animate-in fade-in">
                      <label className="block text-amber-900 font-semibold mb-2">عرض الطبقة السفلية (متر)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={formData.bottomFabricWidth || formData.width}
                        onChange={e => updateField('bottomFabricWidth', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-left"
                      />
                      <p className="text-sm text-amber-700 mt-2">
                        السعر: 50 درهم للمتر × {formData.bottomFabricWidth || formData.width}م = {' '}
                        {formatCurrency((formData.bottomFabricWidth || formData.width || 0) * 50)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                  <Gem className="w-6 h-6" />
                  الإكسسوارات والعقاق
                </h2>
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <label className="block text-amber-900 font-semibold mb-2">
                      عرض العقاق (متر) <span className="text-gray-500 text-sm font-normal">- لحساب الخرز بدقة</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.aqaqWidth}
                      onChange={e => updateField('aqaqWidth', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-left"
                    />
                    <p className="text-sm text-amber-700 mt-1">30 درهم للمتر</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <label className="block text-amber-900 font-semibold mb-2">الكبالة (بالأزواج)</label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => updateField('kabalaCount', Math.max(0, (formData.kabalaCount || 0) - 1))}
                        className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold"
                      >-</button>
                      <span className="text-2xl font-bold text-amber-900 w-12 text-center">{formData.kabalaCount}</span>
                      <button
                        onClick={() => updateField('kabalaCount', (formData.kabalaCount || 0) + 1)}
                        className="w-10 h-10 rounded-lg bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-xl font-bold text-amber-800"
                      >+</button>
                    </div>
                    <p className="text-sm text-amber-700 mt-2">150 درهم للزوج</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <label className="block text-amber-900 font-semibold mb-2">أشكال أخرى (200 درهم للشكل)</label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => updateField('otherShapesCount', Math.max(0, (formData.otherShapesCount || 0) - 1))}
                        className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold"
                      >-</button>
                      <span className="text-2xl font-bold text-amber-900 w-12 text-center">{formData.otherShapesCount}</span>
                      <button
                        onClick={() => updateField('otherShapesCount', (formData.otherShapesCount || 0) + 1)}
                        className="w-10 h-10 rounded-lg bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-xl font-bold text-amber-800"
                      >+</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                  <Ruler className="w-6 h-6" />
                  الخياطة
                </h2>
                <div className="space-y-3">
                  {[
                    { value: 'standard', label: 'خياطة قياسية', price: 40, desc: 'السعر الأساسي' },
                    { value: 'special', label: 'خياطة خاصة', price: 70, desc: 'تشمل تفاصيل إضافية' },
                    { value: 'custom', label: 'خياطة مخصصة', price: 0, desc: 'أدخل السعر يدوياً' },
                  ].map(method => (
                    <button
                      key={method.value}
                      onClick={() => updateField('sewingType', method.value as any)}
                      className={`w-full p-4 rounded-xl border-2 text-right transition-all flex items-center justify-between ${
                        formData.sewingType === method.value
                          ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-200'
                          : 'border-gray-200 hover:border-amber-300 bg-white'
                      }`}
                    >
                      <div>
                        <h3 className="font-bold text-gray-900">{method.label}</h3>
                        <p className="text-sm text-gray-600">{method.desc}</p>
                      </div>
                      <div className="text-left">
                        <span className="text-lg font-bold text-amber-800">
                          {method.price > 0 ? `${method.price} درهم` : 'مخصص'}
                        </span>
                        {formData.sewingType === method.value && (
                          <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center mt-1 ml-auto">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                  {formData.sewingType === 'custom' && (
                    <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 animate-in fade-in">
                      <label className="block text-amber-900 font-semibold mb-2">السعر المخصص (درهم)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.customSewingPrice || ''}
                        onChange={e => updateField('customSewingPrice', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-left"
                        placeholder="أدخل السعر"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  إضافات مخصصة
                </h2>
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-4">إضافة جديدة</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={newAddition.name}
                      onChange={e => setNewAddition(prev => ({ ...prev, name: e.target.value }))}
                      className="md:col-span-2 px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                      placeholder="اسم الإضافة (مثال: تعليقات خشبية)"
                      dir="rtl"
                    />
                    <input
                      type="number"
                      min="0"
                      value={newAddition.price}
                      onChange={e => setNewAddition(prev => ({ ...prev, price: e.target.value }))}
                      className="px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-left"
                      placeholder="السعر"
                    />
                  </div>
                  <button
                    onClick={addCustomAddition}
                    disabled={!newAddition.name || !newAddition.price}
                    className="mt-3 w-full py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    إضافة للطلب
                  </button>
                </div>

                {formData.customAdditions && formData.customAdditions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-gray-900">الإضافات المضافة</h3>
                    {formData.customAdditions.map(addition => (
                      <div
                        key={addition.id}
                        className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200"
                      >
                        <div>
                          <p className="font-bold text-gray-900">{addition.name}</p>
                          <p className="text-amber-700 font-semibold">{formatCurrency(addition.price)}</p>
                        </div>
                        <button
                          onClick={() => removeAddition(addition.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-amber-900 rounded-2xl p-6 text-white">
                  <h3 className="font-bold text-xl mb-4">ملخص الطلب</h3>
                  <div className="space-y-2 text-amber-100">
                    <div className="flex justify-between">
                      <span>العميل:</span>
                      <span className="font-semibold">{formData.customerName || '---'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الأبعاد:</span>
                      <span className="font-semibold">{formData.width}م × {formData.height}م</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الشكل:</span>
                      <span className="font-semibold">
                        {formData.shape === 'cut_middle' ? 'قص من الوسط' : 'قطعة صلبة'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>القماش:</span>
                      <span className="font-semibold">{selectedFabric.name}</span>
                    </div>
                    <div className="border-t border-amber-700 my-3" />
                    <div className="flex justify-between text-xl font-bold text-white">
                      <span>المجموع الكلي:</span>
                      <span>{formatCurrency(breakdown.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <button
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <ChevronRight className="w-5 h-5" />
                السابق
              </button>

              {currentStep < 6 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  التالي
                  <ChevronLeft className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      حفظ الطلب
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <KhamiyaSVG
              width={formData.width || 2}
              height={formData.height || 2.5}
              shape={formData.shape || 'solid_piece'}
              hasBottomFabric={formData.hasBottomFabric || false}
              aqaqWidth={formData.aqaqWidth || 0}
            />
            <KhamiyaCalculator
              breakdown={breakdown}
              customerWidth={formData.width || 0}
              customerHeight={formData.height || 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}