'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Filter, ArrowLeft, ShoppingCart, FileText } from 'lucide-react';

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  total: number;
  depositAmount: number;
  remaining: number;
  itemCount: number;
}

export default function SellerOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [filtered, setFiltered] = useState<OrderSummary[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let result = orders;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter);
    }
    setFiltered(result);
  }, [search, statusFilter, orders]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // جلب عدد العناصر لكل طلب
      const orderIds = (ordersData || []).map((o: any) => o.id);
      const itemCounts: Record<string, number> = {};
      if (orderIds.length > 0) {
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('order_id')
          .in('order_id', orderIds);
        (itemsData || []).forEach((item: any) => {
          itemCounts[item.order_id] = (itemCounts[item.order_id] || 0) + 1;
        });
      }

      const mapped: OrderSummary[] = (ordersData || []).map((o: any) => ({
        id: o.id,
        orderNumber: String(o.order_number || ''),
        status: o.status,
        createdAt: o.created_at,
        customerName: o.customer_name || '',
        customerPhone: o.customer_phone || '',
        total: o.total || 0,
        depositAmount: o.deposit || 0,
        remaining: o.remaining_amount || (o.total - o.deposit) || 0,
        itemCount: itemCounts[o.id] || 0,
      }));

      setOrders(mapped);
      setFiltered(mapped);
    } catch (err) {
      console.error(err);
      setOrders([]);
      setFiltered([]);
    }
    setLoading(false);
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      quotation: { label: 'عرض سعر', className: 'bg-amber-100 text-amber-700' },
      confirmed: { label: 'مؤكد', className: 'bg-blue-100 text-blue-700' },
      in_production: { label: 'قيد الإنتاج', className: 'bg-purple-100 text-purple-700' },
      ready: { label: 'جاهز', className: 'bg-emerald-100 text-emerald-700' },
      delivered: { label: 'مُسلّم', className: 'bg-green-100 text-green-700' },
      cancelled: { label: 'ملغى', className: 'bg-red-100 text-red-700' },
    };
    const s = map[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.className}`}>{s.label}</span>;
  };

  const stats = [
    { label: 'الكل', count: orders.length, color: 'bg-[#1B5E38]' },
    { label: 'مؤكد', count: orders.filter((o) => o.status === 'confirmed').length, color: 'bg-blue-500' },
    { label: 'قيد الإنتاج', count: orders.filter((o) => o.status === 'in_production').length, color: 'bg-purple-500' },
    { label: 'جاهز', count: orders.filter((o) => o.status === 'ready').length, color: 'bg-emerald-500' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E8]" dir="rtl">
      {/* Header */}
      <div className="bg-[#1B5E38] text-white px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <button onClick={() => router.push('/seller')} className="flex items-center gap-2 text-sm hover:opacity-80">
            <ArrowLeft className="w-4 h-4" />
            الرئيسية
          </button>
          <h1 className="text-lg font-bold">📋 طلباتي</h1>
          <button
            onClick={() => router.push('/seller/order-center')}
            className="bg-[#C9A84C] text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-[#b8983d]"
          >
            + طلب جديد
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-[#E8E0D0] text-center">
              <p className="text-2xl font-bold text-[#1B5E38]">{s.count}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E8E0D0] flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث برقم الطلب أو اسم الزبون..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 border border-[#E8E0D0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E38]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-[#E8E0D0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E38]"
            >
              <option value="all">كل الحالات</option>
              <option value="quotation">عرض سعر</option>
              <option value="confirmed">مؤكد</option>
              <option value="in_production">قيد الإنتاج</option>
              <option value="ready">جاهز</option>
              <option value="delivered">مُسلّم</option>
              <option value="cancelled">ملغى</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">لا توجد طلبات</p>
            <button
              onClick={() => router.push('/seller/order-center')}
              className="bg-[#1B5E38] text-white px-6 py-2 rounded-lg text-sm"
            >
              <ShoppingCart className="w-4 h-4 inline ml-1" />
              إنشاء طلب جديد
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <div
                key={order.id}
                onClick={() => router.push(`/seller/orders/${order.id}`)}
                className="bg-white rounded-xl p-4 shadow-sm border border-[#E8E0D0] hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[#1B5E38] font-bold">#{order.orderNumber}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('ar-MA')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{order.customerName || 'زبون غير معروف'}</p>
                    <p className="text-sm text-gray-500">{order.customerPhone}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[#1B5E38]">{order.total.toLocaleString()} د.م</p>
                    <p className="text-xs text-gray-500">
                      {order.itemCount} منتج | متبقي: {order.remaining.toLocaleString()} د.م
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}