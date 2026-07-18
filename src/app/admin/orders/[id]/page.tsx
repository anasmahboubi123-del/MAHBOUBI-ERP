'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { fmtDh } from '@/lib/calculations';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ImageUploader from '@/components/ui/ImageUploader';
import ChatSystem from '@/components/chat/ChatSystem';

interface Tailor {
  id: string;
  full_name: string;
}

/** مراجعة الطلبية قبل إرسالها للخياط + المراسلة */
export default function AdminOrderPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [notes, setNotes] = useState('');
  const [tailorId, setTailorId] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: o }, { data: t }] = await Promise.all([
        supabase.from('orders').select('*').eq('id', id).single(),
        supabase.from('tailors').select('id, full_name').eq('active', true)
      ]);
      setOrder(o);
      setNotes(o?.notes ?? '');
      setTailorId(o?.tailor_id ?? '');
      setImages(o?.payload?.adminImages ?? []);
      setTailors((t as Tailor[]) ?? []);
      setLoading(false);
    })();
  }, [id]);

  async function sendToTailor() {
    const payload = { ...(order.payload ?? {}), adminImages: images };
    const { error } = await supabase
      .from('orders')
      .update({ status: 'reviewed', notes, tailor_id: tailorId || null, payload })
      .eq('id', id);
    if (error) return toast.error('فشل الإرسال');
    setOrder({ ...order, status: 'reviewed', notes, payload });
    toast.success('تم إرسال الطلبية للخياط ✅');
  }

  async function markDelivered() {
    const { error } = await supabase.from('orders').update({ status: 'delivered' }).eq('id', id);
    if (error) return toast.error('فشل التحديث');
    setOrder({ ...order, status: 'delivered' });
    toast.success('تم تسليم الطلبية 🎉');
  }

  if (loading) return <p className="p-8 text-center text-gray-500">جارٍ التحميل...</p>;
  if (!order) return <p className="p-8 text-center">الطلبية غير موجودة</p>;

  const p = order.payload ?? {};

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-700">
        طلبية #{order.order_number} — {order.customer_name}
      </h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="text-center">
          <div className="font-bold">{fmtDh(Number(order.total))}</div>
          <div className="text-sm text-gray-500">المجموع</div>
        </Card>
        <Card className="text-center">
          <div className="font-bold">{fmtDh(Number(order.deposit))}</div>
          <div className="text-sm text-gray-500">التسبيق</div>
        </Card>
        <Card className="text-center">
          <div className="font-bold">{fmtDh(Number(order.total) - Number(order.deposit))}</div>
          <div className="text-sm text-gray-500">المتبقي</div>
        </Card>
        <Card className="text-center">
          <div className="font-bold">{order.delivery_date ?? '—'}</div>
          <div className="text-sm text-gray-500">موعد التسليم</div>
        </Card>
      </div>

      {order.drawing_url && (
        <Card>
          <h2 className="mb-2 font-bold">📐 رسم الصالون</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.drawing_url} alt="" className="w-full rounded-xl border" />
        </Card>
      )}

      {(p.completedImages ?? []).length > 0 && (
        <Card>
          <h2 className="mb-2 font-bold">📸 صور العمل المكتمل (من الخياط)</h2>
          <div className="flex flex-wrap gap-3">
            {(p.completedImages ?? []).map((u: string) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={u} src={u} alt="" className="h-32 rounded-xl object-cover" />
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-bold">📤 مراجعة وإرسال للخياط</h2>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-600">الخياط المكلف</span>
            <select
              value={tailorId}
              onChange={(e) => setTailorId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
            >
              <option value="">— اختر خياطاً —</option>
              {tailors.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-600">ملاحظات للخياط</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
              placeholder="شكل الخياطة المطلوب، لون الخيط..."
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <ImageUploader bucket="orders" folder={`admin/${order.id}`} onUploaded={(url) => setImages([...images, url])} label="📷 صورة توضيحية" />
            {images.map((u) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={u} src={u} alt="" className="h-20 w-20 rounded-lg object-cover" />
            ))}
          </div>
          {['pending', 'reviewed'].includes(order.status) && (
            <Button className="w-full" onClick={sendToTailor}>📤 إرسال للخياط</Button>
          )}
          {order.status === 'completed' && (
            <Button className="w-full" onClick={markDelivered}>🎁 تم التسليم للزبون</Button>
          )}
        </div>
      </Card>

      <ChatSystem orderId={order.id} senderRole="admin" />
    </div>
  );
}
