'use client';

// ============================================================
// El Mahboubi Salon ERP — Wood Order Seller Flow (Cart Mode)
// تدفق البائع لطلبات العود — يُرسل للسلة المشتركة
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// ← FIXED: use OrderCartContext instead of OrderContext
import { useOrderCart } from '@/contexts/OrderCartContext';
import { buildWoodCartItem } from "@/features/order-center/utils/buildWoodCartItem";
import {
  ChevronLeft, ChevronRight, Plus, Minus, Trash2, Save, Printer,
  Send, Image as ImageIcon, Ruler, Box, Sofa, Table, Armchair,
  CornerDownRight, ArrowRightLeft, Square, CheckCircle, AlertCircle,
  User, Phone, MapPin, Calendar, DollarSign, Percent, FileText,
  MessageSquare, RotateCcw, Eye, ShoppingCart
} from 'lucide-react';
import {
  getWoodPricingModels,
  calculateSeddariPrice,
  calculateWoodOrderTotal,
} from '@/lib/supabase-wood';
import type {
  WoodPricingModel,
  WoodOrderSeddari,
  WoodOrderItem,
  WoodFlowState,
  WoodCalculationResult,
} from '@/types/wood-types';
import { WOOD_ITEM_TYPE_LABELS, SALON_SHAPE_LABELS, JUNCTION_TYPE_LABELS, MODIFY_REASONS } from '@/types/wood-types';

const THEME = {
  primary: '#1B5E38',
  primaryLight: '#2D7A4F',
  gold: '#C9A84C',
  goldLight: '#D4B85A',
  cream: '#F5F0E8',
  dark: '#0D1F17',
  darkCard: '#1A2E22',
  darkElevated: '#243D2E',
  danger: '#DC2626',
  warning: '#F59E0B',
  success: '#10B981',
};

// ════════════════════════════════════════════════════════════
// FIXED: Strict type for salon shape
// ════════════════════════════════════════════════════════════
type SalonShape = "U" | "L" | "custom" | "straight";

// ════════════════════════════════════════════════════════════
// STEPS — Removed 'customer' and 'invoice', kept 5 steps
// ════════════════════════════════════════════════════════════
const STEPS = [
  { key: 'model', label: 'اختيار الموديل', icon: <Box className="w-4 h-4" /> },
  { key: 'measurements', label: 'المقاسات', icon: <Ruler className="w-4 h-4" /> },
  { key: 'shape', label: 'الشكل', icon: <Sofa className="w-4 h-4" /> },
  { key: 'extras', label: 'الإضافات', icon: <Plus className="w-4 h-4" /> },
  { key: 'summary', label: 'الملخص', icon: <FileText className="w-4 h-4" /> },
] as const;

