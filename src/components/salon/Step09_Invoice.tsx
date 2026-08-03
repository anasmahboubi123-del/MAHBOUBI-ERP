'use client';

/**
 * المرحلة 9 — الفاتورة A4
 * ────────────────────────────────────────────────────────────
 * تحديث مطلوب في types.ts — أضف حقل واحد فقط في OrderDraft:
 *
 *   discount?: number;   // تخفيض خاص يُطبَّق في هذه المرحلة فقط
 *
 * وفي emptyDraft():  discount: 0,
 *
 * ملاحظات تكامل:
 * - `shopInfo` و `adminPin` قابلان للتمرير من useSettings() الذي بنيته
 *   مسبقاً (بدل القيم الافتراضية هنا). القيمة الافتراضية لـ adminPin
 *   هي '9999' فقط كحل احتياطي — اربطها بـ settings.pin_admin الحقيقي.
 * - هذا الملف يبني الفاتورة داخلياً (لا يعتمد على InvoiceA4.tsx القديم)
 *   حتى يبقى مستقلاً وقابلاً للتشغيل فوراً. إن كنت تفضل استخدام تصميم
 *   InvoiceA4.tsx/InvoiceTemplate.tsx الحاليين حرفياً، أرسل لي محتواهما
 *   وأدمج هذا المنطق (الأزرار + الحساب + PIN) داخلهما بدل هذا العرض.
 * - "إظهار/إخفاء مرحلة" هنا مجمّعة في 5 مجموعات (الثوب+السدادر معاً،
 *   الخياطة، المخاد، مخاد الديكور، الإضافات) بدل 6 مراحل منفصلة، لأن
 *   الثوب والسدادر يعبّران عن نفس تكلفة القماش. إخفاء مجموعة يخفي
 *   سطرها من الجدول فقط — لا يغيّر المجموع الكلي المطبوع أسفل الفاتورة.
 */

import { useMemo, useState } from 'react';
import { OrderDraft } from '@/lib/types';

/* ────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────── */
interface ShopInfo {
  name: string;
  addressLine?: string;
  phone?: string;
  logoUrl?: string;
  email?: string;
  instagram?: string;
  tiktok?: string;
}

interface Step09InvoiceProps {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onBack: () => void;
  /** يُستدعى بعد الطباعة أو الإرسال — مثلاً لبدء طلبية جديدة. اختياري. */
  onFinish?: () => void;
  shopInfo?: ShopInfo;
  adminPin?: string;
  terms?: string;
}

type Group = 'fabric' | 'stitch' | 'cushions' | 'decor' | 'extras';

interface InvoiceLine {
  id: string;
  group: Group;
  label: string;
  qtyLabel?: string;
  total: number;
}

const GROUP_LABELS: Record<Group, string> = {
  fabric: 'الثوب والسدادر',
  stitch: 'خياطة السدادر',
  cushions: 'المخاد',
  decor: 'مخاد الديكور',
  extras: 'الإضافات',
};

const DEFAULT_SHOP: ShopInfo = { name: 'اسم المحل' };

/* ────────────────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────────────────── */
function sumStageTotals(t?: OrderDraft['stageTotals']) {
  if (!t) return 0;
  return (t.fabric || 0) + (t.seddars || 0) + (t.stitch || 0) + (t.cushions || 0) + (t.decor || 0) + (t.extras || 0);
}

function buildInvoiceLines(draft: OrderDraft): InvoiceLine[] {
  const lines: InvoiceLine[] = [];
  const t = draft.stageTotals;

  const fabricTotal = (t?.fabric || 0) + (t?.seddars || 0);
  if (fabricTotal > 0) {
    const meters = draft.fabric?.price_per_meter ? fabricTotal / draft.fabric.price_per_meter : null;
    lines.push({
      id: 'fabric',
      group: 'fabric',
      label: draft.fabric ? `الثوب — ${draft.fabric.name}` : 'الثوب',
      qtyLabel: meters ? `${meters.toFixed(1)} م` : undefined,
      total: fabricTotal,
    });
  }

  if (t?.stitch) {
    lines.push({
      id: 'stitch',
      group: 'stitch',
      label: 'خياطة السدادر',
      qtyLabel: draft.sedariStitches?.length ? `${draft.sedariStitches.length} قطعة` : undefined,
      total: t.stitch,
    });
  }

  if (t?.cushions) {
    const count = draft.cushions.reduce((s, c) => s + (c.count || 0), 0);
    lines.push({ id: 'cushions', group: 'cushions', label: 'المخاد', qtyLabel: count ? `${count} وحدة` : undefined, total: t.cushions });
  }

  if (t?.decor) {
    const count = draft.decorCushions.reduce((s, d) => s + (d.count || 0), 0);
    lines.push({ id: 'decor', group: 'decor', label: 'مخاد الديكور', qtyLabel: count ? `${count} وحدة` : undefined, total: t.decor });
  }

  draft.extras.forEach((ex, i) => {
    lines.push({
      id: `extra-${i}`,
      group: 'extras',
      label: ex.name,
      qtyLabel: ex.qty > 1 ? `${ex.qty} × ${ex.price} DH` : undefined,
      total: ex.price * ex.qty,
    });
  });

  return lines;
}

