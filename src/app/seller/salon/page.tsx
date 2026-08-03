'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrder } from '@/features/order-center/context/OrderContext';
import { buildSalonCartItem } from '@/contexts/OrderCartContext';
import { OrderDraft, emptyDraft } from '@/lib/types';

import Step01_Fabric from '@/components/salon/Step01_Fabric';
import Step02_Seddari from '@/components/salon/Step02_Seddari';
import Step03_Stitch from '@/components/salon/Step03_Stitch';
import Step04_Cushions from '@/components/salon/Step04_Cushions';
import Step05_Decor from '@/components/salon/Step05_Decor';
import Step06_Extras from '@/components/salon/Step06_Extras';
import Step07_Summary from '@/components/salon/Step07_Summary';

export default function SalonPage() {
  const router = useRouter();
  const { addToCart } = useOrder();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<OrderDraft>(emptyDraft());

  const updateDraft = (patch: Partial<OrderDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleAddToCart = () => {
    const cartItem = buildSalonCartItem(draft);
    addToCart(cartItem as any);
    setDraft(emptyDraft());
    setStep(1);
    router.push('/seller/order-center');
  };

  return (
    <div className="h-screen bg-[#F5F0E8]">
      {step === 1 && (
        <Step01_Fabric draft={draft} onChange={updateDraft} onNext={() => setStep(2)} />
      )}
      {step === 2 && (
        <Step02_Seddari draft={draft} onChange={updateDraft} onNext={() => setStep(3)} onBack={() => setStep(1)} />
      )}
      {step === 3 && (
        <Step03_Stitch draft={draft} onChange={updateDraft} onNext={() => setStep(4)} onBack={() => setStep(2)} />
      )}
      {step === 4 && (
        <Step04_Cushions draft={draft} onChange={updateDraft} onNext={() => setStep(5)} onBack={() => setStep(3)} />
      )}
      {step === 5 && (
        <Step05_Decor draft={draft} onChange={updateDraft} onNext={() => setStep(6)} onBack={() => setStep(4)} />
      )}
      {step === 6 && (
        <Step06_Extras draft={draft} onChange={updateDraft} onNext={() => setStep(7)} onBack={() => setStep(5)} />
      )}
      {step === 7 && (
        <Step07_Summary
          draft={draft}
          onChange={updateDraft}
          onNext={handleAddToCart}
          onBack={() => setStep(6)}
          adminPin="9999"
          mode="cart"
        />
      )}
    </div>
  );
}