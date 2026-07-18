'use client';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ImageUploader from '@/components/ui/ImageUploader';

export interface Field {
  key: string;
  label: string;
  type?: 'text' | 'number';
}

type Row = Record<string, any>;

/** مدير كتالوج عام: إضافة / تعديل / حذف مع صور من Supabase Storage */
export default function CatalogueManager({
  table,
  title,
  fields,
  bucket
}: {
  table: string;
  title: string;
  fields: Field[];
  bucket: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from(table).select('*').eq('active', true).order('name');
    if (error) toast.error('تعذر تحميل البيانات - تأكد من تنفيذ supabase-schema.sql');
    setRows(data ?? []);
    setLoading(false);
  }, [table]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!editing?.name) return toast.error('الاسم مطلوب');
    const payload: Row = {};
    fields.forEach((f) => (payload[f.key] = f.type === 'number' ? Number(editing[f.key] ?? 0) : editing[f.key] ?? ''));
    payload.image_url = editing.image_url ?? null;
    const q = editing.id
      ? supabase.from(table).update(payload).eq('id', editing.id)
      : supabase.from(table).insert(payload);
    const { error } = await q;
    if (error) return toast.error('فشل الحفظ');
    toast.success('تم الحفظ');
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm('هل تريد الحذف؟')) return;
    const { error } = await supabase.from(table).update({ active: false }).eq('id', id);
    if (error) return toast.error('فشل الحذف');
    toast.success('تم الحذف');
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <Button onClick={() => setEditing({})}>+ إضافة</Button>
      </div>

      {loading && <p className="text-gray-400">جارٍ التحميل...</p>}
      {!loading && rows.length === 0 && <p className="text-gray-400">لا توجد عناصر بعد</p>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {rows.map((r) => (
          <Card key={r.id} className="text-center">
            {r.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.image_url} alt={r.name} className="mx-auto h-28 w-full rounded-xl object-cover" />
            ) : (
              <div className="flex h-28 items-center justify-center rounded-xl bg-gray-100 text-4xl">🖼️</div>
            )}
            <div className="mt-2 font-bold">{r.name}</div>
            {'price' in r && <div className="text-brand-700">{r.price} DH</div>}
            {'price_per_meter' in r && <div className="text-brand-700">{r.price_per_meter} DH/m</div>}
            <div className="mt-2 flex justify-center gap-2">
              <button onClick={() => setEditing(r)} className="rounded-lg bg-brand-100 px-3 py-1">✏️</button>
              <button onClick={() => remove(r.id)} className="rounded-lg bg-red-100 px-3 py-1">🗑️</button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'تعديل' : 'إضافة'}>
        {editing && (
          <div className="space-y-4">
            {fields.map((f) => (
              <Input
                key={f.key}
                label={f.label}
                type={f.type ?? 'text'}
                value={editing[f.key] ?? ''}
                onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
              />
            ))}
            <div className="flex items-center gap-4">
              <ImageUploader bucket={bucket} onUploaded={(url) => setEditing({ ...editing, image_url: url })} />
              {editing.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={editing.image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
              )}
            </div>
            <Button onClick={save} className="w-full">💾 حفظ</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
