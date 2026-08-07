'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Store, Shield, SlidersHorizontal, Scissors, Ruler,
  ClipboardList, DatabaseBackup,
  Plus, Trash2, Save, AlertTriangle, CheckCircle2,
  Eye, EyeOff, RefreshCw, Download, Upload, Search,
  ChevronUp, ChevronDown, Bell, History, Settings,
  ImagePlus, X, GripVertical, Waves
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ─── Types ───
type TabKey = 'general' | 'pins' | 'flow' | 'stitches' | 'constants' | 'audit' | 'stock' | 'backup' | 'foam';

interface SalonFlowStage {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  link_to_catalogue?: string;
}

interface StitchStyle {
  id: string;
  name: string;
  price: number;
  image_url: string;
  target: 'cushion' | 'decor';
  created_at?: string;
}

interface SalonConstant {
  key: string;
  value: number | number[];
  label: string;
  unit: string;
  editable: boolean;
}

interface AuditLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

interface StockAlert {
  id: string;
  product_name: string;
  category: string;
  current_stock: number;
  min_threshold: number;
  image_url?: string;
}

interface FoamType {
  id: string;
  name: string;
  density: number;
  price_per_m2: number;
  thicknesses: number[];
  image_url?: string;
}

// ─── Tabs ───
const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'general', label: 'أساسيات المحل', icon: Store },
  { key: 'pins', label: 'الأكواد', icon: Shield },
  { key: 'flow', label: 'مراحل الصالون', icon: SlidersHorizontal },
  { key: 'stitches', label: 'أشكال الخياطة', icon: Scissors },
  { key: 'constants', label: 'ثوابت الصالون', icon: Ruler },
  { key: 'foam', label: 'إعدادات البونج', icon: Waves },
  { key: 'audit', label: 'سجل التعديلات', icon: History },
  { key: 'backup', label: 'نسخ احتياطي', icon: DatabaseBackup },
];

// ─── Colors ───
const C = {
  primary: '#1B5E3B',
  primaryLight: '#E8F5E9',
  gold: '#C9A84C',
  goldLight: '#FDF8E7',
  cream: '#F5F0E8',
  dark: '#0D1F17',
  red: '#DC2626',
  redLight: '#FEF2F2',
};

// ─── Helpers ───
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {children}
    </div>
  );
}

