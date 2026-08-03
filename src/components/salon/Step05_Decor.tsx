'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Info, Edit2, Trash2, Check, X, ArrowRight,
  Image as ImageIcon, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { OrderDraft } from '@/lib/types';
import PinLock from '@/components/ui/PinLock';

const G = '#1B5E3B';
const AU = '#C9A84C';
const CR = '#F5F0E8';

interface DecorShape {
  id: string;
  name: string;
  image_url: string | null;
  gallery: string[] | null;
  default_price: number;
}

interface DecorStitch {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  gallery: string[] | null;
  description: string | null;
}

interface DecorItem {
  id: string;
  shapeId: string;
  shapeName: string;
  shapeImage: string | null;
  count: number;
  stitchId: string | null;
  stitchName: string | null;
  stitchPrice: number;
  pricePerUnit: number;
  hasFilling: boolean;
  fillingPrice: number;
}

interface Props {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

/* ── Gallery Modal ── */
function GalleryModal({ images, title, onClose }: { images: string[]; title: string; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  if (!images?.length) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-2xl p-8 mx-4 max-w-xs w-full text-center shadow-2xl">
          <ImageIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">لا توجد صور إضافية</p>
          <button onClick={onClose} className="mt-5 px-8 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold">إغلاق</button>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/95" onClick={onClose}>
      <div className="flex justify-between items-center px-4 py-3">
        <button onClick={onClose} className="p-2 rounded-full bg-white/10 text-white"><X className="h-5 w-5" /></button>
        <span className="text-white font-bold">{title}</span>
        <span className="text-white/60 text-sm">{idx + 1} / {images.length}</span>
      </div>
      <div className="flex-1 flex items-center justify-center px-4" onClick={(e) => e.stopPropagation()}>
        <img src={images[idx]} alt={`${title} - ${idx + 1}`} className="max-h-full max-w-full object-contain rounded-xl" />
      </div>
      <div className="flex justify-center items-center gap-6 py-5" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}
          className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center text-white disabled:opacity-30 transition">
          <ChevronRight className="h-6 w-6" />
        </button>
        <div className="flex gap-1.5">
          {images.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} className={`rounded-full transition-all ${i === idx ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/40'}`} />
          ))}
        </div>
        <button onClick={() => setIdx((i) => Math.min(images.length - 1, i + 1))} disabled={idx === images.length - 1}
          className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center text-white disabled:opacity-30 transition">
          <ChevronLeft className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

