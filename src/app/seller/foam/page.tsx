'use client';

// ============================================================
// El Mahboubi Salon ERP — Foam Seller Flow
// 6 خطوات: ارتفاع → منتج → عرض → سدادر → فورمجة → حساب
// ============================================================

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrder } from '@/features/order-center/context/OrderContext';
import { buildFoamCartItem } from '@/features/order-center/utils/buildFoamCartItem';
import Head from 'next/head';
import type { FoamProduct, FoamProductHeight } from '@/types/foam-types';
import {
  ArrowRight, ArrowLeft, Plus, Trash2, Check, X, Lock, ShoppingCart,
  Calculator, ChevronRight, Package, Ruler, CornerDownRight, DollarSign,
  AlertCircle, RotateCcw, ImageIcon, Layers, TrendingUp, Minus,
  Edit3, Sparkles,
} from 'lucide-react';
import {
  getFoamProducts, getFoamSettings, calculateFoamPrice, getHeightPrice,
} from '@/lib/foam-lib';

// ─── Steps ─────────────────────────────────────────────────
const STEPS = [
  { id: 1, title: 'الارتفاع', icon: <Ruler className="w-5 h-5" /> },
  { id: 2, title: 'المنتج', icon: <Package className="w-5 h-5" /> },
  { id: 3, title: 'العرض', icon: <Ruler className="w-5 h-5" /> },
  { id: 4, title: 'السدادر', icon: <CornerDownRight className="w-5 h-5" /> },
  { id: 5, title: 'الفورمجة', icon: <Layers className="w-5 h-5" /> },
  { id: 6, title: 'الحساب', icon: <Calculator className="w-5 h-5" /> },
];

// ─── Height Images (ضعها في public/images/foam/heights/) ───
const HEIGHT_IMAGES: Record<number, string> = {
  30: '/images/foam/heights/30.jpg',
  50: '/images/foam/heights/50.jpg',
  70: '/images/foam/heights/70.jpg',
};

const HEIGHT_LABELS: Record<number, string> = {
  30: '30 سم',
  50: '50 سم',
  70: '70 سم',
};

const HEIGHT_DESCRIPTIONS: Record<number, string> = {
  30: 'مناسب للمقاعد الصغيرة والوسائد',
  50: 'الارتفاع الأكثر طلباً — متوسط الراحة',
  70: 'أقصى راحة — للكنبات الكبيرة',
};

