'use client';

/**
 * المرحلة 8 — بيانات الزبون
 * ────────────────────────────────────────────────────────────
 * لا تعديل مطلوب في types.ts لهذه المرحلة — كل الحقول المستخدمة
 * (customer, totalOverride, deposit, stageTotals) موجودة أصلاً.
 *
 * ملاحظة تكامل: `onSave` اختياري — اربطه بعملية الحفظ في Supabase
 * (جدول orders) عند الضغط على "إتمام الطلبية". إن لم تمرره، ينتقل
 * الزر مباشرة لمرحلة الفاتورة دون حفظ.
 */

import { useState, type ReactNode } from 'react';
import { OrderDraft, CustomerInfoData } from '@/lib/types';

interface Step08CustomerProps {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
  onBack: () => void;
  onSave?: (draft: OrderDraft) => Promise<void> | void;
}

const PHONE_REGEX = /^(?:\+212|0)([5-7])\d{8}$/;

function sumStageTotals(totals?: OrderDraft['stageTotals']) {
  if (!totals) return 0;
  return (
    (totals.fabric || 0) +
    (totals.seddars || 0) +
    (totals.stitch || 0) +
    (totals.cushions || 0) +
    (totals.decor || 0) +
    (totals.extras || 0)
  );
}

export default function Step08_Customer({ draft, onChange, onNext, onBack, onSave }: Step08CustomerProps) {
  const [form, setForm] = useState<CustomerInfoData>(draft.customer);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = {
    name: form.name.trim().length < 2 ? 'الاسم مطلوب' : null,
    phone: !PHONE_REGEX.test(form.phone.replace(/\s/g, '')) ? 'رقم هاتف غير صحيح (مثال: 0612345678)' : null,
    deliveryDate: !form.deliveryDate ? 'تاريخ التسليم مطلوب' : null,
  };
  const isValid = !errors.name && !errors.phone && !errors.deliveryDate;

  const update = (patch: Partial<CustomerInfoData>) => {
    const next = { ...form, ...patch };
    setForm(next);
    onChange({ customer: next });
  };

  const grandTotal = draft.totalOverride ?? sumStageTotals(draft.stageTotals);
  const deposit = draft.deposit || 0;
  const remaining = grandTotal - deposit;

  const handleComplete = async () => {
    setTouched({ name: true, phone: true, deliveryDate: true });
    if (!isValid) return;
    setError(null);

    if (onSave) {
      try {
        setSaving(true);
        await onSave({ ...draft, customer: form });
      } catch {
        setError('تعذّر حفظ الطلبية — حاول مجدداً');
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    onNext();
  };

  return (
    <div dir="rtl" className="mx-auto flex max-w-2xl flex-col gap-5 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-full p-2 text-[#1B5E3B] transition hover:bg-[#1B5E3B]/10">
          <svg className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div>
          <h2 className="text-lg font-bold text-[#0D1F17]">👤 بيانات الزبون</h2>
          <p className="text-xs text-gray-500">المرحلة 8 من 9</p>
        </div>
      </div>

      {/* Order summary strip */}
      {grandTotal > 0 && (
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#F5F0E8] p-3 text-center">
          <div>
            <p className="text-[11px] text-gray-500">المجموع</p>
            <p className="text-sm font-bold text-[#0D1F17]">{grandTotal.toLocaleString()} DH</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-500">التسبيق</p>
            <p className="text-sm font-bold text-[#1B5E3B]">{deposit.toLocaleString()} DH</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-500">الباقي</p>
            <p className="text-sm font-bold text-[#C9A84C]">{remaining.toLocaleString()} DH</p>
          </div>
        </div>
      )}

      {/* Form card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <Field label="الاسم الكامل" required error={touched.name ? errors.name : null}>
            <input
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              placeholder="مثال: محمد العلوي"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20"
            />
          </Field>

          <Field label="رقم الهاتف" required error={touched.phone ? errors.phone : null}>
            <input
              value={form.phone}
              onChange={(e) => update({ phone: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              placeholder="0612345678"
              inputMode="tel"
              dir="ltr"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20"
            />
          </Field>

          <Field label="تاريخ التسليم المتفق عليه" required error={touched.deliveryDate ? errors.deliveryDate : null}>
            <input
              type="date"
              value={form.deliveryDate}
              onChange={(e) => update({ deliveryDate: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, deliveryDate: true }))}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20"
            />
            <p className="mt-1 text-[11px] text-gray-400">يمكن تعديل هذا التاريخ لاحقاً من واجهة المدير إذا تأخرت الطلبية</p>
          </Field>

          <Field label="ملاحظات">
            <textarea
              value={form.notes}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder="أي تفاصيل إضافية يحتاجها الخياط أو المحل..."
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20"
            />
          </Field>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 border-t border-gray-100 bg-white/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-3">
          <button
            onClick={onBack}
            className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            رجوع
          </button>
          <button
            onClick={handleComplete}
            disabled={saving}
            className="flex-1 rounded-xl bg-[#1B5E3B] py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#164B30] disabled:opacity-60"
          >
            {saving ? 'جاري الحفظ...' : '✅ إتمام الطلبية والانتقال للفاتورة'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-[#0D1F17]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}