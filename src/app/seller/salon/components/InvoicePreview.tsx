'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { OrderDraft } from '@/lib/types';
import { computeTotals, fmtDh, fmtM } from '@/lib/calculations';
import Button from '@/components/ui/Button';

/** نستخدم any لتجاوز فرض Supabase للأنواع الصارمة */
const db = () => supabase as any;

/** رفع ملف إلى Supabase Storage */
async function uploadToBucket(
  bucket: string,
  path: string,
  blob: Blob
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { upsert: true });
  if (error) {
    console.error('Upload error:', error);
    return null;
  }
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data?.path ?? path);
  return urlData?.publicUrl ?? null;
}

/** المرحلة 8: الفاتورة وإتمام الطلبية */
export default function InvoicePreview({
  draft,
  onComplete,
}: {
  draft: OrderDraft;
  onComplete: (orderNumber: number) => void;
}) {
  const [detailed, setDetailed] = useState(true);
  const [saving, setSaving] = useState(false);
  const t = computeTotals(draft);

  async function finish() {
    setSaving(true);
    try {
      let drawing_url: string | null = null;
      const drawingPng = (draft as OrderDraft & { drawingPng?: string }).drawingPng;
      if (drawingPng) {
        const blob = await (await fetch(drawingPng)).blob();
        drawing_url = await uploadToBucket(
          'orders',
          `drawings/${Date.now()}.png`,
          blob
        );
      }

      const { data: cust, error: custError } = await db()
        .from('customers')
        .insert({
          full_name: draft.customer.name,
          phone: draft.customer.phone,
        })
        .select()
        .single();

      if (custError) throw custError;

      const { data: order, error: orderError } = await db()
        .from('orders')
        .insert({
          customer_id: cust?.id ?? null,
          customer_name: draft.customer.name,
          customer_phone: draft.customer.phone,
          fabric_id: draft.fabric?.id ?? null,
          status: 'pending',
          drawing_url,
          total: t.total,
          deposit: draft.deposit,
          delivery_date: draft.customer.deliveryDate || null,
          notes: draft.customer.notes,
          payload: { ...draft, drawingPng: undefined },
        })
        .select()
        .single();

      if (orderError || !order) {
        throw orderError ?? new Error('فشل إنشاء الطلبية');
      }

      toast.success('تم تسجيل الطلبية بنجاح 🎉');
      onComplete(order.order_number);
    } catch (err) {
      console.error(err);
      toast.error('فشل حفظ الطلبية - تأكد من الاتصال وإعداد Supabase');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setDetailed(true)}
          className={`rounded-xl px-4 py-2 font-semibold ${
            detailed ? 'bg-brand-600 text-white' : 'bg-white'
          }`}
        >
          عرض التفاصيل
        </button>
        <button
          onClick={() => setDetailed(false)}
          className={`rounded-xl px-4 py-2 font-semibold ${
            !detailed ? 'bg-brand-600 text-white' : 'bg-white'
          }`}
        >
          بدون تفاصيل
        </button>
      </div>

      <div
        id="invoice-area"
        className="mx-auto max-w-2xl rounded-2xl border bg-white p-8"
      >
        <div className="mb-6 border-b pb-4 text-center">
          <h2 className="text-2xl font-extrabold text-brand-700">
            Salon Marocain
          </h2>
          <p className="text-sm text-gray-500">
            فاتورة — {new Date().toLocaleDateString('fr-MA')}
          </p>
        </div>
        <div className="mb-4 flex justify-between text-sm">
          <div>
            <div>
              <b>الزبون:</b> {draft.customer.name}
            </div>
            <div dir="ltr">
              <b>📱</b> {draft.customer.phone}
            </div>
          </div>
          <div>
            <b>موعد التسليم:</b> {draft.customer.deliveryDate}
          </div>
        </div>

        {detailed && (
          <table className="mb-4 w-full text-sm">
            <thead>
              <tr className="border-b text-right text-gray-500">
                <th className="py-2">العنصر</th>
                <th className="py-2 text-left">الثمن</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">
                  الثوب {draft.fabric?.name} ({fmtM(t.fabricCm)})
                </td>
                <td className="text-left">{fmtDh(t.fabricCost)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">
                  خياطة السدادر ({draft.seddars.length})
                </td>
                <td className="text-left">{fmtDh(t.seddariSewing)}</td>
              </tr>
              {t.formajaCount > 0 && (
                <tr className="border-b">
                  <td className="py-2">فورماجة ×{t.formajaCount}</td>
                  <td className="text-left">{fmtDh(t.formajaCost)}</td>
                </tr>
              )}
              <tr className="border-b">
                <td className="py-2">
                  خياطة المخاد (
                  {(
                    (draft as OrderDraft & { cushions?: { count: number }[] })
                      .cushions ?? []
                  ).reduce((s, c) => s + c.count, 0)} وسادة)
                </td>
                <td className="text-left">{fmtDh(t.cushionsCost)}</td>
              </tr>
              {t.stuffingCost > 0 && (
                <tr className="border-b">
                  <td className="py-2">الحشو (لواط)</td>
                  <td className="text-left">{fmtDh(t.stuffingCost)}</td>
                </tr>
              )}
              {t.decorCost > 0 && (
                <tr className="border-b">
                  <td className="py-2">مخاد الديكور</td>
                  <td className="text-left">{fmtDh(t.decorCost)}</td>
                </tr>
              )}
              {draft.extras.map((e) => (
                <tr key={e.name} className="border-b">
                  <td className="py-2">
                    {e.name} ×{e.qty}
                  </td>
                  <td className="text-left">{fmtDh(e.qty * e.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="space-y-1 rounded-xl bg-brand-50 p-4 text-lg">
          <div className="flex justify-between font-extrabold">
            <span>المجموع الكلي</span>
            <span>{fmtDh(t.total)}</span>
          </div>
          <div className="flex justify-between">
            <span>التسبيق</span>
            <span>{fmtDh(draft.deposit)}</span>
          </div>
          <div className="flex justify-between font-bold text-brand-700">
            <span>المتبقي عند التسليم</span>
            <span>{fmtDh(t.total - draft.deposit)}</span>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-gray-400">
          شكراً لثقتكم 🌹
        </p>
      </div>

      <div className="flex justify-center gap-4">
        <Button variant="secondary" onClick={() => window.print()}>
          🖨️ طباعة / PDF
        </Button>
        <Button onClick={finish} disabled={saving}>
          {saving ? 'جارٍ الحفظ...' : '✅ إتمام الطلبية'}
        </Button>
      </div>
    </div>
  );
}