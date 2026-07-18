'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { FabricItem } from '@/lib/types';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PinLock from '@/components/ui/PinLock';

/** المرحلة 1: اختيار الثوب */
export default function FabricSelector({
  selected,
  onSelect
}: {
  selected: FabricItem | null;
  onSelect: (f: FabricItem) => void;
}) {
  const [fabrics, setFabrics] = useState<FabricItem[]>([]);
  const [search, setSearch] = useState('');
  const [info, setInfo] = useState<FabricItem | null>(null);
  const [priceEdit, setPriceEdit] = useState<FabricItem | null>(null);
  const [adminOk, setAdminOk] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAdminOk(sessionStorage.getItem('auth_admin') === '1');
    (async () => {
      const { data } = await supabase.from('fabrics').select('*').eq('active', true).order('name');
      setFabrics((data as FabricItem[]) ?? []);
      setLoading(false);
    })();
  }, []);

  async function savePrice() {
    if (!priceEdit) return;
    const price = Number(newPrice);
    const { error } = await supabase.from('fabrics').update({ price_per_meter: price }).eq('id', priceEdit.id);
    if (error) return toast.error('فشل تحديث الثمن');
    setFabrics(fabrics.map((f) => (f.id === priceEdit.id ? { ...f, price_per_meter: price } : f)));
    toast.success('تم تحديث الثمن');
    setPriceEdit(null);
  }

  const filtered = fabrics.filter(
    (f) => f.name.includes(search) || (f.color ?? '').includes(search)
  );

  return (
    <div>
      <Input placeholder="🔍 بحث بالاسم أو اللون..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4" />
      {loading && <p className="text-gray-400">جارٍ التحميل...</p>}
      {!loading && fabrics.length === 0 && (
        <p className="text-gray-400">لا توجد أثواب - أضفها من واجهة المدير ← الكتالوج</p>
      )}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {filtered.map((f) => (
          <Card
            key={f.id}
            onClick={() => onSelect(f)}
            className={`relative text-center ${selected?.id === f.id ? 'ring-4 ring-brand-600' : ''}`}
          >
            {f.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.image_url} alt={f.name} className="h-32 w-full rounded-xl object-cover" />
            ) : (
              <div className="flex h-32 items-center justify-center rounded-xl bg-gray-100 text-4xl">🧵</div>
            )}
            <div className="mt-2 font-bold">{f.name}</div>
            {f.color && <div className="text-sm text-gray-500">{f.color}</div>}
            <div className="font-bold text-brand-700">{f.price_per_meter} DH/m</div>
            <div className="absolute left-2 top-2 flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setInfo(f); }}
                className="h-8 w-8 rounded-full bg-white/90 shadow"
                title="معلومات"
              >
                i
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setPriceEdit(f); setNewPrice(String(f.price_per_meter)); }}
                className="h-8 w-8 rounded-full bg-white/90 shadow"
                title="تغيير الثمن (كود المدير)"
              >
                ✏️
              </button>
            </div>
            {selected?.id === f.id && <div className="absolute right-2 top-2 text-2xl">✅</div>}
          </Card>
        ))}
      </div>

      {/* مودال معلومات الثوب */}
      <Modal open={!!info} onClose={() => setInfo(null)} title={info?.name}>
        {info && (
          <div className="space-y-3">
            <div className="text-lg font-bold text-brand-700">{info.price_per_meter} DH/m</div>
            {info.color && <div>اللون: {info.color}</div>}
            <h4 className="font-semibold">الثوب في صالون حقيقي:</h4>
            <div className="grid grid-cols-2 gap-3">
              {(info.gallery ?? []).map((u) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={u} src={u} alt="" className="rounded-xl object-cover" />
              ))}
              {(info.gallery ?? []).length === 0 && <p className="text-gray-400">لا توجد صور إضافية</p>}
            </div>
          </div>
        )}
      </Modal>

      {/* تغيير الثمن - يتطلب كود المدير */}
      <Modal open={!!priceEdit} onClose={() => setPriceEdit(null)} title="تغيير الثمن">
        {priceEdit && !adminOk && <PinLock role="admin" onSuccess={() => setAdminOk(true)} onCancel={() => setPriceEdit(null)} />}
        {priceEdit && adminOk && (
          <div className="space-y-4">
            <Input label={`ثمن ${priceEdit.name} (DH/m)`} type="number" dir="ltr" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
            <Button onClick={savePrice} className="w-full">💾 حفظ</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
