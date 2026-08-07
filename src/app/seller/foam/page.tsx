'use client';

// ============================================================
// El Mahboubi Salon ERP — Foam (Bounj) Seller Flow (Cart Mode)
// تدفق البائع لطلبات البونج — يُرسل للسلة المشتركة
// ============================================================

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrder } from '@/features/order-center/context/OrderContext';
import { buildFoamCartItem } from '@/features/order-center/utils/buildFoamCartItem';
import Head from 'next/head';
import type { FoamProduct, Supplier } from '@/types/foam-types';
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  X,
  Lock,
  ShoppingCart,
  Calculator,
  ChevronRight,
  Package,
  Ruler,
  CornerDownRight,
  DollarSign,
  AlertCircle,
  RotateCcw,
  ImageIcon,
} from 'lucide-react';
import {
  getFoamProducts,
  getFoamSettings,
  calculateFoamPrice,
} from '@/lib/foam-lib';

// ─── Local UI Types ──────────────────────────────────────
interface FlowStep {
  id: number;
  title: string;
  icon: React.ReactNode;
}

const STEPS: FlowStep[] = [
  { id: 1, title: 'المنتج', icon: <Package className="w-5 h-5" /> },
  { id: 2, title: 'الارتفاع', icon: <Ruler className="w-5 h-5" /> },
  { id: 3, title: 'العرض', icon: <Ruler className="w-5 h-5" /> },
  { id: 4, title: 'السدادر', icon: <CornerDownRight className="w-5 h-5" /> },
  { id: 5, title: 'الفورمجة', icon: <CornerDownRight className="w-5 h-5" /> },
  { id: 6, title: 'الحساب', icon: <Calculator className="w-5 h-5" /> },
];

