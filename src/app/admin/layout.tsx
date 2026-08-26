'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ManagerGate, { clearAdminSession } from '@/components/ManagerGate';

const tabs = [
  { href: '/admin', label: '📊 لوحة التحكم' },
  { href: '/admin/orders', label: '📦 الطلبيات العامة' },
  { href: '/admin/orders-registry', label: '📁 سجل الطلبيات الدائم' },
  { href: '/admin/catalogue', label: '🖼️ الكتالوج' },
  { href: '/admin/wood-models', label: '📐 موديلات العود' },
  { href: '/admin/tailors', label: '🧵 الخياطين' },
  { href: '/admin/album_seller', label: '📸 ألبوم البائع' },
  { href: '/admin/salon-rules', label: '🛋️ قواعد الصالون' },
  { href: '/admin/settings', label: '⚙️ الإعدادات' }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearAdminSession();
    router.push('/admin');
    router.refresh();
  };

  return (
    <ManagerGate>
      <div className="min-h-screen">
        <nav className="sticky top-0 z-40 flex items-center gap-2 overflow-x-auto bg-white px-4 py-3 shadow">
          <Link href="/" className="ml-2 text-xl">🏠</Link>
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`whitespace-nowrap rounded-xl px-4 py-2 font-semibold transition-colors ${
                pathname === t.href || pathname.startsWith(t.href + '/')
                  ? 'bg-[#1B5E38] text-white'
                  : 'text-gray-600 hover:bg-[#1B5E38]/10'
              }`}
            >
              {t.label}
            </Link>
          ))}
          {/* زر الخروج الآمن */}
          <button
            onClick={handleLogout}
            className="mr-auto whitespace-nowrap rounded-xl px-4 py-2 font-semibold text-red-600 hover:bg-red-50 transition-colors border border-red-200 flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            خروج
          </button>
        </nav>
        <div className="mx-auto max-w-7xl p-4">{children}</div>
      </div>
    </ManagerGate>
  );
}