/* ── Add Item Modal (3-step wizard) ── */
function AddItemModal({ shapes, stitchStyles, onAdd, onClose }: {
  shapes: DecorShape[]; stitchStyles: DecorStitch[];
  onAdd: (item: DecorItem) => void; onClose: () => void;
}) {
  type Step = 'shape' | 'customize' | 'price';
  const [step, setStep] = useState<Step>('shape');
  const [selectedShape, setSelectedShape] = useState<DecorShape | null>(null);
  const [selectedStitch, setSelectedStitch] = useState<DecorStitch | null>(null);
  const [count, setCount] = useState(1);
  const [hasFilling, setHasFilling] = useState(true);
  const [fillingPrice, setFillingPrice] = useState(30);
  const [customPrice, setCustomPrice] = useState('');
  const [gallery, setGallery] = useState<{ images: string[]; title: string } | null>(null);
  const [showNewStitchForm, setShowNewStitchForm] = useState(false);
  const [pinForStitch, setPinForStitch] = useState(false);
  const [newStitchName, setNewStitchName] = useState('');
  const [newStitchPrice, setNewStitchPrice] = useState('');
  const [newStitchFile, setNewStitchFile] = useState<File | null>(null);
  const [uploadingStitch, setUploadingStitch] = useState(false);

  const basePrice = selectedShape?.default_price ?? 0;
  const stitchPrice = selectedStitch?.price ?? 0;
  const autoUnitPrice = basePrice + stitchPrice + (hasFilling ? fillingPrice : 0);
  const finalUnitPrice = customPrice !== '' ? parseFloat(customPrice) || 0 : autoUnitPrice;
  const subtotal = finalUnitPrice * count;

  const progressWidth = step === 'shape' ? 33 : step === 'customize' ? 66 : 100;

  const handleConfirm = () => {
    if (!selectedShape) return;
    onAdd({
      id: `decor-${Date.now()}`,
      shapeId: selectedShape.id,
      shapeName: selectedShape.name,
      shapeImage: selectedShape.image_url,
      count,
      stitchId: selectedStitch?.id ?? null,
      stitchName: selectedStitch?.name ?? null,
      stitchPrice: selectedStitch?.price ?? 0,
      pricePerUnit: finalUnitPrice,
      hasFilling,
      fillingPrice: hasFilling ? fillingPrice : 0,
    });
  };

  const handleSaveNewStitch = async () => {
    if (!newStitchName || !newStitchPrice) return;
    setUploadingStitch(true);
    try {
      let imageUrl: string | null = null;
      if (newStitchFile) {
        const ext = newStitchFile.name.split('.').pop();
        const path = `stitch-styles/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('products').upload(path, newStitchFile);
        if (!upErr) {
          const { data } = supabase.storage.from('products').getPublicUrl(path);
          imageUrl = data.publicUrl;
        }
      }
      const { data } = await supabase.from('stitch_styles').insert({
        name: newStitchName,
        price: parseFloat(newStitchPrice),
        image_url: imageUrl,
        target: 'decor',
        active: true,
      }).select().single();
      if (data) {
        stitchStyles.push(data as DecorStitch);
        setSelectedStitch(data as DecorStitch);
      }
      setShowNewStitchForm(false);
      setNewStitchName(''); setNewStitchPrice(''); setNewStitchFile(null);
    } catch (e) { console.error(e); }
    setUploadingStitch(false);
  };

  return (
    <>
      {gallery && <GalleryModal images={gallery.images} title={gallery.title} onClose={() => setGallery(null)} />}
      {pinForStitch && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 mx-4 w-full max-w-sm shadow-2xl">
            {/* ✅ FIXED: use role="admin" instead of correctPin */}
            <PinLock
              role="admin"
              onSuccess={() => { setPinForStitch(false); setShowNewStitchForm(true); }}
              onCancel={() => setPinForStitch(false)}
            />
          </div>
        </div>
      )}
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white w-full max-w-lg rounded-t-3xl shadow-2xl overflow-hidden" style={{ maxHeight: '92vh' }}>
          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <button onClick={onClose} className="p-2 rounded-full bg-gray-100 text-gray-600"><X className="h-5 w-5" /></button>
              <h3 className="font-bold text-lg" style={{ color: G }}>
                {step === 'shape' ? 'اختر الشكل' : step === 'customize' ? 'العدد والخياطة' : 'الثمن والتأكيد'}
              </h3>
              <div className="w-9" />
            </div>
            <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressWidth}%`, background: AU }} />
            </div>
          </div>

          <div className="overflow-y-auto p-5" style={{ maxHeight: 'calc(92vh - 90px)' }}>
            {/* ── Step 1: Shape ── */}
            {step === 'shape' && (
              <div>
                <p className="text-sm text-gray-500 mb-4 text-right">اختر شكل مخدة الديكور</p>
                {shapes.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <p>لا توجد أشكال في الكتالوج بعد</p>
                    <p className="text-xs mt-1">أضف أشكالاً من واجهة المدير</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {shapes.map((shape) => {
                      const isSelected = selectedShape?.id === shape.id;
                      return (
                        <button key={shape.id} onClick={() => setSelectedShape(shape)}
                          className={`relative rounded-2xl border-2 overflow-hidden text-right transition-all ${isSelected ? 'border-[#1B5E3B] shadow-md' : 'border-gray-100 hover:border-gray-300'}`}>
                          {shape.image_url ? (
                            <img src={shape.image_url} alt={shape.name} className="w-full h-28 object-cover" />
                          ) : (
                            <div className="w-full h-28 flex items-center justify-center text-4xl" style={{ background: CR }}>🎀</div>
                          )}
                          <div className="p-2.5">
                            <p className="font-bold text-sm text-gray-800">{shape.name}</p>
                            <p className="text-xs font-bold mt-0.5" style={{ color: AU }}>{shape.default_price} DH</p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 left-2 h-6 w-6 rounded-full flex items-center justify-center shadow" style={{ background: G }}>
                              <Check className="h-3.5 w-3.5 text-white" />
                            </div>
                          )}
                          {(shape.gallery?.length ?? 0) > 0 && (
                            <button onClick={(e) => { e.stopPropagation(); setGallery({ images: shape.gallery!, title: shape.name }); }}
                              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 flex items-center justify-center shadow">
                              <Info className="h-4 w-4" style={{ color: G }} />
                            </button>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                <button onClick={() => selectedShape && setStep('customize')} disabled={!selectedShape}
                  className="w-full py-3.5 rounded-2xl font-bold text-white transition disabled:opacity-40" style={{ background: G }}>التالي ←</button>
              </div>
            )}

            {/* ── Step 2: Count + Stitch + Filling ── */}
            {step === 'customize' && (
              <div>
                <div className="flex items-center gap-3 rounded-xl p-3 mb-5 text-right" style={{ background: CR }}>
                  {selectedShape?.image_url ? (
                    <img src={selectedShape.image_url} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg shrink-0 flex items-center justify-center text-2xl" style={{ background: `${G}15` }}>🎀</div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{selectedShape?.name}</p>
                    <p className="text-xs font-bold" style={{ color: AU }}>{selectedShape?.default_price} DH / مخدة</p>
                  </div>
                </div>

                {/* Count */}
                <div className="mb-6">
                  <p className="font-bold text-gray-700 text-right mb-3">عدد المخاد</p>
                  <div className="flex items-center justify-center gap-6">
                    <button onClick={() => setCount((c) => Math.max(1, c - 1))}
                      className="h-12 w-12 rounded-full border-2 flex items-center justify-center text-2xl font-bold transition" style={{ borderColor: G, color: G }}>−</button>
                    <span className="text-4xl font-bold tabular-nums w-12 text-center" style={{ color: G }}>{count}</span>
                    <button onClick={() => setCount((c) => c + 1)}
                      className="h-12 w-12 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow" style={{ background: G }}>+</button>
                  </div>
                </div>

                {/* Filling Toggle */}
                <div className="mb-5 rounded-xl border-2 p-4 text-right transition" style={{ borderColor: hasFilling ? G : '#e5e7eb', background: hasFilling ? `${G}08` : 'white' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">+{fillingPrice} DH / مخدة</span>
                      <button onClick={() => { setHasFilling(!hasFilling); }}
                        className={`relative h-7 w-12 rounded-full transition ${hasFilling ? 'bg-[#1B5E3B]' : 'bg-gray-300'}`}>
                        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${hasFilling ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                    <p className="font-bold text-gray-700">حشوة اللواط (Fiberfill)</p>
                  </div>
                  {hasFilling && (
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs text-gray-500">DH</span>
                      <input type="number" value={fillingPrice} onChange={(e) => setFillingPrice(parseFloat(e.target.value) || 0)}
                        className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-right text-sm font-bold focus:outline-none" style={{ borderColor: G }} />
                    </div>
                  )}
                </div>

                {/* Stitch styles */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setPinForStitch(true)}
                      className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg" style={{ background: `${AU}20`, color: AU }}>
                      <Plus className="h-3 w-3" /> إضافة
                    </button>
                    <p className="font-bold text-gray-700">شكل الخياطة <span className="text-gray-400 font-normal text-xs mr-1">(اختياري)</span></p>
                  </div>

                  {showNewStitchForm && (
                    <div className="rounded-xl p-4 mb-3 border-2 text-right" style={{ borderColor: AU, background: `${AU}08` }}>
                      <p className="text-sm font-bold mb-2" style={{ color: G }}>شكل خياطة جديد</p>
                      <input type="text" value={newStitchName} onChange={(e) => setNewStitchName(e.target.value)} placeholder="اسم الشكل"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm mb-2 focus:outline-none" style={{ borderColor: G }} />
                      <input type="number" value={newStitchPrice} onChange={(e) => setNewStitchPrice(e.target.value)} placeholder="الثمن (DH)"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-right text-sm mb-2 focus:outline-none" style={{ borderColor: G }} />
                      <label className="flex items-center gap-2 justify-end text-xs text-gray-600 mb-3 cursor-pointer">
                        <span>صورة (اختياري)</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setNewStitchFile(e.target.files?.[0] || null)} />
                        <span className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${newStitchFile ? 'border-[#1B5E3B] text-[#1B5E3B] bg-[#1B5E3B08]' : 'border-gray-200 text-gray-500'}`}>
                          {newStitchFile ? '✓ تم اختيار الصورة' : '📷 اختر صورة'}
                        </span>
                      </label>
                      <div className="flex gap-2">
                        <button onClick={() => { setShowNewStitchForm(false); setNewStitchName(''); setNewStitchPrice(''); setNewStitchFile(null); }}
                          className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-bold">إلغاء</button>
                        <button onClick={handleSaveNewStitch} disabled={uploadingStitch}
                          className="flex-1 py-2 rounded-lg text-white text-sm font-bold" style={{ background: G }}>
                          {uploadingStitch ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2.5">
                    {stitchStyles.map((s) => {
                      const isSel = selectedStitch?.id === s.id;
                      return (
                        <button key={s.id} onClick={() => setSelectedStitch((prev) => prev?.id === s.id ? null : s)}
                          className={`relative rounded-xl border-2 overflow-hidden text-right transition-all ${isSel ? 'border-[#1B5E3B] shadow-sm' : 'border-gray-100 hover:border-gray-300'}`}>
                          {s.image_url ? (
                            <img src={s.image_url} alt={s.name} className="w-full h-20 object-cover" />
                          ) : (
                            <div className="w-full h-20 flex items-center justify-center text-3xl" style={{ background: CR }}>✂️</div>
                          )}
                          <div className="p-2">
                            <p className="font-bold text-xs text-gray-800">{s.name}</p>
                            <p className="text-xs font-bold" style={{ color: AU }}>{s.price} DH/مخدة</p>
                          </div>
                          {isSel && (
                            <div className="absolute top-1.5 left-1.5 h-5 w-5 rounded-full flex items-center justify-center shadow" style={{ background: G }}>
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                          {(s.gallery?.length ?? 0) > 0 && (
                            <button onClick={(e) => { e.stopPropagation(); setGallery({ images: s.gallery!, title: s.name }); }}
                              className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-white/90 flex items-center justify-center">
                              <Info className="h-3.5 w-3.5" style={{ color: G }} />
                            </button>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep('shape')} className="flex-1 py-3 rounded-2xl font-bold border-2 transition" style={{ borderColor: G, color: G }}>→ رجوع</button>
                  <button onClick={() => setStep('price')} className="flex-[2] py-3 rounded-2xl font-bold text-white" style={{ background: G }}>التالي ←</button>
                </div>
              </div>
            )}

            {/* ── Step 3: Price + Confirm ── */}
            {step === 'price' && (
              <div>
                <div className="rounded-2xl p-4 mb-5 text-right space-y-2" style={{ background: CR }}>
                  <div className="flex justify-between items-center"><span className="text-gray-500 text-sm">الشكل</span><span className="font-bold text-gray-800">{selectedShape?.name}</span></div>
                  {selectedStitch && <div className="flex justify-between items-center"><span className="text-gray-500 text-sm">الخياطة</span><span className="font-bold text-gray-800">✂️ {selectedStitch.name}</span></div>}
                  <div className="flex justify-between items-center"><span className="text-gray-500 text-sm">العدد</span><span className="font-bold text-gray-800">{count} مخدة</span></div>
                  {hasFilling && <div className="flex justify-between items-center"><span className="text-gray-500 text-sm">اللواط</span><span className="font-bold text-gray-800">نعم (+{fillingPrice} DH)</span></div>}
                </div>

                <div className="mb-4 rounded-xl border border-gray-100 p-3 text-right space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-400">الثوب (افتراضي)</span><span>{basePrice} DH</span></div>
                  {selectedStitch && <div className="flex justify-between"><span className="text-gray-400">الخياطة</span><span>+ {stitchPrice} DH</span></div>}
                  {hasFilling && <div className="flex justify-between"><span className="text-gray-400">اللواط</span><span>+ {fillingPrice} DH</span></div>}
                  <div className="border-t pt-1 flex justify-between font-bold" style={{ color: G }}><span>الثمن التلقائي للوحدة</span><span>{autoUnitPrice} DH</span></div>
                </div>

                <div className="mb-5 text-right">
                  <p className="font-bold text-gray-700 mb-1">الثمن لكل مخدة</p>
                  <p className="text-xs text-gray-400 mb-3">يمكنك تعديل الثمن الإجمالي للوحدة يدوياً</p>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 font-bold shrink-0">DH</span>
                    <input type="number" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder={String(autoUnitPrice)}
                      className="flex-1 rounded-xl border-2 px-4 py-3 text-center text-xl font-bold focus:outline-none transition" style={{ borderColor: customPrice ? G : '#e5e7eb' }} />
                  </div>
                  {customPrice && <p className="text-xs text-gray-400 mt-1.5">الثمن الافتراضي: {autoUnitPrice} DH</p>}
                </div>

                <div className="rounded-2xl border-2 p-4 mb-6 flex items-center justify-between" style={{ borderColor: AU, background: `${AU}10` }}>
                  <div className="text-left"><p className="text-xs text-gray-500">المجموع لهذا الشكل</p></div>
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: G }}>{subtotal.toLocaleString('ar-MA')} DH</p>
                    <p className="text-xs text-gray-500">{count} × {finalUnitPrice} DH</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep('customize')} className="flex-1 py-3 rounded-2xl font-bold border-2" style={{ borderColor: G, color: G }}>→ رجوع</button>
                  <button onClick={handleConfirm} className="flex-[2] py-3 rounded-2xl font-bold text-white shadow" style={{ background: G }}>✓ إضافة</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Price Edit Modal ── */
function EditPriceModal({ label, current, hint, onSave, onCancel }: {
  label: string; current: number; hint?: string; onSave: (val: number) => void; onCancel: () => void;
}) {
  const [val, setVal] = useState(String(current));
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-5 mx-4 w-full max-w-sm shadow-2xl">
        <h3 className="font-bold text-lg mb-1 text-right" style={{ color: G }}>{label}</h3>
        {hint && <p className="text-xs text-gray-400 mb-4 text-right">{hint}</p>}
        <input type="number" value={val} onChange={(e) => setVal(e.target.value)}
          className="w-full border-2 rounded-xl px-4 py-3.5 text-center text-2xl font-bold mb-4 focus:outline-none" style={{ borderColor: G }} autoFocus />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border-2 font-bold text-gray-600" style={{ borderColor: '#e5e7eb' }}>إلغاء</button>
          <button onClick={() => { const n = parseFloat(val); if (!isNaN(n) && n >= 0) onSave(n); }}
            className="flex-1 py-3 rounded-xl font-bold text-white" style={{ background: G }}>حفظ</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function Step05_Decor({ draft, onChange, onNext, onBack }: Props) {
  const [shapes, setShapes] = useState<DecorShape[]>([]);
  const [stitchStyles, setStitchStyles] = useState<DecorStitch[]>([]);
  const [loading, setLoading] = useState(true);

  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [items, setItems] = useState<DecorItem[]>([]);
  const [totalOverride, setTotalOverride] = useState<number | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [gallery, setGallery] = useState<{ images: string[]; title: string } | null>(null);

  type PinTarget = 'total' | { itemId: string } | null;
  const [pinTarget, setPinTarget] = useState<PinTarget>(null);
  const [editTarget, setEditTarget] = useState<'total' | string | null>(null);

  const autoTotal = items.reduce((sum, it) => sum + it.count * it.pricePerUnit, 0);
  const finalTotal = totalOverride ?? autoTotal;

  // Load from draft (restore)
  useEffect(() => {
    const saved = (draft as any).decorItems;
    if (saved?.length) {
      setItems(saved);
      setEnabled(true);
    }
    const savedOverride = (draft as any).decorTotalOverride;
    if (savedOverride !== undefined) setTotalOverride(savedOverride);
  }, [draft]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [shapesRes, stitchRes] = await Promise.all([
        supabase.from('decor_cushions').select('*').eq('active', true).order('name'),
        supabase.from('stitch_styles').select('*').eq('target', 'decor').eq('active', true).order('price'),
      ]);
      if (shapesRes.data) setShapes(shapesRes.data);
      if (stitchRes.data) setStitchStyles(stitchRes.data);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const persist = (newItems: DecorItem[], override: number | null) => {
    setItems(newItems);
    setTotalOverride(override);
    onChange({
      decorItems: newItems as any,
      decorTotalOverride: override as any,
      decorCushions: newItems.map(it => ({
        shape: it.shapeName,
        count: it.count,
        stitchPrice: it.pricePerUnit,
      })),
    });
  };

  const handleAddItem = (item: DecorItem) => {
    const next = [...items, item];
    persist(next, null);
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    persist(next, null);
  };

  const handleCountChange = (id: string, delta: number) => {
    const next = items.map((i) => i.id === id ? { ...i, count: Math.max(1, i.count + delta) } : i);
    persist(next, null);
  };

  const handlePriceChange = (id: string, price: number) => {
    const next = items.map((i) => i.id === id ? { ...i, pricePerUnit: price } : i);
    persist(next, null);
  };

  const handlePinSuccess = () => {
    if (pinTarget === 'total') setEditTarget('total');
    else if (pinTarget && typeof pinTarget === 'object') setEditTarget(pinTarget.itemId);
    setPinTarget(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: CR }}>
        <div className="h-10 w-10 rounded-full border-4 animate-spin" style={{ borderColor: `${G} ${G} ${G} transparent` }} />
      </div>
    );
  }

  // ── Gate ──
  if (enabled === null) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: CR }}>
        <div className="px-4 pt-5 pb-4 flex items-center gap-3" style={{ background: G }}>
          <button onClick={onBack} className="p-2 rounded-xl bg-white/10"><ArrowRight className="h-5 w-5 text-white" /></button>
          <div>
            <p className="text-white/60 text-xs">الخطوة 5 من 9</p>
            <h1 className="text-white font-bold text-lg">مخاد الديكور</h1>
          </div>
        </div>
        <div className="h-1" style={{ background: `${G}30` }}><div className="h-full" style={{ width: '55%', background: AU }} /></div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-7">
          <div className="h-24 w-24 rounded-3xl flex items-center justify-center text-5xl shadow-lg" style={{ background: `${G}12` }}>🎀</div>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2" style={{ color: G }}>مخاد ديار الديكور</h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">مخاد إضافية لتزيين الصالون — تُباع كاملة بثمن إجمالي شامل الثوب والخياطة واللواط</p>
          </div>
          <div className="flex gap-4 w-full max-w-xs">
            <button onClick={() => { setEnabled(false); onChange({ decorCushions: [] }); }}
              className="flex-1 py-4 rounded-2xl border-2 font-bold text-gray-600 bg-white transition active:scale-95" style={{ borderColor: '#ddd' }}>لا ❌</button>
            <button onClick={() => setEnabled(true)}
              className="flex-1 py-4 rounded-2xl font-bold text-white shadow-lg transition active:scale-95" style={{ background: G }}>نعم ✅</button>
          </div>
        </div>
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: CR }}>
        <div className="px-4 pt-5 pb-4 flex items-center gap-3" style={{ background: G }}>
          <button onClick={() => setEnabled(null)} className="p-2 rounded-xl bg-white/10"><ArrowRight className="h-5 w-5 text-white" /></button>
          <h1 className="text-white font-bold text-lg">مخاد الديكور</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <div className="text-5xl">✅</div>
          <p className="text-gray-600 font-medium text-center">تم تخطي مخاد الديكور</p>
          <button onClick={onNext} className="w-full max-w-xs py-4 rounded-2xl font-bold text-white shadow" style={{ background: G }}>التالي ← الإضافات</button>
        </div>
      </div>
    );
  }

  // ── Main ──
  return (
    <>
      {gallery && <GalleryModal images={gallery.images} title={gallery.title} onClose={() => setGallery(null)} />}
      {showAddModal && <AddItemModal shapes={shapes} stitchStyles={stitchStyles} onAdd={handleAddItem} onClose={() => setShowAddModal(false)} />}
      {pinTarget !== null && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 mx-4 w-full max-w-sm shadow-2xl">
            {/* ✅ FIXED: role="admin" instead of correctPin */}
            <PinLock
              role="admin"
              onSuccess={handlePinSuccess}
              onCancel={() => setPinTarget(null)}
            />
          </div>
        </div>
      )}
      {editTarget === 'total' && (
        <EditPriceModal label="تعديل المجموع الكلي" current={finalTotal}
          hint={`المجموع التلقائي: ${autoTotal.toLocaleString('ar-MA')} DH — يؤثر على هذه الطلبية فقط`}
          onSave={(val) => { persist(items, val); setEditTarget(null); }} onCancel={() => setEditTarget(null)} />
      )}
      {editTarget && editTarget !== 'total' && (
        <EditPriceModal label={`تعديل ثمن ${items.find((i) => i.id === editTarget)?.shapeName}`}
          current={items.find((i) => i.id === editTarget)?.pricePerUnit ?? 0}
          hint="ثمن المخدة الواحدة — يؤثر على هذه الطلبية فقط"
          onSave={(val) => { handlePriceChange(editTarget, val); setEditTarget(null); }} onCancel={() => setEditTarget(null)} />
      )}

      <div className="min-h-screen flex flex-col" style={{ background: CR }}>
        <div className="px-4 pt-5 pb-4 flex items-center gap-3" style={{ background: G }}>
          <button onClick={() => setEnabled(null)} className="p-2 rounded-xl bg-white/10"><ArrowRight className="h-5 w-5 text-white" /></button>
          <div className="flex-1">
            <p className="text-white/60 text-xs">الخطوة 5 من 9</p>
            <h1 className="text-white font-bold text-lg">مخاد الديكور</h1>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm transition active:scale-95" style={{ background: AU, color: '#0D1F17' }}>
            <Plus className="h-4 w-4" /> إضافة
          </button>
        </div>
        <div className="h-1" style={{ background: `${G}20` }}><div className="h-full transition-all" style={{ width: '55%', background: AU }} /></div>

        <div className="flex-1 px-4 py-5 pb-32">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-5">
              <div className="h-20 w-20 rounded-3xl flex items-center justify-center text-4xl" style={{ background: `${G}12` }}>🎀</div>
              <p className="text-gray-500 font-medium text-center">لم تضف أي مخدة ديكور بعد</p>
              <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white shadow" style={{ background: G }}>
                <Plus className="h-5 w-5" /> أضف شكلاً
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex gap-3 p-3">
                    {item.shapeImage ? (
                      <div className="relative shrink-0">
                        <img src={item.shapeImage} alt={item.shapeName} className="h-20 w-20 rounded-xl object-cover" />
                        <button onClick={() => setGallery({ images: [item.shapeImage!], title: item.shapeName })}
                          className="absolute top-1 right-1 h-6 w-6 rounded-full bg-white/90 flex items-center justify-center shadow">
                          <Info className="h-3.5 w-3.5" style={{ color: G }} />
                        </button>
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-xl shrink-0 flex items-center justify-center text-3xl" style={{ background: CR }}>🎀</div>
                    )}
                    <div className="flex-1 text-right">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex gap-1.5">
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg bg-red-50 text-red-400 transition hover:bg-red-100">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => setPinTarget({ itemId: item.id })} className="p-1.5 rounded-lg transition" style={{ background: `${AU}20`, color: AU }}>
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{item.shapeName}</h3>
                          {item.stitchName && <p className="text-xs text-gray-500 mt-0.5">✂️ {item.stitchName}</p>}
                          {item.hasFilling && <p className="text-xs text-gray-400 mt-0.5">🧶 لواط (+{item.fillingPrice} DH)</p>}
                        </div>
                      </div>
                      <p className="font-bold text-sm" style={{ color: AU }}>{item.pricePerUnit.toLocaleString('ar-MA')} DH / مخدة</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 px-3 py-2.5 flex items-center justify-between" style={{ background: `${CR}90` }}>
                    <p className="font-bold text-base" style={{ color: G }}>{(item.count * item.pricePerUnit).toLocaleString('ar-MA')} DH</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleCountChange(item.id, -1)}
                        className="h-8 w-8 rounded-full border-2 flex items-center justify-center font-bold text-lg transition active:scale-90" style={{ borderColor: G, color: G }}>−</button>
                      <span className="w-8 text-center font-bold text-lg tabular-nums" style={{ color: G }}>{item.count}</span>
                      <button onClick={() => handleCountChange(item.id, 1)}
                        className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-white shadow transition active:scale-90" style={{ background: G }}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Summary */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-xl">
          {items.length > 0 && (
            <div className="px-4 pt-3.5 pb-2">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setPinTarget('total')} className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl transition" style={{ background: `${AU}15`, color: AU }}>
                  <Edit2 className="h-4 w-4" /> تعديل
                </button>
                <div className="text-right">
                  <p className="text-xs text-gray-500">مجموع مخاد الديكور</p>
                  <div className="flex items-center gap-2 justify-end">
                    {totalOverride !== null && (
                      <>
                        <span className="text-sm text-gray-400 line-through">{autoTotal.toLocaleString('ar-MA')} DH</span>
                        <button onClick={() => persist(items, null)} className="text-xs text-red-400 underline">إلغاء</button>
                      </>
                    )}
                    <p className="text-xl font-bold" style={{ color: G }}>{finalTotal.toLocaleString('ar-MA')} DH</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="px-4 pb-4">
            <button onClick={onNext} className="w-full py-3.5 rounded-2xl font-bold text-white shadow transition active:scale-[0.99]" style={{ background: G }}>التالي ← الإضافات</button>
          </div>
        </div>
      </div>
    </>
  );
}