export default function FoamSellerPage() {
  const router = useRouter();
  const { addToCart } = useOrder();

  const [currentStep, setCurrentStep] = useState(1);
  const [products, setProducts] = useState<FoamProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<FoamProduct | null>(null);
  const [selectedHeight, setSelectedHeight] = useState<number | null>(null);
  const [widthCm, setWidthCm] = useState<number>(70);
  const [seddars, setSeddars] = useState<number[]>([]);
  const [newSeddarLength, setNewSeddarLength] = useState('');
  const [hasCorners, setHasCorners] = useState<boolean | null>(null);
  const [squareCorners, setSquareCorners] = useState(0);
  const [triangleCorners, setTriangleCorners] = useState(0);
  const [priceAdjustment, setPriceAdjustment] = useState<{
    type: 'discount' | 'increase';
    value: number;
    reason: string;
  } | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [managerPin, setManagerPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'discount' | 'increase'>('discount');
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [error, setError] = useState('');
  const [managerPinCode, setManagerPinCode] = useState('9999');

  // ─── Price-per-height + editable price states ─────────────────
  const [customPricePerMeter, setCustomPricePerMeter] = useState<number | null>(null);
  const [showInlinePriceEdit, setShowInlinePriceEdit] = useState(false);
  const [tempPriceInput, setTempPriceInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prods, settings] = await Promise.all([
        getFoamProducts(true),
        getFoamSettings(),
      ]);
      setProducts(prods);
      setManagerPinCode(settings.manager_pin);
    } catch {
      setError('فشل تحميل البيانات');
    }
  };

  // ─── Price helpers ─────────────────────────────────────────
  const handleSelectProduct = (product: FoamProduct) => {
    setSelectedProduct(product);
    setSelectedHeight(null);
    setCustomPricePerMeter(null);
    setShowInlinePriceEdit(false);
    setTempPriceInput('');
  };

  const handleSelectHeight = (heightCm: number, defaultPrice: number) => {
    setSelectedHeight(heightCm);
    setCustomPricePerMeter(defaultPrice);
    setShowInlinePriceEdit(false);
    setTempPriceInput('');
  };

  const effectivePricePerMeter =
    customPricePerMeter ?? selectedProduct?.price_per_meter ?? 0;

  const applyCustomPrice = () => {
    const val = parseFloat(tempPriceInput);
    if (!isNaN(val) && val > 0) {
      setCustomPricePerMeter(val);
      setShowInlinePriceEdit(false);
    }
  };

  const resetCustomPrice = () => {
    if (selectedProduct && selectedHeight !== null) {
      const h = selectedProduct.heights?.find(h => h.height_cm === selectedHeight);
      setCustomPricePerMeter(h?.price_per_meter ?? selectedProduct.price_per_meter);
    }
    setShowInlinePriceEdit(false);
  };

  const priceCalc = selectedProduct
    ? calculateFoamPrice(
        seddars,
        effectivePricePerMeter,
        hasCorners === true,
        squareCorners,
        triangleCorners,
        selectedProduct.square_corner_price,
        selectedProduct.triangle_corner_price,
        priceAdjustment
      )
    : null;

  const totalLength = seddars.reduce((sum, len) => sum + len, 0);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!selectedProduct;
      case 2:
        return selectedHeight !== null;
      case 3:
        return widthCm > 0;
      case 4:
        return seddars.length > 0;
      case 5:
        return hasCorners !== null;
      case 6:
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 6) {
      setCurrentStep(s => s + 1);
      setError('');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(s => s - 1);
      setError('');
    }
  };

  const addSeddar = () => {
    const val = parseFloat(newSeddarLength);
    if (!isNaN(val) && val > 0) {
      setSeddars(prev => [...prev, val]);
      setNewSeddarLength('');
    }
  };

  const removeSeddar = (index: number) => {
    setSeddars(prev => prev.filter((_, i) => i !== index));
  };

  const updateSeddar = (index: number, value: string) => {
    const val = parseFloat(value);
    if (!isNaN(val) && val > 0)
      setSeddars(prev => prev.map((s, i) => (i === index ? val : s)));
  };

  const verifyManagerPin = () => {
    if (managerPin !== managerPinCode) {
      setPinError('كود المدير غير صحيح');
      return false;
    }
    setPinError('');
    return true;
  };

  const applyPriceAdjustment = () => {
    if (!verifyManagerPin()) return;
    const val = parseFloat(adjustmentValue);
    if (isNaN(val) || val <= 0) {
      setPinError('أدخل قيمة صحيحة');
      return;
    }
    const reason = adjustmentReason === 'other' ? customReason : adjustmentReason;
    if (!reason.trim()) {
      setPinError('أدخل سبب التعديل');
      return;
    }
    setPriceAdjustment({ type: adjustmentType, value: val, reason });
    setShowPriceModal(false);
    setManagerPin('');
    setAdjustmentValue('');
    setAdjustmentReason('');
    setCustomReason('');
    setPinError('');
  };

  const removePriceAdjustment = () => setPriceAdjustment(null);

  const handleAddToCart = () => {
    if (
      !selectedProduct ||
      selectedHeight === null ||
      hasCorners === null ||
      !priceCalc
    )
      return;

    const cartItem = buildFoamCartItem({
      selectedProduct,
      selectedHeight,
      widthCm,
      seddars,
      hasCorners,
      squareCorners,
      triangleCorners,
      priceAdjustment: priceAdjustment || undefined,
      customPricePerMeter: customPricePerMeter ?? undefined,
      notes: '',
    });

    addToCart(cartItem);
    resetFlow();
    router.push('/seller/order-center');
  };

  const resetFlow = () => {
    setCurrentStep(1);
    setSelectedProduct(null);
    setSelectedHeight(null);
    setWidthCm(70);
    setSeddars([]);
    setNewSeddarLength('');
    setHasCorners(null);
    setSquareCorners(0);
    setTriangleCorners(0);
    setPriceAdjustment(null);
    setCustomPricePerMeter(null);
    setShowInlinePriceEdit(false);
    setTempPriceInput('');
    setError('');
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('ar-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <>
      <Head>
        <title>بيع البونج — El Mahboubi</title>
      </Head>
      <div className="min-h-screen bg-[#0D1F17] text-[#F5F0E8]" dir="rtl">
        {/* Header */}
        <header className="bg-[#1B5E3B] border-b-4 border-[#C9A84C] sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#C9A84C] rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-[#0D1F17]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#F5F0E8]">نظام البونج</h1>
                  <p className="text-xs text-[#C9A84C]">El Mahboubi — بيع سريع</p>
                </div>
              </div>
              <button
                onClick={resetFlow}
                className="flex items-center gap-2 px-3 py-2 bg-[#0D1F17]/50 hover:bg-[#0D1F17] rounded-lg text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                طلب جديد
              </button>
            </div>
          </div>
        </header>

        {/* Progress Steps */}
        <div className="bg-[#1B5E3B]/30 border-b border-[#C9A84C]/20">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-1 overflow-x-auto">
              {STEPS.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg whitespace-nowrap transition-all ${
                      currentStep === step.id
                        ? 'bg-[#C9A84C] text-[#0D1F17] font-bold'
                        : currentStep > step.id
                        ? 'text-[#C9A84C]'
                        : 'text-[#F5F0E8]/40'
                    }`}
                  >
                    {step.icon}
                    <span className="text-xs hidden sm:inline">{step.title}</span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight
                      className={`w-4 h-4 flex-shrink-0 ${
                        currentStep > step.id
                          ? 'text-[#C9A84C]'
                          : 'text-[#F5F0E8]/20'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="max-w-4xl mx-auto px-4 mt-4">
            <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-200">{error}</p>
              <button onClick={() => setError('')} className="mr-auto">
                <X className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-6 pb-32">
          {/* ===== STEP 1: Product Selection ===== */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#C9A84C]">اختر منتج البونج</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className={`relative group rounded-2xl overflow-hidden border-2 transition-all duration-300 text-right ${
                      selectedProduct?.id === product.id
                        ? 'border-[#C9A84C] ring-4 ring-[#C9A84C]/20 shadow-lg shadow-[#C9A84C]/10'
                        : 'border-[#1B5E3B] hover:border-[#C9A84C]/50 hover:shadow-lg'
                    } bg-[#1B5E3B]/20`}
                  >
                    <div className="aspect-video bg-[#0D1F17] relative overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-[#F5F0E8]/20" />
                        </div>
                      )}
                      {selectedProduct?.id === product.id && (
                        <div className="absolute top-2 left-2 w-8 h-8 bg-[#C9A84C] rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-[#0D1F17]" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-[#F5F0E8]">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-[#F5F0E8]/60 mt-1 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-2 text-[#C9A84C]">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-bold">{product.price_per_meter} درهم/م</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ===== STEP 2: Height Selection ===== */}
          {currentStep === 2 && selectedProduct && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={prevStep}
                  className="p-2 hover:bg-[#1B5E3B]/50 rounded-lg transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-[#C9A84C]">اختر الارتفاع</h2>
              </div>
              <div className="bg-[#1B5E3B]/20 rounded-2xl p-6 border border-[#1B5E3B]">
                <p className="text-lg mb-4">
                  المنتج:{' '}
                  <span className="font-bold text-[#C9A84C]">{selectedProduct.name}</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {selectedProduct.heights?.map(h => {
                    const heightPrice = h.price_per_meter ?? selectedProduct.price_per_meter;
                    return (
                      <button
                        key={h.id}
                        onClick={() => handleSelectHeight(h.height_cm, heightPrice)}
                        className={`py-4 px-4 rounded-xl font-bold transition-all flex flex-col items-center gap-1 ${
                          selectedHeight === h.height_cm
                            ? 'bg-[#C9A84C] text-[#0D1F17] shadow-lg shadow-[#C9A84C]/20 border-2 border-[#C9A84C]'
                            : 'bg-[#0D1F17] text-[#F5F0E8] hover:bg-[#0D1F17]/80 border-2 border-[#1B5E3B]'
                        }`}
                      >
                        <span className="text-xl">{h.height_cm} سم</span>
                        <span className={`text-sm ${selectedHeight === h.height_cm ? 'text-[#0D1F17]/70' : 'text-[#C9A84C]'}`}>
                          {heightPrice} درهم/م
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Editable price for selected height */}
                {selectedHeight !== null && (
                  <div className="mt-6 bg-[#0D1F17] rounded-xl p-4 border border-[#C9A84C]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#F5F0E8]/80">
                        السعر لكل متر (ارتفاع {selectedHeight} سم)
                      </span>
                      <span className="text-[#C9A84C] font-bold text-xl">
                        {effectivePricePerMeter} درهم
                      </span>
                    </div>

                    {!showInlinePriceEdit ? (
                      <button
                        onClick={() => {
                          setTempPriceInput(effectivePricePerMeter.toString());
                          setShowInlinePriceEdit(true);
                        }}
                        className="text-sm text-[#C9A84C] underline hover:text-[#C9A84C]/80 transition-colors"
                      >
                        تعديل السعر يدوياً
                      </button>
                    ) : (
                      <div className="flex gap-3 items-center">
                        <input
                          type="number"
                          step="0.01"
                          value={tempPriceInput}
                          onChange={e => setTempPriceInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && applyCustomPrice()}
                          placeholder="السعر الجديد"
                          className="flex-1 bg-[#1B5E3B]/30 border-2 border-[#C9A84C]/50 rounded-xl px-4 py-2 text-[#F5F0E8] focus:border-[#C9A84C] focus:outline-none"
                        />
                        <button
                          onClick={applyCustomPrice}
                          className="px-4 py-2 bg-[#C9A84C] text-[#0D1F17] rounded-xl font-bold text-sm hover:bg-[#C9A84C]/90 transition-colors"
                        >
                          حفظ
                        </button>
                        <button
                          onClick={resetCustomPrice}
                          className="px-4 py-2 bg-[#0D1F17] border border-[#F5F0E8]/20 text-[#F5F0E8] rounded-xl text-sm hover:bg-[#0D1F17]/80 transition-colors"
                        >
                          إلغاء
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== STEP 3: Width Input ===== */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={prevStep}
                  className="p-2 hover:bg-[#1B5E3B]/50 rounded-lg transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-[#C9A84C]">العرض</h2>
              </div>
              <div className="bg-[#1B5E3B]/20 rounded-2xl p-6 border border-[#1B5E3B] space-y-6">
                <div className="text-center">
                  <p className="text-[#F5F0E8]/60 mb-2">العرض الافتراضي</p>
                  <div className="text-5xl font-bold text-[#C9A84C]">
                    {widthCm} <span className="text-2xl">سم</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm text-[#F5F0E8]/80">
                    تعديل العرض (اختياري)
                  </label>
                  <input
                    type="number"
                    value={widthCm}
                    min={1}
                    onChange={e => setWidthCm(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#0D1F17] border-2 border-[#1B5E3B] rounded-xl px-4 py-4 text-2xl text-center text-[#F5F0E8] focus:border-[#C9A84C] focus:outline-none transition-colors"
                  />
                  <p className="text-xs text-[#F5F0E8]/40 text-center">
                    يمكن تعديل هذا لاحقاً حسب حاجة الزبون
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 4: Seddars ===== */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={prevStep}
                  className="p-2 hover:bg-[#1B5E3B]/50 rounded-lg transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-[#C9A84C]">أطوال السدادر</h2>
              </div>
              <div className="bg-[#1B5E3B]/20 rounded-2xl p-6 border border-[#1B5E3B] space-y-4">
                <div className="flex gap-3">
                  <input
                    type="number"
                    step="0.01"
                    value={newSeddarLength}
                    onChange={e => setNewSeddarLength(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSeddar()}
                    placeholder="أدخل الطول بالمتر (مثال: 3.20)"
                    className="flex-1 bg-[#0D1F17] border-2 border-[#1B5E3B] rounded-xl px-4 py-3 text-[#F5F0E8] focus:border-[#C9A84C] focus:outline-none transition-colors"
                  />
                  <button
                    onClick={addSeddar}
                    className="bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-[#0D1F17] px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-5 h-5" /> إضافة
                  </button>
                </div>
                {seddars.length > 0 && (
                  <div className="space-y-2">
                    {seddars.map((len, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 bg-[#0D1F17] rounded-xl px-4 py-3 border border-[#1B5E3B]/50"
                      >
                        <span className="text-[#C9A84C] font-bold w-8">#{idx + 1}</span>
                        <input
                          type="number"
                          step="0.01"
                          value={len}
                          onChange={e => updateSeddar(idx, e.target.value)}
                          className="flex-1 bg-transparent text-[#F5F0E8] text-lg font-bold focus:outline-none"
                        />
                        <span className="text-[#F5F0E8]/60">متر</span>
                        <button
                          onClick={() => removeSeddar(idx)}
                          className="p-2 hover:bg-red-900/30 rounded-lg text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-[#0D1F17] rounded-xl p-4 border-2 border-[#C9A84C]/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[#F5F0E8]/80">إجمالي أطوال السدادر:</span>
                    <span className="text-2xl font-bold text-[#C9A84C]">
                      {totalLength.toFixed(2)} متر
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 5: Corners (Formaja) ===== */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={prevStep}
                  className="p-2 hover:bg-[#1B5E3B]/50 rounded-lg transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-[#C9A84C]">الفورمجة</h2>
              </div>
              <div className="bg-[#1B5E3B]/20 rounded-2xl p-6 border border-[#1B5E3B] space-y-6">
                <p className="text-lg text-center">هل يوجد فورمجة في هذا الطلب؟</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setHasCorners(false)}
                    className={`py-6 rounded-xl text-xl font-bold transition-all ${
                      hasCorners === false
                        ? 'bg-red-900/50 border-2 border-red-500 text-red-200'
                        : 'bg-[#0D1F17] border-2 border-[#1B5E3B] text-[#F5F0E8]/60 hover:border-red-500/30'
                    }`}
                  >
                    <X className="w-8 h-8 mx-auto mb-2" /> لا
                  </button>
                  <button
                    onClick={() => setHasCorners(true)}
                    className={`py-6 rounded-xl text-xl font-bold transition-all ${
                      hasCorners === true
                        ? 'bg-[#C9A84C] text-[#0D1F17] shadow-lg'
                        : 'bg-[#0D1F17] border-2 border-[#1B5E3B] text-[#F5F0E8]/60 hover:border-[#C9A84C]/30'
                    }`}
                  >
                    <Check className="w-8 h-8 mx-auto mb-2" /> نعم
                  </button>
                </div>
                {hasCorners === true && selectedProduct && (
                  <div className="space-y-4 pt-4 border-t border-[#1B5E3B]">
                    <div className="space-y-3">
                      <label className="block text-sm text-[#F5F0E8]/80">
                        عدد الفورمجات المربعة ({selectedProduct.square_corner_price}{' '}
                        درهم/واحدة)
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSquareCorners(Math.max(0, squareCorners - 1))}
                          className="w-12 h-12 bg-[#0D1F17] border-2 border-[#1B5E3B] rounded-xl flex items-center justify-center text-xl hover:border-[#C9A84C] transition-colors"
                        >
                          -
                        </button>
                        <span className="text-3xl font-bold w-16 text-center">
                          {squareCorners}
                        </span>
                        <button
                          onClick={() => setSquareCorners(squareCorners + 1)}
                          className="w-12 h-12 bg-[#0D1F17] border-2 border-[#1B5E3B] rounded-xl flex items-center justify-center text-xl hover:border-[#C9A84C] transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="block text-sm text-[#F5F0E8]/80">
                        عدد الفورمجات المثلثة ({selectedProduct.triangle_corner_price}{' '}
                        درهم/واحدة)
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setTriangleCorners(Math.max(0, triangleCorners - 1))}
                          className="w-12 h-12 bg-[#0D1F17] border-2 border-[#1B5E3B] rounded-xl flex items-center justify-center text-xl hover:border-[#C9A84C] transition-colors"
                        >
                          -
                        </button>
                        <span className="text-3xl font-bold w-16 text-center">
                          {triangleCorners}
                        </span>
                        <button
                          onClick={() => setTriangleCorners(triangleCorners + 1)}
                          className="w-12 h-12 bg-[#0D1F17] border-2 border-[#1B5E3B] rounded-xl flex items-center justify-center text-xl hover:border-[#C9A84C] transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== STEP 6: Price Summary ===== */}
          {currentStep === 6 && priceCalc && selectedProduct && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={prevStep}
                  className="p-2 hover:bg-[#1B5E3B]/50 rounded-lg transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-[#C9A84C]">الحساب</h2>
              </div>
              <div className="bg-[#1B5E3B]/20 rounded-2xl p-6 border border-[#1B5E3B] space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-[#1B5E3B]/30">
                    <span className="text-[#F5F0E8]/60">المنتج</span>
                    <span className="font-bold">{selectedProduct.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1B5E3B]/30">
                    <span className="text-[#F5F0E8]/60">الارتفاع</span>
                    <span className="font-bold">{selectedHeight} سم</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1B5E3B]/30">
                    <span className="text-[#F5F0E8]/60">العرض</span>
                    <span className="font-bold">{widthCm} سم</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1B5E3B]/30">
                    <span className="text-[#F5F0E8]/60">إجمالي الأطوال</span>
                    <span className="font-bold">
                      {priceCalc.totalLength.toFixed(2)} متر
                    </span>
                  </div>
                </div>
                <div className="bg-[#0D1F17] rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#F5F0E8]/80">
                      السدادر ({priceCalc.totalLength.toFixed(2)} م ×{' '}
                      {effectivePricePerMeter} درهم)
                      {customPricePerMeter !== null && (
                        <span className="text-xs text-[#C9A84C] mr-2">(سعر معدّل)</span>
                      )}
                    </span>
                    <span className="font-bold">
                      {formatCurrency(priceCalc.seddarsTotal)}
                    </span>
                  </div>
                  {hasCorners && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[#F5F0E8]/80">
                          فورمجة مربعة ({squareCorners} ×{' '}
                          {selectedProduct.square_corner_price})
                        </span>
                        <span className="font-bold">
                          {formatCurrency(priceCalc.squareCornersTotal)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#F5F0E8]/80">
                          فورمجة مثلثة ({triangleCorners} ×{' '}
                          {selectedProduct.triangle_corner_price})
                        </span>
                        <span className="font-bold">
                          {formatCurrency(priceCalc.triangleCornersTotal)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-[#1B5E3B] pt-3 flex justify-between text-lg">
                    <span className="text-[#C9A84C] font-bold">المجموع</span>
                    <span className="text-[#C9A84C] font-bold text-xl">
                      {formatCurrency(priceCalc.subtotal)}
                    </span>
                  </div>
                </div>
                {priceAdjustment && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-300 text-sm">
                          {priceAdjustment.type === 'discount' ? 'خصم' : 'زيادة'}:{' '}
                          {formatCurrency(priceAdjustment.value)}
                        </p>
                        <p className="text-red-300/60 text-xs mt-1">
                          السبب: {priceAdjustment.reason}
                        </p>
                      </div>
                      <button
                        onClick={removePriceAdjustment}
                        className="p-2 hover:bg-red-900/30 rounded-lg text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="bg-[#C9A84C]/10 border-2 border-[#C9A84C] rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#C9A84C] font-bold text-lg">
                      الإجمالي النهائي
                    </span>
                    <span className="text-[#C9A84C] font-bold text-3xl">
                      {formatCurrency(priceCalc.finalTotal)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowPriceModal(true)}
                  className="w-full py-3 bg-[#0D1F17] border-2 border-[#C9A84C]/50 rounded-xl text-[#C9A84C] font-bold flex items-center justify-center gap-2 hover:bg-[#C9A84C]/10 transition-colors"
                >
                  <Lock className="w-4 h-4" /> تعديل السعر (يتطلب كود المدير)
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#1B5E3B] border-t-4 border-[#C9A84C] z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              {currentStep > 1 ? (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 bg-[#0D1F17]/50 hover:bg-[#0D1F17] rounded-xl transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span className="hidden sm:inline">السابق</span>
                </button>
              ) : (
                <div />
              )}
              {priceCalc && currentStep >= 4 && (
                <div className="hidden md:block text-center">
                  <p className="text-xs text-[#F5F0E8]/60">المجموع</p>
                  <p className="text-xl font-bold text-[#C9A84C]">
                    {formatCurrency(priceCalc.finalTotal)}
                  </p>
                </div>
              )}
              {currentStep === 6 ? (
                <button
                  onClick={handleAddToCart}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-8 py-3 bg-[#C9A84C] hover:bg-[#C9A84C]/90 disabled:opacity-50 disabled:cursor-not-allowed text-[#0D1F17] rounded-xl font-bold transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  أضف للسلة
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-8 py-3 bg-[#C9A84C] hover:bg-[#C9A84C]/90 disabled:opacity-50 disabled:cursor-not-allowed text-[#0D1F17] rounded-xl font-bold transition-colors"
                >
                  التالي <ArrowLeft className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Price Adjustment Modal */}
        {showPriceModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
            <div className="bg-[#1B5E3B] rounded-2xl p-6 w-full max-w-md border-2 border-[#C9A84C] space-y-4">
              <h3 className="text-xl font-bold text-[#C9A84C] text-center">
                تعديل السعر
              </h3>
              <p className="text-sm text-[#F5F0E8]/60 text-center">
                يتطلب كود المدير
              </p>
              <input
                type="password"
                value={managerPin}
                onChange={e => setManagerPin(e.target.value)}
                placeholder="أدخل كود المدير"
                className="w-full bg-[#0D1F17] border-2 border-[#C9A84C]/50 rounded-xl px-4 py-3 text-center text-2xl text-[#F5F0E8] focus:border-[#C9A84C] focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAdjustmentType('discount')}
                  className={`py-3 rounded-xl font-bold transition-all ${
                    adjustmentType === 'discount'
                      ? 'bg-red-600 text-white'
                      : 'bg-[#0D1F17] text-[#F5F0E8]/60'
                  }`}
                >
                  خصم
                </button>
                <button
                  onClick={() => setAdjustmentType('increase')}
                  className={`py-3 rounded-xl font-bold transition-all ${
                    adjustmentType === 'increase'
                      ? 'bg-[#C9A84C] text-[#0D1F17]'
                      : 'bg-[#0D1F17] text-[#F5F0E8]/60'
                  }`}
                >
                  زيادة
                </button>
              </div>
              <input
                type="number"
                value={adjustmentValue}
                onChange={e => setAdjustmentValue(e.target.value)}
                placeholder="القيمة بالدرهم"
                className="w-full bg-[#0D1F17] border-2 border-[#1B5E3B] rounded-xl px-4 py-3 text-[#F5F0E8] focus:border-[#C9A84C] focus:outline-none"
              />
              <select
                value={adjustmentReason}
                onChange={e => setAdjustmentReason(e.target.value)}
                className="w-full bg-[#0D1F17] border-2 border-[#1B5E3B] rounded-xl px-4 py-3 text-[#F5F0E8] focus:border-[#C9A84C] focus:outline-none"
              >
                <option value="">اختر السبب...</option>
                <option value="زبون دائم">زبون دائم</option>
                <option value="خصم موسمي">خصم موسمي</option>
                <option value="تعويض">تعويض</option>
                <option value="هدية">هدية</option>
                <option value="other">سبب آخر</option>
              </select>
              {adjustmentReason === 'other' && (
                <input
                  type="text"
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="اكتب السبب..."
                  className="w-full bg-[#0D1F17] border-2 border-[#1B5E3B] rounded-xl px-4 py-3 text-[#F5F0E8] focus:border-[#C9A84C] focus:outline-none"
                />
              )}
              {pinError && (
                <p className="text-red-400 text-sm text-center">{pinError}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setShowPriceModal(false);
                    setPinError('');
                    setManagerPin('');
                  }}
                  className="py-3 bg-[#0D1F17] border border-[#F5F0E8]/20 rounded-xl text-[#F5F0E8] font-bold hover:bg-[#0D1F17]/80 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={applyPriceAdjustment}
                  className="py-3 bg-[#C9A84C] rounded-xl text-[#0D1F17] font-bold hover:bg-[#C9A84C]/90 transition-colors"
                >
                  تأكيد
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}