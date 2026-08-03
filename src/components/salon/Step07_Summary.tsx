'use client';

import { useState } from 'react';
import { OrderDraft } from '@/lib/types';
import { calcSeddariFabricLength, roundCushions } from '@/contexts/OrderCartContext';

interface Step07_SummaryProps {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
  onBack: () => void;
  adminPin: string;
  mode?: 'flow' | 'cart';
}

export default function Step07_Summary({
  draft,
  onChange,
  onNext,
  onBack,
  adminPin,
  mode = 'flow',
}: Step07_SummaryProps) {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pendingAction, setPendingAction] = useState<'next' | 'editTotal' | null>(null);

  // ─── Fabric calculation (sum across all seddars) ───
  const fabricLengthCm = draft.seddars.reduce((total, s) => {
    if (s.length && s.height) {
      return total + calcSeddariFabricLength(s.length, s.height);
    }
    return total;
  }, 0);
  const fabricLengthM = fabricLengthCm / 100;
  const fabricCost = (draft.fabric?.price_per_meter || 0) * fabricLengthM;

  // ─── Stitch (cart-mode simplified) ───
  const laborCost = draft.stitchConfig?.price || 0;

  // ─── Cushions (cart-mode simplified) ───
  const cushionsCount = draft.cushionsConfig?.totalCm
    ? roundCushions(draft.cushionsConfig.totalCm)
    : (draft.cushionsConfig?.count || 0);
  const cushionsCost = cushionsCount * (draft.cushionsConfig?.unitPrice || 0);

  // ─── Decor (cart-mode simplified) ───
  const decorCost = draft.decorConfig?.price || 0;

  // ─── Extras ───
  const extrasCost = (draft.extras || []).reduce((s, ex) => s + (ex.price || 0), 0);

  // ─── Formage ───
  const formageCorners = draft.formage?.corners || 0;
  const formageCost = formageCorners * (draft.formage?.pricePerCorner || 0);

  // ─── Total ───
  const calculatedTotal =
    fabricCost + laborCost + cushionsCost + decorCost + extrasCost + formageCost;
  const displayTotal = draft.manualTotal ?? calculatedTotal;
  const isManual =
    draft.manualTotal !== undefined && draft.manualTotal !== calculatedTotal;

  // ─── PIN Guard ───
  const requestPin = (action: 'next' | 'editTotal') => {
    setPendingAction(action);
    setShowPinModal(true);
    setPinInput('');
  };

  const verifyPin = () => {
    if (pinInput !== adminPin) {
      alert('كود المدير غير صحيح');
      return;
    }
    setShowPinModal(false);
    if (pendingAction === 'editTotal') {
      const newTotal = prompt('أدخل المجموع الجديد:');
      if (newTotal && !isNaN(Number(newTotal))) {
        onChange({ manualTotal: Number(newTotal) });
      }
    } else if (pendingAction === 'next') {
      onNext();
    }
    setPendingAction(null);
  };

  // ─── Render ───
  return (
    <div className="flex flex-col h-full p-6">
      <h2 className="text-2xl font-bold text-[#4A3F35] mb-6">
        {mode === 'cart' ? '🛒 ملخص المنتج' : '📋 ملخص الطلب'}
      </h2>

      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Fabric */}
        <SummaryRow label="القماش" value={draft.fabric?.name || '—'} />
        <SummaryRow
          label="طول القماش المطلوب"
          value={`${fabricLengthCm.toFixed(0)} سم (${fabricLengthM.toFixed(2)} م)`}
        />
        <SummaryRow label="ثمن القماش" value={`${fabricCost.toFixed(2)} درهم`} />

        {/* Seddari */}
        {draft.seddars.length > 0 && (
          <SummaryRow
            label="السداري"
            value={draft.seddars
              .map((s) => `${s.length}×${s.width} سم — ارتفاع ${s.height} سم`)
              .join(' | ')}
          />
        )}

        {/* Stitch */}
        <SummaryRow label="نوع الخياطة" value={draft.stitchConfig?.type || '—'} />
        <SummaryRow label="أجرة الخياطة" value={`${laborCost.toFixed(2)} درهم`} />

        {/* Cushions */}
        {cushionsCount > 0 && (
          <>
            <SummaryRow label="المخدات" value={`${cushionsCount} مخدة`} />
            <SummaryRow label="ثمن المخدات" value={`${cushionsCost.toFixed(2)} درهم`} />
          </>
        )}

        {/* Decor */}
        {decorCost > 0 && <SummaryRow label="الديكور" value={`${decorCost.toFixed(2)} درهم`} />}

        {/* Extras */}
        {(draft.extras || []).map((ex, i) => (
          <SummaryRow key={i} label={ex.name} value={`${ex.price.toFixed(2)} درهم`} />
        ))}

        {/* Formage */}
        {formageCorners > 0 && (
          <>
            <SummaryRow label="الفورماج" value={`${formageCorners} زاوية`} />
            <SummaryRow label="ثمن الفورماج" value={`${formageCost.toFixed(2)} درهم`} />
          </>
        )}

        {/* Divider */}
        <div className="border-t border-[#D4C5B0] my-4" />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-[#4A3F35]">المجموع المحسوب:</span>
          <span className="text-lg text-[#8B7355]">{calculatedTotal.toFixed(2)} درهم</span>
        </div>

        {isManual && (
          <div className="flex justify-between items-center text-amber-700">
            <span className="font-bold">المجموع المعدّل:</span>
            <span>{displayTotal.toFixed(2)} درهم</span>
          </div>
        )}

        <div className="flex justify-between items-center text-2xl font-bold text-[#4A3F35]">
          <span>الإجمالي:</span>
          <span>{displayTotal.toFixed(2)} درهم</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mt-6 pt-4 border-t border-[#D4C5B0]">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl bg-[#E8E0D5] text-[#4A3F35] font-semibold hover:bg-[#DDD5CA] transition"
        >
          رجوع
        </button>

        <button
          onClick={() => requestPin('editTotal')}
          className="px-4 py-3 rounded-xl bg-amber-100 text-amber-800 font-semibold hover:bg-amber-200 transition"
        >
          تعديل المجموع
        </button>

        <button
          onClick={() => {
            if (mode === 'cart') {
              onNext();
            } else {
              requestPin('next');
            }
          }}
          className="flex-1 py-3 rounded-xl bg-[#4A3F35] text-white font-semibold hover:bg-[#3A2F25] transition"
        >
          {mode === 'cart' ? '🛒 أضف للسلة' : 'التالي ➜'}
        </button>
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80">
            <h3 className="text-lg font-bold text-[#4A3F35] mb-4">تأكيد كود المدير</h3>
            <input
              type="password"
              inputMode="numeric"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full p-3 border border-[#D4C5B0] rounded-xl text-center text-xl tracking-widest"
              placeholder="••••"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowPinModal(false)}
                className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700"
              >
                إلغاء
              </button>
              <button
                onClick={verifyPin}
                className="flex-1 py-2 rounded-xl bg-[#4A3F35] text-white"
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-[#8B7355]">{label}</span>
      <span className="font-medium text-[#4A3F35]">{value}</span>
    </div>
  );
}