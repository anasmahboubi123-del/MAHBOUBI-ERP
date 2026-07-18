'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';

interface SettingRow {
  key: string;
  value: string;
  description: string | null;
}

export default function SettingsPage() {
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('settings').select('*').order('key');
      if (error) toast.error('تعذر تحميل الإعدادات - نفّذ supabase-schema.sql أولاً');
      setRows((data as SettingRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  async function save() {
    const { error } = await supabase.from('settings').upsert(rows);
    if (error) return toast.error('فشل الحفظ');
    toast.success('تم حفظ الإعدادات');
  }

  const groups: { title: string; keys: string[] }[] = [
    { title: '🔐 أكواد الدخول', keys: ['pin_seller', 'pin_tailor', 'pin_admin'] },
    {
      title: '💰 الأسعار الافتراضية',
      keys: ['seddari_sewing_price', 'formaja_sewing_price', 'formaja_fabric_cm', 'stuffing_price', 'min_deposit_ratio', 'default_seddari_width']
    },
    { title: '🔗 ربط Make.com', keys: ['whatsapp_webhook', 'calendar_webhook'] }
  ];

  if (loading) return <p className="p-8 text-center text-gray-500">جارٍ التحميل...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">الإعدادات</h1>
      {groups.map((g) => (
        <Card key={g.title}>
          <h2 className="mb-4 font-bold">{g.title}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {rows
              .filter((r) => g.keys.includes(r.key))
              .map((r) => (
                <Input
                  key={r.key}
                  label={r.description ?? r.key}
                  value={r.value}
                  dir="ltr"
                  onChange={(e) =>
                    setRows(rows.map((x) => (x.key === r.key ? { ...x, value: e.target.value } : x)))
                  }
                />
              ))}
          </div>
        </Card>
      ))}
      <Button onClick={save} className="w-full">💾 حفظ جميع الإعدادات</Button>
    </div>
  );
}
