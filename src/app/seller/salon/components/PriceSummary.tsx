'use client';
import { useState } from 'react';
import { OrderDraft } from '@/lib/types';
import { computeTotals, fmtDh, fmtM } from '@/lib/calculations';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import PinLock from '@/components/ui/PinLock';

/** المرحلة 6: ملخص الأسعار والتسبيق */
export default function PriceSummary({
  draft,
  onPatch
}: {
  draft: OrderDraft;
  onPatch: (p: Partial<OrderDraft>) => void;
}) {
  const t = computeTotals(draft);
  const [editOpen, setEditOpen] = useState(false);
  const [adminOk, setAdminOk] = useState(false);
  const [override, setOverride] = useState('');

  const rows = [
    { label: `🧵 الثوب (${fmtM(t.fabricCm)})`, value: t.fabricCost },
    { label: `✂️ خياطة السدادر (${draft.seddars.length})`, value: t.seddariSewing },
    { label: `🔺 الفورماجات (${t.formajaCount})`, value: t.formajaCost },
    { label: '🛏️ خياطة المخاد', value: t.cushionsCost },
    { label: '☁️ الحشو (لواط)', value: t.stuffingCost },
    { label: '🎀 مخاد الديكور', value: t.decorCost },
    { label: '➕ الإضافات', value: t.extrasCost }
  ];

  return (
    <div className="space-y-4">
      <Card>
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between border-b py-2 last:border-0">
            <span>{r.label}</span>
            <span className="font-semibold">{fmtDh(r.value)}</span>
          </div>
        ))}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-brand-100 p-4">
          <span className="text-xl font-bold">المجموع الكلي</span>
          <span className="flex items-center gap-2 text-2xl font-extrabold text-brand-700">
            {fmtDh(t.total)}
            <button onClick={() => { setOverride(String(t.total)); setEditOpen(true); }} title="تعديل (كود المدير)">✏️</button>
          </span>
        </div>
        {draft.totalOverride !== null && (
          <p className="mt-1 text-sm text-amber-600">⚠️ المجموع مُعدّل يدوياً <button className="underline" onClick={() => onPatch({ totalOverride: null })}>إلغاء</button></p>
        )}
      </Card>

      <Card>
        <h3 className="mb-2 font-bold">💵 التسبيق</h3>
        <p className="mb-2 text-sm text-gray-500">الحد الأدنى 30% = <b>{fmtDh(t.minDeposit)}</b></p>
        <Input
          type="number"
          dir="ltr"
          value={draft.deposit || ''}
          onChange={(e) => onPatch({ deposit: Number(e.target.value) })}
          placeholder="مبلغ التسبيق (DH)"
        />
        {draft.deposit > 0 && draft.deposit < t.minDeposit && (
          <p className="mt-2 font-semibold text-red-600">⚠️ التسبيق أقل من الحد الأدنى (30%)</p>
        )}
        {draft.deposit >= t.minDeposit && (
          <p className="mt-2 text-green-600">✅ المتبقي عند التسليم: <b>{fmtDh(t.total - draft.deposit)}</b></p>
        )}
      </Card>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="تعديل المجموع الكلي">
        {!adminOk && <PinLock role="admin" onSuccess={() => setAdminOk(true)} onCancel={() => setEditOpen(false)} />}
        {adminOk && (
          <div className="space-y-4">
            <Input label="المجموع الجديد (DH)" type="number" dir="ltr" value={override} onChange={(e) => setOverride(e.target.value)} />
            <Button className="w-full" onClick={() => { onPatch({ totalOverride: Number(override) }); setEditOpen(false); }}>💾 حفظ</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