function buildWhatsappUrl(phone: string, text: string) {
  const digits = phone.replace(/\D/g, '');
  const withCountry = digits.startsWith('212') ? digits : digits.replace(/^0/, '212');
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`;
}

/* ────────────────────────────────────────────────────────────
   Component
──────────────────────────────────────────────────────────── */
export default function Step09_Invoice({
  draft,
  onChange,
  onBack,
  onFinish,
  shopInfo = DEFAULT_SHOP,
  adminPin = '9999',
  terms = 'التسبيق بنسبة 30% منصوح به وغير إلزامي، لكن لا يبدأ العمل في الطلبية دون تسبيق. يُحدَّد أجل التسليم باتفاق الطرفين.',
}: Step09InvoiceProps) {
  const [viewMode, setViewMode] = useState<'detailed' | 'summary'>('detailed');
  const [showDrawing, setShowDrawing] = useState(true);
  const [hiddenGroups, setHiddenGroups] = useState<Set<Group>>(new Set());
  const [pinTarget, setPinTarget] = useState<'discount' | 'total' | null>(null);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState(false);

  const lines = useMemo(() => buildInvoiceLines(draft), [draft]);
  const baseTotal = draft.totalOverride ?? sumStageTotals(draft.stageTotals);
  const discount = draft.discount || 0;
  const finalTotal = Math.max(0, baseTotal - discount);
  const deposit = draft.deposit || 0;
  const remaining = finalTotal - deposit;
  const minDeposit = Math.round(finalTotal * 0.3);

  const toggleGroup = (g: Group) => {
    setHiddenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  };

  const openPin = (target: 'discount' | 'total') => {
    setPinTarget(target);
    setPinValue('');
    setPinError(false);
  };

  const confirmPin = () => {
    if (pinValue !== adminPin) setPinError(true);
  };

  const verified = pinTarget !== null && pinValue === adminPin;

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const handleWhatsapp = () => {
    const msg = [
      `فاتورة طلبية — ${shopInfo.name}`,
      `الزبون: ${draft.customer.name}`,
      `المجموع: ${finalTotal.toLocaleString()} DH`,
      `التسبيق: ${deposit.toLocaleString()} DH`,
      `الباقي: ${remaining.toLocaleString()} DH`,
      `تاريخ التسليم: ${draft.customer.deliveryDate || '—'}`,
    ].join('\n');
    window.open(buildWhatsappUrl(draft.customer.phone, msg), '_blank');
  };

  return (
    <div dir="rtl" className="mx-auto flex max-w-3xl flex-col gap-5 pb-10">
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          .no-print { display: none !important; }
          .invoice-page { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      {/* Header (screen only) */}
      <div className="no-print flex items-center gap-3">
        <button onClick={onBack} className="rounded-full p-2 text-[#1B5E3B] transition hover:bg-[#1B5E3B]/10">
          <svg className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div>
          <h2 className="text-lg font-bold text-[#0D1F17]">🧾 الفاتورة</h2>
          <p className="text-xs text-gray-500">المرحلة 9 من 9</p>
        </div>
      </div>

      {/* Controls (screen only) */}
      <div className="no-print flex flex-wrap items-center gap-2 rounded-xl bg-[#F5F0E8] p-3">
        <ToggleChip active={viewMode === 'detailed'} onClick={() => setViewMode('detailed')} label="تفصيلي" />
        <ToggleChip active={viewMode === 'summary'} onClick={() => setViewMode('summary')} label="مجموع فقط" />
        <span className="mx-1 h-5 w-px bg-gray-300" />
        <ToggleChip active={showDrawing} onClick={() => setShowDrawing((v) => !v)} label="🖼️ الرسم 2D" />

        {viewMode === 'detailed' && (
          <>
            <span className="mx-1 h-5 w-px bg-gray-300" />
            {(Object.keys(GROUP_LABELS) as Group[]).map((g) => (
              <label key={g} className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600">
                <input type="checkbox" checked={!hiddenGroups.has(g)} onChange={() => toggleGroup(g)} className="accent-[#1B5E3B]" />
                {GROUP_LABELS[g]}
              </label>
            ))}
          </>
        )}
      </div>

      {/* Printable page */}
      <div className="invoice-page rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        {/* Shop header */}
        <div className="mb-6 flex items-start justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            {shopInfo.logoUrl && <img src={shopInfo.logoUrl} alt={shopInfo.name} className="h-14 w-14 object-contain" />}
            <div>
              <p className="text-lg font-extrabold text-[#0D1F17]">{shopInfo.name}</p>
              {shopInfo.addressLine && <p className="text-xs text-gray-500">{shopInfo.addressLine}</p>}
              {shopInfo.phone && (
                <p className="text-xs text-gray-500" dir="ltr">
                  {shopInfo.phone}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black tracking-wide text-[#C9A84C]">FACTURE</p>
            <p className="text-xs text-gray-400">{new Date().toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        {/* Customer */}
        <div className="mb-6 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-400">الزبون</p>
            <p className="font-semibold text-[#0D1F17]">{draft.customer.name || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400">الهاتف</p>
            <p className="font-semibold text-[#0D1F17]" dir="ltr">
              {draft.customer.phone || '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-400">تاريخ التسليم</p>
            <p className="font-semibold text-[#0D1F17]">{draft.customer.deliveryDate || '—'}</p>
          </div>
          {draft.customer.notes && (
            <div className="col-span-2">
              <p className="text-gray-400">ملاحظات</p>
              <p className="text-[#0D1F17]">{draft.customer.notes}</p>
            </div>
          )}
        </div>

        {/* 2D drawing */}
        {showDrawing && draft.drawingPng && (
          <div className="mb-6 flex justify-center rounded-xl bg-[#F5F0E8] p-4">
            <img src={draft.drawingPng} alt="مخطط الصالون" className="max-h-56 object-contain" />
          </div>
        )}

        {/* Lines */}
        {viewMode === 'detailed' ? (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-[#0D1F17]/10 text-gray-500">
                <th className="py-2 text-right font-medium">الوصف</th>
                <th className="py-2 text-right font-medium">الكمية</th>
                <th className="py-2 text-left font-medium">الثمن</th>
              </tr>
            </thead>
            <tbody>
              {lines
                .filter((l) => !hiddenGroups.has(l.group))
                .map((l) => (
                  <tr key={l.id} className="border-b border-gray-50">
                    <td className="py-2 text-[#0D1F17]">{l.label}</td>
                    <td className="py-2 text-gray-500">{l.qtyLabel || '—'}</td>
                    <td className="py-2 text-left font-medium text-[#0D1F17]">{l.total.toLocaleString()} DH</td>
                  </tr>
                ))}
              {lines.filter((l) => !hiddenGroups.has(l.group)).length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-400">
                    لا توجد عناصر ظاهرة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-[#0D1F17]/10 text-gray-500">
                <th className="py-2 text-right font-medium">الوصف</th>
                <th className="py-2 text-left font-medium">الثمن</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50">
                <td className="py-2 text-[#0D1F17]">خدمة صالون كاملة</td>
                <td className="py-2 text-left font-medium text-[#0D1F17]">{baseTotal.toLocaleString()} DH</td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Totals */}
        <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>المجموع الفرعي</span>
            <span>{baseTotal.toLocaleString()} DH</span>
          </div>

          <div className="flex items-center justify-between text-gray-500">
            <span className="flex items-center gap-1.5">
              تخفيض خاص
              <button onClick={() => openPin('discount')} className="no-print text-[#C9A84C] hover:underline">
                ✏️
              </button>
            </span>
            <span>− {discount.toLocaleString()} DH</span>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-1.5 text-base font-bold text-[#0D1F17]">
            <span className="flex items-center gap-1.5">
              المجموع الكلي
              <button onClick={() => openPin('total')} className="no-print text-xs font-normal text-[#C9A84C] hover:underline">
                ✏️
              </button>
            </span>
            <span>{finalTotal.toLocaleString()} DH</span>
          </div>

          <div className="flex justify-between text-[#1B5E3B]">
            <span>التسبيق (ينصح بـ 30% = {minDeposit.toLocaleString()} DH)</span>
            <span>{deposit.toLocaleString()} DH</span>
          </div>

          <div className="flex justify-between text-base font-bold text-[#C9A84C]">
            <span>الباقي</span>
            <span>{remaining.toLocaleString()} DH</span>
          </div>
        </div>

        {/* Terms */}
        <p className="mt-6 border-t border-gray-100 pt-3 text-[11px] leading-relaxed text-gray-400">{terms}</p>

        {/* Contact footer */}
        {(shopInfo.email || shopInfo.instagram || shopInfo.tiktok) && (
          <div className="mt-3 flex gap-4 text-[11px] text-gray-400">
            {shopInfo.email && <span>{shopInfo.email}</span>}
            {shopInfo.instagram && <span>@{shopInfo.instagram}</span>}
            {shopInfo.tiktok && <span>{shopInfo.tiktok}</span>}
          </div>
        )}
      </div>

      {/* Action buttons (screen only) */}
      <div className="no-print flex gap-3">
        <button onClick={onBack} className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
          رجوع
        </button>
        <button onClick={handlePrint} className="flex-1 rounded-xl bg-[#0D1F17] py-3 text-sm font-bold text-white transition hover:bg-black">
          🖨️ طباعة
        </button>
        <button
          onClick={handleWhatsapp}
          disabled={!draft.customer.phone}
          className="flex-1 rounded-xl bg-[#1B5E3B] py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#164B30] disabled:opacity-50"
        >
          📤 إرسال واتساب
        </button>
      </div>

      {onFinish && (
        <button onClick={onFinish} className="no-print text-center text-xs text-gray-400 underline hover:text-[#1B5E3B]">
          إنهاء وبدء طلبية جديدة
        </button>
      )}

      {/* PIN modal */}
      {pinTarget && !verified && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setPinTarget(null)}>
          <div className="mx-4 w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-center text-sm font-bold text-[#0D1F17]">أدخل كود المدير</p>
            <input
              type="password"
              inputMode="numeric"
              value={pinValue}
              onChange={(e) => {
                setPinValue(e.target.value);
                setPinError(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && confirmPin()}
              className={`w-full rounded-xl border px-4 py-2.5 text-center text-lg tracking-widest ${pinError ? 'border-red-400' : 'border-gray-200'}`}
              autoFocus
            />
            {pinError && <p className="mt-1.5 text-center text-xs text-red-500">كود خاطئ</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={() => setPinTarget(null)} className="flex-1 rounded-xl border border-gray-200 py-2 text-sm text-gray-600">
                إلغاء
              </button>
              <button onClick={confirmPin} className="flex-1 rounded-xl bg-[#1B5E3B] py-2 text-sm font-bold text-white">
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editors revealed once PIN verified */}
      {verified && pinTarget === 'discount' && (
        <InlineEditor
          label="تخفيض خاص (DH)"
          value={discount}
          onSave={(v) => {
            onChange({ discount: v });
            setPinTarget(null);
          }}
          onClose={() => setPinTarget(null)}
        />
      )}
      {verified && pinTarget === 'total' && (
        <InlineEditor
          label="المجموع الكلي (DH)"
          value={baseTotal}
          onSave={(v) => {
            onChange({ totalOverride: v });
            setPinTarget(null);
          }}
          onClose={() => setPinTarget(null)}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Small UI helpers
──────────────────────────────────────────────────────────── */
function ToggleChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active ? 'bg-[#1B5E3B] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}

function InlineEditor({
  label,
  value,
  onSave,
  onClose,
}: {
  label: string;
  value: number;
  onSave: (v: number) => void;
  onClose: () => void;
}) {
  const [v, setV] = useState(value);
  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="mb-3 text-sm font-bold text-[#0D1F17]">{label}</p>
        <input
          type="number"
          value={v}
          onChange={(e) => setV(Number(e.target.value))}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-center text-lg"
          autoFocus
        />
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2 text-sm text-gray-600">
            إلغاء
          </button>
          <button onClick={() => onSave(v)} className="flex-1 rounded-xl bg-[#1B5E3B] py-2 text-sm font-bold text-white">
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}