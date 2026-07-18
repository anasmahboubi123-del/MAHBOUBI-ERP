'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { sendWhatsAppReady } from '@/lib/makecom';
import { seddariFabricCm, fmtM } from '@/lib/calculations';
import { Seddari } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ImageUploader from '@/components/ui/ImageUploader';
import ChatSystem from '@/components/chat/ChatSystem';

const junctionLabels: Record<string, string> = {
  formaja: '🔺 فورماجة',
  insert: '↪️ دخول سداري في الآخر',
  wooden_box: '⬜ صندوق خشبي',
  none: 'بدون'
};

/** تفاصيل الطلبية للخياط - جميع التفاصيل التقنية بدون أي أثمنة */
export default function TailorOrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('orders').select('*').eq('id', id).single();
      setOrder(data);
      setPhotos(data?.payload?.completedImages ?? []);
      setLoading(false);
    })();
  }, [id]);

  async function setStatus(status: string, extra: Record<string, any> = {}) {
    const { error } = await supabase.from('orders').update({ status, ...extra }).eq('id', id);
    if (error) return toast.error('فشل التحديث');
    setOrder({ ...order, status, ...extra });
    return true;
  }

  async function complete() {
    if (photos.length === 0) return toast.error('التقط صورة واحدة على الأقل للعمل المكتمل');
    const payload = { ...(order.payload ?? {}), completedImages: photos };
    if (await setStatus('completed', { payload })) {
      toast.success('أحسنت! تم إتمام الطلبية 🎉');
      if (order.customer_phone) {
        sendWhatsAppReady(order.customer_name ?? '', order.customer_phone, order.order_number);
      }
      router.push('/tailor');
    }
  }

  if (loading) return <p className="p-8 text-center text-gray-500">جارٍ التحميل...</p>;
  if (!order) return <p className="p-8 text-center">الطلبية غير موجودة</p>;

  const p = order.payload ?? {};
  const seddars: Seddari[] = p.seddars ?? [];
  const fabric = p.fabric;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-700">
          طلبية #{order.order_number} — {order.customer_name}
        </h1>
        <div className="text-sm text-gray-500">التسليم: {order.delivery_date ?? '—'}</div>
      </div>

      {order.drawing_url && (
        <Card>
          <h2 className="mb-2 font-bold">📐 رسم الصالون</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.drawing_url} alt="رسم الصالون" className="w-full rounded-xl border" />
        </Card>
      )}

      {fabric && (
        <Card>
          <h2 className="mb-2 font-bold">🧵 الثوب</h2>
          <div className="flex items-center gap-4">
            {fabric.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fabric.image_url} alt={fabric.name} className="h-24 w-24 rounded-xl object-cover" />
            )}
            <div>
              <div className="text-lg font-bold">{fabric.name}</div>
              {fabric.color && <div className="text-gray-500">اللون: {fabric.color}</div>}
            </div>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-bold">✂️ السدادر وتفاصيل القص</h2>
        {seddars.length === 0 && <p className="text-gray-400">لا توجد تفاصيل سدادر</p>}
        <div className="space-y-3">
          {seddars.map((s, i) => (
            <div key={s.id ?? i} className="rounded-xl bg-gray-50 p-3">
              <div className="font-bold">سداري {i + 1}</div>
              <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                <span>📏 الطول: {s.length} cm</span>
                <span>العرض: {s.width} cm</span>
                <span>الارتفاع: {s.height} cm</span>
                <span className="font-bold text-brand-700">الثوب: {fmtM(seddariFabricCm(s))}</span>
              </div>
              <div className="mt-1 text-sm">الربط: {junctionLabels[s.junction] ?? s.junction}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-bold">🛏️ المخاد</h2>
        {(p.cushions ?? []).map((c: any, i: number) => (
          <div key={i} className="flex flex-wrap gap-3 border-b py-2 text-sm">
            <span>سداري {i + 1}:</span>
            <span className="font-bold">{c.count} وسادة</span>
            <span>الحجم: {c.size} cm</span>
            <span>{c.stuffing ? '✅ مع حشو (لواط)' : 'بدون حشو'}</span>
          </div>
        ))}
        {(p.decorCushions ?? []).length > 0 && (
          <>
            <h3 className="mt-3 font-semibold">🎀 مخاد الديكور</h3>
            {(p.decorCushions ?? []).map((d: any, i: number) => (
              <div key={i} className="flex gap-3 py-1 text-sm">
                <span className="font-bold">{d.count} ×</span>
                <span>{d.shape || 'شكل عادي'}</span>
              </div>
            ))}
          </>
        )}
      </Card>

      {(p.adminImages ?? []).length > 0 && (
        <Card>
          <h2 className="mb-2 font-bold">📸 صور توضيحية من المدير</h2>
          <div className="flex flex-wrap gap-3">
            {(p.adminImages ?? []).map((u: string) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={u} src={u} alt="" className="h-32 rounded-xl object-cover" />
            ))}
          </div>
        </Card>
      )}

      {order.notes && (
        <Card>
          <h2 className="mb-2 font-bold">📝 ملاحظات المدير</h2>
          <p className="whitespace-pre-wrap">{order.notes}</p>
        </Card>
      )}

      {order.status === 'reviewed' && (
        <Button className="w-full" onClick={() => setStatus('in_progress') && toast.success('بالتوفيق! 💪')}>
          ▶️ بدأت العمل
        </Button>
      )}

      {order.status === 'in_progress' && (
        <Card>
          <h2 className="mb-3 font-bold">✅ إتمام العمل</h2>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <ImageUploader bucket="orders" folder={`completed/${order.id}`} onUploaded={(url) => setPhotos([...photos, url])} label="📷 صورة للعمل المكتمل" />
            {photos.map((u) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={u} src={u} alt="" className="h-20 w-20 rounded-lg object-cover" />
            ))}
          </div>
          <Button className="w-full" onClick={complete}>🎉 أكملت العمل</Button>
        </Card>
      )}

      <ChatSystem orderId={order.id} senderRole="tailor" />
    </div>
  );
}