export default function WoodSellerFlow() {
  const router = useRouter();
  // ← FIXED: use useOrderCart instead of useOrder
  const { addToCart } = useOrderCart();
  const [step, setStep] = useState(0);
  const [models, setModels] = useState<WoodPricingModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [flowState, setFlowState] = useState<WoodFlowState>({
    step: 'model',
    seddars: [],
    items: [],
    salonShape: 'straight',
    customer: { name: '', phone: '', city: '', address: '' },
    depositPercent: 30,
    discountAmount: 0,
    discountReason: '',
    notes: '',
    priceModified: false,
  });
  const [calculation, setCalculation] = useState<WoodCalculationResult | null>(null);
  const [showPriceModifyModal, setShowPriceModifyModal] = useState(false);
  const [managerPin, setManagerPin] = useState('');
  const [modifyReason, setModifyReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [newFinalPrice, setNewFinalPrice] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => { loadModels(); }, []);
  useEffect(() => { recalculate(); }, [flowState.seddars, flowState.items, flowState.discountAmount, flowState.selectedModel]);

  const loadModels = async () => {
    try {
      const data = await getWoodPricingModels(true);
      setModels(data);
    } catch (err) {
      console.error('Error loading models:', err);
    } finally {
      setLoading(false);
    }
  };

  const recalculate = () => {
    if (!flowState.selectedModel) return;
    const result = calculateWoodOrderTotal(
      flowState.seddars,
      flowState.items,
      flowState.discountAmount
    );
    setCalculation(result);
    if (!flowState.priceModified) {
      setFlowState(prev => ({ ...prev, finalPrice: result.final_total }));
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      setFlowState(prev => ({ ...prev, step: STEPS[step + 1].key }));
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setFlowState(prev => ({ ...prev, step: STEPS[step - 1].key }));
    }
  };

  const canProceed = () => {
    switch (STEPS[step].key) {
      case 'model': return !!flowState.selectedModel;
      case 'measurements': return flowState.seddars.length > 0;
      case 'shape': return true;
      case 'extras': return true;
      case 'summary': return true;
      default: return true;
    }
  };

  // ════════════════════════════════════════════════════════════
  // NEW: Add to shared cart instead of saving to Supabase
  // ════════════════════════════════════════════════════════════
  const handleAddToCart = () => {
    if (!flowState.selectedModel || !calculation) return;

    // ← FIXED: map seddars & items to the exact shape expected by buildWoodCartItem
    const cartItem = buildWoodCartItem({
      selectedModel: flowState.selectedModel,
      seddars: flowState.seddars.map(s => ({
        index: s.seddari_index,
        length: s.length_cm,
        price: s.seddari_price,
      })),
      items: flowState.items.map(i => ({
        item_name: i.item_name,
        quantity: i.quantity,
        unit_price: i.original_price,
        total_price: i.total_price,
      })),
      salonShape: flowState.salonShape,
      notes: flowState.notes,
      priceModified: flowState.priceModified,
      finalPrice: flowState.finalPrice,
      discountAmount: flowState.discountAmount,
      discountReason: flowState.discountReason,
    });

    addToCart(cartItem);
    resetFlow();
    router.push('/seller/order-center');
  };

  const handleModifyFinalPrice = () => {
    if (managerPin !== '9999') {
      setPinError('كود المدير غير صحيح');
      return;
    }
    const price = parseFloat(newFinalPrice);
    if (isNaN(price) || price <= 0) {
      setPinError('السعر غير صالح');
      return;
    }
    const reason = modifyReason === 'other' ? customReason : MODIFY_REASONS.find(r => r.value === modifyReason)?.label || '';
    setFlowState(prev => ({
      ...prev,
      finalPrice: price,
      priceModified: true,
      discountAmount: calculation ? calculation.final_total - price : 0,
      discountReason: reason,
    }));
    setShowPriceModifyModal(false);
    setManagerPin('');
    setPinError('');
  };

  const resetFlow = () => {
    setStep(0);
    setFlowState({
      step: 'model',
      seddars: [],
      items: [],
      salonShape: 'straight',
      customer: { name: '', phone: '', city: '', address: '' },
      depositPercent: 30,
      discountAmount: 0,
      discountReason: '',
      notes: '',
      priceModified: false,
    });
    setCalculation(null);
  };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center" style={{ backgroundColor: THEME.dark, color: THEME.cream }}>
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#C9A84C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="opacity-60">جاري تحميل الموديلات...</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen" style={{ backgroundColor: THEME.dark, color: THEME.cream }}>
      {/* Progress Bar */}
      <div className="sticky top-0 z-40 border-b border-white/10" style={{ backgroundColor: THEME.darkCard }}>
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-bold text-lg flex items-center gap-2">
              <Box className="w-5 h-5" style={{ color: THEME.gold }} />
              طلب عود جديد
            </h1>
            <button onClick={resetFlow} className="flex items-center gap-1 text-sm opacity-60 hover:opacity-100 transition-opacity">
              <RotateCcw className="w-3.5 h-3.5" />
              إعادة البدء
            </button>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {STEPS.map((s, idx) => (
              <React.Fragment key={s.key}>
                <button
                  onClick={() => { if (idx <= step) { setStep(idx); setFlowState(prev => ({ ...prev, step: s.key })); }}}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                    idx === step ? 'font-bold' : idx < step ? 'opacity-70' : 'opacity-40 cursor-not-allowed'
                  }`}
                  style={idx === step ? { backgroundColor: THEME.primary + '30', color: THEME.primaryLight } : {}}
                >
                  {s.icon}
                  {s.label}
                  {idx < step && <CheckCircle className="w-3 h-3 text-green-500" />}
                </button>
                {idx < STEPS.length - 1 && (
                  <ChevronLeft className="w-3 h-3 opacity-30 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6 pb-32">
        {STEPS[step].key === 'model' && (
          <ModelSelectionStep
            models={models}
            selected={flowState.selectedModel}
            onSelect={(model) => setFlowState(prev => ({ ...prev, selectedModel: model }))}
          />
        )}
        {STEPS[step].key === 'measurements' && flowState.selectedModel && (
          <MeasurementsStep
            model={flowState.selectedModel}
            seddars={flowState.seddars}
            onChange={(seddars) => setFlowState(prev => ({ ...prev, seddars }))}
          />
        )}
        {STEPS[step].key === 'shape' && (
          <ShapeStep
            shape={flowState.salonShape}
            onChange={(shape) => setFlowState(prev => ({ ...prev, salonShape: shape }))}
          />
        )}
        {STEPS[step].key === 'extras' && flowState.selectedModel && (
          <ExtrasStep
            model={flowState.selectedModel}
            items={flowState.items}
            onChange={(items) => setFlowState(prev => ({ ...prev, items }))}
          />
        )}
        {STEPS[step].key === 'summary' && calculation && (
          <SummaryStep
            flowState={flowState}
            calculation={calculation}
            onModifyPrice={() => setShowPriceModifyModal(true)}
          />
        )}
      </div>

      {/* Bottom Actions */}
      <div className="sticky bottom-0 z-40 border-t border-white/10 px-4 py-3" style={{ backgroundColor: THEME.darkCard }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/20 hover:bg-white/5 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
            السابق
          </button>

          {calculation && (
            <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-lg" style={{ backgroundColor: THEME.dark }}>
              <div className="text-sm">
                <span className="opacity-60">المجموع: </span>
                <span className="font-bold text-lg" style={{ color: THEME.gold }}>
                  {flowState.priceModified && flowState.finalPrice ? flowState.finalPrice : calculation.final_total} درهم
                </span>
              </div>
              {flowState.priceModified && (
                <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">مُعدَّل</span>
              )}
            </div>
          )}

          {STEPS[step].key === 'summary' ? (
            <button
              onClick={handleAddToCart}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-bold transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: THEME.primary }}
            >
              <ShoppingCart className="w-4 h-4" />
              أضف للسلة
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold transition-colors hover:opacity-90 disabled:opacity-30"
              style={{ backgroundColor: THEME.primary }}
            >
              التالي
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Price Modify Modal */}
      {showPriceModifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md rounded-xl p-6 border border-white/10" style={{ backgroundColor: THEME.darkCard }}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" style={{ color: THEME.gold }} />
              تعديل السعر النهائي
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 opacity-80">كود المدير *</label>
                <input type="password" value={managerPin} onChange={(e) => setManagerPin(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#C9A84C]"
                  placeholder="أدخل كود المدير" />
              </div>
              <div>
                <label className="block text-sm mb-2 opacity-80">السعر الجديد *</label>
                <div className="relative">
                  <input type="number" value={newFinalPrice} onChange={(e) => setNewFinalPrice(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#C9A84C]"
                    placeholder={calculation?.final_total.toString()} />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-50">درهم</span>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2 opacity-80">سبب التعديل *</label>
                <select value={modifyReason} onChange={(e) => setModifyReason(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#C9A84C]">
                  <option value="">اختر السبب...</option>
                  {MODIFY_REASONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              {modifyReason === 'other' && (
                <div>
                  <label className="block text-sm mb-2 opacity-80">سبب آخر (وصف)</label>
                  <textarea value={customReason} onChange={(e) => setCustomReason(e.target.value)} rows={2}
                    className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#C9A84C] resize-none"
                    placeholder="اكتب السبب..." />
                </div>
              )}
              {pinError && <p className="text-red-400 text-sm">{pinError}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowPriceModifyModal(false)} className="flex-1 py-2.5 rounded-lg border border-white/20 hover:bg-white/5 transition-colors">
                  إلغاء
                </button>
                <button onClick={handleModifyFinalPrice}
                  className="flex-1 py-2.5 rounded-lg text-white font-semibold transition-colors hover:opacity-90"
                  style={{ backgroundColor: THEME.primary }}>
                  تأكيد التعديل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ════════════════════════════════════════════════════════════

function ModelSelectionStep({ models, selected, onSelect }: {
  models: WoodPricingModel[];
  selected: WoodPricingModel | undefined;
  onSelect: (m: WoodPricingModel) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold mb-2">اختر موديل العود</h2>
        <p className="opacity-60">اختر نموذج التسعير المناسب للزبون</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map(model => (
          <button key={model.id} onClick={() => onSelect(model)}
            className={`relative rounded-xl border-2 overflow-hidden text-right transition-all hover:scale-[1.02] ${
              selected?.id === model.id ? 'border-[#C9A84C]' : 'border-white/10 hover:border-white/30'
            }`} style={{ backgroundColor: THEME.darkCard }}>
            {selected?.id === model.id && (
              <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: THEME.gold }}>
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="h-36 relative overflow-hidden" style={{ backgroundColor: THEME.dark }}>
              {model.image_url ? (
                <img src={model.image_url} alt={model.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Box className="w-12 h-12 opacity-20" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1">{model.name}</h3>
              <p className="text-sm opacity-60 mb-2">{model.code} • {model.wood_type}</p>
              <div className="flex items-center gap-3 text-sm">
                <span className="px-2 py-1 rounded" style={{ backgroundColor: THEME.primary + '20', color: THEME.primaryLight }}>
                  {model.seddari_price_per_meter} درهم/متر
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
      {models.length === 0 && (
        <div className="text-center py-20 border border-dashed border-white/20 rounded-xl">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg opacity-60">لا توجد موديلات نشطة</p>
        </div>
      )}
    </div>
  );
}

function MeasurementsStep({ model, seddars, onChange }: {
  model: WoodPricingModel;
  seddars: WoodOrderSeddari[];
  onChange: (s: WoodOrderSeddari[]) => void;
}) {
  const [inputValue, setInputValue] = useState('');

  const addSeddari = () => {
    const length = parseFloat(inputValue);
    if (!length || length <= 0) return;
    const newIndex = seddars.length + 1;
    const lengthCm = Math.round(length * 100);
    const price = calculateSeddariPrice(lengthCm, model.seddari_price_per_meter);
    const newSeddari: WoodOrderSeddari = {
      id: `temp-${Date.now()}`, order_id: '', seddari_index: newIndex,
      length_cm: lengthCm, width_cm: 70, height_cm: 30, junction_type: 'none',
      seddari_price: price, created_at: new Date().toISOString(),
    };
    onChange([...seddars, newSeddari]);
    setInputValue('');
  };

  const updateSeddari = (index: number, updates: Partial<WoodOrderSeddari>) => {
    const updated = [...seddars];
    updated[index] = { ...updated[index], ...updates };
    if (updates.length_cm !== undefined) {
      updated[index].seddari_price = calculateSeddariPrice(updated[index].length_cm, model.seddari_price_per_meter);
    }
    onChange(updated);
  };

  const removeSeddari = (index: number) => {
    const filtered = seddars.filter((_, i) => i !== index);
    const reindexed = filtered.map((s, i) => ({ ...s, seddari_index: i + 1 }));
    onChange(reindexed);
  };

  const totalLength = seddars.reduce((sum, s) => sum + (s.length_cm / 100), 0);

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold mb-2">مقاسات السدادر</h2>
        <p className="opacity-60">أدخل أطوال السدادر بالمتر (مثال: 3.20)</p>
      </div>
      <div className="flex gap-3 max-w-md mx-auto">
        <div className="relative flex-1">
          <input type="number" step="0.01" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSeddari()} placeholder="مثال: 2.50"
            className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white text-lg text-center focus:outline-none focus:border-[#C9A84C]" />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50">متر</span>
        </div>
        <button onClick={addSeddari} disabled={!inputValue}
          className="px-5 py-3 rounded-lg text-white font-semibold transition-colors hover:opacity-90 disabled:opacity-30"
          style={{ backgroundColor: THEME.primary }}>
          <Plus className="w-5 h-5" />
        </button>
      </div>
      {seddars.length > 0 && (
        <div className="space-y-3 max-w-2xl mx-auto">
          {seddars.map((seddari, idx) => (
            <div key={seddari.id} className="rounded-xl border border-white/10 p-4" style={{ backgroundColor: THEME.darkCard }}>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: THEME.primary }}>
                  {seddari.seddari_index}
                </div>
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs opacity-60 block mb-1">الطول (سم)</label>
                    <input type="number" value={seddari.length_cm}
                      onChange={(e) => updateSeddari(idx, { length_cm: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-[#C9A84C]" />
                  </div>
                  <div>
                    <label className="text-xs opacity-60 block mb-1">العرض (سم)</label>
                    <input type="number" value={seddari.width_cm}
                      onChange={(e) => updateSeddari(idx, { width_cm: parseInt(e.target.value) || 70 })}
                      className="w-full px-3 py-1.5 rounded border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-[#C9A84C]" />
                  </div>
                  <div>
                    <label className="text-xs opacity-60 block mb-1">السعر</label>
                    <div className="px-3 py-1.5 rounded text-sm font-semibold" style={{ color: THEME.gold }}>
                      {seddari.seddari_price} درهم
                    </div>
                  </div>
                </div>
                <button onClick={() => removeSeddari(idx)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {idx > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <label className="text-xs opacity-60 block mb-2">ربط مع السداري السابق:</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(JUNCTION_TYPE_LABELS).filter(([k]) => k !== 'none').map(([key, label]) => (
                      <button key={key} onClick={() => updateSeddari(idx, { junction_type: key as any })}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          seddari.junction_type === key ? 'text-white' : 'border border-white/10 hover:bg-white/5'
                        }`}
                        style={seddari.junction_type === key ? { backgroundColor: THEME.primary } : {}}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className="rounded-xl p-4 border border-[#C9A84C]/30" style={{ backgroundColor: THEME.gold + '10' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Ruler className="w-5 h-5" style={{ color: THEME.gold }} />
                <div>
                  <p className="font-bold">إجمالي الطول: {totalLength.toFixed(2)} متر</p>
                  <p className="text-sm opacity-60">{seddars.length} سداري</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-xs opacity-60">إجمالي السدادر</p>
                <p className="text-xl font-bold" style={{ color: THEME.gold }}>
                  {seddars.reduce((s, x) => s + (x.seddari_price || 0), 0).toFixed(2)} درهم
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// FIXED: ShapeStep now uses strict SalonShape type
// ════════════════════════════════════════════════════════════
function ShapeStep({ shape, onChange }: {
  shape: SalonShape;
  onChange: (s: SalonShape) => void;
}) {
  const shapes: { key: SalonShape; label: string; icon: React.ReactNode }[] = [
    { key: 'straight', label: 'مستقيم', icon: <div className="w-16 h-4 rounded" style={{ backgroundColor: THEME.primary }} /> },
    { key: 'L', label: 'L', icon: <div className="relative w-16 h-16"><div className="absolute top-0 right-0 w-4 h-12 rounded" style={{ backgroundColor: THEME.primary }} /><div className="absolute bottom-0 right-0 w-12 h-4 rounded" style={{ backgroundColor: THEME.primary }} /></div> },
    { key: 'U', label: 'U', icon: <div className="relative w-16 h-16"><div className="absolute top-0 right-0 w-4 h-12 rounded" style={{ backgroundColor: THEME.primary }} /><div className="absolute top-0 left-0 w-4 h-12 rounded" style={{ backgroundColor: THEME.primary }} /><div className="absolute bottom-0 right-0 w-16 h-4 rounded" style={{ backgroundColor: THEME.primary }} /></div> },
    { key: 'custom', label: 'مخصص', icon: <div className="w-16 h-16 rounded border-2 border-dashed flex items-center justify-center" style={{ borderColor: THEME.primary }}><span className="text-xs">مخصص</span></div> },
  ];
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold mb-2">شكل الصالون</h2>
        <p className="opacity-60">اختر شكل توزيع السدادر في الغرفة</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
        {shapes.map(s => (
          <button key={s.key} onClick={() => onChange(s.key)}
            className={`rounded-xl border-2 p-6 flex flex-col items-center gap-3 transition-all hover:scale-[1.05] ${
              shape === s.key ? 'border-[#C9A84C]' : 'border-white/10 hover:border-white/30'
            }`} style={{ backgroundColor: THEME.darkCard }}>
            {s.icon}
            <span className="font-semibold">{s.label}</span>
            {shape === s.key && <CheckCircle className="w-5 h-5 text-green-500" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function ExtrasStep({ model, items, onChange }: {
  model: WoodPricingModel;
  items: WoodOrderItem[];
  onChange: (items: WoodOrderItem[]) => void;
}) {
  const standardItems = [
    { type: 'takia', name: 'التكاية', price: model.takia_price },
    { type: 'formaja', name: 'الفرماجة', price: model.formaja_price },
    { type: 'kwan', name: 'الكوان', price: model.kwan_price },
    { type: 'kouti', name: 'الكوطي', price: model.kouti_price },
    { type: 'soundri', name: 'السوندري', price: model.soundri_price },
    { type: 'big_table', name: 'الطاولة الكبيرة', price: model.big_table_price },
    { type: 'small_table', name: 'الطاولة الصغيرة', price: model.small_table_price },
  ];

  const getItemQty = (type: string) => {
    const item = items.find(i => i.item_type === type);
    return item?.quantity || 0;
  };

  const updateItemQty = (type: string, name: string, price: number, qty: number) => {
    const existingIdx = items.findIndex(i => i.item_type === type);
    if (qty <= 0) {
      if (existingIdx >= 0) onChange(items.filter((_, i) => i !== existingIdx));
      return;
    }
    const newItem: WoodOrderItem = {
      id: `temp-${type}`, order_id: '', item_type: type as any, item_name: name,
      quantity: qty, original_price: price, current_price: price, total_price: qty * price,
      price_modified: false, created_at: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      const updated = [...items]; updated[existingIdx] = newItem; onChange(updated);
    } else {
      onChange([...items, newItem]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold mb-2">الإضافات والقطع</h2>
        <p className="opacity-60">اختر القطع الإضافية وعددها</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {standardItems.map(item => {
          const qty = getItemQty(item.type);
          return (
            <div key={item.type} className="rounded-xl border border-white/10 p-4 flex items-center justify-between" style={{ backgroundColor: THEME.darkCard }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: THEME.primary + '20' }}>
                  <Box className="w-5 h-5" style={{ color: THEME.primaryLight }} />
                </div>
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm opacity-60">{item.price} درهم/قطعة</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateItemQty(item.type, item.name, item.price, qty - 1)} disabled={qty <= 0}
                  className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold">{qty}</span>
                <button onClick={() => updateItemQty(item.type, item.name, item.price, qty + 1)}
                  className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {items.length > 0 && (
        <div className="max-w-3xl mx-auto rounded-xl p-4 border border-[#C9A84C]/30" style={{ backgroundColor: THEME.gold + '10' }}>
          <p className="font-semibold mb-2">ملخص الإضافات:</p>
          <div className="space-y-1">
            {items.map(item => (
              <div key={item.item_type} className="flex justify-between text-sm">
                <span className="opacity-80">{item.item_name} × {item.quantity}</span>
                <span className="font-semibold">{item.total_price} درهم</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryStep({ flowState, calculation, onModifyPrice }: {
  flowState: WoodFlowState;
  calculation: WoodCalculationResult;
  onModifyPrice: () => void;
}) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold mb-2">ملخص الطلبية</h2>
        <p className="opacity-60">راجع التفاصيل قبل إضافتها للسلة</p>
      </div>
      <div className="rounded-xl border border-white/10 overflow-hidden" style={{ backgroundColor: THEME.darkCard }}>
        <div className="px-5 py-4 border-b border-white/10" style={{ backgroundColor: THEME.darkElevated }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Box className="w-5 h-5" style={{ color: THEME.gold }} />
              <div>
                <p className="font-bold">{flowState.selectedModel?.name}</p>
                <p className="text-sm opacity-60">{flowState.selectedModel?.code} • {flowState.selectedModel?.wood_type}</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: THEME.primary + '20', color: THEME.primaryLight }}>
              {SALON_SHAPE_LABELS[flowState.salonShape]}
            </span>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div className="space-y-2">
            <p className="font-semibold text-sm opacity-80 mb-2">السدادر:</p>
            {calculation.breakdown.seddars.map(s => (
              <div key={s.index} className="flex justify-between text-sm py-1 border-b border-white/5">
                <span className="opacity-70">سداري {s.index} — {s.length} سم</span>
                <span>{s.price} درهم</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold py-1">
              <span>إجمالي السدادر</span>
              <span style={{ color: THEME.gold }}>{calculation.seddari_total} درهم</span>
            </div>
          </div>
          {calculation.breakdown.items.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-white/10">
              <p className="font-semibold text-sm opacity-80 mb-2">الإضافات:</p>
              {calculation.breakdown.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1 border-b border-white/5">
                  <span className="opacity-70">{item.name} × {item.qty}</span>
                  <span>{item.total} درهم</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold py-1">
                <span>إجمالي الإضافات</span>
                <span>{calculation.extras_total} درهم</span>
              </div>
            </div>
          )}
          <div className="pt-4 space-y-2 border-t border-white/10">
            <div className="flex justify-between">
              <span className="opacity-70">المجموع الفرعي</span>
              <span className="font-semibold">{calculation.subtotal} درهم</span>
            </div>
            {calculation.discount_amount > 0 && (
              <div className="flex justify-between text-red-400">
                <span>الخصم</span>
                <span>-{calculation.discount_amount} درهم</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold py-2 border-t border-white/10">
              <span>المجموع النهائي</span>
              <span style={{ color: THEME.gold }}>
                {flowState.priceModified && flowState.finalPrice ? flowState.finalPrice : calculation.final_total} درهم
              </span>
            </div>
          </div>
        </div>
      </div>
      <button onClick={onModifyPrice}
        className="w-full py-3 rounded-lg border border-[#C9A84C]/30 text-sm transition-colors hover:bg-[#C9A84C]/10 flex items-center justify-center gap-2"
        style={{ color: THEME.gold }}>
        <DollarSign className="w-4 h-4" />
        تعديل السعر النهائي (يتطلب كود المدير)
      </button>
    </div>
  );
}