"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, ArrowRight, Plus, Minus, Loader2, Trash2, RotateCcw, Lock, ImageIcon, Camera, X, Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { OrderDraft, Seddari, CushionItem, StitchStyle } from "@/lib/types";
import PinLock from "@/components/ui/PinLock";

interface Step04Props {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

const SIZES = [75, 80, 100];
const DEFAULT_LWATA_PRICE = 110;
const MKHAD_IMAGE = "/images/mkhad.png";

export default function Step04_Cushions({ draft, onChange, onNext, onBack }: Step04Props) {
  const seddars: Seddari[] = draft.seddars || [];
  const [dbStyles, setDbStyles] = useState<StitchStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CushionItem[]>(draft.cushionItems || []);

  // تعديل السعر
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editField, setEditField] = useState<'stitch' | 'lwata' | 'fabric'>('stitch');
  const [editPriceOpen, setEditPriceOpen] = useState(false);
  const [priceAdminOk, setPriceAdminOk] = useState(false);
  const [newPriceInput, setNewPriceInput] = useState("");

  // تعديل المجموع
  const [totalEditOpen, setTotalEditOpen] = useState(false);
  const [totalAdminOk, setTotalAdminOk] = useState(false);
  const [manualTotal, setManualTotal] = useState("");
  const [totalOverride, setTotalOverride] = useState<number | null>(draft.stage4TotalOverride ?? null);

  // تعديل استهلاك الثوب
  const [fabricEditOpen, setFabricEditOpen] = useState(false);
  const [fabricAdminOk, setFabricAdminOk] = useState(false);
  const [manualFabricTotal, setManualFabricTotal] = useState("");
  const [fabricOverride, setFabricOverride] = useState<number | null>(draft.stage4FabricOverride ?? null);

  // إضافة شكل يدوي
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [customAdminOk, setCustomAdminOk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // جلب الأشكال من Supabase
  useEffect(() => {
    async function fetchStyles() {
      setLoading(true);
      const { data } = await supabase
        .from("stitch_styles")
        .select("id, name, price, image_url, gallery, description")
        .eq("target", "cushion")
        .eq("active", true)
        .order("name");
      if (data) setDbStyles(data as StitchStyle[]);
      setLoading(false);
    }
    fetchStyles();
  }, []);

  // جميع الأشكال (Supabase + يدوية)
  const allStyles: StitchStyle[] = [...dbStyles, ...(draft.customCushionStyles || [])];

  const calcAutoCount = (seddariLength: number, size: number): number => {
    return Math.round(seddariLength / size);
  };

  const handleAutoGenerate = (seddariId: string) => {
    const seddari = seddars.find((s) => s.id === seddariId);
    if (!seddari) return;
    const defaultStyle = dbStyles[0];
    const size = 75;
    const count = calcAutoCount(seddari.length, size);
    const newItem: CushionItem = {
      id: `cush-${Date.now()}`,
      seddariId,
      size,
      count,
      fabricConsumption: 120,
      stitchStyleId: defaultStyle?.id || "",
      stitchStyleName: defaultStyle?.name || "",
      stitchPrice: defaultStyle?.price || 0,
      stitchFinalPrice: defaultStyle?.price || 0,
      hasLwata: false,
      lwataPrice: DEFAULT_LWATA_PRICE,
      hasFormaja: false,
      formajaPrice: 0,
    };
    const updated = [...items, newItem];
    setItems(updated);
    syncToDraft(updated, totalOverride, fabricOverride);
  };

  const handleUpdate = (id: string, patch: Partial<CushionItem>) => {
    const updated = items.map((item) => {
      if (item.id !== id) return item;
      return { ...item, ...patch };
    });
    setItems(updated);
    syncToDraft(updated, totalOverride, fabricOverride);
  };

  const handleDelete = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    syncToDraft(updated, totalOverride, fabricOverride);
  };

  const calcItemTotal = (item: CushionItem): number => {
    const stitchCost = item.count * item.stitchFinalPrice;
    const lwataCost = item.hasLwata ? item.count * item.lwataPrice : 0;
    return stitchCost + lwataCost;
  };

