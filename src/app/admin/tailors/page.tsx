'use client';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

interface Tailor {
  id?: string;
  full_name: string;
  phone: string | null;
  pin_code: string | null;
}

export default function TailorsPage() {
  const [rows, setRows] = useState<Tailor[]>([]);
  const [editing, setEditing] = useState<Tailor | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('tailors').select('*').eq('active', true).order('full_name');
    setRows((data as Tailor[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!editing?.full_name) return toast.error('الاسم مطلوب');
    const payload = { full_name: editing.full_name, phone: editing.phone ?? '', pin_code: editing.pin_code ?? '' };
    const q = editing.id
      ? supabase.from('tailors').update(payload).eq('id', editing.id)
      : supabase.from('tailors').insert(payload);
    const { error } = await q;
    if (error) return toast.error('فشل الحفظ');
    toast.success('تم الحفظ');
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm('هل تريد الحذف؟')) return;
    await supabase.from('tailors').update({ active: false }).eq('id', id);
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-700">إدارة الخياطين</h1>
        <Button onClick={() => setEditing({ full_name: '', phone: '', pin_code: '' })}>+ إضافة خياط</Button>
      </div>
      {rows.length === 0 && <p className="text-gray-400">لا يوجد خياطون بعد</p>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {rows.map((t) => (
          <Card key={t.id}>
            <div className="text-lg font-bold">🧵 {t.full_name}</div>
            <div className="text-sm text-gray-500" dir="ltr">{t.phone || '—'}</div>
            <div className="mt-2 flex gap-2">
              <button onClick={() => setEditing(t)} className="rounded-lg bg-brand-100 px-3 py-1">✏️</button>
              <button onClick={() => remove(t.id!)} className="rounded-lg bg-red-100 px-3 py-1">🗑️</button>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'تعديل خياط' : 'إضافة خياط'}>
        {editing && (
          <div className="space-y-4">
            <Input label="الاسم الكامل" value={editing.full_name} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} />
            <Input label="رقم الهاتف" dir="ltr" value={editing.phone ?? ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            <Input label="كود الدخول (PIN)" dir="ltr" value={editing.pin_code ?? ''} onChange={(e) => setEditing({ ...editing, pin_code: e.target.value })} />
            <Button onClick={save} className="w-full">💾 حفظ</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
