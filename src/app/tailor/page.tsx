'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import { differenceInCalendarDays, parseISO } from 'date-fns';

interface OrderRow {
  id: string;
  order_number: number;
  status: string;
  customer_name: string | null;
  delivery_date: string | null;
  created_at: string;
}

const statusLabels: Record<string, { label: string; cls: string }> = {
  pending: { label: 'معلقة', cls: 'bg-amber-100 text-amber-700' },
  reviewed: { label: 'جاهزة للتنفيذ', cls: 'bg-purple-100 text-purple-700' },
  in_progress: { label: 'قيد التنفيذ', cls: 'bg-blue-100 text-blue-700' },
  completed: { label: 'مكتملة', cls: 'bg-green-100 text-green-700' }
};

/** قائمة انتظار الخياط - بدون أي أثمنة */
export default function TailorHome() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, status, customer_name, delivery_date, created_at')
        .in('status', ['reviewed', 'in_progress', 'completed'])
        .order('delivery_date', { ascending: true });
      setOrders((data as OrderRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  function daysLeft(d: string | null) {
    if (!d) return null;
    return differenceInCalendarDays(parseISO(d), new Date());
  }

  if (loading) return <p className="p-8 text-center text-gray-500">جارٍ التحميل...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-700">الطلبيات</h1>
      {orders.length === 0 && <p className="text-gray-400">لا توجد طلبيات حالياً</p>}
      {orders.map((o) => {
        const left = daysLeft(o.delivery_date);
        const st = statusLabels[o.status] ?? { label: o.status, cls: 'bg-gray-100' };
        return (
          <Link key={o.id} href={`/tailor/orders/${o.id}`} className="block">
            <Card className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold">
                  #{o.order_number} — {o.customer_name ?? 'زبون'}
                </div>
                <span className={`rounded-full px-3 py-0.5 text-sm ${st.cls}`}>{st.label}</span>
              </div>
              <div className="text-left">
                <div className="text-sm text-gray-500">التسليم: {o.delivery_date ?? '—'}</div>
                {left !== null && o.status !== 'completed' && (
                  <div className={`font-bold ${left <= 2 ? 'text-red-600' : 'text-green-600'}`}>
                    {left >= 0 ? `⛳ باقي ${left} يوم` : `⚠️ متأخر ${-left} يوم`}
                  </div>
                )}
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
