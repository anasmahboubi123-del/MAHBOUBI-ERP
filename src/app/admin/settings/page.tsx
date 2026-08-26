'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Store, Shield, SlidersHorizontal, Scissors, Ruler,
  ClipboardList, DatabaseBackup, Printer, Save, AlertTriangle,
  CheckCircle2, Eye, EyeOff, RefreshCw, Download, Upload, Search,
  ChevronUp, ChevronDown, Bell, History, Settings,
  ImagePlus, X, GripVertical, Waves, FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ─── Types ───
type TabKey = 'general' | 'pins' | 'flow' | 'stitches' | 'constants' | 'audit' | 'stock' | 'backup' | 'foam' | 'print';

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

interface DocumentConditions {
  devis_conditions?: string | null;
  bc_conditions?: string | null;
  facture_conditions?: string | null;
}

// ─── Tabs ───
const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'general', label: 'أساسيات المحل', icon: Store },
  { key: 'pins', label: 'الأكواد', icon: Shield },
  { key: 'flow', label: 'مراحل الصالون', icon: SlidersHorizontal },
  { key: 'stitches', label: 'أشكال الخياطة', icon: Scissors },
  { key: 'constants', label: 'ثوابت الصالون', icon: Ruler },
  { key: 'foam', label: 'إعدادات البونج', icon: Waves },
  { key: 'print', label: 'الطباعة', icon: Printer },
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
function Card({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`} style={style}>
      {children}
    </div>
  );
}

// ─── useSettings hook ───
function useSettings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getSetting = useCallback(async (key: string, fallback: any) => {
    const { data, error } = await supabase.from('settings').select('value').eq('key', key).single();
    if (error || !data) return fallback;
    const value = (data as { value: string }).value;
    try { return JSON.parse(value); } catch { return value; }
  }, []);

  const setSetting = useCallback(async (key: string, value: any) => {
    const json = typeof value === 'string' ? value : JSON.stringify(value);
    await supabase.from('settings').upsert({ key, value: json } as never, { onConflict: 'key' });
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
            <input value={shop.name} onChange={e => setShop(p => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">رقم الهاتف</label>
            <input value={shop.phone} onChange={e => setShop(p => ({ ...p, phone: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">العنوان</label>
            <input value={shop.address} onChange={e => setShop(p => ({ ...p, address: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
          </div>
        </div>
      </Card>
      <div className="flex justify-end">
        <button onClick={save} disabled={saving}
          className="px-6 py-2.5 bg-[#1B5E3B] text-white rounded-xl text-sm font-bold hover:bg-[#14502d] transition flex items-center gap-2 disabled:opacity-50">
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
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          أكواد الدخول (PIN)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['admin', 'seller', 'tailor1', 'tailor2'] as const).map((k, i) => {
            const labels = ['كود المدير', 'كود البائع', 'كود نور الدين', 'كود عبد الرحيم'];
            return (
              <div key={k} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{labels[i]}</label>
                <div className="relative">
                  <input type={show[k] ? 'text' : 'password'} value={pins[k]}
                    onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 4); setPins(p => ({ ...p, [k]: val })); }}
                    maxLength={4}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-center tracking-[0.5em] font-mono font-bold outline-none focus:ring-2" />
                  <button type="button" onClick={() => setShow(p => ({ ...p, [k]: !p[k] }))}
                    className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {show[k] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={save}
            className="px-6 py-2.5 bg-[#1B5E3B] text-white rounded-xl text-sm font-bold hover:bg-[#14502d] transition flex items-center gap-2">
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'تم الحفظ' : 'حفظ الأكواد'}
          </button>
        </div>
      </Card>
    </div>
  );
}

// ─── Tab 3: Flow ───
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
      if (data) { try { setStages(JSON.parse((data as { value: string }).value)); } catch {} }
    })();
  }, []);

  const save = async () => {
    await supabase.from('settings').upsert({ key: 'salon_flow_stages', value: JSON.stringify(stages) } as never, { onConflict: 'key' });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5" style={{ color: C.primary }} />
            مراحل تدفق الصالون
          </h3>
        </div>
        <div className="space-y-2">
          {stages.map((s, i) => (
            <div key={s.id} className={`flex items-center gap-3 p-4 rounded-xl border transition ${s.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
              <GripVertical className="w-4 h-4 text-gray-300" />
              <span className="w-8 h-8 rounded-full bg-[#1B5E3B] text-white flex items-center justify-center text-sm font-bold">{s.order}</span>
              <div className="flex-1">
                <p className="font-bold text-gray-800">{s.name}</p>
                {s.link_to_catalogue && <p className="text-xs text-gray-400">يرتبط بـ: {s.link_to_catalogue}</p>}
              </div>
              <button onClick={() => setStages(p => p.map(x => x.id === s.id ? { ...x, enabled: !x.enabled } : x))}
                className={`relative w-12 h-6 rounded-full transition-colors ${s.enabled ? 'bg-[#1B5E3B]' : 'bg-gray-300'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${s.enabled ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={save}
            className="px-6 py-2.5 bg-[#1B5E3B] text-white rounded-xl text-sm font-bold hover:bg-[#14502d] transition flex items-center gap-2">
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'تم الحفظ' : 'حفظ الترتيب'}
          </button>
        </div>
      </Card>
    </div>
  );
}

// ─── Tab 4: Stitches ───
function StitchesTab() {
  const [styles, setStyles] = useState<StitchStyle[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('stitch_styles').select('*').order('created_at', { ascending: false });
    setStyles(data || []); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Scissors className="w-5 h-5" style={{ color: C.primary }} />
          أشكال خياطة المخاد
        </h3>
        {loading ? <p className="text-center text-gray-400 py-8">جاري التحميل...</p> :
          styles.length === 0 ? <p className="text-center text-gray-400 py-8">لا توجد أشكال مسجلة</p> :
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {styles.map(s => (
              <div key={s.id} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                <div className="h-32 bg-gray-200">
                  {s.image_url ? <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">لا توجد صورة</div>}
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-800">{s.name}</p>
                    <span className="text-sm font-bold" style={{ color: C.gold }}>{s.price} درهم</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        }
      </Card>
    </div>
  );
}

// ─── Tab 5: Constants ───
function ConstantsTab() {
  const [constants, setConstants] = useState<SalonConstant[]>([
    { key: 'seddari_heights', value: [20, 30, 50], label: 'ارتفاعات السداري المتاحة', unit: 'سم', editable: true },
    { key: 'fabric_price_per_meter', value: 10, label: 'سعر المتر للقماش', unit: 'درهم', editable: true },
  ]);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    for (const c of constants) {
      await supabase.from('settings').upsert({ key: `salon_const_${c.key}`, value: JSON.stringify(c.value) } as any, { onConflict: 'key' });
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
        <div className="space-y-3">
          {constants.map((c, i) => (
            <div key={c.key} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex-1">
                <p className="font-bold text-gray-800">{c.label}</p>
                <p className="text-xs text-gray-400">{c.unit}</p>
              </div>
              <input value={Array.isArray(c.value) ? c.value.join(', ') : c.value}
                onChange={e => {
                  const val = e.target.value;
                  setConstants(prev => {
                    const next = [...prev];
                    next[i] = { ...next[i], value: Array.isArray(next[i].value) ? val.split(',').map(v => Number(v.trim())).filter(v => !isNaN(v)) : Number(val) || 0 };
                    return next;
                  });
                }}
                className="w-40 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-center font-mono font-bold outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={save}
            className="px-6 py-2.5 bg-[#1B5E3B] text-white rounded-xl text-sm font-bold hover:bg-[#14502d] transition flex items-center gap-2">
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'تم الحفظ' : 'حفظ الثوابت'}
          </button>
        </div>
      </Card>
    </div>
  );
}

// ─── Tab 6: Audit ───
function AuditTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
      setLogs(data || []); setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <History className="w-5 h-5" style={{ color: C.primary }} />
          سجل التعديلات
        </h3>
        {loading ? <p className="text-center text-gray-400 py-8">جاري التحميل...</p> :
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200">
                <th className="text-right py-2 px-3 text-gray-500 font-medium">التاريخ</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">المستخدم</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">الإجراء</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">العنصر</th>
              </tr></thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="py-2.5 px-3 text-gray-600">{new Date(l.created_at).toLocaleString('ar-MA', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="py-2.5 px-3 font-bold text-gray-800">{l.actor}</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600">{l.action}</span></td>
                    <td className="py-2.5 px-3 text-gray-700">{l.entity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </Card>
    </div>
  );
}

// ─── Tab 7: Stock ───
function StockTab() {
  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4">تنبيهات المخزون المنخفض</h3>
        <p className="text-center text-gray-400 py-8">لا توجد تنبيهات — المخزون بخير</p>
      </Card>
    </div>
  );
}

// ─── Tab 8: Backup ───
function BackupTab() {
  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DatabaseBackup className="w-5 h-5" style={{ color: C.primary }} />
          نسخ احتياطي
        </h3>
        <p className="text-sm text-gray-500">تصدير كل بيانات المحل إلى ملف JSON محلي</p>
      </Card>
    </div>
  );
}

// ─── Tab 9: Foam ───
function FoamTab() {
  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Waves className="w-5 h-5" style={{ color: C.primary }} />
          أنواع البونج
        </h3>
        <p className="text-center text-gray-400 py-8">لا توجد أنواع بونج مسجلة</p>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ✅ NEW: Tab 10 — Print Settings (Conditions)
// ═══════════════════════════════════════════════════════════════
function PrintSettingsTab() {
  const [conditions, setConditions] = useState({
    devis_conditions: '',
    bc_conditions: '',
    facture_conditions: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConditions();
  }, []);

  const loadConditions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_conditions')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        const documentConditions = data as unknown as DocumentConditions;
        setConditions({
          devis_conditions: documentConditions.devis_conditions || '',
          bc_conditions: documentConditions.bc_conditions || '',
          facture_conditions: documentConditions.facture_conditions || '',
        });
      }
    } catch (e) {
      console.error('Failed to load conditions:', e);
    }
    setLoading(false);
  };

  const saveConditions = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('document_conditions')
        .upsert(
          {
            devis_conditions: conditions.devis_conditions,
            bc_conditions: conditions.bc_conditions,
            facture_conditions: conditions.facture_conditions,
            updated_at: new Date().toISOString(),
          } as never,
          { onConflict: 'id' }
        );

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert('فشل حفظ الشروط: ' + (e as Error).message);
    }
    setSaving(false);
  };

  const ConditionCard = ({
    title,
    icon: Icon,
    color,
    value,
    onChange,
    placeholder,
  }: {
    title: string;
    icon: React.ElementType;
    color: string;
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
  }) => (
    <Card className="border-r-4" style={{ borderRightColor: color }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E3B] resize-none leading-relaxed"
        dir="rtl"
      />
      <p className="text-xs text-gray-400 mt-2">
        كل سطر جديد يُحوّل إلى بند منفصل في المستند
      </p>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6" style={{ color: C.primary }} />
            شروط المستندات
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            تعديل الشروط التي تظهر في أسفل كل مستند مطبوع. كل مستند له شروطه الخاصة.
          </p>
        </div>
        <button
          onClick={saveConditions}
          disabled={saving}
          className="px-6 py-2.5 bg-[#1B5E3B] text-white rounded-xl text-sm font-bold hover:bg-[#14502d] transition flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'تم الحفظ' : saving ? 'جاري الحفظ...' : 'حفظ الشروط'}
        </button>
      </div>

      {/* Conditions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ConditionCard
          title="عرض السعر (Devis)"
          icon={FileText}
          color="#3B82F6"
          value={conditions.devis_conditions}
          onChange={(val) => setConditions(p => ({ ...p, devis_conditions: val }))}
          placeholder={`1. عرض السعر صالح لمدة 15 يوماً.
2. لا يبدأ التصنيع إلا بعد دفع العربون.
3. التسليم خلال 3-4 أسابيع من تأكيد الطلب.`}
        />
        <ConditionCard
          title="بون دي كوماند (BC)"
          icon={ClipboardList}
          color="#F59E0B"
          value={conditions.bc_conditions}
          onChange={(val) => setConditions(p => ({ ...p, bc_conditions: val }))}
          placeholder={`1. دفع العربون إلزامي لبدء التصنيع.
2. العربون غير قابل للاسترجاع بعد بدء العمل.
3. مدة التصنيع القصوى 90 يوماً.`}
        />
        <ConditionCard
          title="الفاتورة (Facture)"
          icon={FileText}
          color="#10B981"
          value={conditions.facture_conditions}
          onChange={(val) => setConditions(p => ({ ...p, facture_conditions: val }))}
          placeholder={`1. الفاتورة تُثبت عملية البيع النهائية.
2. الضمان 6 أشهر على الخياطة.
3. الضمان لا يشمل الأضرار الناتجة عن الاستخدام الخاطئ.`}
        />
      </div>

      {/* Preview hint */}
      <Card className="bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800 text-sm">ملاحظة مهمة</p>
            <p className="text-sm text-amber-700 mt-1">
              الشروط التي تُكتب هنا تظهر تلقائياً في المستندات المطبوعة. إذا تركت حقلاً فارغاً، سيُستخدم النص الافتراضي.
              يمكنك استخدام <code className="bg-amber-100 px-1 rounded">{'{{deliveryDate}}'}</code> في بون دي كوماند ليظهر موعد التسليم المتفق عليه.
            </p>
          </div>
        </div>
      </Card>
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
      case 'print': return <PrintSettingsTab />;
      case 'audit': return <AuditTab />;
      case 'stock': return <StockTab />;
      case 'backup': return <BackupTab />;
      default: return <GeneralTab />;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.cream }} dir="rtl">
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

          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-none">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    isActive ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {renderTab()}
      </main>
    </div>
  );
}