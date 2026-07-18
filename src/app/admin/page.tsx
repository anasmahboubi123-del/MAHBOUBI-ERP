'use client';
import { useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import { fmtDh } from '@/lib/calculations';
import { format, subDays, isAfter, startOfDay, startOfWeek, startOfMonth, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface OrderRow {
  id: string;
  order_number: number;
  status: string;
  total: number;
  deposit: number;
  customer_name: string | null;
  delivery_date: string | null;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  pending: 'معلقة',
  reviewed: 'تمت المراجعة',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتملة',
  delivered: 'مُسلّمة'
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (supabaseConfigured) {
        const { data } = await supabase
          .from('orders')
          .select('id, order_number, status, total, deposit, customer_name, delivery_date, created_at')
          .order('created_at', { ascending: false })
          .limit(500);
        setOrders((data as OrderRow[]) ?? []);
      }
      setLoading(false);
    })();
  }, []);

  const now = new Date();
  const count = (s: string) => orders.filter((o) => o.status === s).length;
  const revenueSince = (d: Date) =>
    orders.filter((o) => isAfter(parseISO(o.created_at), d)).reduce((s, o) => s + Number(o.total), 0);

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(now, 6 - i);
    const key = format(day, 'yyyy-MM-dd');
    const sum = orders
      .filter((o) => o.created_at.startsWith(key))
      .reduce((s, o) => s + Number(o.total), 0);
    return { day: format(day, 'dd/MM'), المبيعات: sum };
  });

  if (loading) return <p className="p-8 text-center text-gray-500">جارٍ التحميل...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">لوحة التحكم</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="text-center">
          <div className="text-3xl font-extrabold text-amber-600">{count('pending')}</div>
          <div className="text-sm text-gray-500">طلبيات معلقة</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-extrabold text-blue-600">{count('in_progress')}</div>
          <div className="text-sm text-gray-500">قيد التنفيذ</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-extrabold text-green-600">{count('completed')}</div>
          <div className="text-sm text-gray-500">مكتملة</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-extrabold text-brand-700">{orders.length}</div>
          <div className="text-sm text-gray-500">مجموع الطلبيات</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="text-center">
          <div className="text-xl font-bold">{fmtDh(revenueSince(startOfDay(now)))}</div>
          <div className="text-sm text-gray-500">مبيعات اليوم</div>
        </Card>
        <Card className="text-center">
          <div className="text-xl font-bold">{fmtDh(revenueSince(startOfWeek(now)))}</div>
          <div className="text-sm text-gray-500">مبيعات الأسبوع</div>
        </Card>
        <Card className="text-center">
          <div className="text-xl font-bold">{fmtDh(revenueSince(startOfMonth(now)))}</div>
          <div className="text-sm text-gray-500">مبيعات الشهر</div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 font-bold">مبيعات آخر 7 أيام</h2>
        <div style={{ width: '100%', height: 260 }} dir="ltr">
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="المبيعات" fill="#b8860b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-bold">أحدث الطلبيات</h2>
        {orders.length === 0 && <p className="text-gray-400">لا توجد طلبيات بعد</p>}
        <div className="divide-y">
          {orders.slice(0, 10).map((o) => (
            <div key={o.id} className="flex items-center justify-between py-3">
              <div>
                <span className="font-bold">#{o.order_number}</span>{' '}
                <span>{o.customer_name ?? '—'}</span>
                <span className="mr-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs">
                  {statusLabels[o.status] ?? o.status}
                </span>
              </div>
              <div className="text-left">
                <div className="font-bold">{fmtDh(Number(o.total))}</div>
                <div className="text-xs text-gray-400">التسليم: {o.delivery_date ?? '—'}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
