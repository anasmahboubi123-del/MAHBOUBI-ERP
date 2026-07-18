'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PinLock from '@/components/ui/PinLock';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOk(sessionStorage.getItem('auth_seller') === '1');
    setReady(true);
  }, []);

  if (!ready) return null;
  if (!ok)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PinLock role="seller" onSuccess={() => setOk(true)} />
      </div>
    );

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-40 flex items-center gap-3 bg-white px-4 py-3 shadow">
        <Link href="/" className="text-xl">🏠</Link>
        <Link href="/seller" className="font-bold text-brand-700">🛒 واجهة البائع</Link>
      </nav>
      {children}
    </div>
  );
}
