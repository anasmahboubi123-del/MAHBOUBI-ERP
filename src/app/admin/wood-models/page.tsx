'use client';

// ============================================================
// El Mahboubi Salon ERP — Wood Pricing Models Manager
// واجهة المدير لإدارة نماذج تسعير العود
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit3, Trash2, Eye, EyeOff, Image as ImageIcon,
  Save, X, ChevronDown, ChevronUp, Calculator, Copy, CheckCircle,
  AlertTriangle, TrendingUp, Package, DollarSign, Settings
} from 'lucide-react';
import {
  getWoodPricingModels,
  createWoodPricingModel,
  updateWoodPricingModel,
  deleteWoodPricingModel,
  getModelExtras,
  createModelExtra,
  updateModelExtra,
  deleteModelExtra,
  uploadWoodModelImage,
} from '@/lib/supabase-wood';
import type {
  WoodPricingModel,
  WoodModelExtra,
  WoodPricingSimulation,
} from '@/types/wood-types';

// ============================================================
// الألوان والثيم
// ============================================================
const THEME = {
  primary: '#1B5E38',
  primaryLight: '#2D7A4F',
  gold: '#C9A84C',
  goldLight: '#D4B85A',
  cream: '#F5F0E8',
  dark: '#0D1F17',
  darkCard: '#1A2E22',
  danger: '#DC2626',
  warning: '#F59E0B',
};

