'use client';

// ============================================================
// El Mahboubi Salon ERP — Wood Orders Admin List
// واجهة المدير لقائمة طلبات العود
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Eye, CheckCircle, XCircle, Clock, Truck,
  Package, DollarSign, Phone, User, Calendar, ArrowUpDown,
  MoreHorizontal, Printer, MessageSquare, RotateCcw, AlertTriangle,
  TrendingUp, BarChart3, ChevronDown, ChevronUp, Box,
} from 'lucide-react';
import {
  getWoodOrders,
  getWoodOrderById,
  updateWoodOrderStatus,
  getOrderSeddars,
  getOrderItems,
  getWoodAuditLogs,
} from '@/lib/supabase-wood';
import type {
  WoodOrder,
  WoodOrderSummary,
  WoodOrderStatus,
  WoodOrderSeddari,
  WoodOrderItem,
  WoodAuditLog,
} from '@/types/wood-types';
import { WOOD_ORDER_STATUS_LABELS, WOOD_ORDER_STATUS_COLORS } from '@/types/wood-types';
import Link from 'next/link';

const STATUS_FILTERS: { value: WoodOrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'new', label: 'جديد' },
  { value: 'pending', label: 'بانتظار الموافقة' },
  { value: 'approved', label: 'تمت الموافقة' },
  { value: 'in_progress', label: 'قيد التصنيع' },
  { value: 'ready', label: 'جاهز' },
  { value: 'delivered', label: 'مسلّم' },
  { value: 'cancelled', label: 'ملغى' },
  { value: 'rejected', label: 'مرفوض' },
];

