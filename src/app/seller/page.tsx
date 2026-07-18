'use client';
import Link from 'next/link';
import Card from '@/components/ui/Card';

const categories = [
  { key: 'salon', label: 'صالون مغربي', icon: '🛋️', href: '/seller/salon', ready: true },
  { key: 'carpet', label: 'زربية', icon: '🪢', href: '#', ready: false },
  { key: 'khamiya', label: 'خامية', icon: '🎭', href: '#', ready: false },
  { key: 'wood', label: 'خشب', icon: '🪵', href: '#', ready: false }
];

export default function SellerHome() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold text-brand-700">اختر المنتج</h1>
      <div className="grid grid-cols-2 gap-6">
        {categories.map((c) =>
          c.ready ? (
            <Link key={c.key} href={c.href}>
              <Card className="text-center">
                <div className="text-6xl">{c.icon}</div>
                <div className="mt-3 text-xl font-bold">{c.label}</div>
              </Card>
            </Link>
          ) : (
            <Card key={c.key} className="text-center opacity-50">
              <div className="text-6xl">{c.icon}</div>
              <div className="mt-3 text-xl font-bold">{c.label}</div>
              <div className="text-sm text-gray-400">قريباً</div>
            </Card>
          )
        )}
      </div>
    </main>
  );
}