function Badge({ children, color = 'primary' }: { children: React.ReactNode; color?: 'primary' | 'gold' | 'red' | 'gray' }) {
  const map = {
    primary: `bg-[${C.primaryLight}] text-[${C.primary}]`,
    gold: `bg-[${C.goldLight}] text-[${C.gold}]`,
    red: `bg-[${C.redLight}] text-[${C.red}]`,
    gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${map[color]}`}>
      {children}
    </span>
  );
}

// ─── useSettings hook (Supabase) ───
function useSettings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getSetting = useCallback(async (key: string, fallback: any) => {
    const { data, error } = await supabase.from('settings').select('value').eq('key', key).single();
    if (error || !data) return fallback;
    try { return JSON.parse(data.value); } catch { return data.value; }
  }, []);

  const setSetting = useCallback(async (key: string, value: any) => {
    const json = typeof value === 'string' ? value : JSON.stringify(value);
    await supabase.from('settings').upsert({ key, value: json }, { onConflict: 'key' });
  }, []);

  return { loading, setLoading, error, setError, getSetting, setSetting };
}

// ─── Tab 1: General ───
function GeneralTab() {
  const { getSetting, setSetting } = useSettings();
  const [shop, setShop] = useState({ name: 'صالون المحبوبي', address: '', phone: '', logo_url: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const name = await getSetting('shop_name', 'صالون المحبوبي');
      const address = await getSetting('shop_address', '');
      const phone = await getSetting('shop_phone', '');
      const logo = await getSetting('shop_logo_url', '');
      setShop({ name, address, phone, logo_url: logo });
    })();
  }, [getSetting]);

  const save = async () => {
    setSaving(true);
    await setSetting('shop_name', shop.name);
    await setSetting('shop_address', shop.address);
    await setSetting('shop_phone', shop.phone);
    await setSetting('shop_logo_url', shop.logo_url);
    setSaving(false);
  };

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `logos/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('catalogue').upload(path, file, { upsert: true });
    if (error) return alert('فشل رفع الشعار: ' + error.message);
    const { data: { publicUrl } } = supabase.storage.from('catalogue').getPublicUrl(path);
    setShop(p => ({ ...p, logo_url: publicUrl }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Store className="w-5 h-5" style={{ color: C.primary }} />
          معلومات المحل
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المحل</label>
            <input
              value={shop.name}
              onChange={e => setShop(p => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E3B]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">رقم الهاتف</label>
            <input
              value={shop.phone}
              onChange={e => setShop(p => ({ ...p, phone: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E3B]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">العنوان</label>
            <input
              value={shop.address}
              onChange={e => setShop(p => ({ ...p, address: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E3B]"
            />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ImagePlus className="w-5 h-5" style={{ color: C.gold }} />
          شعار المحل
        </h3>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-gray-400">لا يوجد شعار</span>
            )}
          </div>
          <label className="cursor-pointer px-4 py-2 bg-[#1B5E3B] text-white rounded-xl text-sm font-bold hover:bg-[#14502d] transition flex items-center gap-2">
            <Upload className="w-4 h-4" />
            رفع شعار
            <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
          </label>
          {shop.logo_url && (
            <button
              onClick={() => setShop(p => ({ ...p, logo_url: '' }))}
              className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 bg-[#1B5E3B] text-white rounded-xl text-sm font-bold hover:bg-[#14502d] transition flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ التغييرات
        </button>
      </div>
    </div>
  );
}

// ─── Tab 2: PINs ───
function PinsTab() {
  const { getSetting, setSetting } = useSettings();
  const [pins, setPins] = useState({ admin: '9999', seller: '1111', tailor1: '5678', tailor2: '5679' });
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const admin = await getSetting('pin_admin', '9999');
      const seller = await getSetting('pin_seller', '1111');
      const t1 = await getSetting('pin_tailor_noureddine', '5678');
      const t2 = await getSetting('pin_tailor_abderrahim', '5679');
      setPins({ admin, seller, tailor1: t1, tailor2: t2 });
    })();
  }, [getSetting]);

  const save = async () => {
    await setSetting('pin_admin', pins.admin);
    await setSetting('pin_seller', pins.seller);
    await setSetting('pin_tailor_noureddine', pins.tailor1);
    await setSetting('pin_tailor_abderrahim', pins.tailor2);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const PinField = ({ label, keyName, color }: { label: string; keyName: string; color: string }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show[keyName] ? 'text' : 'password'}
          value={pins[keyName as keyof typeof pins]}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
            setPins(p => ({ ...p, [keyName]: val }));
          }}
          maxLength={4}
          className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-center tracking-[0.5em] font-mono font-bold outline-none focus:ring-2 ${color}`}
        />
        <button
          type="button"
          onClick={() => setShow(p => ({ ...p, [keyName]: !p[keyName] }))}
          className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
        >
          {show[keyName] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          أكواد الدخول (PIN)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PinField label="كود المدير" keyName="admin" color="focus:ring-blue-200" />
          <PinField label="كود البائع" keyName="seller" color="focus:ring-green-200" />
          <PinField label="كود نور الدين" keyName="tailor1" color="focus:ring-purple-200" />
          <PinField label="كود عبد الرحيم" keyName="tailor2" color="focus:ring-orange-200" />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={save}
            className="px-6 py-2.5 bg-[#1B5E3B] text-white rounded-xl text-sm font-bold hover:bg-[#14502d] transition flex items-center gap-2"
          >
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'تم الحفظ' : 'حفظ الأكواد'}
          </button>
        </div>
      </Card>
    </div>
  );
}

// ─── Tab 3: Salon Flow Stages ───
function FlowTab() {
  const [stages, setStages] = useState<SalonFlowStage[]>([
    { id: '1', name: 'اللحايف', enabled: true, order: 1 },
    { id: '2', name: 'الطابورية', enabled: true, order: 2 },
    { id: '3', name: 'الزرابي', enabled: true, order: 3, link_to_catalogue: 'gp-tapis' },
    { id: '4', name: 'الخامية', enabled: true, order: 4, link_to_catalogue: 'gp-khamiya' },
    { id: '5', name: 'الخشب', enabled: true, order: 5, link_to_catalogue: 'gp-bois' },
    { id: '6', name: 'البونج', enabled: true, order: 6 },
  ]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'salon_flow_stages').single();
      if (data) {
        try { setStages(JSON.parse(data.value)); } catch {}
      }
    })();
  }, []);

  const save = async () => {
    await supabase.from('settings').upsert(
      { key: 'salon_flow_stages', value: JSON.stringify(stages) },
      { onConflict: 'key' }
    );
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const toggle = (id: string) => {
    setStages(p => p.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = stages.findIndex(s => s.id === id);
    if (idx === -1) return;
    if (dir === -1 && idx === 0) return;
    if (dir === 1 && idx === stages.length - 1) return;
    const newStages = [...stages];
    [newStages[idx], newStages[idx + dir]] = [newStages[idx + dir], newStages[idx]];
    newStages.forEach((s, i) => (s.order = i + 1));
    setStages(newStages);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5" style={{ color: C.primary }} />
            مراحل تدفق الصالون
          </h3>
          <p className="text-sm text-gray-500">فعّل/عطّل أو رتّب المراحل التي يمر بها البائع</p>
        </div>
        <div className="space-y-2">
          {stages.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-3 p-4 rounded-xl border transition ${
                s.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
              }`}
            >
              <GripVertical className="w-4 h-4 text-gray-300" />
              <span className="w-8 h-8 rounded-full bg-[#1B5E3B] text-white flex items-center justify-center text-sm font-bold">
                {s.order}
              </span>
              <div className="flex-1">
                <p className="font-bold text-gray-800">{s.name}</p>
                {s.link_to_catalogue && (
                  <p className="text-xs text-gray-400">يرتبط بـ: {s.link_to_catalogue}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(s.id, -1)}
                  disabled={i === 0}
                  className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => move(s.id, 1)}
                  disabled={i === stages.length - 1}
                  className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => toggle(s.id)}
                className={`relative w-12 h-6 rounded-full transition-colors ${s.enabled ? 'bg-[#1B5E3B]' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${s.enabled ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={save}
            className="px-6 py-2.5 bg-[#1B5E3B] text-white rounded-xl text-sm font-bold hover:bg-[#14502d] transition flex items-center gap-2"
          >
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'تم الحفظ' : 'حفظ الترتيب'}
          </button>
        </div>
      </Card>
    </div>
  );
}

// ─── Tab 4: Stitching Styles ───
function StitchesTab() {
  const [styles, setStyles] = useState<StitchStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<StitchStyle>>({ name: '', price: 0, target: 'cushion', image_url: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('stitch_styles').select('*').order('created_at', { ascending: false });
    setStyles(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name || !form.price) return;
    if (editingId) {
      await supabase.from('stitch_styles').update(form).eq('id', editingId);
    } else {
      await supabase.from('stitch_styles').insert(form);
    }
    setShowForm(false);
    setForm({ name: '', price: 0, target: 'cushion', image_url: '' });
    setEditingId(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('حذف هذا الشكل؟')) return;
    await supabase.from('stitch_styles').delete().eq('id', id);
    load();
  };

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `stitch-styles/${Date.now()}_${file.name}`;
    await supabase.storage.from('stitch-styles').upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from('stitch-styles').getPublicUrl(path);
    setForm(p => ({ ...p, image_url: publicUrl }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Scissors className="w-5 h-5" style={{ color: C.primary }} />
            أشكال خياطة المخاد
          </h3>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', price: 0, target: 'cushion', image_url: '' }); }}
            className="px-4 py-2 bg-[#1B5E3B] text-white rounded-xl text-sm font-bold hover:bg-[#14502d] transition flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> إضافة شكل
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-8">جاري التحميل...</p>
        ) : styles.length === 0 ? (
          <p className="text-center text-gray-400 py-8">لا توجد أشكال مسجلة</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {styles.map(s => (
              <div key={s.id} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden group">
                <div className="h-32 bg-gray-200 relative">
                  {s.image_url ? (
                    <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">لا توجد صورة</div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => { setEditingId(s.id); setForm(s); setShowForm(true); }} className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-gray-50">
                      <Settings className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    <button onClick={() => remove(s.id)} className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-800">{s.name}</p>
                    <span className="text-sm font-bold" style={{ color: C.gold }}>{s.price} درهم</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{s.target === 'cushion' ? 'مخاد عادية' : 'مخاد ديار الديكور'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{editingId ? 'تعديل شكل' : 'شكل جديد'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="اسم الشكل" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
              <input type="number" placeholder="السعر (درهم)" value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
              <select value={form.target} onChange={e => setForm(p => ({ ...p, target: e.target.value as 'cushion' | 'decor' }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E3B]">
                <option value="cushion">مخاد عادية</option>
                <option value="decor">مخاد ديار الديكور</option>
              </select>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                  {form.image_url ? <img src={form.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">صورة</div>}
                </div>
                <label className="cursor-pointer px-3 py-1.5 bg-[#C9A84C] text-white rounded-lg text-xs font-bold hover:bg-[#b8983f] transition">
                  رفع صورة
                  <input type="file" accept="image/*" className="hidden" onChange={uploadImage} />
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition">إلغاء</button>
              <button onClick={save} className="flex-1 px-4 py-2.5 bg-[#1B5E3B] text-white rounded-xl font-bold text-sm hover:bg-[#14502d] transition">حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 5: Salon Constants ───
function ConstantsTab() {
  const [constants, setConstants] = useState<SalonConstant[]>([
    { key: 'seddari_heights', value: [20, 30, 50], label: 'ارتفاعات السداري المتاحة', unit: 'سم', editable: true },
    { key: 'fabric_price_per_meter', value: 10, label: 'سعر المتر للقماش', unit: 'درهم', editable: true },
    { key: 'formaja_fabric_m', value: 2.5, label: 'ثوب الفورماجة', unit: 'متر', editable: true },
    { key: 'formaja_sewing_price', value: 50, label: 'خياطة الفورماجة', unit: 'درهم', editable: true },
    { key: 'cushion_sizes', value: [75, 80, 100], label: 'أحجام المخاد المتاحة', unit: 'سم', editable: true },
    { key: 'stuffing_price', value: 100, label: 'سعر حشوة المخدة', unit: 'درهم', editable: true },
    { key: 'decor_cushion_prices', value: [50, 75, 100, 150], label: 'أسعار ديار الديكور', unit: 'درهم', editable: true },
  ]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('settings').select('key, value').like('key', 'salon_const_%');
      if (data && data.length > 0) {
        const map: Record<string, any> = {};
        data.forEach(r => { try { map[r.key] = JSON.parse(r.value); } catch { map[r.key] = r.value; } });
        setConstants(prev => prev.map(c => {
          const v = map[`salon_const_${c.key}`];
          return v !== undefined ? { ...c, value: v } : c;
        }));
      }
    })();
  }, []);

  const updateValue = (idx: number, val: string) => {
    setConstants(prev => {
      const next = [...prev];
      const c = next[idx];
      if (Array.isArray(c.value)) {
        next[idx] = { ...c, value: val.split(',').map(v => Number(v.trim())).filter(v => !isNaN(v)) };
      } else {
        next[idx] = { ...c, value: Number(val) || 0 };
      }
      return next;
    });
  };

  const save = async () => {
    for (const c of constants) {
      await supabase.from('settings').upsert(
        { key: `salon_const_${c.key}`, value: JSON.stringify(c.value) },
        { onConflict: 'key' }
      );
    }
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Ruler className="w-5 h-5" style={{ color: C.primary }} />
          ثوابت حساب الصالون
        </h3>
        <p className="text-sm text-gray-500 mb-4">تغيير هذه الأرقام يؤثر مباشرة على حساب السعر أثناء البيع</p>
        <div className="space-y-3">
          {constants.map((c, i) => (
            <div key={c.key} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex-1">
                <p className="font-bold text-gray-800">{c.label}</p>
                <p className="text-xs text-gray-400">{c.unit}</p>
              </div>
              <input
                value={Array.isArray(c.value) ? c.value.join(', ') : c.value}
                onChange={e => updateValue(i, e.target.value)}
                className="w-40 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-center font-mono font-bold outline-none focus:ring-2 focus:ring-[#1B5E3B]"
                placeholder={Array.isArray(c.value) ? '20, 30, 50' : '0'}
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={save}
            className="px-6 py-2.5 bg-[#1B5E3B] text-white rounded-xl text-sm font-bold hover:bg-[#14502d] transition flex items-center gap-2"
          >
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'تم الحفظ' : 'حفظ الثوابت'}
          </button>
        </div>
      </Card>
    </div>
  );
}

// ─── Tab 6: Audit Log ───
function AuditTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
    setLogs(data || []);
    setLoading(false);
  };

  const filtered = logs.filter(l =>
    l.actor?.includes(filter) || l.action?.includes(filter) || l.entity?.includes(filter)
  );

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5" style={{ color: C.primary }} />
            سجل التعديلات
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-gray-400" />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="بحث..."
              className="pr-9 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E3B] w-48"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-8">جاري التحميل...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-8">لا توجد سجلات</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">التاريخ</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">المستخدم</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">الإجراء</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">العنصر</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">القيمة القديمة</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">القيمة الجديدة</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString('ar-MA', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-gray-800">{l.actor}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        l.action === 'تعديل سعر' ? 'bg-orange-50 text-orange-600' :
                        l.action === 'حذف' ? 'bg-red-50 text-red-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-700">{l.entity}</td>
                    <td className="py-2.5 px-3 text-gray-400 line-through">{l.old_value || '—'}</td>
                    <td className="py-2.5 px-3 text-[#1B5E3B] font-bold">{l.new_value || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Tab 7: Stock Alerts ───
function StockTab() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('fabrics').select('id, name, stock_meters, min_threshold, image_url').lt('stock_meters', 10);
    const mapped = (data || []).map(d => ({
      id: d.id,
      product_name: d.name,
      category: 'أثواب',
      current_stock: d.stock_meters,
      min_threshold: d.min_threshold || 10,
      image_url: d.image_url,
    }));
    setAlerts(mapped);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            تنبيهات المخزون المنخفض
          </h3>
          <button onClick={load} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-8">جاري التحميل...</p>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="text-gray-500">لا توجد تنبيهات — المخزون بخير</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(a => (
              <div key={a.id} className="flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                <div className="w-12 h-12 rounded-lg bg-white border border-red-100 overflow-hidden flex-shrink-0">
                  {a.image_url ? (
                    <img src={a.image_url} alt={a.product_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">—</div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{a.product_name}</p>
                  <p className="text-xs text-gray-500">{a.category}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{a.current_stock}</p>
                  <p className="text-xs text-gray-500">متر متبقي</p>
                </div>
                <div className="text-center px-3">
                  <p className="text-xs text-gray-400">الحد الأدنى</p>
                  <p className="font-bold text-gray-600">{a.min_threshold}</p>
                </div>
                <button className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition">
                  طلب تجديد
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Tab 8: Backup ───
function BackupTab() {
  const [exporting, setExporting] = useState(false);

  const exportData = async () => {
    setExporting(true);
    try {
      const tables = ['orders', 'order_parts', 'order_seddars', 'order_cushions', 'order_items', 'customers', 'fabrics', 'stitch_styles', 'cushion_styles', 'decor_cushions', 'extras', 'formas', 'bounge', 'tapis', 'bois', 'khamiya', 'rembourrage', 'categories', 'tailors', 'messages', 'weekly_wages', 'settings'];
      const backup: Record<string, any> = { exported_at: new Date().toISOString() };
      for (const table of tables) {
        const { data } = await supabase.from(table).select('*');
        backup[table] = data || [];
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mahboubi_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('فشل التصدير: ' + (e as Error).message);
    }
    setExporting(false);
  };

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const backup = JSON.parse(text);
      if (!confirm(`استيراد ${Object.keys(backup).length - 1} جدول؟ سيحلّ محل البيانات الحالية!`)) return;
      alert('تم التحقق من الملف — استخدم SQL مباشر لاستيراد كامل');
    } catch {
      alert('ملف غير صالح');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DatabaseBackup className="w-5 h-5" style={{ color: C.primary }} />
          نسخ احتياطي
        </h3>
        <p className="text-sm text-gray-500 mb-6">تصدير كل بيانات المحل إلى ملف JSON محلي — للحفظ اليدوي</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={exportData}
            disabled={exporting}
            className="flex flex-col items-center gap-3 p-6 bg-[#1B5E3B] text-white rounded-2xl hover:bg-[#14502d] transition disabled:opacity-50"
          >
            <Download className="w-8 h-8" />
            <span className="font-bold">تصدير كل البيانات</span>
            <span className="text-xs opacity-80">JSON — يشمل الطلبيات والكتالوج والإعدادات</span>
          </button>

          <label className="flex flex-col items-center gap-3 p-6 bg-[#C9A84C] text-white rounded-2xl hover:bg-[#b8983f] transition cursor-pointer">
            <Upload className="w-8 h-8" />
            <span className="font-bold">استيراد من ملف</span>
            <span className="text-xs opacity-80">اختر ملف JSON صادر سابقاً</span>
            <input type="file" accept=".json" className="hidden" onChange={importData} />
          </label>
        </div>
      </Card>
    </div>
  );
}

// ─── Tab 9: Foam Settings (NEW) ───
function FoamTab() {
  const [foamTypes, setFoamTypes] = useState<FoamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<FoamType>>({ name: '', density: 20, price_per_m2: 0, thicknesses: [2, 4, 6, 8, 10], image_url: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('foam_types').select('*').order('created_at', { ascending: false });
    setFoamTypes(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name || !form.price_per_m2) return;
    if (editingId) {
      await supabase.from('foam_types').update(form).eq('id', editingId);
    } else {
      await supabase.from('foam_types').insert(form);
    }
    setShowForm(false);
    setForm({ name: '', density: 20, price_per_m2: 0, thicknesses: [2, 4, 6, 8, 10], image_url: '' });
    setEditingId(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('حذف هذا النوع؟')) return;
    await supabase.from('foam_types').delete().eq('id', id);
    load();
  };

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `foam-types/${Date.now()}_${file.name}`;
    await supabase.storage.from('foam-types').upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from('foam-types').getPublicUrl(path);
    setForm(p => ({ ...p, image_url: publicUrl }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Waves className="w-5 h-5" style={{ color: C.primary }} />
            أنواع البونج
          </h3>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', density: 20, price_per_m2: 0, thicknesses: [2, 4, 6, 8, 10], image_url: '' }); }}
            className="px-4 py-2 bg-[#1B5E3B] text-white rounded-xl text-sm font-bold hover:bg-[#14502d] transition flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> إضافة نوع
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-8">جاري التحميل...</p>
        ) : foamTypes.length === 0 ? (
          <p className="text-center text-gray-400 py-8">لا توجد أنواع بونج مسجلة</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {foamTypes.map(f => (
              <div key={f.id} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden group">
                <div className="h-32 bg-gray-200 relative">
                  {f.image_url ? (
                    <img src={f.image_url} alt={f.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">لا توجد صورة</div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => { setEditingId(f.id); setForm(f); setShowForm(true); }} className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-gray-50">
                      <Settings className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    <button onClick={() => remove(f.id)} className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-800">{f.name}</p>
                    <span className="text-sm font-bold" style={{ color: C.gold }}>{f.price_per_m2} درهم/م²</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">كثافة: {f.density} كجم/م³ | سماكات: {f.thicknesses?.join(', ')} سم</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{editingId ? 'تعديل نوع' : 'نوع بونج جديد'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="اسم النوع (مثال: بونج 20 كثافة)" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
              <input type="number" placeholder="الكثافة (كجم/م³)" value={form.density} onChange={e => setForm(p => ({ ...p, density: Number(e.target.value) }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
              <input type="number" placeholder="السعر لكل متر مربع (درهم)" value={form.price_per_m2} onChange={e => setForm(p => ({ ...p, price_per_m2: Number(e.target.value) }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
              <input placeholder="السماكات المتاحة (مثال: 2, 4, 6, 8, 10)" value={form.thicknesses?.join(', ')} onChange={e => setForm(p => ({ ...p, thicknesses: e.target.value.split(',').map(v => Number(v.trim())).filter(v => !isNaN(v)) }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                  {form.image_url ? <img src={form.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">صورة</div>}
                </div>
                <label className="cursor-pointer px-3 py-1.5 bg-[#C9A84C] text-white rounded-lg text-xs font-bold hover:bg-[#b8983f] transition">
                  رفع صورة
                  <input type="file" accept="image/*" className="hidden" onChange={uploadImage} />
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition">إلغاء</button>
              <button onClick={save} className="flex-1 px-4 py-2.5 bg-[#1B5E3B] text-white rounded-xl font-bold text-sm hover:bg-[#14502d] transition">حفظ</button>
            </div>
          </div>
        </div>
      )}

      {saved && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold">تم الحفظ بنجاح</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('general');

  const renderTab = () => {
    switch (activeTab) {
      case 'general': return <GeneralTab />;
      case 'pins': return <PinsTab />;
      case 'flow': return <FlowTab />;
      case 'stitches': return <StitchesTab />;
      case 'constants': return <ConstantsTab />;
      case 'foam': return <FoamTab />;
      case 'audit': return <AuditTab />;
      case 'stock': return <StockTab />;
      case 'backup': return <BackupTab />;
      default: return <GeneralTab />;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.cream }} dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.primaryLight }}>
                <Settings className="w-5 h-5" style={{ color: C.primary }} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">مركز تحكم التدفق</h1>
                <p className="text-sm text-gray-500">إعدادات تخدم عمل البيع اليومي مباشرة</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: C.primary }} />
              <span>متصل بـ Supabase</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-none">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={isActive ? { backgroundColor: C.primary } : {}}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {renderTab()}
      </main>
    </div>
  );
}