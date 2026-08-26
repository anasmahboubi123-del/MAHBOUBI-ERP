'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchArchivedOrders, restoreOrder, formatCurrency, getProductLabel, getWorkflowStatusLabel, getDaysLeft, getPriorityLevel, type UnifiedOrder } from '@/lib/orders-unified';
import { Archive, RotateCcw, Search, Package, Calendar, User, Eye } from 'lucide-react';

export default function ArchivePage() {
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [restoring, setRestoring] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchArchivedOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRestore = async (id: string) => {
    if (!confirm('استرجاع الطلبية من الأرشيف؟')) return;
    setRestoring(id);
    await restoreOrder(id, 'المدير');
    await load();
    setRestoring(null);
  };

  const filtered = orders.filter(o =>
    !search ||
    (o.customer_name?.toLowerCase().includes(search.toLowerCase()) || false) ||
    (o.order_number?.toLowerCase().includes(search.toLowerCase()) || false) ||
    (o.customer_phone?.includes(search) || false)
  );

  return (
    <div className="min-h-screen bg-[#F0EDE8]" dir="rtl">
      <header className="bg-white border-b border-[#E8E4DC]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Link href="/admin/orders" className="p-2 rounded-xl bg-[#F5F0E8] hover:bg-[#E8E4DC] transition">
                <RotateCcw className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Archive className="w-6 h-6 text-gray-600" />
                  أرشيف الطلبيات
                </h1>
                <p className="text-sm text-gray-500">الطلبيات المكتملة والمؤرشفة</p>
              </div>
            </div>
            <div className="relative w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="بحث..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 rounded-xl border border-gray-200 text-sm bg-[#FAFAF8] focus:ring-2 focus:ring-[#1B5E38] outline-none"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-3 border-[#1B5E38] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">جاري التحميل...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-bold">الأرشيف فارغ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(order => {
              const daysLeft = getDaysLeft(order.delivery_date);
              const priority = getPriorityLevel(daysLeft);
              return (
                <div key={order.id} className="bg-white rounded-2xl p-5 border border-[#E8E4DC] shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-800">{order.order_number}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-xs font-bold ${priority.bg} ${priority.color}`}>
                        {getProductLabel(order.product_type)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{order.archived_at?.split('T')[0]}</span>
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-500"><User className="w-3.5 h-3.5" /> {order.customer_name || '—'}</div>
                    <div className="flex items-center gap-2 text-gray-500"><Calendar className="w-3.5 h-3.5" /> {order.delivery_date || '—'}</div>
                    <div className="flex items-center gap-2 text-gray-500"><Package className="w-3.5 h-3.5" /> {formatCurrency(order.total_amount)}</div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex-1 px-3 py-2 rounded-xl bg-[#F5F0E8] text-gray-700 text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#E8E4DC] transition"
                    >
                      <Eye className="w-4 h-4" />
                      عرض
                    </Link>
                    <button
                      onClick={() => handleRestore(order.id)}
                      disabled={restoring === order.id}
                      className="flex-1 px-3 py-2 rounded-xl bg-[#1B5E38] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#144d2e] transition disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      {restoring === order.id ? 'جاري...' : 'استرجاع'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}