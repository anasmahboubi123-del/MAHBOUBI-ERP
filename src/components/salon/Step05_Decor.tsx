"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Plus, Minus, Loader2, Trash2, RotateCcw, Lock, ImageIcon, Camera, X, Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { OrderDraft, DecorCushionItem, StitchStyle } from "@/lib/types";
import PinLock from "@/components/ui/PinLock";

interface DecorShape {
  id: string;
  name: string;
  image_url: string | null;
  isCustom?: boolean;
}

interface Step05Props {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step05_Decor({ draft, onChange, onNext, onBack }: Step05Props) {
  const [dbShapes, setDbShapes] = useState<DecorShape[]>([]);
  const [dbStyles, setDbStyles] = useState<StitchStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DecorCushionItem[]>(draft.decorItems || []);

  // تعديل السعر
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editPriceOpen, setEditPriceOpen] = useState(false);
  const [priceAdminOk, setPriceAdminOk] = useState(false);
  const [newPriceInput, setNewPriceInput] = useState("");

  // تعديل المجموع
  const [totalEditOpen, setTotalEditOpen] = useState(false);
  const [totalAdminOk, setTotalAdminOk] = useState(false);
  const [manualTotal, setManualTotal] = useState("");
  const [totalOverride, setTotalOverride] = useState<number | null>(draft.stage5TotalOverride ?? null);

  // إضافة شكل يدوي
  const [customShapeModalOpen, setCustomShapeModalOpen] = useState(false);
  const [customShapeName, setCustomShapeName] = useState("");
  const [customShapeImage, setCustomShapeImage] = useState<string | null>(null);
  const [customShapeAdminOk, setCustomShapeAdminOk] = useState(false);
  const shapeFileRef = useRef<HTMLInputElement>(null);

  // إضافة خياطة يدوية
  const [customStyleModalOpen, setCustomStyleModalOpen] = useState(false);
  const [customStyleName, setCustomStyleName] = useState("");
  const [customStylePrice, setCustomStylePrice] = useState("");
  const [customStyleImage, setCustomStyleImage] = useState<string | null>(null);
  const [customStyleAdminOk, setCustomStyleAdminOk] = useState(false);
  const styleFileRef = useRef<HTMLInputElement>(null);

