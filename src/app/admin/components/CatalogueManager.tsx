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

interface Row {
  id?: string;
  name: string;
  image_url?: string | null;
  price?: number;
  price_per_meter?: number;
  active?: boolean;
  [key: string]: string | number | boolean | undefined | null;
}

/** نستخدم any لتجاوز فرض Supabase للأنواع الصارمة على اسم الجدول */
const db = () => supabase as any;

export default function CatalogueManager({
  table,
  title,
  fields,
  bucket,
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
    const { data, error } = await db()
      .from(table)
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) toast.error('تعذر تحميل البيانات - تأكد من تنفيذ supabase-schema.sql');
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }, [table]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!editing?.name) {
      toast.error('الاسم مطلوب');
      return;
    }

    const payload: Record<string, string | number | boolean | null> = {
      name: editing.name,
      image_url: editing.image_url ?? null,
    };

    fields.forEach((f) => {
      const val = editing[f.key];
      payload[f.key] =
        f.type === 'number' ? Number(val ?? 0) : ((val as string) ?? '');
    });

    let error;

    if (editing.id) {
      const res = await db().from(table).update(payload).eq('id', editing.id);
      error = res.error;
    } else {
      const res = await db().from(table).insert(payload);
      error = res.error;
    }

    if (error) {
      toast.error('فشل الحفظ');
      return;
    }

    toast.success('تم الحفظ');
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm('هل تريد الحذف؟')) return;

    const { error } = await db().from(table).update({ active: false }).eq('id', id);

    if (error) {
      toast.error('فشل الحذف');
      return;
    }
    toast.success('تم الحذف');
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <Button onClick={() => setEditing({ name: '' })}>+ إضافة</Button>
      </div>

      {loading && <p className="text-gray-400">جارٍ التحميل...</p>}
      {!loading && rows.length === 0 && <p className="text-gray-400">لا توجد عناصر بعد</p>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {rows.map((r) => (
          <Card key={r.id ?? r.name} className="text-center">
            {r.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.image_url}
                alt={r.name}
                className="mx-auto h-28 w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-28 items-center justify-center rounded-xl bg-gray-100 text-4xl">
                🖼️
              </div>
            )}
            <div className="mt-2 font-bold">{r.name}</div>
            {'price' in r && r.price !== undefined && (
              <div className="text-brand-700">{r.price} DH</div>
            )}
            {'price_per_meter' in r && r.price_per_meter !== undefined && (
              <div className="text-brand-700">{r.price_per_meter} DH/m</div>
            )}
            <div className="mt-2 flex justify-center gap-2">
              <button
                onClick={() => setEditing(r)}
                className="rounded-lg bg-brand-100 px-3 py-1"
              >
                ✏️
              </button>
              <button
                onClick={() => r.id && remove(r.id)}
                className="rounded-lg bg-red-100 px-3 py-1"
              >
                🗑️
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'تعديل' : 'إضافة'}
      >
        {editing && (
          <div className="space-y-4">
            {fields.map((f) => (
              <Input
                key={f.key}
                label={f.label}
                type={f.type ?? 'text'}
                value={String(editing[f.key] ?? '')}
                onChange={(e) =>
                  setEditing({ ...editing, [f.key]: e.target.value })
                }
              />
            ))}
            <div className="flex items-center gap-4">
              <ImageUploader
                bucket={bucket}
                onUploaded={(url: string) =>
                  setEditing({ ...editing, image_url: url })
                }
              />
              {editing.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={editing.image_url}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover"
                />
              )}
            </div>
            <Button onClick={save} className="w-full">
              💾 حفظ
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}