  const calcFabricTotal = (list: CushionItem[]): number => {
    return list.reduce((sum, item) => sum + (item.count * item.fabricConsumption), 0);
  };

  const syncToDraft = (list: CushionItem[], override: number | null, fabOverride: number | null) => {
    const computed = list.reduce((sum, item) => sum + calcItemTotal(item), 0);
    const total = override ?? computed;
    const computedFabric = calcFabricTotal(list);
    const fabricTotal = fabOverride ?? computedFabric;
    onChange({
      cushionItems: list,
      stage4TotalOverride: override,
      stage4FabricOverride: fabOverride,
      stageTotals: {
        ...draft.stageTotals,
        cushions: total,
      },
    });
  };

  // فتح نافذة تعديل السعر
  const handleEditPrice = (itemId: string, field: 'stitch' | 'lwata' | 'fabric') => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    setEditItemId(itemId);
    setEditField(field);
    if (field === 'stitch') setNewPriceInput(String(item.stitchFinalPrice));
    else if (field === 'lwata') setNewPriceInput(String(item.lwataPrice));
    else setNewPriceInput(String(item.fabricConsumption));
    setEditPriceOpen(true);
    setPriceAdminOk(false);
  };

  const handleSavePrice = () => {
    const priceNum = Number(newPriceInput);
    if (!editItemId || priceNum < 0) return;
    const patch: Partial<CushionItem> = {};
    if (editField === 'stitch') patch.stitchFinalPrice = priceNum;
    else if (editField === 'lwata') patch.lwataPrice = priceNum;
    else patch.fabricConsumption = priceNum;

    const updated = items.map((item) => {
      if (item.id !== editItemId) return item;
      return { ...item, ...patch };
    });
    setItems(updated);
    syncToDraft(updated, totalOverride, fabricOverride);
    setEditPriceOpen(false);
    setPriceAdminOk(false);
  };

  const handleSaveTotal = () => {
    const val = Number(manualTotal);
    if (val >= 0) {
      setTotalOverride(val);
      syncToDraft(items, val, fabricOverride);
      setTotalEditOpen(false);
      setTotalAdminOk(false);
    }
  };

  const handleSaveFabricTotal = () => {
    const val = Number(manualFabricTotal);
    if (val >= 0) {
      setFabricOverride(val);
      syncToDraft(items, totalOverride, val);
      setFabricEditOpen(false);
      setFabricAdminOk(false);
    }
  };

  // إضافة شكل يدوي
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCustomImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddCustomStyle = () => {
    const price = Number(customPrice);
    if (!customName.trim() || price < 0) return;

    const newStyle: StitchStyle = {
      id: `custom-cushion-${Date.now()}`,
      name: customName.trim(),
      price: price,
      image_url: customImage,
      gallery: customImage ? [customImage] : null,
      description: null,
      isCustom: true,
    };

    const updatedCustom = [...(draft.customCushionStyles || []), newStyle];
    onChange({ customCushionStyles: updatedCustom });

    setCustomName("");
    setCustomPrice("");
    setCustomImage(null);
    setCustomModalOpen(false);
    setCustomAdminOk(false);
  };

  const handleDeleteCustom = (styleId: string) => {
    const updated = (draft.customCushionStyles || []).filter(s => s.id !== styleId);
    onChange({ customCushionStyles: updated });
  };

  const computedTotal = items.reduce((sum, item) => sum + calcItemTotal(item), 0);
  const displayTotal = totalOverride ?? computedTotal;
  const computedFabric = calcFabricTotal(items);
  const displayFabric = fabricOverride ?? computedFabric;
  const canProceed = items.length > 0 && items.every((i) => i.stitchStyleId && i.fabricConsumption > 0);

  const getSeddariItems = (seddariId: string) => items.filter((i) => i.seddariId === seddariId);

  // عداد منفصل للسدادر والفورمجات
  const getSeddariDisplayIndex = (seddari: Seddari, globalIdx: number) => {
    const isFormaja = seddari.type === "formaja";
    const sameTypeBefore = seddars.filter((s, i) => i < globalIdx && s.type === seddari.type).length;
    return sameTypeBefore + 1;
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="sticky top-0 z-30 border-b border-[#1B5E3B]/10 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <button onClick={onBack} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
            <ArrowRight className="h-4 w-4" /> رجوع
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#0D1F17] md:text-2xl flex items-center justify-center gap-2">
              <img src={MKHAD_IMAGE} alt="مخدة" className="inline-block h-8 w-8" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              المخاد
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">الخطوة 4 من 7 — اختيار الحجم والعدد والخياطة</p>
          </div>
          <button onClick={onNext} disabled={!canProceed} className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${canProceed ? "bg-[#1B5E3B] text-white hover:bg-[#144d30] shadow-lg shadow-[#1B5E3B]/20" : "cursor-not-allowed bg-gray-200 text-gray-400"}`}>
            التالي <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {seddars.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-medium text-gray-600">لا توجد سدادر — ارجع للمرحلة السابقة</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {seddars.map((seddari, idx) => {
                const seddariItems = getSeddariItems(seddari.id);
                const isFormaja = seddari.type === "formaja";
                const displayIdx = getSeddariDisplayIndex(seddari, idx);

                return (
                  <div key={seddari.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className={`text-lg font-bold ${isFormaja ? "text-[#C9A84C]" : "text-[#0D1F17]"}`}>
                          {isFormaja ? `🌀 فورمجة ${displayIdx}` : `سداري ${displayIdx}`} — {seddari.length} سم
                        </h3>
                        <p className="text-sm text-gray-500">{seddariItems.length > 0 ? `${seddariItems.reduce((s, i) => s + i.count, 0)} مخدة` : "لا توجد مخدات"}</p>
                      </div>
                      <button onClick={() => handleAutoGenerate(seddari.id)} className="flex items-center gap-1 rounded-lg bg-[#1B5E3B] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#144d30] transition">
                        <Plus className="h-3.5 w-3.5" /> إنشاء مخاد تلقائية
                      </button>
                    </div>

                    {seddariItems.length === 0 ? (
                      <p className="text-center text-sm text-gray-400 py-4">اضغط "إنشاء مخاد تلقائية" لحساب العدد</p>
                    ) : (
                      <div className="space-y-4">
                        {seddariItems.map((item, itemIdx) => (
                          <div key={item.id} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-bold text-[#0D1F17]">مخدة {itemIdx + 1} ({item.size}سم) × {item.count}</span>
                              <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 transition"><Trash2 className="h-4 w-4" /></button>
                            </div>

                            {/* الحجم والعدد واستهلاك الثوب */}
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-4">
                              <div>
                                <label className="mb-1 block text-xs text-gray-500">الحجم</label>
                                <select value={item.size} onChange={(e) => {
                                  const newSize = Number(e.target.value);
                                  const newCount = calcAutoCount(seddari.length, newSize);
                                  handleUpdate(item.id, { size: newSize, count: newCount });
                                }} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm font-bold text-center">
                                  {SIZES.map((s) => <option key={s} value={s}>{s} سم</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-gray-500">العدد</label>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => handleUpdate(item.id, { count: Math.max(1, item.count - 1) })} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F5F0E8] text-[#1B5E3B] font-bold"><Minus className="h-3 w-3" /></button>
                                  <span className="w-6 text-center font-bold text-sm">{item.count}</span>
                                  <button onClick={() => handleUpdate(item.id, { count: item.count + 1 })} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F5F0E8] text-[#1B5E3B] font-bold"><Plus className="h-3 w-3" /></button>
                                </div>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-gray-500">استهلاك الثوب/مخدة</label>
                                <div className="flex items-center gap-1">
                                  <input type="number" min={0} value={item.fabricConsumption} onChange={(e) => handleUpdate(item.id, { fabricConsumption: Number(e.target.value) })} className="w-full rounded-lg border border-[#C9A84C] px-2 py-1.5 text-sm font-bold text-center" />
                                  <button onClick={() => handleEditPrice(item.id, 'fabric')} className="rounded bg-white p-1 text-gray-400 hover:text-[#C9A84C] transition" title="تعديل">
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-gray-500">المجموع الثوب</label>
                                <div className="rounded-lg bg-[#F5F0E8] px-2 py-1.5 text-sm font-bold text-center text-[#1B5E3B]">{(item.count * item.fabricConsumption)} سم</div>
                              </div>
                            </div>

                            {/* ✅ شكل الخياطة - بطاقات بصور من Supabase */}
                            <div className="mb-4">
                              <label className="mb-2 block text-xs font-bold text-gray-600">شكل الخياطة</label>
                              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                  {allStyles.map((style) => (
                                    <div key={style.id} className={`relative rounded-xl border-2 p-2 text-center transition cursor-pointer ${item.stitchStyleId === style.id ? "border-[#C9A84C] bg-[#F5F0E8] shadow-md" : "border-gray-200 bg-white hover:border-[#1B5E3B]/30"}`}>
                                      {style.isCustom && (
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleDeleteCustom(style.id); }}
                                          className="absolute left-1 top-1 z-10 rounded-full bg-red-50 p-0.5 text-red-500 hover:bg-red-100 transition"
                                        >
                                          <X className="h-2.5 w-2.5" />
                                        </button>
                                      )}
                                      <button onClick={() => handleUpdate(item.id, { stitchStyleId: style.id, stitchStyleName: style.name, stitchPrice: style.price, stitchFinalPrice: style.price })} className="w-full">
                                        {item.stitchStyleId === style.id && (
                                          <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#1B5E3B] text-white">
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                          </div>
                                        )}
                                        <div className="aspect-square w-full rounded-lg bg-gray-100 mb-1 flex items-center justify-center overflow-hidden">
                                          {style.image_url ? <img src={style.image_url} alt={style.name} className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-gray-300" />}
                                        </div>
                                        <p className="font-bold text-[10px] text-[#0D1F17] truncate">{style.name}</p>
                                        <div className="flex items-center justify-center gap-1 mt-0.5">
                                          <p className="text-xs font-extrabold text-[#1B5E3B]">{style.price} DH</p>
                                          {item.stitchStyleId === style.id && (
                                            <button onClick={(e) => { e.stopPropagation(); handleEditPrice(item.id, 'stitch'); }} className="rounded bg-white p-0.5 text-gray-400 hover:text-[#C9A84C] transition">
                                              <Pencil className="h-2.5 w-2.5" />
                                            </button>
                                          )}
                                        </div>
                                      </button>
                                    </div>
                                  ))}

                                  {/* زر إضافة شكل يدوي */}
                                  <button 
                                    onClick={() => { setCustomModalOpen(true); setCustomAdminOk(false); }}
                                    className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#C9A84C]/40 bg-white p-2 text-[#C9A84C] transition hover:border-[#C9A84C] hover:bg-[#C9A84C]/5 min-h-[100px]"
                                  >
                                    <Plus className="h-5 w-5" />
                                    <span className="text-[10px] font-bold">شكل يدوي</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* ✅ اللواط - سؤال نهائي */}
                            <div className="rounded-lg bg-white border border-gray-200 p-3">
                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={item.hasLwata} 
                                    onChange={(e) => handleUpdate(item.id, { hasLwata: e.target.checked })} 
                                    className="h-4 w-4 accent-[#1B5E3B]" 
                                  />
                                  <span className="text-sm font-bold text-gray-700">لواط؟</span>
                                </label>
                                {item.hasLwata && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{item.count} × {item.lwataPrice} DH = </span>
                                    <span className="text-sm font-bold text-[#C9A84C]">{(item.count * item.lwataPrice)} DH</span>
                                    <button onClick={() => handleEditPrice(item.id, 'lwata')} className="rounded bg-gray-50 p-1 text-gray-400 hover:text-[#C9A84C] transition" title="تعديل">
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* ملخص المخدة */}
                            <div className="mt-3 pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                              <span className="text-gray-500">
                                خياطة: {item.count} × {item.stitchFinalPrice} = {(item.count * item.stitchFinalPrice)} DH
                                {item.hasLwata && <span> + لواط: {(item.count * item.lwataPrice)} DH</span>}
                              </span>
                              <span className="font-bold text-[#1B5E3B]">= {calcItemTotal(item)} DH</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* الملخص الجانبي */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 bg-[#F5F0E8] px-5 py-3">
                  <h3 className="font-bold text-[#0D1F17]">💰 ملخص المخاد</h3>
                </div>
                <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">لا توجد مخدات بعد</div>
                  ) : (
                    items.map((item, idx) => (
                      <div key={item.id} className="px-5 py-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">مخدة {idx + 1} ({item.size}سم) × {item.count}</span>
                          <span className="font-bold text-[#0D1F17]">{calcItemTotal(item)} DH</span>
                        </div>
                        <p className="text-xs text-gray-400">استهلاك: {item.count * item.fabricConsumption} سم ثوب</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-gray-200 bg-[#F5F0E8] px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">استهلاك الثوب الكلي</p>
                      <p className="mt-1 text-xl font-extrabold text-[#1B5E3B]">{displayFabric.toLocaleString("fr-MA")} سم</p>
                    </div>
                    <button onClick={() => { setManualFabricTotal(String(displayFabric)); setFabricEditOpen(true); setFabricAdminOk(false); }} className="rounded-lg bg-white border border-[#C9A84C] p-2 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition" title="تعديل استهلاك الثوب">
                      <Lock className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="border-t border-[#C9A84C]/20 pt-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">المجموع المالي</p>
                      <p className="mt-1 text-xl font-extrabold text-[#1B5E3B]">{displayTotal.toLocaleString("fr-MA")} DH</p>
                      {totalOverride !== null && <p className="mt-0.5 text-xs text-amber-600">⚠️ مُعدّل يدوياً</p>}
                    </div>
                    <button onClick={() => { setManualTotal(String(displayTotal)); setTotalEditOpen(true); setTotalAdminOk(false); }} className="rounded-lg bg-white border border-[#C9A84C] p-2 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition" title="تعديل المجموع">
                      <Lock className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* نافذة تعديل السعر */}
      {editPriceOpen && editItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <button onClick={() => { setEditPriceOpen(false); setPriceAdminOk(false); }} className="absolute left-3 top-3 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition"><RotateCcw className="h-5 w-5" /></button>
            <h3 className="mb-4 text-center text-lg font-bold text-[#0D1F17]">
              تعديل {editField === 'stitch' ? 'ثمن الخياطة' : editField === 'lwata' ? 'ثمن اللواط' : 'استهلاك الثوب'}
            </h3>
            {!priceAdminOk ? (
              <div className="py-4">
                <p className="mb-4 text-center text-gray-600">أدخل كود المدير</p>
                <PinLock role="admin" onSuccess={() => setPriceAdminOk(true)} onCancel={() => { setEditPriceOpen(false); setPriceAdminOk(false); }} />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    {editField === 'stitch' ? 'السعر الجديد (DH)' : editField === 'lwata' ? 'ثمن اللواط (DH)' : 'استهلاك الثوب/مخدة (سم)'}
                  </label>
                  <input type="number" dir="ltr" value={newPriceInput} onChange={(e) => setNewPriceInput(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20" autoFocus />
                </div>
                <button onClick={handleSavePrice} disabled={!newPriceInput || Number(newPriceInput) < 0} className="w-full rounded-xl bg-[#1B5E3B] py-3 text-base font-bold text-white transition hover:bg-[#144d30] disabled:opacity-40">💾 حفظ</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* نافذة تعديل المجموع */}
      {totalEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <button onClick={() => { setTotalEditOpen(false); setTotalAdminOk(false); }} className="absolute left-3 top-3 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition"><RotateCcw className="h-5 w-5" /></button>
            <h3 className="mb-4 text-center text-lg font-bold text-[#0D1F17]">تعديل مجموع المخاد</h3>
            {!totalAdminOk ? (
              <div className="py-4">
                <p className="mb-4 text-center text-gray-600">أدخل كود المدير</p>
                <PinLock role="admin" onSuccess={() => setTotalAdminOk(true)} onCancel={() => { setTotalEditOpen(false); setTotalAdminOk(false); }} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-[#F5F0E8] p-4 text-center border border-[#C9A84C]/20">
                  <p className="text-sm text-gray-500">المجموع الحالي</p>
                  <p className="mt-1 text-3xl font-bold text-[#1B5E3B]">{displayTotal.toLocaleString("fr-MA")} DH</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">المجموع الجديد (DH)</label>
                  <input type="number" dir="ltr" value={manualTotal} onChange={(e) => setManualTotal(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20" autoFocus />
                </div>
                <button onClick={handleSaveTotal} disabled={!manualTotal || Number(manualTotal) < 0} className="w-full rounded-xl bg-[#1B5E3B] py-3 text-base font-bold text-white transition hover:bg-[#144d30] disabled:opacity-40">💾 حفظ</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* نافذة تعديل استهلاك الثوب */}
      {fabricEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <button onClick={() => { setFabricEditOpen(false); setFabricAdminOk(false); }} className="absolute left-3 top-3 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition"><RotateCcw className="h-5 w-5" /></button>
            <h3 className="mb-4 text-center text-lg font-bold text-[#0D1F17]">تعديل استهلاك الثوب</h3>
            {!fabricAdminOk ? (
              <div className="py-4">
                <p className="mb-4 text-center text-gray-600">أدخل كود المدير</p>
                <PinLock role="admin" onSuccess={() => setFabricAdminOk(true)} onCancel={() => { setFabricEditOpen(false); setFabricAdminOk(false); }} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-[#F5F0E8] p-4 text-center border border-[#C9A84C]/20">
                  <p className="text-sm text-gray-500">المجموع الحالي</p>
                  <p className="mt-1 text-3xl font-bold text-[#1B5E3B]">{displayFabric.toLocaleString("fr-MA")} سم</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">المجموع الجديد (سم)</label>
                  <input type="number" dir="ltr" value={manualFabricTotal} onChange={(e) => setManualFabricTotal(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20" autoFocus />
                </div>
                <button onClick={handleSaveFabricTotal} disabled={!manualFabricTotal || Number(manualFabricTotal) < 0} className="w-full rounded-xl bg-[#1B5E3B] py-3 text-base font-bold text-white transition hover:bg-[#144d30] disabled:opacity-40">💾 حفظ</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* نافذة إضافة شكل يدوي */}
      {customModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <button onClick={() => { setCustomModalOpen(false); setCustomAdminOk(false); setCustomName(""); setCustomPrice(""); setCustomImage(null); }} className="absolute left-3 top-3 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition">
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-4 text-center text-lg font-bold text-[#0D1F17]">✨ شكل خياطة يدوي</h3>

            {!customAdminOk ? (
              <div className="py-4">
                <p className="mb-4 text-center text-gray-600">أدخل كود المدير</p>
                <PinLock role="admin" onSuccess={() => setCustomAdminOk(true)} onCancel={() => { setCustomModalOpen(false); setCustomAdminOk(false); }} />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">اسم الشكل</label>
                  <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="مثال: خياطة مخصصة" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">السعر (DH)</label>
                  <input type="number" dir="ltr" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="40" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">صورة (اختياري)</label>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                  {customImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img src={customImage} alt="معاينة" className="w-full h-32 object-cover" />
                      <button onClick={() => setCustomImage(null)} className="absolute top-2 left-2 rounded-full bg-red-500 text-white p-1 hover:bg-red-600 transition"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-3 text-gray-500 hover:border-[#1B5E3B] hover:text-[#1B5E3B] transition">
                        <ImageIcon className="h-5 w-5" /><span className="text-sm font-bold">رفع صورة</span>
                      </button>
                      <button onClick={() => { if(fileInputRef.current) { fileInputRef.current.setAttribute('capture', 'environment'); fileInputRef.current.click(); }}} className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-3 text-gray-500 hover:border-[#C9A84C] hover:text-[#C9A84C] transition">
                        <Camera className="h-5 w-5" /><span className="text-sm font-bold">كاميرا</span>
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={handleAddCustomStyle} disabled={!customName.trim() || !customPrice || Number(customPrice) < 0} className="w-full rounded-xl bg-[#1B5E3B] py-3 text-base font-bold text-white transition hover:bg-[#144d30] disabled:opacity-40">💾 إضافة الشكل</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}