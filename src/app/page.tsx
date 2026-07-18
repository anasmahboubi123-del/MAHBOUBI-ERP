'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import PinLock from '@/components/ui/PinLock';
import Card from '@/components/ui/Card';

type Role = 'seller' | 'tailor' | 'admin';

const portals: { role: Role; label: string; icon: string; desc: string }[] = [
  { role: 'seller', label: 'البائع', icon: '🛒', desc: 'إنشاء طلبيات وتصميم الصالونات' },
  { role: 'tailor', label: 'الخياط', icon: '🧵', desc: 'متابعة وتنفيذ الطلبيات' },
  { role: 'admin', label: 'المدير', icon: '📊', desc: 'لوحة التحكم والإدارة' }
];

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-brand-700">Salon Marocain ERP</h1>
        <p className="mt-2 text-gray-500">نظام إدارة محل الصالونات المغربية</p>
      </div>
      <div className="grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
        {portals.map((p) => (
          <Card key={p.role} onClick={() => setRole(p.role)} className="text-center">
            <div className="text-6xl">{p.icon}</div>
            <div className="mt-3 text-2xl font-bold">{p.label}</div>
            <div className="mt-1 text-sm text-gray-500">{p.desc}</div>
          </Card>
        ))}
      </div>
      <Modal open={!!role} onClose={() => setRole(null)}>
        {role && (
          <PinLock role={role} onSuccess={() => router.push(`/${role}`)} onCancel={() => setRole(null)} />
        )}
      </Modal>
    </main>
  );
}