export default function WoodOrdersAdmin() {
  const [orders, setOrders] = useState<WoodOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WoodOrderStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'status'>('date');
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<WoodOrder | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [stats, setStats] = useState({
    total: 0, new: 0, inProgress: 0, delivered: 0,
    totalRevenue: 0, pendingRevenue: 0,
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getWoodOrders();
      setOrders(data);

      setStats({
        total: data.length,
        new: data.filter(o => o.status === 'new').length,
        inProgress: data.filter(o => o.status === 'in_progress').length,
        delivered: data.filter(o => o.status === 'delivered').length,
        totalRevenue: data.reduce((s, o) => s + (o.final_total || 0), 0),
        pendingRevenue: data.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
          .reduce((s, o) => s + (o.remaining_amount || 0), 0),
      });
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders
    .filter(o => {
      const matchesSearch = !searchQuery ||
        o.customer_name?.includes(searchQuery) ||
        o.order_number?.includes(searchQuery) ||
        (o.customer_phone && o.customer_phone.includes(searchQuery));
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortBy === 'price') comparison = (a.final_total || 0) - (b.final_total || 0);
      else if (sortBy === 'status') comparison = a.status.localeCompare(b.status);
      return sortDesc ? -comparison : comparison;
    });

  const handleViewOrder = async (id: string) => {
    try {
      const order = await getWoodOrderById(id);
      setSelectedOrder(order);
      setShowDetail(true);
    } catch (err) {
      console.error('Error loading order:', err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: WoodOrderStatus) => {
    try {
      await updateWoodOrderStatus(id, newStatus, { role: 'admin', id: 'admin', name: 'المدير' });
      loadOrders();
      if (selectedOrder?.id === id) {
        handleViewOrder(id);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#F0EDE8]">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E4DC] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1B5E38] rounded-xl flex items-center justify-center text-white">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1B5E38]">طلبات العود</h1>
              <p className="text-sm text-gray-500">متابعة وإدارة طلبيات العود</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl border border-[#E8E4DC] text-sm text-gray-600 hover:bg-[#F5F0E8] transition"
            >
              ← رجوع للوحة
            </Link>
            <button
              onClick={loadOrders}
              className="p-2 rounded-xl border border-[#E8E4DC] hover:bg-[#F5F0E8] transition-colors text-gray-600"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Package />} label="إجمالي الطلبات" value={stats.total} color="#1B5E38" />
          <StatCard icon={<Clock />} label="جديدة" value={stats.new} color="#C9A84C" />
          <StatCard icon={<TrendingUp />} label="قيد التصنيع" value={stats.inProgress} color="#3B82F6" />
          <StatCard icon={<DollarSign />} label="إيرادات متوقعة" value={`${Math.round(stats.pendingRevenue).toLocaleString()} DH`} color="#10B981" />
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالرقم أو الاسم أو الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-[#E8E4DC] bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-colors ${
                  statusFilter === f.value 
                    ? 'bg-[#1B5E38] text-white shadow-md' 
                    : 'bg-white text-gray-600 border border-[#E8E4DC] hover:bg-[#F5F0E8]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        {loading ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#E8E4DC]">
            <div className="w-8 h-8 border-2 border-[#1B5E38] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">جاري التحميل...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E8E4DC]">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg text-gray-500">لا توجد طلبيات</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E8E4DC] overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8E4DC] bg-[#F5F0E8]">
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">الطلبية</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">الزبون</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 cursor-pointer hover:text-[#1B5E38]" onClick={() => { setSortBy('status'); setSortDesc(!sortDesc); }}>
                      <div className="flex items-center gap-1">الحالة <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 cursor-pointer hover:text-[#1B5E38]" onClick={() => { setSortBy('price'); setSortDesc(!sortDesc); }}>
                      <div className="flex items-center gap-1">المجموع <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">التسبيق</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 cursor-pointer hover:text-[#1B5E38]" onClick={() => { setSortBy('date'); setSortDesc(!sortDesc); }}>
                      <div className="flex items-center gap-1">التاريخ <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="border-b border-[#E8E4DC]/50 hover:bg-[#F5F0E8]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-sm text-[#1B5E38]">{order.order_number}</p>
                          <p className="text-xs text-gray-400">{order.model_name || '—'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{order.customer_name}</p>
                          <p className="text-xs text-gray-400">{order.customer_phone || '—'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white ${WOOD_ORDER_STATUS_COLORS[order.status]}`}>
                          {order.status === 'new' && <Clock className="w-3 h-3" />}
                          {order.status === 'delivered' && <CheckCircle className="w-3 h-3" />}
                          {order.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                          {WOOD_ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-sm text-[#C9A84C]">{(order.final_total || 0).toLocaleString()} DH</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700">
                          <p>{(order.deposit_amount || 0).toLocaleString()} DH</p>
                          <p className="text-xs text-gray-400">باقي: {(order.remaining_amount || 0).toLocaleString()}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('ar-MA') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewOrder(order.id)}
                            className="p-1.5 rounded-lg hover:bg-[#1B5E38]/10 text-[#1B5E38] transition-colors"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(order.id, 'approved')}
                            disabled={order.status !== 'new'}
                            className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 transition-colors disabled:opacity-20"
                            title="موافقة"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(order.id, 'cancelled')}
                            disabled={order.status === 'delivered' || order.status === 'cancelled'}
                            className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors disabled:opacity-20"
                            title="إلغاء"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {showDetail && selectedOrder && (
        <OrderDetailDrawer
          order={selectedOrder}
          onClose={() => setShowDetail(false)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-2xl p-4 border border-[#E8E4DC] bg-white shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: color }}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-[#1B5E38]">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function OrderDetailDrawer({ order, onClose, onStatusChange }: {
  order: WoodOrder;
  onClose: () => void;
  onStatusChange: (id: string, status: WoodOrderStatus) => void;
}) {
  const [seddars, setSeddars] = useState<WoodOrderSeddari[]>([]);
  const [items, setItems] = useState<WoodOrderItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<WoodAuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'seddars' | 'items' | 'audit'>('details');

  useEffect(() => {
    loadDetails();
  }, [order.id]);

  const loadDetails = async () => {
    try {
      const [s, i, a] = await Promise.all([
        getOrderSeddars(order.id),
        getOrderItems(order.id),
        getWoodAuditLogs(order.id),
      ]);
      setSeddars(s);
      setItems(i);
      setAuditLogs(a);
    } catch (err) {
      console.error('Error loading details:', err);
    }
  };

  const statusFlow: WoodOrderStatus[] = ['new', 'pending', 'approved', 'in_progress', 'ready', 'delivered'];
  const currentIndex = statusFlow.indexOf(order.status);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute left-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-[#E8E4DC] flex items-center justify-between bg-white">
          <div>
            <h2 className="text-xl font-bold text-[#1B5E38]">{order.order_number}</h2>
            <p className="text-sm text-gray-400">{order.created_at ? new Date(order.created_at).toLocaleString('ar-MA') : '—'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Status Flow */}
        <div className="px-6 py-4 border-b border-[#E8E4DC] bg-[#F5F0E8]">
          <div className="flex items-center justify-between">
            {statusFlow.map((status, idx) => (
              <React.Fragment key={status}>
                <button
                  onClick={() => onStatusChange(order.id, status)}
                  className={`flex flex-col items-center gap-1 transition-all ${
                    idx <= currentIndex ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                    idx <= currentIndex ? 'text-white' : 'border border-gray-300 text-gray-400'
                  }`}
                  style={idx <= currentIndex ? { backgroundColor: idx === currentIndex ? '#C9A84C' : '#1B5E38' } : {}}
                  >
                    {idx < currentIndex ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className="text-[10px] whitespace-nowrap text-gray-600">{WOOD_ORDER_STATUS_LABELS[status]}</span>
                </button>
                {idx < statusFlow.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${idx < currentIndex ? 'bg-[#1B5E38]' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E8E4DC] bg-white">
          {[
            { key: 'details', label: 'التفاصيل', icon: <Eye className="w-4 h-4" /> },
            { key: 'seddars', label: `السدادر (${seddars.length})`, icon: <Package className="w-4 h-4" /> },
            { key: 'items', label: `القطع (${items.length})`, icon: <Box className="w-4 h-4" /> },
            { key: 'audit', label: `السجل (${auditLogs.length})`, icon: <BarChart3 className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-colors ${
                activeTab === tab.key ? 'font-bold border-b-2 text-[#C9A84C] border-[#C9A84C]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 bg-[#F0EDE8]">
          {activeTab === 'details' && (
            <div className="space-y-4">
              <InfoSection title="بيانات الزبون" icon={<User className="w-4 h-4" />}>
                <InfoRow label="الاسم" value={order.customer_name || '—'} />
                <InfoRow label="الهاتف" value={order.customer_phone || '—'} />
                <InfoRow label="المدينة" value={order.customer_city || '—'} />
                <InfoRow label="العنوان" value={order.customer_address || '—'} />
              </InfoSection>

              <InfoSection title="الطلبية" icon={<Package className="w-4 h-4" />}>
                <InfoRow label="الموديل" value={order.model_snapshot?.name || '—'} />
                <InfoRow label="نوع الخشب" value={order.model_snapshot?.wood_type || '—'} />
                <InfoRow label="الشكل" value={order.salon_shape || '—'} />
                <InfoRow label="إجمالي الطول" value={`${order.total_length_meters || 0} متر`} />
              </InfoSection>

              <InfoSection title="الأسعار" icon={<DollarSign className="w-4 h-4" />}>
                <InfoRow label="السدادر" value={`${(order.seddari_total || 0).toLocaleString()} DH`} />
                <InfoRow label="الإضافات" value={`${(order.extras_total || 0).toLocaleString()} DH`} />
                <InfoRow label="المجموع الفرعي" value={`${(order.subtotal || 0).toLocaleString()} DH`} />
                {(order.discount_amount || 0) > 0 && (
                  <InfoRow label="الخصم" value={`-${(order.discount_amount || 0).toLocaleString()} DH`} className="text-red-500" />
                )}
                <div className="pt-2 border-t border-[#E8E4DC]">
                  <InfoRow label="المجموع النهائي" value={`${(order.final_total || 0).toLocaleString()} DH`} className="font-bold text-lg" valueColor="#C9A84C" />
                  <InfoRow label="التسبيق" value={`${(order.deposit_amount || 0).toLocaleString()} DH`} />
                  <InfoRow label="الباقي" value={`${(order.remaining_amount || 0).toLocaleString()} DH`} />
                </div>
              </InfoSection>

              {order.seller_notes && (
                <InfoSection title="ملاحظات البائع" icon={<MessageSquare className="w-4 h-4" />}>
                  <p className="text-sm text-gray-600">{order.seller_notes}</p>
                </InfoSection>
              )}
            </div>
          )}

          {activeTab === 'seddars' && (
            <div className="space-y-3">
              {seddars.map(s => (
                <div key={s.id} className="rounded-xl border border-[#E8E4DC] p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#1B5E38]">سداري {s.seddari_index}</span>
                    <span className="text-sm text-[#C9A84C] font-bold">{(s.seddari_price || 0).toLocaleString()} DH</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm text-gray-500">
                    <span>الطول: {s.length_cm} سم</span>
                    <span>العرض: {s.width_cm} سم</span>
                    <span>الارتفاع: {s.height_cm} سم</span>
                  </div>
                  {s.junction_type && s.junction_type !== 'none' && (
                    <p className="text-xs mt-2 px-2 py-1 rounded inline-block bg-[#1B5E38]/10 text-[#1B5E38]">
                      ربط: {s.junction_type}
                    </p>
                  )}
                </div>
              ))}
              {seddars.length === 0 && <p className="text-center text-gray-400 py-8">لا توجد سدادر</p>}
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="rounded-xl border border-[#E8E4DC] p-4 flex items-center justify-between bg-white">
                  <div>
                    <p className="font-semibold text-[#1B5E38]">{item.item_name}</p>
                    <p className="text-sm text-gray-400">{item.quantity} × {(item.current_price || 0).toLocaleString()} DH</p>
                    {item.price_modified && (
                      <p className="text-xs text-orange-500 mt-1">تم تعديل السعر</p>
                    )}
                  </div>
                  <span className="font-bold text-[#C9A84C]">{(item.total_price || 0).toLocaleString()} DH</span>
                </div>
              ))}
              {items.length === 0 && <p className="text-center text-gray-400 py-8">لا توجد قطع إضافية</p>}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3">
              {auditLogs.map(log => (
                <div key={log.id} className="rounded-xl border border-[#E8E4DC] p-4 bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-[#1B5E38]">{log.action_type}</span>
                    <span className="text-xs text-gray-400">{log.created_at ? new Date(log.created_at).toLocaleString('ar-MA') : '—'}</span>
                  </div>
                  {log.old_value && log.new_value && (
                    <p className="text-sm text-gray-600">
                      من <span className="text-red-500">{log.old_value}</span> إلى <span className="text-green-600">{log.new_value}</span>
                    </p>
                  )}
                  {log.reason && <p className="text-xs text-gray-400 mt-1">السبب: {log.reason}</p>}
                  <p className="text-xs text-gray-400 mt-1">بواسطة: {log.actor_name || log.actor_role}</p>
                </div>
              ))}
              {auditLogs.length === 0 && <p className="text-center text-gray-400 py-8">لا توجد عمليات مسجلة</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E8E4DC] p-4 bg-white">
      <h3 className="font-bold mb-3 flex items-center gap-2 text-sm text-[#C9A84C]">
        {icon}
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value, className = '', valueColor }: { label: string; value: string; className?: string; valueColor?: string }) {
  return (
    <div className={`flex justify-between text-sm ${className}`}>
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800" style={valueColor ? { color: valueColor } : {}}>{value}</span>
    </div>
  );
}