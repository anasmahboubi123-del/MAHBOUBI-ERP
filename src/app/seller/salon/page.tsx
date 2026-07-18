'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { OrderDraft, emptyDraft } from '@/lib/types';
import { computeTotals } from '@/lib/calculations';
import StepWizard from '@/components/ui/StepWizard';
import Button from '@/components/ui/Button';
import FabricSelector from './components/FabricSelector';
import SalonDesigner2D from './components/SalonDesigner2D';
import CushionConfig from './components/CushionConfig';
import DecorCushions from './components/DecorCushions';
import ExtrasSelector from './components/ExtrasSelector';
import PriceSummary from './components/PriceSummary';
import CustomerInfo from './components/CustomerInfo';
import InvoicePreview from './components/InvoicePreview';

const STEPS = ['اختيار الثوب', 'تصميم الصالون', 'المخاد', 'مخاد الديكور', 'الإضافات', 'ملخص الأسعار', 'معلومات الزبون', 'الفاتورة'];
const STORAGE_KEY = 'salon_draft_v1';

export default function SalonWizard() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OrderDraft>(emptyDraft());
  const [done, setDone] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // حفظ تلقائي للمسودة
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setDraft({ ...emptyDraft(), ...JSON.parse(saved) });
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft, hydrated]);

  const patch = (p: Partial<OrderDraft>) => setDraft((d) => ({ ...d, ...p }));

  function canNext(): boolean {
    const t = computeTotals(draft);
    switch (step) {
      case 0: return !!draft.fabric;
      case 1: return draft.seddars.length > 0;
      case 5: return draft.deposit >= t.minDeposit;
      case 6: return !!draft.customer.name && !!draft.customer.phone && !!draft.customer.deliveryDate;
      default: return true;
    }
  }

  function next() {
    if (!canNext()) {
      const msgs: Record<number, string> = {
        0: 'اختر ثوباً أولاً',
        1: 'أضف سدارياً واحداً على الأقل',
        5: 'التسبيق يجب أن يكون 30% على الأقل',
        6: 'أكمل معلومات الزبون'
      };
      return toast.error(msgs[step] ?? 'أكمل هذه المرحلة أولاً');
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    setDraft(emptyDraft());
    setDone(null);
    setStep(0);
  }

  if (!hydrated) return null;

  // شاشة التهنئة ✨
  if (done !== null)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-7xl">✨🎉</div>
        <h1 className="text-3xl font-extrabold text-brand-700">تمت الطلبية بنجاح!</h1>
        <p className="text-xl">رقم الطلبية: <b>#{done}</b></p>
        <p className="text-gray-500">تم إرسال رسالة شكر للزبون وإضافة موعد التسليم للتقويم</p>
        <Button onClick={reset}>🛒 طلبية جديدة</Button>
      </div>
    );

  return (
    <StepWizard
      steps={STEPS}
      current={step}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={next}
      nextLabel={step === STEPS.length - 1 ? 'مراجعة أعلاه ⬆️' : 'التالي ←'}
      nextDisabled={step === STEPS.length - 1}
    >
      {step === 0 && <FabricSelector selected={draft.fabric} onSelect={(fabric) => patch({ fabric })} />}
      {step === 1 && <SalonDesigner2D seddars={draft.seddars} onChange={(seddars) => patch({ seddars })} onDrawing={(drawingPng) => patch({ drawingPng })} />}
      {step === 2 && <CushionConfig seddars={draft.seddars} cushions={draft.cushions} onChange={(cushions) => patch({ cushions })} />}
      {step === 3 && <DecorCushions decor={draft.decorCushions} onChange={(decorCushions) => patch({ decorCushions })} />}
      {step === 4 && <ExtrasSelector extras={draft.extras} onChange={(extras) => patch({ extras })} />}
      {step === 5 && <PriceSummary draft={draft} onPatch={patch} />}
      {step === 6 && <CustomerInfo customer={draft.customer} onChange={(customer) => patch({ customer })} />}
      {step === 7 && <InvoicePreview draft={draft} onComplete={setDone} />}
    </StepWizard>
  );
}
