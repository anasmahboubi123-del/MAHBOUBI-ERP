'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PinLock from '@/components/ui/PinLock';

const tabs = [
  { href: '/admin', label: '📊 لوحة التحكم' },
  { href: '/admin/orders', label: '📦 الطلبيات' },
  { href: '/admin/catalogue', label: '🖼️ الكتالوج' },
  { href: '/admin/tailors', label: '🧵 الخياطين' },
  { href: '/admin/settings', label: '⚙️ الإعدادات' }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ok, setOk] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOk(sessionStorage.getItem('auth_admin') === '1');
    setReady(true);
  }, []);

  if (!ready) return null;
  if (!ok)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PinLock role="admin" onSuccess={() => setOk(true)} />
      </div>
    );

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-40 flex items-center gap-2 overflow-x-auto bg-white px-4 py-3 shadow">
        <Link href="/" className="ml-2 text-xl">🏠</Link>
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`whitespace-nowrap rounded-xl px-4 py-2 font-semibold ${pathname === t.href ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-brand-100'}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="mx-auto max-w-6xl p-4">{children}</div>
    </div>
  );
}