  // جلب من Supabase
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [{ data: shapesData }, { data: stylesData }] = await Promise.all([
        supabase.from("decor_cushion_shapes").select("id, name, image_url").eq("active", true).order("name"),
        supabase.from("stitch_styles").select("id, name, price, image_url, gallery, description").eq("target", "decor").eq("active", true).order("name"),
      ]);
      if (shapesData) setDbShapes(shapesData as DecorShape[]);
      if (stylesData) setDbStyles(stylesData as StitchStyle[]);
      setLoading(false);
    }
    fetchData();
  }, []);

  // جميع الأشكال والخياطات (Supabase + يدوية)
  const allShapes: DecorShape[] = [...dbShapes, ...(draft.customDecorShapes || [])];
  const allStyles: StitchStyle[] = [...dbStyles, ...(draft.customDecorStyles || [])];

  const handleAdd = () => {
    const defaultShape = allShapes[0];
    const defaultStyle = allStyles[0];
    const newItem: DecorCushionItem = {
      id: `decor-${Date.now()}`,
      shapeId: defaultShape?.id || "",
      shapeName: defaultShape?.name || "",
      shapeImage: defaultShape?.image_url || null,
      stitchStyleId: defaultStyle?.id || "",
      stitchStyleName: defaultStyle?.name || "",
      stitchStyleImage: defaultStyle?.image_url || null,
      stitchPrice: defaultStyle?.price || 0,
      stitchFinalPrice: defaultStyle?.price || 0,
      fabricConsumption: 0,
      count: 2,
    };
    const updated = [...items, newItem];
    setItems(updated);
    syncToDraft(updated, totalOverride);
  };

  const handleUpdate = (id: string, patch: Partial<DecorCushionItem>) => {
    const updated = items.map((item) => {
      if (item.id !== id) return item;
      return { ...item, ...patch };
    });
    setItems(updated);
    syncToDraft(updated, totalOverride);
  };

  const handleDelete = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    syncToDraft(updated, totalOverride);
  };

  // ✅ الحساب بالقطعة فقط: عدد القطع × ثمن الخياطة لكل قطعة
  const calcItemTotal = (item: DecorCushionItem): number => {
    return item.count * item.stitchFinalPrice;
  };

  const syncToDraft = (list: DecorCushionItem[], override: number | null) => {
    const computed = list.reduce((sum, item) => sum + calcItemTotal(item), 0);
    const total = override ?? computed;
    onChange({ decorItems: list, stage5TotalOverride: override, stageTotals: { ...draft.stageTotals, decor: total } });
  };

  // تعديل السعر
  const handleEditPrice = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    setEditItemId(itemId);
    setNewPriceInput(String(item.stitchFinalPrice));
    setEditPriceOpen(true);
    setPriceAdminOk(false);
  };

  const handleSavePrice = () => {
    const priceNum = Number(newPriceInput);
    if (!editItemId || priceNum < 0) return;
    const updated = items.map((item) => {
      if (item.id !== editItemId) return item;
      return { ...item, stitchFinalPrice: priceNum };
    });
    setItems(updated);
    syncToDraft(updated, totalOverride);
    setEditPriceOpen(false);
    setPriceAdminOk(false);
  };

  const handleSaveTotal = () => {
    const val = Number(manualTotal);
    if (val >= 0) {
      setTotalOverride(val);
      syncToDraft(items, val);
      setTotalEditOpen(false);
      setTotalAdminOk(false);
    }
  };

  // إضافة شكل يدوي
  const handleShapeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCustomShapeImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddCustomShape = () => {
    if (!customShapeName.trim()) return;
    const newShape: DecorShape = {
      id: `custom-shape-${Date.now()}`,
      name: customShapeName.trim(),
      image_url: customShapeImage,
      isCustom: true,
    };
    const updated = [...(draft.customDecorShapes || []), newShape];
    onChange({ customDecorShapes: updated });
    setCustomShapeName("");
    setCustomShapeImage(null);
    setCustomShapeModalOpen(false);
    setCustomShapeAdminOk(false);
  };

  // إضافة خياطة يدوية
  const handleStyleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCustomStyleImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddCustomStyle = () => {
    const price = Number(customStylePrice);
    if (!customStyleName.trim() || price < 0) return;
    const newStyle: StitchStyle = {
      id: `custom-decor-${Date.now()}`,
      name: customStyleName.trim(),
      price: price,
      image_url: customStyleImage,
      gallery: customStyleImage ? [customStyleImage] : null,
      description: null,
      isCustom: true,
    };
    const updated = [...(draft.customDecorStyles || []), newStyle];
    onChange({ customDecorStyles: updated });
    setCustomStyleName("");
    setCustomStylePrice("");
    setCustomStyleImage(null);
    setCustomStyleModalOpen(false);
    setCustomStyleAdminOk(false);
  };

  const handleDeleteCustomShape = (shapeId: string) => {
    const updated = (draft.customDecorShapes || []).filter(s => s.id !== shapeId);
    onChange({ customDecorShapes: updated });
  };

  const handleDeleteCustomStyle = (styleId: string) => {
    const updated = (draft.customDecorStyles || []).filter(s => s.id !== styleId);
    onChange({ customDecorStyles: updated });
  };

  const computedTotal = items.reduce((sum, item) => sum + calcItemTotal(item), 0);
  const displayTotal = totalOverride ?? computedTotal;
  const canProceed = items.length === 0 || items.every((i) => i.shapeId && i.stitchStyleId);

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="sticky top-0 z-30 border-b border-[#1B5E3B]/10 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <button onClick={onBack} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
            <ArrowRight className="h-4 w-4" /> رجوع
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#0D1F17] md:text-2xl">🌀 مخاد الكيدور</h1>
            <p className="mt-0.5 text-sm text-gray-500">الخطوة 5 من 7 — اختر الشكل والخياطة (بالقطعة)</p>
          </div>
          <button onClick={onNext} disabled={!canProceed} className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${canProceed ? "bg-[#1B5E3B] text-white hover:bg-[#144d30] shadow-lg shadow-[#1B5E3B]/20" : "cursor-not-allowed bg-gray-200 text-gray-400"}`}>
            التالي <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <button onClick={handleAdd} className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#1B5E3B]/30 bg-white py-4 text-[#1B5E3B] transition hover:border-[#1B5E3B] hover:bg-[#F5F0E8]">
          <Plus className="h-5 w-5" /><span className="font-bold">إضافة كيدور جديد</span>
        </button>

        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-[#1B5E3B]" />
            <p className="text-gray-500">جاري التحميل...</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                  <p className="text-lg font-medium text-gray-600">لا توجد كيدور — اضغط "إضافة كيدور جديد"</p>
                </div>
              ) : (
                items.map((item, idx) => (
                  <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-[#0D1F17]">كيدور {idx + 1}</h3>
                      <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 transition"><Trash2 className="h-4 w-4" /></button>
                    </div>

                    {/* العدد فقط */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-sm text-gray-600">العدد (قطع):</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleUpdate(item.id, { count: Math.max(1, item.count - 1) })} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F0E8] text-[#1B5E3B] font-bold"><Minus className="h-4 w-4" /></button>
                        <span className="w-8 text-center font-bold text-lg">{item.count}</span>
                        <button onClick={() => handleUpdate(item.id, { count: item.count + 1 })} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F0E8] text-[#1B5E3B] font-bold"><Plus className="h-4 w-4" /></button>
                      </div>
                    </div>

                    {/* ✅ الشكل - بطاقات بصور من Supabase */}
                    <div className="mb-4">
                      <label className="mb-2 block text-xs font-bold text-gray-600">الشكل</label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {allShapes.map((shape) => (
                          <div key={shape.id} className={`relative rounded-xl border-2 p-2 text-center transition cursor-pointer ${item.shapeId === shape.id ? "border-[#C9A84C] bg-[#F5F0E8] shadow-md" : "border-gray-200 bg-white hover:border-[#1B5E3B]/30"}`}>
                            {shape.isCustom && (
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteCustomShape(shape.id); }} className="absolute left-1 top-1 z-10 rounded-full bg-red-50 p-0.5 text-red-500 hover:bg-red-100 transition">
                                <X className="h-2.5 w-2.5" />
                              </button>
                            )}
                            <button onClick={() => handleUpdate(item.id, { shapeId: shape.id, shapeName: shape.name, shapeImage: shape.image_url })} className="w-full">
                              {item.shapeId === shape.id && (
                                <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#1B5E3B] text-white">
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                              )}
                              <div className="aspect-square w-full rounded-lg bg-gray-100 mb-1 flex items-center justify-center overflow-hidden">
                                {shape.image_url ? <img src={shape.image_url} alt={shape.name} className="h-full w-full object-cover" /> : <span className="text-2xl">🌀</span>}
                              </div>
                              <p className="font-bold text-[10px] text-[#0D1F17] truncate">{shape.name}</p>
                            </button>
                          </div>
                        ))}
                        {/* زر إضافة شكل يدوي */}
                        <button onClick={() => { setCustomShapeModalOpen(true); setCustomShapeAdminOk(false); }} className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#C9A84C]/40 bg-white p-2 text-[#C9A84C] transition hover:border-[#C9A84C] hover:bg-[#C9A84C]/5 min-h-[100px]">
                          <Plus className="h-5 w-5" />
                          <span className="text-[10px] font-bold">شكل يدوي</span>
                        </button>
                      </div>
                    </div>

                    {/* ✅ شكل الخياطة - بطاقات بصور من Supabase */}
                    <div className="mb-4">
                      <label className="mb-2 block text-xs font-bold text-gray-600">شكل الخياطة</label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {allStyles.map((style) => (
                          <div key={style.id} className={`relative rounded-xl border-2 p-2 text-center transition cursor-pointer ${item.stitchStyleId === style.id ? "border-[#C9A84C] bg-[#F5F0E8] shadow-md" : "border-gray-200 bg-white hover:border-[#1B5E3B]/30"}`}>
                            {style.isCustom && (
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteCustomStyle(style.id); }} className="absolute left-1 top-1 z-10 rounded-full bg-red-50 p-0.5 text-red-500 hover:bg-red-100 transition">
                                <X className="h-2.5 w-2.5" />
                              </button>
                            )}
                            <button onClick={() => handleUpdate(item.id, { stitchStyleId: style.id, stitchStyleName: style.name, stitchStyleImage: style.image_url, stitchPrice: style.price, stitchFinalPrice: style.price })} className="w-full">
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
                                  <button onClick={(e) => { e.stopPropagation(); handleEditPrice(item.id); }} className="rounded bg-white p-0.5 text-gray-400 hover:text-[#C9A84C] transition">
                                    <Pencil className="h-2.5 w-2.5" />
                                  </button>
                                )}
                              </div>
                            </button>
                          </div>
                        ))}
                        {/* زر إضافة خياطة يدوية */}
                        <button onClick={() => { setCustomStyleModalOpen(true); setCustomStyleAdminOk(false); }} className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#C9A84C]/40 bg-white p-2 text-[#C9A84C] transition hover:border-[#C9A84C] hover:bg-[#C9A84C]/5 min-h-[100px]">
                          <Plus className="h-5 w-5" />
                          <span className="text-[10px] font-bold">خياطة يدوية</span>
                        </button>
                      </div>
                    </div>

                    {/* ✅ ملخص الكيدور — فقط عدد × ثمن */}
                    <div className="rounded-lg bg-[#F5F0E8] border border-[#C9A84C]/20 p-3 flex items-center justify-between">
                      <span className="text-sm text-gray-600">{item.count} قطعة × {item.stitchFinalPrice} DH = </span>
                      <span className="font-bold text-[#1B5E3B]">{calcItemTotal(item)} DH</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* الملخص الجانبي */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 bg-[#F5F0E8] px-5 py-3">
                  <h3 className="font-bold text-[#0D1F17]">💰 ملخص مخاد الكيدور</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {items.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">لا توجد كيدور</div>
                  ) : (
                    items.map((item, idx) => (
                      <div key={item.id} className="px-5 py-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">كيدور {idx + 1} × {item.count} قطعة</span>
                          <span className="font-bold text-[#0D1F17]">{calcItemTotal(item)} DH</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-gray-200 bg-[#F5F0E8] px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">المجموع</p>
                      <p className="mt-1 text-2xl font-extrabold text-[#1B5E3B]">{displayTotal.toLocaleString("fr-MA")} DH</p>
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
            <h3 className="mb-4 text-center text-lg font-bold text-[#0D1F17]">تعديل ثمن الخياطة</h3>
            {!priceAdminOk ? (
              <div className="py-4">
                <p className="mb-4 text-center text-gray-600">أدخل كود المدير</p>
                <PinLock role="admin" onSuccess={() => setPriceAdminOk(true)} onCancel={() => { setEditPriceOpen(false); setPriceAdminOk(false); }} />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">السعر الجديد (DH)</label>
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
            <h3 className="mb-4 text-center text-lg font-bold text-[#0D1F17]">تعديل مجموع الكيدور</h3>
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

      {/* نافذة إضافة شكل يدوي */}
      {customShapeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <button onClick={() => { setCustomShapeModalOpen(false); setCustomShapeAdminOk(false); setCustomShapeName(""); setCustomShapeImage(null); }} className="absolute left-3 top-3 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition"><X className="h-5 w-5" /></button>
            <h3 className="mb-4 text-center text-lg font-bold text-[#0D1F17]">✨ شكل كيدور يدوي</h3>
            {!customShapeAdminOk ? (
              <div className="py-4">
                <p className="mb-4 text-center text-gray-600">أدخل كود المدير</p>
                <PinLock role="admin" onSuccess={() => setCustomShapeAdminOk(true)} onCancel={() => { setCustomShapeModalOpen(false); setCustomShapeAdminOk(false); }} />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">اسم الشكل</label>
                  <input type="text" value={customShapeName} onChange={(e) => setCustomShapeName(e.target.value)} placeholder="مثال: شكل مخصص" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">صورة (اختياري)</label>
                  <input ref={shapeFileRef} type="file" accept="image/*" capture="environment" onChange={handleShapeFileChange} className="hidden" />
                  {customShapeImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img src={customShapeImage} alt="معاينة" className="w-full h-32 object-cover" />
                      <button onClick={() => setCustomShapeImage(null)} className="absolute top-2 left-2 rounded-full bg-red-500 text-white p-1 hover:bg-red-600 transition"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => shapeFileRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-3 text-gray-500 hover:border-[#1B5E3B] hover:text-[#1B5E3B] transition">
                        <ImageIcon className="h-5 w-5" /><span className="text-sm font-bold">رفع صورة</span>
                      </button>
                      <button onClick={() => { if(shapeFileRef.current) { shapeFileRef.current.setAttribute('capture', 'environment'); shapeFileRef.current.click(); }}} className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-3 text-gray-500 hover:border-[#C9A84C] hover:text-[#C9A84C] transition">
                        <Camera className="h-5 w-5" /><span className="text-sm font-bold">كاميرا</span>
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={handleAddCustomShape} disabled={!customShapeName.trim()} className="w-full rounded-xl bg-[#1B5E3B] py-3 text-base font-bold text-white transition hover:bg-[#144d30] disabled:opacity-40">💾 إضافة الشكل</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* نافذة إضافة خياطة يدوية */}
      {customStyleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <button onClick={() => { setCustomStyleModalOpen(false); setCustomStyleAdminOk(false); setCustomStyleName(""); setCustomStylePrice(""); setCustomStyleImage(null); }} className="absolute left-3 top-3 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition"><X className="h-5 w-5" /></button>
            <h3 className="mb-4 text-center text-lg font-bold text-[#0D1F17]">✨ خياطة كيدور يدوية</h3>
            {!customStyleAdminOk ? (
              <div className="py-4">
                <p className="mb-4 text-center text-gray-600">أدخل كود المدير</p>
                <PinLock role="admin" onSuccess={() => setCustomStyleAdminOk(true)} onCancel={() => { setCustomStyleModalOpen(false); setCustomStyleAdminOk(false); }} />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">اسم الخياطة</label>
                  <input type="text" value={customStyleName} onChange={(e) => setCustomStyleName(e.target.value)} placeholder="مثال: خياطة مخصصة" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">السعر (DH)</label>
                  <input type="number" dir="ltr" value={customStylePrice} onChange={(e) => setCustomStylePrice(e.target.value)} placeholder="50" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">صورة (اختياري)</label>
                  <input ref={styleFileRef} type="file" accept="image/*" capture="environment" onChange={handleStyleFileChange} className="hidden" />
                  {customStyleImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img src={customStyleImage} alt="معاينة" className="w-full h-32 object-cover" />
                      <button onClick={() => setCustomStyleImage(null)} className="absolute top-2 left-2 rounded-full bg-red-500 text-white p-1 hover:bg-red-600 transition"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => styleFileRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-3 text-gray-500 hover:border-[#1B5E3B] hover:text-[#1B5E3B] transition">
                        <ImageIcon className="h-5 w-5" /><span className="text-sm font-bold">رفع صورة</span>
                      </button>
                      <button onClick={() => { if(styleFileRef.current) { styleFileRef.current.setAttribute('capture', 'environment'); styleFileRef.current.click(); }}} className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-3 text-gray-500 hover:border-[#C9A84C] hover:text-[#C9A84C] transition">
                        <Camera className="h-5 w-5" /><span className="text-sm font-bold">كاميرا</span>
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={handleAddCustomStyle} disabled={!customStyleName.trim() || !customStylePrice || Number(customStylePrice) < 0} className="w-full rounded-xl bg-[#1B5E3B] py-3 text-base font-bold text-white transition hover:bg-[#144d30] disabled:opacity-40">💾 إضافة الخياطة</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}