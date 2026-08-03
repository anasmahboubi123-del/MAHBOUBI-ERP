'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Save, Loader2, Sofa, Square, Layers, PlusCircle, Scissors, DollarSign } from 'lucide-react';
import { SalonRules, defaultRules, fetchSalonRules, saveSalonRules } from '@/lib/salon-rules';

export default function AdminSalonRulesPage() {
  const [rules, setRules] = useState<SalonRules>(defaultRules);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await fetchSalonRules();
      setRules(data);
    } catch {
      setError('لا يمكن الاتصال بقاعدة البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const ok = await saveSalonRules(rules);
      if (ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError('فشل الحفظ — تحقق من الاتصال');
      }
    } catch {
      setError('فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof SalonRules, value: number) => {
    setRules((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#1B5E3B]/10">
      <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
        {icon}
        <h2 className="text-lg font-black text-[#0D1F17]">{title}</h2>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, field, unit, color = 'gray' }: { label: string; field: keyof SalonRules; unit: string; color?: string }) => (
    <div>
      <label className="mb-1 block text-xs font-bold text-gray-500">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={rules[field]}
          onChange={(e) => update(field, parseFloat(e.target.value) || 0)}
          className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-center text-sm font-bold text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none"
        />
        <span className="text-xs text-gray-400 whitespace-nowrap">{unit}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F0E8]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B5E3B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] p-4 pb-24">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => window.history.back()} className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#1B5E3B] shadow-sm border border-[#1B5E3B]/10">
          <ArrowRight className="h-4 w-4" /> رجوع
        </button>
        <h1 className="text-xl font-black text-[#0D1F17]">⚙️ قواعد الحسابية لصالون</h1>
        <button onClick={handleSave} disabled={saving}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm border transition ${
            saved ? 'bg-green-600 text-white border-green-600' : 'bg-[#1B5E3B] text-white border-[#1B5E3B] hover:bg-[#164a30]'
          } disabled:opacity-50`}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saved ? 'تم الحفظ في Supabase!' : saving ? 'جاري الحفظ...' : 'حفظ القواعد'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-center text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      <div className="mx-auto grid max-w-6xl gap-4">
        {/* سداري — أسعار */}
        <Section title="💰 أسعار السداري" icon={<Sofa className="h-5 w-5 text-[#C9A84C]" />}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="سعر السداري الأساسي" field="seddari_base_price" unit="درهم" />
            <Field label="سعر خياطة السداري" field="stitch_price_per_seddari" unit="درهم" />
            <Field label="سعر الفورمجة" field="formaja_price" unit="درهم" />
            <Field label="سعر التداخل (ديوان)" field="insert_price" unit="درهم" />
            <Field label="سعر الصندوق الخشبي" field="wooden_box_price" unit="درهم" />
            <Field label="سعر متر الثوب" field="fabric_price_per_meter" unit="درهم" />
          </div>
        </Section>

        {/* سداري — استهلاك الثوب */}
        <Section title="🧵 استهلاك ثوب السداري" icon={<Scissors className="h-5 w-5 text-[#C9A84C]" />}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="ثوب لكل سم طول" field="seddari_fabric_per_cm" unit="سم" />
            <Field label="إضافة لكل سم ارتفاع" field="seddari_height_extra" unit="سم" />
            <Field label="إضافة ثوب الفورمجة" field="fabric_formaja_extra_cm" unit="سم" />
            <Field label="إضافة ثوب التداخل" field="fabric_insert_extra_cm" unit="سم" />
          </div>
        </Section>

        {/* مخدات — أسعار */}
        <Section title="🛋️ أسعار المخدات" icon={<Square className="h-5 w-5 text-[#C9A84C]" />}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="مخدة صغيرة (40×40)" field="cushion_small_price" unit="درهم" />
            <Field label="مخدة متوسطة (50×50)" field="cushion_medium_price" unit="درهم" />
            <Field label="مخدة كبيرة (60×60)" field="cushion_large_price" unit="درهم" />
            <Field label="مخدة كبيرة جداً (70×70)" field="cushion_xl_price" unit="درهم" />
          </div>
        </Section>

        {/* مخدات — استهلاك ثوب */}
        <Section title="🧵 ثوب المخدات" icon={<Scissors className="h-5 w-5 text-[#C9A84C]" />}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="ثوب مخدة صغيرة" field="fabric_cushion_small_cm" unit="سم" />
            <Field label="ثوب مخدة متوسطة" field="fabric_cushion_medium_cm" unit="سم" />
            <Field label="ثوب مخدة كبيرة" field="fabric_cushion_large_cm" unit="سم" />
            <Field label="ثوب مخدة كبيرة جداً" field="fabric_cushion_xl_cm" unit="سم" />
          </div>
        </Section>

        {/* لواط */}
        <Section title="📐 أسعار اللواط" icon={<Layers className="h-5 w-5 text-[#C9A84C]" />}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="سعر اللواط لكل متر" field="lwat_price_per_meter" unit="درهم/متر" />
            <Field label="ثوب اللواط لكل متر" field="fabric_lwat_per_meter" unit="سم/متر" />
          </div>
        </Section>

        {/* إضافات */}
        <Section title="✨ أسعار الإضافات" icon={<PlusCircle className="h-5 w-5 text-[#C9A84C]" />}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="سعر استراحة يد" field="handrest_price" unit="درهم" />
            <Field label="ثوب استراحة يد" field="fabric_handrest_cm" unit="سم" />
            <Field label="سعر ستارة (لكل متر)" field="curtain_price_per_meter" unit="درهم" />
            <Field label="ثوب ستارة (لكل متر)" field="fabric_curtain_per_meter" unit="سم" />
            <Field label="سعر زليج (لكل متر)" field="carpet_price_per_meter" unit="درهم" />
          </div>
        </Section>
      </div>
    </div>
  );
}