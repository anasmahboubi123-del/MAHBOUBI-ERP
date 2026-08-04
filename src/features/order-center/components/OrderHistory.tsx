'use client';

import React, { useEffect, useState } from 'react';
import { useOrder } from '../context/OrderContext';
import { UnifiedOrder } from '../types';
import { Clock, RotateCcw, Hash, Eye } from 'lucide-react';

const C = { green: '#1B5E38', gold: '#C9A84C', dark: '#0D1F17', danger: '#DC2626', warning: '#F59E0B', success: '#10B981', info: '#3B82F6' };

function formatCurrency(n: number): string {
  return n.toLocaleString('ar-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' د.م';
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#6B7280', quotation: '#8B5CF6', waiting_deposit: '#F59E0B',
  confirmed: '#3B82F6', production: '#6366F1', tailor_working: '#EC4899',
  quality_check: '#F97316', ready: '#10B981', delivered: '#059669',
  invoiced: '#0EA5E9', paid: '#10B981', cancelled: '#DC2626', archived: '#9CA3AF',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة', quotation: 'عرض سعر', waiting_deposit: 'في انتظار العربون',
  confirmed: 'مؤكد', production: 'قيد الإنتاج', tailor_working: 'الخياط يعمل',
  quality_check: 'فحص الجودة', ready: 'جاهز', delivered: 'مُسلّم',
  invoiced: 'مفوتر', paid: 'مدفوع', cancelled: 'ملغي', archived: 'مؤرشف',
};

export function OrderHistory() {
  const orderCtx = useOrder() as any;
  const loadOrders: () => Promise<UnifiedOrder[]> = orderCtx.loadOrders || (async () => []);

  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders().then((data: UnifiedOrder[]) => { setOrders(data); setLoading(false); });
  }, [loadOrders]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="w-10 h-10 border-4 rounded-full mx-auto mb-4 animate-spin" style={{ borderColor: C.green, borderTopColor: 'transparent' }} />
        <p className="text-gray-500">جاري التحميل...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
        <Clock className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <h3 className="text-xl font-bold text-gray-400">لا توجد طلبات محفوظة</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: C.dark }}>سجل الطلبات</h2>
        <button onClick={() => loadOrders().then((data: UnifiedOrder[]) => setOrders(data))} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border border-gray-200 hover:bg-gray-50 transition">
          <RotateCcw className="w-4 h-4" /> تحديث
        </button>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <span className="font-bold text-sm">{order.orderNumber}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{ background: STATUS_COLORS[order.status] || '#6B7280' }}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <p className="font-bold text-lg">{order.customer.name}</p>
                <p className="text-sm text-gray-500">{order.customer.phone}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>{order.items.length} منتجات</span>
                  <span>{new Date(order.createdAt).toLocaleDateString('ar-MA')}</span>
                </div>
              </div>
              <div className="text-left flex flex-col items-end gap-2">
                <p className="text-2xl font-bold" style={{ color: C.green }}>{formatCurrency(order.total)}</p>
                <a href={`/seller/orders/${order.id}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                  <Eye className="w-4 h-4" /> عرض
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}