// ============================================================
// المكون الرئيسي
// ============================================================
export default function WoodModelsManager() {
  const [models, setModels] = useState<WoodPricingModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedModel, setSelectedModel] = useState<WoodPricingModel | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [managerPin, setManagerPin] = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [pinError, setPinError] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, avgPrice: 0 });

  const MANAGER_PIN = '9999'; // يمكن تغييره من الإعدادات

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      const data = await getWoodPricingModels(false);
      setModels(data);
      setStats({
        total: data.length,
        active: data.filter(m => m.is_active).length,
        avgPrice: data.length > 0
          ? Math.round(data.reduce((s, m) => s + m.seddari_price_per_meter, 0) / data.length)
          : 0,
      });
    } catch (err) {
      console.error('Error loading models:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredModels = models.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         m.wood_type.includes(searchQuery);
    const matchesActive = showInactive ? true : m.is_active;
    return matchesSearch && matchesActive;
  });

  const verifyPin = () => {
    if (managerPin === MANAGER_PIN) {
      setPinVerified(true);
      setPinError('');
    } else {
      setPinError('كود المدير غير صحيح');
    }
  };

  return (
    <div dir="rtl" className="min-h-screen" style={{ backgroundColor: THEME.dark, color: THEME.cream }}>
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4" style={{ backgroundColor: THEME.darkCard }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: THEME.primary }}>
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">نماذج تسعير العود</h1>
              <p className="text-sm opacity-60">إدارة موديلات الخشب والأسعار</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSimulator(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: THEME.gold, color: THEME.dark }}
            >
              <Calculator className="w-4 h-4" />
              <span className="font-semibold">محاكي الأسعار</span>
            </button>
            <button
              onClick={() => { setSelectedModel(null); setIsEditing(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: THEME.primary }}
            >
              <Plus className="w-4 h-4" />
              <span className="font-semibold">موديل جديد</span>
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={<Package className="w-5 h-5" />}
            label="إجمالي الموديلات"
            value={stats.total}
            color={THEME.primary}
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="الموديلات النشطة"
            value={stats.active}
            color={THEME.gold}
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            label="متوسط سعر المتر"
            value={`${stats.avgPrice} درهم`}
            color="#10B981"
          />
        </div>
      </div>

      {/* Search & Filters */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الكود أو نوع الخشب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:border-[#C9A84C] transition-colors"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 rounded border-white/20"
            />
            <span className="text-sm opacity-80">عرض غير النشط</span>
          </label>
        </div>
      </div>

      {/* Models Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="opacity-60">جاري التحميل...</p>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/20 rounded-xl">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg opacity-60">لا توجد موديلات</p>
            <p className="text-sm opacity-40 mt-1">أضف موديلاً جديداً للبدء</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModels.map(model => (
              <ModelCard
                key={model.id}
                model={model}
                onEdit={() => { setSelectedModel(model); setIsEditing(true); }}
                onToggleActive={async () => {
                  await updateWoodPricingModel(model.id, { is_active: !model.is_active });
                  loadModels();
                }}
                onDelete={async () => {
                  if (!confirm('هل أنت متأكد من حذف هذا الموديل؟')) return;
                  await deleteWoodPricingModel(model.id);
                  loadModels();
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <ModelEditModal
          model={selectedModel}
          onClose={() => { setIsEditing(false); setSelectedModel(null); }}
          onSave={async (model, extras) => {
            if (selectedModel) {
              await updateWoodPricingModel(selectedModel.id, model);
            } else {
              const created = await createWoodPricingModel(model as any);
              // إضافة العناصر الإضافية
              for (const extra of extras) {
                await createModelExtra({ ...extra, model_id: created.id });
              }
            }
            loadModels();
            setIsEditing(false);
            setSelectedModel(null);
          }}
          pinVerified={pinVerified}
          onVerifyPin={verifyPin}
          managerPin={managerPin}
          setManagerPin={setManagerPin}
          pinError={pinError}
        />
      )}

      {/* Simulator Modal */}
      {showSimulator && (
        <PricingSimulator
          models={models}
          onClose={() => setShowSimulator(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// مكونات مساعدة
// ============================================================

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl p-4 border border-white/10" style={{ backgroundColor: THEME.darkCard }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: color }}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm opacity-60">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ModelCard({ model, onEdit, onToggleActive, onDelete }: {
  model: WoodPricingModel;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden transition-all hover:border-[#C9A84C]/50" style={{ backgroundColor: THEME.darkCard }}>
      {/* Image */}
      <div className="h-40 relative overflow-hidden" style={{ backgroundColor: THEME.dark }}>
        {model.image_url ? (
          <img src={model.image_url} alt={model.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 opacity-20" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          {!model.is_active && (
            <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-600 text-white">غير نشط</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-lg">{model.name}</h3>
            <p className="text-sm opacity-60">{model.code}</p>
          </div>
          <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: THEME.primary + '30', color: THEME.primaryLight }}>
            {model.wood_type}
          </span>
        </div>

        <p className="text-sm opacity-70 mb-3 line-clamp-2">{model.description}</p>

        {/* Price Preview */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          <div className="rounded-lg p-2" style={{ backgroundColor: THEME.dark }}>
            <p className="opacity-50 text-xs">سعر المتر</p>
            <p className="font-bold" style={{ color: THEME.gold }}>{model.seddari_price_per_meter} درهم</p>
          </div>
          <div className="rounded-lg p-2" style={{ backgroundColor: THEME.dark }}>
            <p className="opacity-50 text-xs">التكاية</p>
            <p className="font-bold">{model.takia_price} درهم</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/10">
          <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm transition-colors hover:bg-white/10" style={{ color: THEME.gold }}>
            <Edit3 className="w-3.5 h-3.5" />
            تعديل
          </button>
          <button onClick={onToggleActive} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm transition-colors hover:bg-white/10 text-white/70">
            {model.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {model.is_active ? 'تعطيل' : 'تنشيط'}
          </button>
          <button onClick={onDelete} className="px-3 py-2 rounded-lg text-sm transition-colors hover:bg-red-500/20 text-red-400">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expand Details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full mt-2 flex items-center justify-center gap-1 text-xs opacity-50 hover:opacity-80 transition-opacity"
        >
          {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showDetails ? 'إخفاء التفاصيل' : 'عرض كل الأسعار'}
        </button>

        {showDetails && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-1 text-sm">
            <PriceRow label="الفرماجة" value={model.formaja_price} />
            <PriceRow label="الكوان" value={model.kwan_price} />
            <PriceRow label="الكوطي" value={model.kouti_price} />
            <PriceRow label="السوندري" value={model.soundri_price} />
            <PriceRow label="الطاولة الكبيرة" value={model.big_table_price} />
            <PriceRow label="الطاولة الصغيرة" value={model.small_table_price} />
          </div>
        )}
      </div>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="opacity-60">{label}</span>
      <span className="font-semibold">{value} درهم</span>
    </div>
  );
}

// ============================================================
// نموذج التعديل / الإضافة
// ============================================================

function ModelEditModal({ model, onClose, onSave, pinVerified, onVerifyPin, managerPin, setManagerPin, pinError }: {
  model: WoodPricingModel | null;
  onClose: () => void;
  onSave: (model: Partial<WoodPricingModel>, extras: Partial<WoodModelExtra>[]) => void;
  pinVerified: boolean;
  onVerifyPin: () => void;
  managerPin: string;
  setManagerPin: (v: string) => void;
  pinError: string;
}) {
  const [form, setForm] = useState<Partial<WoodPricingModel>>(model || {
    name: '', code: '', wood_type: '', engraving_type: '', description: '',
    seddari_price_per_meter: 0, takia_price: 0, formaja_price: 0,
    kwan_price: 0, kouti_price: 0, soundri_price: 0,
    big_table_price: 0, small_table_price: 0, is_active: true,
  });
  const [extras, setExtras] = useState<Partial<WoodModelExtra>[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(model?.image_url || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (model?.id) {
      loadExtras();
    }
  }, [model]);

  const loadExtras = async () => {
    if (!model?.id) return;
    const data = await getModelExtras(model.id);
    setExtras(data);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.code || !form.wood_type) {
      alert('يرجى ملء الحقول الإلزامية');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = form.image_url;
      if (imageFile && form.code) {
        imageUrl = await uploadWoodModelImage(imageFile, form.code);
      }

      onSave({ ...form, image_url: imageUrl }, extras);
    } catch (err) {
      console.error('Error saving:', err);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const addExtra = () => {
    setExtras([...extras, { item_key: '', item_name: '', item_name_ar: '', default_price: 0, unit: 'piece', sort_order: extras.length }]);
  };

  const updateExtra = (index: number, field: keyof WoodModelExtra, value: any) => {
    const updated = [...extras];
    updated[index] = { ...updated[index], [field]: value };
    setExtras(updated);
  };

  const removeExtra = (index: number) => {
    setExtras(extras.filter((_, i) => i !== index));
  };

  if (!pinVerified) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
        <div className="w-full max-w-md rounded-xl p-6 border border-white/10" style={{ backgroundColor: THEME.darkCard }}>
          <div className="text-center mb-6">
            <Settings className="w-12 h-12 mx-auto mb-3" style={{ color: THEME.gold }} />
            <h2 className="text-xl font-bold">تأكيد كود المدير</h2>
            <p className="text-sm opacity-60 mt-1">هذه العملية تتطلب صلاحيات المدير</p>
          </div>
          <input
            type="password"
            placeholder="أدخل كود المدير"
            value={managerPin}
            onChange={(e) => setManagerPin(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white text-center text-xl tracking-widest focus:outline-none focus:border-[#C9A84C] mb-4"
          />
          {pinError && <p className="text-red-400 text-sm text-center mb-4">{pinError}</p>}
          <div className="flex gap-3">
            <button onClick={onVerifyPin} className="flex-1 py-3 rounded-lg text-white font-semibold" style={{ backgroundColor: THEME.primary }}>
              تأكيد
            </button>
            <button onClick={onClose} className="flex-1 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition-colors">
              إلغاء
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-4xl mx-auto rounded-xl border border-white/10 overflow-hidden" style={{ backgroundColor: THEME.darkCard }}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-bold">{model ? 'تعديل الموديل' : 'موديل جديد'}</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2 opacity-80">اسم الموديل *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#C9A84C]"
                  placeholder="مثال: موديل كلاسيكي"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 opacity-80">الكود *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#C9A84C]"
                  placeholder="مثال: W-CLASSIC-01"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 opacity-80">نوع الخشب *</label>
                <input
                  type="text"
                  value={form.wood_type}
                  onChange={(e) => setForm({ ...form, wood_type: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#C9A84C]"
                  placeholder="مثال: الصنوبر، البلوط"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 opacity-80">نوع النقش</label>
                <input
                  type="text"
                  value={form.engraving_type || ''}
                  onChange={(e) => setForm({ ...form, engraving_type: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#C9A84C]"
                  placeholder="مثال: نقش تقليدي"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm mb-2 opacity-80">صورة الموديل</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg border border-white/10 overflow-hidden flex items-center justify-center" style={{ backgroundColor: THEME.dark }}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 opacity-30" />
                  )}
                </div>
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 cursor-pointer hover:bg-white/5 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">اختيار صورة</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm mb-2 opacity-80">الوصف</label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#C9A84C] resize-none"
                placeholder="وصف الموديل..."
              />
            </div>

            {/* Prices */}
            <div>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4" style={{ color: THEME.gold }} />
                الأسعار
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <PriceInput label="سعر متر السداري" value={form.seddari_price_per_meter || 0} onChange={(v) => setForm({ ...form, seddari_price_per_meter: v })} />
                <PriceInput label="التكاية" value={form.takia_price || 0} onChange={(v) => setForm({ ...form, takia_price: v })} />
                <PriceInput label="الفرماجة" value={form.formaja_price || 0} onChange={(v) => setForm({ ...form, formaja_price: v })} />
                <PriceInput label="الكوان" value={form.kwan_price || 0} onChange={(v) => setForm({ ...form, kwan_price: v })} />
                <PriceInput label="الكوطي" value={form.kouti_price || 0} onChange={(v) => setForm({ ...form, kouti_price: v })} />
                <PriceInput label="السوندري" value={form.soundri_price || 0} onChange={(v) => setForm({ ...form, soundri_price: v })} />
                <PriceInput label="الطاولة الكبيرة" value={form.big_table_price || 0} onChange={(v) => setForm({ ...form, big_table_price: v })} />
                <PriceInput label="الطاولة الصغيرة" value={form.small_table_price || 0} onChange={(v) => setForm({ ...form, small_table_price: v })} />
              </div>
            </div>

            {/* Dynamic Extras */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Package className="w-4 h-4" style={{ color: THEME.gold }} />
                  عناصر إضافية ديناميكية
                </h3>
                <button onClick={addExtra} className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg" style={{ backgroundColor: THEME.primary + '30', color: THEME.primaryLight }}>
                  <Plus className="w-3.5 h-3.5" />
                  إضافة عنصر
                </button>
              </div>

              <div className="space-y-3">
                {extras.map((extra, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg border border-white/5" style={{ backgroundColor: THEME.dark }}>
                    <div className="col-span-3">
                      <input
                        type="text"
                        placeholder="المفتاح (مثال: armrest)"
                        value={extra.item_key}
                        onChange={(e) => updateExtra(idx, 'item_key', e.target.value)}
                        className="w-full px-3 py-1.5 rounded border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-[#C9A84C]"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        placeholder="الاسم"
                        value={extra.item_name}
                        onChange={(e) => updateExtra(idx, 'item_name', e.target.value)}
                        className="w-full px-3 py-1.5 rounded border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-[#C9A84C]"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="الاسم بالعربية"
                        value={extra.item_name_ar || ''}
                        onChange={(e) => updateExtra(idx, 'item_name_ar', e.target.value)}
                        className="w-full px-3 py-1.5 rounded border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-[#C9A84C]"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="السعر"
                        value={extra.default_price}
                        onChange={(e) => updateExtra(idx, 'default_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 rounded border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-[#C9A84C]"
                      />
                    </div>
                    <div className="col-span-1">
                      <select
                        value={extra.unit}
                        onChange={(e) => updateExtra(idx, 'unit', e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-white/10 bg-white/5 text-white text-sm focus:outline-none"
                      >
                        <option value="piece">قطعة</option>
                        <option value="meter">متر</option>
                        <option value="set">طقم</option>
                      </select>
                    </div>
                    <div className="col-span-1">
                      <button onClick={() => removeExtra(idx)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {extras.length === 0 && (
                  <p className="text-center text-sm opacity-40 py-4">لا توجد عناصر إضافية</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">موديل نشط</span>
            </label>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-6 py-2.5 rounded-lg border border-white/20 hover:bg-white/5 transition-colors">
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2.5 rounded-lg text-white font-semibold flex items-center gap-2 transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: THEME.primary }}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    حفظ الموديل
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs mb-1.5 opacity-70">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#C9A84C] text-sm"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs opacity-40">درهم</span>
      </div>
    </div>
  );
}

// ============================================================
// محاكي الأسعار (Pricing Simulator)
// ============================================================

function PricingSimulator({ models, onClose }: { models: WoodPricingModel[]; onClose: () => void }) {
  const [selectedModel, setSelectedModel] = useState<WoodPricingModel | null>(null);
  const [masterTotal, setMasterTotal] = useState('');
  const [systemInputs, setSystemInputs] = useState({
    totalLength: '',
    seddariCount: 1,
    takiaCount: 0,
    formajaCount: 0,
    kwanCount: 0,
    koutiCount: 0,
    soundriCount: 0,
    bigTableCount: 0,
    smallTableCount: 0,
  });
  const [result, setResult] = useState<{
    systemTotal: number;
    difference: number;
    differencePercent: number;
    isAccurate: boolean;
    breakdown: any[];
  } | null>(null);

  const calculate = () => {
    if (!selectedModel) return;

    const length = parseFloat(systemInputs.totalLength) || 0;
    const seddariTotal = length * selectedModel.seddari_price_per_meter;

    const items = [
      { name: 'التكايات', qty: systemInputs.takiaCount, price: selectedModel.takia_price },
      { name: 'الفرماجات', qty: systemInputs.formajaCount, price: selectedModel.formaja_price },
      { name: 'الكوان', qty: systemInputs.kwanCount, price: selectedModel.kwan_price },
      { name: 'الكوطيات', qty: systemInputs.koutiCount, price: selectedModel.kouti_price },
      { name: 'السوندريات', qty: systemInputs.soundriCount, price: selectedModel.soundri_price },
      { name: 'الطاولة الكبيرة', qty: systemInputs.bigTableCount, price: selectedModel.big_table_price },
      { name: 'الطاولة الصغيرة', qty: systemInputs.smallTableCount, price: selectedModel.small_table_price },
    ];

    const extrasTotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const systemTotal = seddariTotal + extrasTotal;
    const master = parseFloat(masterTotal) || 0;
    const difference = systemTotal - master;
    const differencePercent = master > 0 ? (difference / master) * 100 : 0;
    const isAccurate = Math.abs(differencePercent) <= 5;

    setResult({
      systemTotal: Math.round(systemTotal * 100) / 100,
      difference: Math.round(difference * 100) / 100,
      differencePercent: Math.round(differencePercent * 100) / 100,
      isAccurate,
      breakdown: [
        { name: 'السدادر', qty: length, unit: 'متر', price: selectedModel.seddari_price_per_meter, total: seddariTotal },
        ...items.filter(i => i.qty > 0).map(i => ({ ...i, total: i.qty * i.price })),
      ],
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-3xl mx-auto rounded-xl border border-white/10 overflow-hidden" style={{ backgroundColor: THEME.darkCard }}>
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="w-5 h-5" style={{ color: THEME.gold }} />
              <h2 className="text-xl font-bold">محاكي الأسعار</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="p-4 rounded-lg border border-[#C9A84C]/30" style={{ backgroundColor: THEME.gold + '10' }}>
              <p className="text-sm leading-relaxed">
                <AlertTriangle className="w-4 h-4 inline-block ml-1" style={{ color: THEME.gold }} />
                أدخل نفس أبعاد طلب حقيقي والسعر الذي حسبه المعلم يدوياً، ثم قارن بنتيجة النظام.
                بهذه الطريقة تستطيع ضبط نماذج الأسعار حتى تصبح نتائج التطبيق مطابقة للورشة الفعلية.
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm mb-2 opacity-80">اختر الموديل</label>
              <select
                value={selectedModel?.id || ''}
                onChange={(e) => {
                  const model = models.find(m => m.id === e.target.value);
                  setSelectedModel(model || null);
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#C9A84C]"
              >
                <option value="">اختر موديل...</option>
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                ))}
              </select>
            </div>

            {selectedModel && (
              <>
                {/* Master Price */}
                <div className="p-4 rounded-lg border border-white/10" style={{ backgroundColor: THEME.dark }}>
                  <label className="block text-sm mb-2 font-semibold" style={{ color: THEME.gold }}>السعر الفعلي (المعلم)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={masterTotal}
                      onChange={(e) => setMasterTotal(e.target.value)}
                      placeholder="أدخل السعر الذي حسبه المعلم..."
                      className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white text-lg focus:outline-none focus:border-[#C9A84C]"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold">درهم</span>
                  </div>
                </div>

                {/* System Inputs */}
                <div>
                  <h3 className="font-semibold mb-3">مدخلات النظام</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <SimInput label="إجمالي الطول (متر)" value={systemInputs.totalLength} onChange={(v) => setSystemInputs({ ...systemInputs, totalLength: v })} />
                    <SimInput label="عدد التكايات" value={systemInputs.takiaCount} onChange={(v) => setSystemInputs({ ...systemInputs, takiaCount: parseInt(v) || 0 })} type="number" />
                    <SimInput label="عدد الفرماجات" value={systemInputs.formajaCount} onChange={(v) => setSystemInputs({ ...systemInputs, formajaCount: parseInt(v) || 0 })} type="number" />
                    <SimInput label="عدد الكوان" value={systemInputs.kwanCount} onChange={(v) => setSystemInputs({ ...systemInputs, kwanCount: parseInt(v) || 0 })} type="number" />
                    <SimInput label="عدد الكوطيات" value={systemInputs.koutiCount} onChange={(v) => setSystemInputs({ ...systemInputs, koutiCount: parseInt(v) || 0 })} type="number" />
                    <SimInput label="عدد السوندريات" value={systemInputs.soundriCount} onChange={(v) => setSystemInputs({ ...systemInputs, soundriCount: parseInt(v) || 0 })} type="number" />
                    <SimInput label="الطاولات الكبيرة" value={systemInputs.bigTableCount} onChange={(v) => setSystemInputs({ ...systemInputs, bigTableCount: parseInt(v) || 0 })} type="number" />
                    <SimInput label="الطاولات الصغيرة" value={systemInputs.smallTableCount} onChange={(v) => setSystemInputs({ ...systemInputs, smallTableCount: parseInt(v) || 0 })} type="number" />
                  </div>
                </div>

                <button
                  onClick={calculate}
                  className="w-full py-3 rounded-lg text-white font-bold text-lg transition-colors hover:opacity-90"
                  style={{ backgroundColor: THEME.primary }}
                >
                  مقارنة الأسعار
                </button>

                {/* Results */}
                {result && (
                  <div className={`p-6 rounded-xl border-2 ${result.isAccurate ? 'border-green-500/50' : 'border-red-500/50'}`} style={{ backgroundColor: result.isAccurate ? '#10B98110' : '#EF444410' }}>
                    <div className="flex items-center gap-2 mb-4">
                      {result.isAccurate ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                      )}
                      <h3 className="text-lg font-bold">
                        {result.isAccurate ? 'النتائج متقاربة ✅' : 'هناك فارق ملحوظ ⚠️'}
                      </h3>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 rounded-lg" style={{ backgroundColor: THEME.dark }}>
                        <p className="text-xs opacity-60 mb-1">سعر المعلم</p>
                        <p className="text-xl font-bold">{masterTotal} درهم</p>
                      </div>
                      <div className="text-center p-3 rounded-lg" style={{ backgroundColor: THEME.dark }}>
                        <p className="text-xs opacity-60 mb-1">سعر النظام</p>
                        <p className="text-xl font-bold" style={{ color: THEME.gold }}>{result.systemTotal} درهم</p>
                      </div>
                      <div className="text-center p-3 rounded-lg" style={{ backgroundColor: THEME.dark }}>
                        <p className="text-xs opacity-60 mb-1">الفرق</p>
                        <p className={`text-xl font-bold ${result.difference > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {result.difference > 0 ? '+' : ''}{result.difference} ({result.differencePercent}%)
                        </p>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-2">
                      <p className="font-semibold text-sm mb-2">تفصيل الحساب:</p>
                      {result.breakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-white/5">
                          <span className="opacity-80">{item.name} × {item.qty} {item.unit || 'قطعة'}</span>
                          <span className="font-semibold">{Math.round(item.total * 100) / 100} درهم</span>
                        </div>
                      ))}
                    </div>

                    {!result.isAccurate && (
                      <div className="mt-4 p-3 rounded-lg text-sm" style={{ backgroundColor: THEME.warning + '20', color: THEME.warning }}>
                        💡 نصيحة: راجع أسعار الموديل أو أضف عناصر إضافية ناقصة. إذا كان الفارق مقصوداً (مثلاً خصم خاص)، فهذا طبيعي.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SimInput({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs mb-1.5 opacity-70">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#C9A84C] text-sm"
      />
    </div>
  );
}