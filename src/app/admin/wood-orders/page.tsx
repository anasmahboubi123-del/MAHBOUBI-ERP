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
  TrendingUp, BarChart3, ChevronDown, ChevronUp,Box,
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

const THEME = {
  primary: '#1B5E38',
  primaryLight: '#2D7A4F',
  gold: '#C9A84C',
  cream: '#F5F0E8',
  dark: '#0D1F17',
  darkCard: '#1A2E22',
  darkElevated: '#243D2E',
};

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
        totalRevenue: data.reduce((s, o) => s + o.final_total, 0),
        pendingRevenue: data.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
          .reduce((s, o) => s + o.remaining_amount, 0),
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
        o.customer_name.includes(searchQuery) ||
        o.order_number.includes(searchQuery) ||
        (o.customer_phone && o.customer_phone.includes(searchQuery));
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortBy === 'price') comparison = a.final_total - b.final_total;
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
    <div dir="rtl" className="min-h-screen" style={{ backgroundColor: THEME.dark, color: THEME.cream }}>
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4" style={{ backgroundColor: THEME.darkCard }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: THEME.primary }}>
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">طلبات العود</h1>
              <p className="text-sm opacity-60">متابعة وإدارة طلبيات العود</p>
            </div>
          </div>
          <button
            onClick={loadOrders}
            className="p-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Package />} label="إجمالي الطلبات" value={stats.total} color={THEME.primary} />
          <StatCard icon={<Clock />} label="جديدة" value={stats.new} color={THEME.gold} />
          <StatCard icon={<TrendingUp />} label="قيد التصنيع" value={stats.inProgress} color="#3B82F6" />
          <StatCard icon={<DollarSign />} label="إيرادات متوقعة" value={`${Math.round(stats.pendingRevenue)} درهم`} color="#10B981" />
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input
              type="text"
              placeholder="بحث بالرقم أو الاسم أو الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:border-[#C9A84C]"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  statusFilter === f.value ? 'text-white' : 'opacity-60 hover:opacity-100'
                }`}
                style={statusFilter === f.value ? { backgroundColor: THEME.primary } : {}}
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
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="opacity-60">جاري التحميل...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/20 rounded-xl">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg opacity-60">لا توجد طلبيات</p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 overflow-hidden" style={{ backgroundColor: THEME.darkCard }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10" style={{ backgroundColor: THEME.darkElevated }}>
                    <th className="px-4 py-3 text-right text-sm font-semibold opacity-70">الطلبية</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold opacity-70">الزبون</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold opacity-70 cursor-pointer hover:opacity-100" onClick={() => { setSortBy('status'); setSortDesc(!sortDesc); }}>
                      <div className="flex items-center gap-1">الحالة <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold opacity-70 cursor-pointer hover:opacity-100" onClick={() => { setSortBy('price'); setSortDesc(!sortDesc); }}>
                      <div className="flex items-center gap-1">المجموع <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold opacity-70">التسبيق</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold opacity-70 cursor-pointer hover:opacity-100" onClick={() => { setSortBy('date'); setSortDesc(!sortDesc); }}>
                      <div className="flex items-center gap-1">التاريخ <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold opacity-70">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-sm">{order.order_number}</p>
                          <p className="text-xs opacity-60">{order.model_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">{order.customer_name}</p>
                          <p className="text-xs opacity-60">{order.customer_phone || '—'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-white ${WOOD_ORDER_STATUS_COLORS[order.status]}`}>
                          {order.status === 'new' && <Clock className="w-3 h-3" />}
                          {order.status === 'delivered' && <CheckCircle className="w-3 h-3" />}
                          {order.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                          {WOOD_ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-sm" style={{ color: THEME.gold }}>{order.final_total} درهم</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p>{order.deposit_amount} درهم</p>
                          <p className="text-xs opacity-60">باقي: {order.remaining_amount}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm opacity-70">
                        {new Date(order.created_at).toLocaleDateString('ar-MA')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewOrder(order.id)}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(order.id, 'approved')}
                            disabled={order.status !== 'new'}
                            className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors disabled:opacity-20"
                            title="موافقة"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(order.id, 'cancelled')}
                            disabled={order.status === 'delivered' || order.status === 'cancelled'}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-20"
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
    <div className="rounded-xl p-4 border border-white/10" style={{ backgroundColor: THEME.darkCard }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: color }}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm opacity-60">{label}</p>
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
    <div className="fixed inset-0 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="absolute left-0 top-0 h-full w-full max-w-2xl overflow-y-auto" style={{ backgroundColor: THEME.darkCard }}>
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-white/10 flex items-center justify-between" style={{ backgroundColor: THEME.darkCard }}>
          <div>
            <h2 className="text-xl font-bold">{order.order_number}</h2>
            <p className="text-sm opacity-60">{new Date(order.created_at).toLocaleString('ar-MA')}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Status Flow */}
        <div className="px-6 py-4 border-b border-white/10">
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
                    idx <= currentIndex ? 'text-white' : 'border border-white/20'
                  }`}
                  style={idx <= currentIndex ? { backgroundColor: idx === currentIndex ? THEME.gold : THEME.primary } : {}}
                  >
                    {idx < currentIndex ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className="text-[10px] whitespace-nowrap">{WOOD_ORDER_STATUS_LABELS[status]}</span>
                </button>
                {idx < statusFlow.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${idx < currentIndex ? '' : 'bg-white/10'}`}
                    style={idx < currentIndex ? { backgroundColor: THEME.primary } : {}}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
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
                activeTab === tab.key ? 'font-bold border-b-2' : 'opacity-60 hover:opacity-100'
              }`}
              style={activeTab === tab.key ? { borderColor: THEME.gold, color: THEME.gold } : {}}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-4">
              <InfoSection title="بيانات الزبون" icon={<User className="w-4 h-4" />}>
                <InfoRow label="الاسم" value={order.customer_name} />
                <InfoRow label="الهاتف" value={order.customer_phone || '—'} />
                <InfoRow label="المدينة" value={order.customer_city || '—'} />
                <InfoRow label="العنوان" value={order.customer_address || '—'} />
              </InfoSection>

              <InfoSection title="الطلبية" icon={<Package className="w-4 h-4" />}>
                <InfoRow label="الموديل" value={order.model_snapshot?.name || '—'} />
                <InfoRow label="نوع الخشب" value={order.model_snapshot?.wood_type || '—'} />
                <InfoRow label="الشكل" value={order.salon_shape} />
                <InfoRow label="إجمالي الطول" value={`${order.total_length_meters} متر`} />
              </InfoSection>

              <InfoSection title="الأسعار" icon={<DollarSign className="w-4 h-4" />}>
                <InfoRow label="السدادر" value={`${order.seddari_total} درهم`} />
                <InfoRow label="الإضافات" value={`${order.extras_total} درهم`} />
                <InfoRow label="المجموع الفرعي" value={`${order.subtotal} درهم`} />
                {order.discount_amount > 0 && (
                  <InfoRow label="الخصم" value={`-${order.discount_amount} درهم`} className="text-red-400" />
                )}
                <div className="pt-2 border-t border-white/10">
                  <InfoRow label="المجموع النهائي" value={`${order.final_total} درهم`} className="font-bold text-lg" valueColor={THEME.gold} />
                  <InfoRow label="التسبيق" value={`${order.deposit_amount} درهم`} />
                  <InfoRow label="الباقي" value={`${order.remaining_amount} درهم`} />
                </div>
              </InfoSection>

              {order.seller_notes && (
                <InfoSection title="ملاحظات البائع" icon={<MessageSquare className="w-4 h-4" />}>
                  <p className="text-sm opacity-80">{order.seller_notes}</p>
                </InfoSection>
              )}
            </div>
          )}

          {activeTab === 'seddars' && (
            <div className="space-y-3">
              {seddars.map(s => (
                <div key={s.id} className="rounded-lg border border-white/10 p-4" style={{ backgroundColor: THEME.dark }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold">سداري {s.seddari_index}</span>
                    <span className="text-sm" style={{ color: THEME.gold }}>{s.seddari_price} درهم</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm opacity-70">
                    <span>الطول: {s.length_cm} سم</span>
                    <span>العرض: {s.width_cm} سم</span>
                    <span>الارتفاع: {s.height_cm} سم</span>
                  </div>
                  {s.junction_type !== 'none' && (
                    <p className="text-xs mt-2 px-2 py-1 rounded inline-block" style={{ backgroundColor: THEME.primary + '20', color: THEME.primaryLight }}>
                      ربط: {s.junction_type}
                    </p>
                  )}
                </div>
              ))}
              {seddars.length === 0 && <p className="text-center opacity-40 py-8">لا توجد سدادر</p>}
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="rounded-lg border border-white/10 p-4 flex items-center justify-between" style={{ backgroundColor: THEME.dark }}>
                  <div>
                    <p className="font-semibold">{item.item_name}</p>
                    <p className="text-sm opacity-60">{item.quantity} × {item.current_price} درهم</p>
                    {item.price_modified && (
                      <p className="text-xs text-yellow-400 mt-1">تم تعديل السعر</p>
                    )}
                  </div>
                  <span className="font-bold" style={{ color: THEME.gold }}>{item.total_price} درهم</span>
                </div>
              ))}
              {items.length === 0 && <p className="text-center opacity-40 py-8">لا توجد قطع إضافية</p>}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3">
              {auditLogs.map(log => (
                <div key={log.id} className="rounded-lg border border-white/10 p-4" style={{ backgroundColor: THEME.dark }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{log.action_type}</span>
                    <span className="text-xs opacity-50">{new Date(log.created_at).toLocaleString('ar-MA')}</span>
                  </div>
                  {log.old_value && log.new_value && (
                    <p className="text-sm opacity-70">
                      من <span className="text-red-400">{log.old_value}</span> إلى <span className="text-green-400">{log.new_value}</span>
                    </p>
                  )}
                  {log.reason && <p className="text-xs opacity-50 mt-1">السبب: {log.reason}</p>}
                  <p className="text-xs opacity-40 mt-1">بواسطة: {log.actor_name || log.actor_role}</p>
                </div>
              ))}
              {auditLogs.length === 0 && <p className="text-center opacity-40 py-8">لا توجد عمليات مسجلة</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 p-4" style={{ backgroundColor: THEME.dark }}>
      <h3 className="font-bold mb-3 flex items-center gap-2 text-sm" style={{ color: THEME.gold }}>
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
      <span className="opacity-60">{label}</span>
      <span className="font-medium" style={valueColor ? { color: valueColor } : {}}>{value}</span>
    </div>
  );
}