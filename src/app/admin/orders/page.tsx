'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import { fmtDh } from '@/lib/calculations';

interface OrderRow {
  id: string;
  order_number: number;
  status: string;
  total: number;
  deposit: number;
  customer_name: string | null;
  delivery_date: string | null;
}

const filters = [
  { key: 'all', label: 'الكل' },
  { key: 'pending', label: 'معلقة' },
  { key: 'reviewed', label: 'أُرسلت للخياط' },
  { key: 'in_progress', label: 'قيد التنفيذ' },
  { key: 'completed', label: 'مكتملة' },
  { key: 'delivered', label: 'مُسلّمة' }
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, status, total, deposit, customer_name, delivery_date')
        .order('created_at', { ascending: false });
      setOrders((data as OrderRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const shown = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  if (loading) return <p className="p-8 text-center text-gray-500">جارٍ التحميل...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-700">إدارة الطلبيات</h1>
      <div className="flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 font-semibold ${filter === f.key ? 'bg-brand-600 text-white' : 'bg-white text-gray-600'}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {shown.length === 0 && <p className="text-gray-400">لا توجد طلبيات</p>}
      {shown.map((o) => (
        <Link key={o.id} href={`/admin/orders/${o.id}`} className="block">
          <Card className="flex items-center justify-between">
            <div>
              <span className="font-bold">#{o.order_number}</span> {o.customer_name ?? '—'}
              <div className="text-sm text-gray-500">التسليم: {o.delivery_date ?? '—'}</div>
            </div>
            <div className="text-left">
              <div className="font-bold">{fmtDh(Number(o.total))}</div>
              <div className="text-xs text-gray-400">تسبيق: {fmtDh(Number(o.deposit))}</div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