export default function FoamSellerPage() {
  const router = useRouter();
  const { addToCart } = useOrder();

  // ─── State ───────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);
  const [products, setProducts] = useState<FoamProduct[]>([]);
  const [selectedHeight, setSelectedHeight] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<FoamProduct | null>(null);
  const [selectedHeightRecord, setSelectedHeightRecord] = useState<FoamProductHeight | null>(null);
  const [widthCm, setWidthCm] = useState<number>(70);
  const [seddars, setSeddars] = useState<number[]>([]);
  const [newSeddarLength, setNewSeddarLength] = useState('');
  const [hasCorners, setHasCorners] = useState<boolean>(false);
  const [squareCorners, setSquareCorners] = useState(0);
  const [triangleCorners, setTriangleCorners] = useState(0);
  const [priceAdjustment, setPriceAdjustment] = useState<{
    type: 'discount' | 'increase';
    value: number;
    reason: string;
  } | null>(null);

  // Manager PIN modal
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [managerPin, setManagerPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'discount' | 'increase'>('discount');
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  // Custom price override (تعديل سعر المتر يدوياً)
  const [customPricePerMeter, setCustomPricePerMeter] = useState<number | null>(null);
  const [showInlinePriceEdit, setShowInlinePriceEdit] = useState(false);
  const [tempPriceInput, setTempPriceInput] = useState('');

  const [error, setError] = useState('');
  const [managerPinCode, setManagerPinCode] = useState('9999');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, settings] = await Promise.all([
        getFoamProducts(true),
        getFoamSettings(),
      ]);
      setProducts(prods);
      setManagerPinCode(settings.manager_pin);
    } catch {
      setError('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // ─── Height Selection ────────────────────────────────────
  const handleSelectHeight = (heightCm: number) => {
    setSelectedHeight(heightCm);
    setSelectedProduct(null);
    setSelectedHeightRecord(null);
    setCustomPricePerMeter(null);
    setShowInlinePriceEdit(false);
    setTempPriceInput('');
    setError('');
    setCurrentStep(2);
  };

  // ─── Product Selection ───────────────────────────────────
  const handleSelectProduct = (product: FoamProduct) => {
    if (selectedHeight === null) return;

    const { pricePerMeter, squareCornerPrice, triangleCornerPrice, heightRecord } =
      getHeightPrice(product, selectedHeight);

    if (!heightRecord) {
      setError(`لا يوجد سعر مسجل لـ ${product.name} بهذا الارتفاع`);
      return;
    }

    setSelectedProduct(product);
    setSelectedHeightRecord(heightRecord);
    setWidthCm(product.default_width_cm || 70);
    setCustomPricePerMeter(null);
    setShowInlinePriceEdit(false);
    setTempPriceInput('');
    setError('');
    setCurrentStep(3);
  };

  const resetFlow = () => {
    setCurrentStep(1);
    setSelectedHeight(null);
    setSelectedProduct(null);
    setSelectedHeightRecord(null);
    setWidthCm(70);
    setSeddars([]);
    setNewSeddarLength('');
    setHasCorners(false);
    setSquareCorners(0);
    setTriangleCorners(0);
    setPriceAdjustment(null);
    setCustomPricePerMeter(null);
    setShowInlinePriceEdit(false);
    setTempPriceInput('');
    setError('');
  };

  // ─── Price helpers ───────────────────────────────────────
  const effectivePricePerMeter =
    customPricePerMeter ?? selectedHeightRecord?.price_per_meter ?? 0;

  const effectiveSquareCornerPrice =
    selectedHeightRecord?.square_corner_price ?? 0;

  const effectiveTriangleCornerPrice =
    selectedHeightRecord?.triangle_corner_price ?? 0;

  const applyCustomPrice = () => {
    const val = parseFloat(tempPriceInput);
    if (!isNaN(val) && val > 0) {
      setCustomPricePerMeter(val);
      setShowInlinePriceEdit(false);
    }
  };

  const resetCustomPrice = () => {
    setCustomPricePerMeter(null);
    setShowInlinePriceEdit(false);
  };

  // ─── Products available for selected height ──────────────
  const productsForHeight = React.useMemo(() => {
    if (selectedHeight === null) return [];
    return products.filter(p => 
      p.heights?.some(h => h.height_cm === selectedHeight)
    );
  }, [products, selectedHeight]);

  // ─── Price calculation ───────────────────────────────────
  const priceCalc = selectedProduct && selectedHeight !== null
    ? calculateFoamPrice(
        seddars,
        effectivePricePerMeter,
        hasCorners,
        squareCorners,
        triangleCorners,
        effectiveSquareCornerPrice,
        effectiveTriangleCornerPrice,
        priceAdjustment
      )
    : null;

  const totalLength = seddars.reduce((sum, len) => sum + len, 0);

  // ─── Navigation ──────────────────────────────────────────
  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedHeight !== null;
      case 2: return selectedProduct !== null;
      case 3: return widthCm > 0;
      case 4: return seddars.length > 0;
      case 5: return true;
      case 6: return true;
      default: return true;
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

  // ─── Seddars ─────────────────────────────────────────────
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

  // ─── Manager PIN ─────────────────────────────────────────
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

  // ─── Add to Cart ─────────────────────────────────────────
  const handleAddToCart = () => {
    if (
      !selectedProduct ||
      selectedHeight === null ||
      !selectedHeightRecord ||
      !priceCalc
    )
      return;

    const cartItem = buildFoamCartItem({
      selectedProduct,
      selectedHeight,
      selectedHeightRecord,
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('ar-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2,
    }).format(amount);

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
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
                <div className="w-12 h-12 bg-[#C9A84C] rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-7 h-7 text-[#0D1F17]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#F5F0E8]">نظام البونج</h1>
                  <p className="text-xs text-[#C9A84C]">El Mahboubi — بيع سريع</p>
                </div>
              </div>
              <button
                onClick={resetFlow}
                className="flex items-center gap-2 px-4 py-2 bg-[#0D1F17]/50 hover:bg-[#0D1F17] rounded-xl text-sm transition-colors border border-[#C9A84C]/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">إعادة البدء</span>
              </button>
            </div>
          </div>
        </header>

        {/* Progress Steps */}
        <div className="bg-[#1B5E3B]/30 border-b border-[#C9A84C]/20">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              {STEPS.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <div
                    className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl transition-all ${
                      currentStep === step.id
                        ? 'bg-[#C9A84C] text-[#0D1F17] font-bold shadow-lg'
                        : currentStep > step.id
                        ? 'text-[#C9A84C]'
                        : 'text-[#F5F0E8]/30'
                    }`}
                  >
                    {step.icon}
                    <span className="text-[10px] sm:text-xs">{step.title}</span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight
                      className={`w-4 h-4 flex-shrink-0 ${
                        currentStep > step.id ? 'text-[#C9A84C]' : 'text-[#F5F0E8]/10'
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
            <div className="bg-red-900/50 border border-red-500/50 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-200 font-medium">{error}</p>
              <button onClick={() => setError('')} className="mr-auto hover:bg-red-900/30 p-1 rounded-lg transition-colors">
                <X className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-[#C9A84C] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-[#C9A84C]">جاري تحميل البيانات...</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && (
          <main className="max-w-4xl mx-auto px-4 py-8 pb-40">

            {/* ═══ STEP 1: Height Selection ═══ */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-[#C9A84C]">اختر الارتفاع</h2>
                  <p className="text-[#F5F0E8]/60 text-lg">
                    اختر ارتفاع البونج المطلوب أولاً
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                  {[30, 50, 70].map(height => (
                    <button
                      key={height}
                      onClick={() => handleSelectHeight(height)}
                      className={`group relative rounded-3xl overflow-hidden border-4 transition-all duration-500 text-center hover:shadow-2xl hover:shadow-[#C9A84C]/10 hover:-translate-y-1 ${
                        selectedHeight === height
                          ? 'border-[#C9A84C] shadow-2xl shadow-[#C9A84C]/20 scale-[1.02]'
                          : 'border-[#1B5E3B] hover:border-[#C9A84C]/60'
                      } bg-[#1B5E3B]/20`}
                    >
                      {/* Image Area */}
                      <div className="aspect-[4/3] bg-[#0D1F17] relative overflow-hidden">
                        <img
                          src={HEIGHT_IMAGES[height]}
                          alt={`ارتفاع ${height} سم`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => { 
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        {/* Fallback if no image */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <img style={{ display: 'none' }} alt="" />
                          <div className="w-full h-full flex items-center justify-center bg-[#1B5E3B]/40">
                            <Ruler className="w-16 h-16 text-[#F5F0E8]/20" />
                          </div>
                        </div>

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1F17] via-transparent to-transparent" />

                        {/* Height Badge */}
                        <div className="absolute top-4 right-4 bg-[#C9A84C] text-[#0D1F17] px-5 py-2 rounded-2xl font-bold text-xl shadow-xl">
                          {HEIGHT_LABELS[height]}
                        </div>

                        {/* Selected indicator */}
                        {selectedHeight === height && (
                          <div className="absolute top-4 left-4 w-10 h-10 bg-[#C9A84C] rounded-full flex items-center justify-center shadow-lg animate-bounce">
                            <Check className="w-6 h-6 text-[#0D1F17]" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6 space-y-3">
                        <h3 className="text-2xl font-bold text-[#F5F0E8]">
                          بونج {HEIGHT_LABELS[height]}
                        </h3>
                        <p className="text-sm text-[#F5F0E8]/50 leading-relaxed">
                          {HEIGHT_DESCRIPTIONS[height]}
                        </p>
                        <div className="pt-3 flex items-center justify-center gap-2 text-[#C9A84C]">
                          <Sparkles className="w-4 h-4" />
                          <span className="font-bold text-sm">اضغط للاختيار</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ STEP 2: Product Selection ═══ */}
            {currentStep === 2 && selectedHeight !== null && (
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setCurrentStep(1);
                      setSelectedProduct(null);
                      setSelectedHeightRecord(null);
                    }}
                    className="p-3 hover:bg-[#1B5E3B]/50 rounded-xl transition-colors border border-[#1B5E3B]"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-3xl font-bold text-[#C9A84C]">اختر المنتج</h2>
                    <p className="text-sm text-[#F5F0E8]/60">
                      الارتفاع المختار:{' '}
                      <span className="text-[#C9A84C] font-bold text-lg">{selectedHeight} سم</span>
                    </p>
                  </div>
                </div>

                {productsForHeight.length === 0 ? (
                  <div className="bg-[#1B5E3B]/20 rounded-3xl p-12 border border-[#1B5E3B] text-center space-y-4">
                    <AlertCircle className="w-16 h-16 text-[#F5F0E8]/30 mx-auto" />
                    <p className="text-xl text-[#F5F0E8]/60">
                      لا توجد منتجات مسجلة لهذا الارتفاع
                    </p>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-8 py-3 bg-[#C9A84C] text-[#0D1F17] rounded-xl font-bold hover:bg-[#C9A84C]/90 transition-colors"
                    >
                      العودة للارتفاع
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {productsForHeight.map(product => {
                      const { pricePerMeter, squareCornerPrice, triangleCornerPrice, heightRecord } =
                        getHeightPrice(product, selectedHeight);

                      const isSelected = selectedProduct?.id === product.id;

                      return (
                        <button
                          key={product.id}
                          onClick={() => handleSelectProduct(product)}
                          className={`group relative rounded-3xl overflow-hidden border-4 transition-all duration-500 text-right hover:shadow-2xl hover:-translate-y-1 ${
                            isSelected
                              ? 'border-[#C9A84C] shadow-2xl shadow-[#C9A84C]/20 scale-[1.02]'
                              : 'border-[#1B5E3B] hover:border-[#C9A84C]/60'
                          } bg-[#1B5E3B]/20`}
                        >
                          {/* Image */}
                          <div className="aspect-video bg-[#0D1F17] relative overflow-hidden">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-16 h-16 text-[#F5F0E8]/20" />
                              </div>
                            )}

                            {/* Selected badge */}
                            {isSelected && (
                              <div className="absolute top-3 left-3 w-10 h-10 bg-[#C9A84C] rounded-full flex items-center justify-center shadow-lg">
                                <Check className="w-6 h-6 text-[#0D1F17]" />
                              </div>
                            )}

                            {/* Price badge */}
                            <div className="absolute bottom-3 right-3 bg-[#0D1F17]/90 backdrop-blur-sm text-[#C9A84C] px-4 py-2 rounded-xl font-bold text-lg border border-[#C9A84C]/30">
                              {pricePerMeter} درهم/م
                            </div>
                          </div>

                          {/* Info */}
                          <div className="p-5 space-y-3">
                            <h3 className="text-xl font-bold text-[#F5F0E8]">{product.name}</h3>
                            {product.description && (
                              <p className="text-sm text-[#F5F0E8]/50 line-clamp-2">
                                {product.description}
                              </p>
                            )}

                            {/* Prices detail */}
                            <div className="bg-[#0D1F17]/50 rounded-xl p-3 space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-[#F5F0E8]/50">السعر لكل متر</span>
                                <span className="text-[#C9A84C] font-bold">{pricePerMeter} درهم</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#F5F0E8]/50">فورمجة مربعة</span>
                                <span className="text-[#F5F0E8]/70">{squareCornerPrice} درهم</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#F5F0E8]/50">فورمجة مثلثة</span>
                                <span className="text-[#F5F0E8]/70">{triangleCornerPrice} درهم</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══ STEP 3: Width Input ═══ */}
            {currentStep === 3 && selectedProduct && (
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setCurrentStep(2);
                      setSelectedProduct(null);
                      setSelectedHeightRecord(null);
                    }}
                    className="p-3 hover:bg-[#1B5E3B]/50 rounded-xl transition-colors border border-[#1B5E3B]"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-3xl font-bold text-[#C9A84C]">العرض</h2>
                    <p className="text-sm text-[#F5F0E8]/60">
                      {selectedProduct.name} — {selectedHeight} سم
                    </p>
                  </div>
                </div>

                <div className="bg-[#1B5E3B]/20 rounded-3xl p-8 border border-[#1B5E3B] space-y-8 max-w-xl mx-auto">
                  <div className="text-center space-y-2">
                    <Ruler className="w-12 h-12 text-[#C9A84C] mx-auto" />
                    <p className="text-[#F5F0E8]/60">العرض الافتراضي</p>
                    <div className="text-6xl font-bold text-[#C9A84C]">
                      {widthCm} <span className="text-3xl">سم</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm text-[#F5F0E8]/80 text-center">
                      تعديل العرض (اختياري)
                    </label>
                    <div className="flex items-center gap-4 justify-center">
                      <button
                        onClick={() => setWidthCm(Math.max(1, widthCm - 5))}
                        className="w-14 h-14 bg-[#0D1F17] border-2 border-[#1B5E3B] rounded-2xl flex items-center justify-center text-2xl hover:border-[#C9A84C] transition-colors"
                      >
                        <Minus className="w-6 h-6" />
                      </button>
                      <input
                        type="number"
                        value={widthCm}
                        min={1}
                        onChange={e => setWidthCm(parseInt(e.target.value) || 0)}
                        className="w-32 bg-[#0D1F17] border-2 border-[#1B5E3B] rounded-2xl px-4 py-4 text-3xl text-center text-[#F5F0E8] focus:border-[#C9A84C] focus:outline-none transition-colors"
                      />
                      <button
                        onClick={() => setWidthCm(widthCm + 5)}
                        className="w-14 h-14 bg-[#0D1F17] border-2 border-[#1B5E3B] rounded-2xl flex items-center justify-center text-2xl hover:border-[#C9A84C] transition-colors"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                    <p className="text-xs text-[#F5F0E8]/40 text-center">
                      يمكن تعديل هذا لاحقاً حسب حاجة الزبون
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ STEP 4: Seddars ═══ */}
            {currentStep === 4 && (
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <button
                    onClick={prevStep}
                    className="p-3 hover:bg-[#1B5E3B]/50 rounded-xl transition-colors border border-[#1B5E3B]"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-3xl font-bold text-[#C9A84C]">أطوال السدادر</h2>
                    <p className="text-sm text-[#F5F0E8]/60">
                      أدخل أطوال السدادر بالمتر
                    </p>
                  </div>
                </div>

                <div className="bg-[#1B5E3B]/20 rounded-3xl p-6 border border-[#1B5E3B] space-y-6 max-w-xl mx-auto">
                  {/* Add seddar */}
                  <div className="flex gap-3">
                    <input
                      type="number"
                      step="0.01"
                      value={newSeddarLength}
                      onChange={e => setNewSeddarLength(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addSeddar()}
                      placeholder="أدخل الطول بالمتر (مثال: 3.20)"
                      className="flex-1 bg-[#0D1F17] border-2 border-[#1B5E3B] rounded-xl px-4 py-4 text-[#F5F0E8] text-lg focus:border-[#C9A84C] focus:outline-none transition-colors placeholder:text-[#F5F0E8]/30"
                    />
                    <button
                      onClick={addSeddar}
                      className="bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-[#0D1F17] px-6 py-4 rounded-xl font-bold flex items-center gap-2 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="hidden sm:inline">إضافة</span>
                    </button>
                  </div>

                  {/* List */}
                  {seddars.length > 0 && (
                    <div className="space-y-3">
                      {seddars.map((len, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 bg-[#0D1F17] rounded-xl px-4 py-3 border border-[#1B5E3B]/50 hover:border-[#C9A84C]/30 transition-colors"
                        >
                          <span className="text-[#C9A84C] font-bold w-10 text-lg">#{idx + 1}</span>
                          <input
                            type="number"
                            step="0.01"
                            value={len}
                            onChange={e => updateSeddar(idx, e.target.value)}
                            className="flex-1 bg-transparent text-[#F5F0E8] text-xl font-bold focus:outline-none"
                          />
                          <span className="text-[#F5F0E8]/60 font-medium">متر</span>
                          <button
                            onClick={() => removeSeddar(idx)}
                            className="p-2 hover:bg-red-900/30 rounded-lg text-red-400 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total */}
                  <div className="bg-[#0D1F17] rounded-2xl p-5 border-2 border-[#C9A84C]/30">
                    <div className="flex items-center justify-between">
                      <span className="text-[#F5F0E8]/80 text-lg">إجمالي أطوال السدادر:</span>
                      <span className="text-3xl font-bold text-[#C9A84C]">
                        {totalLength.toFixed(2)} <span className="text-xl">متر</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ STEP 5: Corners (Formaja) ═══ */}
            {currentStep === 5 && (
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <button
                    onClick={prevStep}
                    className="p-3 hover:bg-[#1B5E3B]/50 rounded-xl transition-colors border border-[#1B5E3B]"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-3xl font-bold text-[#C9A84C]">الفورمجة</h2>
                    <p className="text-sm text-[#F5F0E8]/60">
                      هل يوجد فورمجة في هذا الطلب؟
                    </p>
                  </div>
                </div>

                <div className="bg-[#1B5E3B]/20 rounded-3xl p-8 border border-[#1B5E3B] space-y-8 max-w-xl mx-auto">
                  {/* Yes/No */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setHasCorners(false)}
                      className={`py-8 rounded-2xl text-2xl font-bold transition-all duration-300 ${
                        hasCorners === false
                          ? 'bg-red-900/50 border-2 border-red-500 text-red-200 shadow-lg'
                          : 'bg-[#0D1F17] border-2 border-[#1B5E3B] text-[#F5F0E8]/40 hover:border-red-500/30 hover:text-red-200/60'
                      }`}
                    >
                      <X className="w-10 h-10 mx-auto mb-3" /> لا
                    </button>
                    <button
                      onClick={() => setHasCorners(true)}
                      className={`py-8 rounded-2xl text-2xl font-bold transition-all duration-300 ${
                        hasCorners === true
                          ? 'bg-[#C9A84C] text-[#0D1F17] shadow-2xl shadow-[#C9A84C]/20'
                          : 'bg-[#0D1F17] border-2 border-[#1B5E3B] text-[#F5F0E8]/40 hover:border-[#C9A84C]/30 hover:text-[#C9A84C]/60'
                      }`}
                    >
                      <Check className="w-10 h-10 mx-auto mb-3" /> نعم
                    </button>
                  </div>

                  {/* Corner inputs */}
                  {hasCorners && (
                    <div className="space-y-6 pt-6 border-t border-[#1B5E3B] animate-in fade-in slide-in-from-top-4 duration-500">
                      {/* Square */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-[#F5F0E8]/80">
                            عدد الفورمجات المربعة
                          </label>
                          <span className="text-[#C9A84C] font-bold text-sm">
                            {effectiveSquareCornerPrice} درهم/واحدة
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => setSquareCorners(Math.max(0, squareCorners - 1))}
                            className="w-14 h-14 bg-[#0D1F17] border-2 border-[#1B5E3B] rounded-2xl flex items-center justify-center text-2xl hover:border-[#C9A84C] transition-colors"
                          >
                            <Minus className="w-6 h-6" />
                          </button>
                          <span className="text-4xl font-bold w-20 text-center text-[#F5F0E8]">
                            {squareCorners}
                          </span>
                          <button
                            onClick={() => setSquareCorners(squareCorners + 1)}
                            className="w-14 h-14 bg-[#0D1F17] border-2 border-[#1B5E3B] rounded-2xl flex items-center justify-center text-2xl hover:border-[#C9A84C] transition-colors"
                          >
                            <Plus className="w-6 h-6" />
                          </button>
                        </div>
                      </div>

                      {/* Triangle */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-[#F5F0E8]/80">
                            عدد الفورمجات المثلثة
                          </label>
                          <span className="text-[#C9A84C] font-bold text-sm">
                            {effectiveTriangleCornerPrice} درهم/واحدة
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => setTriangleCorners(Math.max(0, triangleCorners - 1))}
                            className="w-14 h-14 bg-[#0D1F17] border-2 border-[#1B5E3B] rounded-2xl flex items-center justify-center text-2xl hover:border-[#C9A84C] transition-colors"
                          >
                            <Minus className="w-6 h-6" />
                          </button>
                          <span className="text-4xl font-bold w-20 text-center text-[#F5F0E8]">
                            {triangleCorners}
                          </span>
                          <button
                            onClick={() => setTriangleCorners(triangleCorners + 1)}
                            className="w-14 h-14 bg-[#0D1F17] border-2 border-[#1B5E3B] rounded-2xl flex items-center justify-center text-2xl hover:border-[#C9A84C] transition-colors"
                          >
                            <Plus className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══ STEP 6: Price Summary ═══ */}
            {currentStep === 6 && priceCalc && selectedProduct && selectedHeightRecord && (
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <button
                    onClick={prevStep}
                    className="p-3 hover:bg-[#1B5E3B]/50 rounded-xl transition-colors border border-[#1B5E3B]"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-3xl font-bold text-[#C9A84C]">الحساب</h2>
                    <p className="text-sm text-[#F5F0E8]/60">
                      مراجعة الطلب قبل الإضافة للسلة
                    </p>
                  </div>
                </div>

                <div className="bg-[#1B5E3B]/20 rounded-3xl p-8 border border-[#1B5E3B] space-y-6 max-w-2xl mx-auto">
                  {/* Order Details */}
                  <div className="space-y-4">
                    <div className="flex justify-between py-3 border-b border-[#1B5E3B]/30">
                      <span className="text-[#F5F0E8]/60">المنتج</span>
                      <span className="font-bold text-lg">{selectedProduct.name}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-[#1B5E3B]/30">
                      <span className="text-[#F5F0E8]/60">الارتفاع</span>
                      <span className="font-bold text-lg">{selectedHeight} سم</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-[#1B5E3B]/30">
                      <span className="text-[#F5F0E8]/60">العرض</span>
                      <span className="font-bold text-lg">{widthCm} سم</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-[#1B5E3B]/30">
                      <span className="text-[#F5F0E8]/60">إجمالي الأطوال</span>
                      <span className="font-bold text-lg">
                        {priceCalc.totalLength.toFixed(2)} متر
                      </span>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="bg-[#0D1F17] rounded-2xl p-6 space-y-4">
                    {/* Material */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-[#F5F0E8]/80">
                          السدادر
                        </span>
                        <span className="text-xs text-[#F5F0E8]/40">
                          ({priceCalc.totalLength.toFixed(2)} م × {effectivePricePerMeter} درهم)
                        </span>
                        {customPricePerMeter !== null && (
                          <span className="text-xs bg-[#C9A84C]/20 text-[#C9A84C] px-2 py-0.5 rounded-full">
                            سعر معدّل
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-lg">
                        {formatCurrency(priceCalc.seddarsTotal)}
                      </span>
                    </div>

                    {/* Inline price edit */}
                    {showInlinePriceEdit ? (
                      <div className="flex gap-2 animate-in fade-in">
                        <input
                          type="number"
                          value={tempPriceInput}
                          onChange={e => setTempPriceInput(e.target.value)}
                          placeholder="السعر الجديد"
                          className="flex-1 bg-[#1B5E3B] border border-[#C9A84C]/50 rounded-lg px-3 py-2 text-[#F5F0E8] focus:outline-none"
                        />
                        <button
                          onClick={applyCustomPrice}
                          className="px-4 py-2 bg-[#C9A84C] text-[#0D1F17] rounded-lg font-bold text-sm"
                        >
                          تأكيد
                        </button>
                        <button
                          onClick={() => setShowInlinePriceEdit(false)}
                          className="px-4 py-2 bg-[#0D1F17] border border-[#F5F0E8]/20 rounded-lg text-sm"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setTempPriceInput(effectivePricePerMeter.toString());
                          setShowInlinePriceEdit(true);
                        }}
                        className="flex items-center gap-2 text-xs text-[#C9A84C] hover:text-[#C9A84C]/80 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        تعديل سعر المتر يدوياً
                      </button>
                    )}

                    {/* Corners */}
                    {hasCorners && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-[#F5F0E8]/80">
                            فورمجة مربعة ({squareCorners} × {effectiveSquareCornerPrice})
                          </span>
                          <span className="font-bold">
                            {formatCurrency(priceCalc.squareCornersTotal)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#F5F0E8]/80">
                            فورمجة مثلثة ({triangleCorners} × {effectiveTriangleCornerPrice})
                          </span>
                          <span className="font-bold">
                            {formatCurrency(priceCalc.triangleCornersTotal)}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Subtotal */}
                    <div className="border-t border-[#1B5E3B] pt-4 flex justify-between text-xl">
                      <span className="text-[#C9A84C] font-bold">المجموع</span>
                      <span className="text-[#C9A84C] font-bold text-2xl">
                        {formatCurrency(priceCalc.subtotal)}
                      </span>
                    </div>
                  </div>

                  {/* Price Adjustment */}
                  {priceAdjustment && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-5">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-red-300 font-bold">
                            {priceAdjustment.type === 'discount' ? 'خصم' : 'زيادة'}:{' '}
                            {formatCurrency(priceAdjustment.value)}
                          </p>
                          <p className="text-red-300/60 text-sm">
                            السبب: {priceAdjustment.reason}
                          </p>
                        </div>
                        <button
                          onClick={removePriceAdjustment}
                          className="p-2 hover:bg-red-900/30 rounded-lg text-red-400 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Final Total */}
                  <div className="bg-[#C9A84C]/10 border-2 border-[#C9A84C] rounded-2xl p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[#C9A84C] font-bold text-xl block">الإجمالي النهائي</span>
                        {customPricePerMeter !== null && (
                          <span className="text-xs text-[#C9A84C]/60">
                            سعر معدّل: {customPricePerMeter} درهم/م
                          </span>
                        )}
                      </div>
                      <span className="text-[#C9A84C] font-bold text-4xl">
                        {formatCurrency(priceCalc.finalTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Manager adjustment button */}
                  <button
                    onClick={() => setShowPriceModal(true)}
                    className="w-full py-4 bg-[#0D1F17] border-2 border-[#C9A84C]/50 rounded-2xl text-[#C9A84C] font-bold flex items-center justify-center gap-2 hover:bg-[#C9A84C]/10 transition-colors"
                  >
                    <Lock className="w-5 h-5" />
                    تعديل السعر (خصم/زيادة — يتطلب كود المدير)
                  </button>
                </div>
              </div>
            )}
          </main>
        )}

        {/* Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#1B5E3B] border-t-4 border-[#C9A84C] z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Back */}
              {currentStep > 1 ? (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 bg-[#0D1F17]/50 hover:bg-[#0D1F17] rounded-xl transition-colors border border-[#F5F0E8]/10"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span className="hidden sm:inline font-bold">السابق</span>
                </button>
              ) : (
                <div className="w-20" />
              )}

              {/* Price Preview */}
              {priceCalc && currentStep >= 4 && (
                <div className="hidden md:block text-center">
                  <p className="text-xs text-[#F5F0E8]/60">المجموع</p>
                  <p className="text-2xl font-bold text-[#C9A84C]">
                    {formatCurrency(priceCalc.finalTotal)}
                  </p>
                </div>
              )}

              {/* Next / Add to Cart */}
              {currentStep === 6 ? (
                <button
                  onClick={handleAddToCart}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-8 py-4 bg-[#C9A84C] hover:bg-[#C9A84C]/90 disabled:opacity-50 disabled:cursor-not-allowed text-[#0D1F17] rounded-xl font-bold text-lg transition-colors shadow-lg shadow-[#C9A84C]/20"
                >
                  <ShoppingCart className="w-6 h-6" />
                  أضف للسلة
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-8 py-4 bg-[#C9A84C] hover:bg-[#C9A84C]/90 disabled:opacity-50 disabled:cursor-not-allowed text-[#0D1F17] rounded-xl font-bold text-lg transition-colors shadow-lg shadow-[#C9A84C]/20"
                >
                  التالي <ArrowLeft className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Price Adjustment Modal */}
        {showPriceModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-[#1B5E3B] rounded-3xl p-8 w-full max-w-md border-2 border-[#C9A84C] space-y-5 shadow-2xl">
              <div className="text-center space-y-1">
                <Lock className="w-10 h-10 text-[#C9A84C] mx-auto" />
                <h3 className="text-2xl font-bold text-[#C9A84C]">تعديل السعر</h3>
                <p className="text-sm text-[#F5F0E8]/60">يتطلب كود المدير</p>
              </div>

              <input
                type="password"
                value={managerPin}
                onChange={e => setManagerPin(e.target.value)}
                placeholder="أدخل كود المدير"
                className="w-full bg-[#0D1F17] border-2 border-[#C9A84C]/50 rounded-xl px-4 py-4 text-center text-2xl text-[#F5F0E8] focus:border-[#C9A84C] focus:outline-none tracking-widest"
              />

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAdjustmentType('discount')}
                  className={`py-4 rounded-xl font-bold text-lg transition-all ${
                    adjustmentType === 'discount'
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'bg-[#0D1F17] text-[#F5F0E8]/60 border border-[#1B5E3B]'
                  }`}
                >
                  خصم
                </button>
                <button
                  onClick={() => setAdjustmentType('increase')}
                  className={`py-4 rounded-xl font-bold text-lg transition-all ${
                    adjustmentType === 'increase'
                      ? 'bg-[#C9A84C] text-[#0D1F17] shadow-lg'
                      : 'bg-[#0D1F17] text-[#F5F0E8]/60 border border-[#1B5E3B]'
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
                className="w-full bg-[#0D1F17] border-2 border-[#1B5E3B] rounded-xl px-4 py-4 text-[#F5F0E8] text-lg focus:border-[#C9A84C] focus:outline-none"
              />

              <select
                value={adjustmentReason}
                onChange={e => setAdjustmentReason(e.target.value)}
                className="w-full bg-[#0D1F17] border-2 border-[#1B5E3B] rounded-xl px-4 py-4 text-[#F5F0E8] focus:border-[#C9A84C] focus:outline-none"
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
                <p className="text-red-400 text-sm text-center bg-red-900/20 rounded-lg py-2">
                  {pinError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowPriceModal(false);
                    setPinError('');
                    setManagerPin('');
                  }}
                  className="py-4 bg-[#0D1F17] border border-[#F5F0E8]/20 rounded-xl text-[#F5F0E8] font-bold hover:bg-[#0D1F17]/80 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={applyPriceAdjustment}
                  className="py-4 bg-[#C9A84C] rounded-xl text-[#0D1F17] font-bold hover:bg-[#C9A84C]/90 transition-colors"
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