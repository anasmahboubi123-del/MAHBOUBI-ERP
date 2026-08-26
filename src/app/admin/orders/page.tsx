'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  fetchUnifiedOrders, fetchCompanyContacts, fetchActiveReminders,
  dismissReminder, archiveOrder, assignTailor, assignCompanyContact,
  updateOrderWorkflowStatus, getOrCreateTrackingToken,
  getPriorityLevel, getDaysLeft, formatCurrency,
  getProductLabel, getWorkflowStatusLabel,
  PRODUCT_LABELS, WORKFLOW_STATUS_LABELS,
  type UnifiedOrder, type CompanyContact, type OrderReminder,
  type ProductType, type WorkflowStatus,
} from '@/lib/orders-unified';
import {
  Search, Filter, Eye, Archive, RotateCcw, Bell, Calendar,
  Phone, User, Scissors, Package, AlertTriangle,
  CheckCircle, ChevronDown, FileSpreadsheet, ArrowUpDown,
  ClipboardCopy, ExternalLink, MessageSquare, Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type SortField = 'date' | 'delivery' | 'amount' | 'status' | 'customer';
type SortDir = 'asc' | 'desc';

interface FilterState {
  productType: ProductType | 'all';
  status: WorkflowStatus | 'all';
  priority: 'all' | 'urgent' | 'high' | 'normal' | 'low';
  searchQuery: string;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'overdue';
}

function StatCard({ icon: Icon, label, value, color, bg, trend }: any) {
  return (
    <div className={`${bg} rounded-2xl p-5 border border-white/60 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/80">{trend}</span>}
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function PriorityBadge({ daysLeft }: { daysLeft: number }) {
  const p = getPriorityLevel(daysLeft);
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${p.bg} ${p.color}`}>
      <span>{p.icon}</span>
      {p.label}
      {daysLeft >= 0 ? ` (${daysLeft} يوم)` : ` (${Math.abs(daysLeft)} يوم متأخر)`}
    </span>
  );
}

function ProductBadge({ type }: { type: string | null }) {
  const c = PRODUCT_LABELS[(type as ProductType) || 'mixed'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${c.bg} ${c.color}`}>
      <span>{c.icon}</span>
      {c.label}
    </span>
  );
}

function getProductIcon(type: string | null) {
  const c = PRODUCT_LABELS[(type as ProductType) || 'mixed'];
  return c.icon || '📦';
}

function StatusBadge({ status }: { status: string | null }) {
  const c = WORKFLOW_STATUS_LABELS[(status as WorkflowStatus) || 'new'];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${c.bg} ${c.color}`}>
      {c.label}
    </span>
  );
}

function ReminderBanner({ reminders, onDismiss }: { reminders: OrderReminder[]; onDismiss: (id: string) => void }) {
  if (reminders.length === 0) return null;
  return (
    <div className="mb-6 space-y-2">
      {reminders.map((r) => (
        <div key={r.id} className={`rounded-xl p-4 border-r-4 flex items-start gap-3 ${
          r.priority === 'urgent' ? 'bg-red-50 border-red-500' :
          r.priority === 'high' ? 'bg-orange-50 border-orange-500' :
          'bg-blue-50 border-blue-500'
        }`}>
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            r.priority === 'urgent' ? 'text-red-500' :
            r.priority === 'high' ? 'text-orange-500' : 'text-blue-500'
          }`} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-gray-800">{r.title}</p>
            <p className="text-xs text-gray-600 mt-1">{r.description}</p>
            <p className="text-xs text-gray-400 mt-1">تاريخ التذكير: {r.trigger_date}</p>
          </div>
          <button onClick={() => onDismiss(r.id)} className="px-3 py-1.5 bg-white rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 transition border border-gray-200">
            تجاهل
          </button>
        </div>
      ))}
    </div>
  );
}

function TechnicalSummary({ item }: { item: any }) {
  const technicalFields = Object.entries(item || {}).filter(([key, value]) =>
    !['id', 'product_name', 'label', 'quantity', 'price', 'total', 'created_at', 'updated_at'].includes(key) &&
    value !== null && value !== undefined && value !== '' && typeof value !== 'object'
  );

  if (technicalFields.length === 0) return null;

  return (
    <div className="space-y-1 text-xs text-gray-600">
      {technicalFields.map(([key, value]) => (
        <div key={key} className="flex justify-between gap-3">
          <span className="text-gray-400">{key.replace(/_/g, ' ')}</span>
          <span className="font-medium text-gray-700 text-left">{String(value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function UnifiedOrdersPage() {
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    productType: 'all', status: 'all', priority: 'all', searchQuery: '', dateRange: 'all',
  });
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [reminders, setReminders] = useState<OrderReminder[]>([]);
  const [companyContacts, setCompanyContacts] = useState<CompanyContact[]>([]);
  const [tailors, setTailors] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showAssignTailor, setShowAssignTailor] = useState<string | null>(null);
  const [showAssignContact, setShowAssignContact] = useState<string | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, remindersData, contactsData, tailorsData] = await Promise.all([
        fetchUnifiedOrders(),
        fetchActiveReminders(),
        fetchCompanyContacts(),
        supabase.from('tailors').select('*').eq('active', true).order('full_name'),
      ]);
      setOrders(ordersData);
      setReminders(remindersData);
      setCompanyContacts(contactsData);
      setTailors(tailorsData.data || []);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(o =>
        (o.customer_name?.toLowerCase().includes(q) || false) ||
        (o.customer_phone?.includes(q) || false) ||
        (o.order_number?.toLowerCase().includes(q) || false) ||
        (o.tailor_name?.toLowerCase().includes(q) || false)
      );
    }
    if (filters.productType !== 'all') result = result.filter(o => o.product_type === filters.productType);
    if (filters.status !== 'all') result = result.filter(o => o.workflow_status === filters.status);
    if (filters.priority !== 'all') {
      result = result.filter(o => getPriorityLevel(getDaysLeft(o.delivery_date)).level === filters.priority);
    }
    if (filters.dateRange !== 'all') {
      const today = new Date(); today.setHours(0,0,0,0);
      result = result.filter(o => {
        if (!o.delivery_date) return false;
        const d = new Date(o.delivery_date); d.setHours(0,0,0,0);
        const diff = Math.ceil((d.getTime() - today.getTime()) / (1000*60*60*24));
        switch (filters.dateRange) {
          case 'today': return diff === 0;
          case 'week': return diff >= 0 && diff <= 7;
          case 'month': return diff >= 0 && diff <= 30;
          case 'overdue': return diff < 0;
          default: return true;
        }
      });
    }
    result.sort((a, b) => {
      let c = 0;
      switch (sortField) {
        case 'date': c = new Date(a.created_at||0).getTime() - new Date(b.created_at||0).getTime(); break;
        case 'delivery': c = new Date(a.delivery_date||'9999-12-31').getTime() - new Date(b.delivery_date||'9999-12-31').getTime(); break;
        case 'amount': c = (a.total_amount||0) - (b.total_amount||0); break;
        case 'status': c = (a.workflow_status||'').localeCompare(b.workflow_status||''); break;
        case 'customer': c = (a.customer_name||'').localeCompare(b.customer_name||''); break;
      }
      return sortDir === 'asc' ? c : -c;
    });
    return result;
  }, [orders, filters, sortField, sortDir]);

  const stats = useMemo(() => {
    const total = orders.length;
    const urgent = orders.filter(o => getPriorityLevel(getDaysLeft(o.delivery_date)).level === 'urgent').length;
    const high = orders.filter(o => getPriorityLevel(getDaysLeft(o.delivery_date)).level === 'high').length;
    const revenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const remaining = orders.reduce((s, o) => s + (o.remaining_amount || 0), 0);
    const todayDel = orders.filter(o => getDaysLeft(o.delivery_date) === 0).length;
    return { total, urgent, high, revenue, remaining, todayDel };
  }, [orders]);

  const handleDismissReminder = async (id: string) => {
    await dismissReminder(id, 'المدير');
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleArchive = async (orderId: string) => {
    if (!confirm('هل أنت متأكد من أرشفة هذه الطلبية؟')) return;
    setActionLoading(orderId);
    await archiveOrder(orderId, 'المدير');
    await loadData();
    setActionLoading(null);
  };

  const handleAssignTailor = async (orderId: string, tailorId: string | null) => {
    setActionLoading(orderId);
    await assignTailor(orderId, tailorId);
    setShowAssignTailor(null);
    await loadData();
    setActionLoading(null);
  };

  const handleAssignContact = async (orderId: string, contactId: string | null) => {
    setActionLoading(orderId);
    await assignCompanyContact(orderId, contactId);
    setShowAssignContact(null);
    await loadData();
    setActionLoading(null);
  };

  const handleStatusChange = async (orderId: string, status: WorkflowStatus) => {
    setActionLoading(orderId);
    await updateOrderWorkflowStatus(orderId, status);
    setShowStatusMenu(null);
    await loadData();
    setActionLoading(null);
  };

  const handleExportCSV = () => {
    const headers = ['رقم الطلبية','الزبون','الهاتف','المنتج','الحالة','المبلغ الإجمالي','التسبيق','الباقي','موعد التسليم','الخياط','تاريخ الإنشاء'];
    const rows = filteredOrders.map(o => [
      o.order_number, o.customer_name||'', o.customer_phone||'',
      getProductLabel(o.product_type), getWorkflowStatusLabel(o.workflow_status),
      o.total_amount||0, o.deposit_amount||0, o.remaining_amount||0,
      o.delivery_date||'', o.tailor_name||'', o.created_at||''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleCopyTrackingLink = async (order: UnifiedOrder) => {
    const token = order.tracking_token || await getOrCreateTrackingToken(order.id);
    const url = `${window.location.origin}/track/${token}`;
    await navigator.clipboard.writeText(url);
    alert('تم نسخ رابط التتبع!');
  };

  const handleSendWhatsApp = (phone: string, message: string) => {
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className="min-h-screen bg-[#F0EDE8]" dir="rtl">
      <header className="bg-white border-b border-[#E8E4DC] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1B5E38] rounded-xl flex items-center justify-center text-white">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1B5E38]">إدارة الطلبيات</h1>
                <p className="text-sm text-gray-500">جميع الطلبيات في مكان واحد</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition ${showFilters ? 'bg-[#1B5E38] text-white' : 'bg-[#F5F0E8] text-gray-700 hover:bg-[#E8E4DC]'}`}>
                <Filter className="w-4 h-4" />
                الفلاتر
              </button>
              <button onClick={handleExportCSV} className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 bg-[#F5F0E8] text-gray-700 hover:bg-[#E8E4DC] transition">
                <FileSpreadsheet className="w-4 h-4" />
                تصدير CSV
              </button>
              <button onClick={loadData} className="p-2 rounded-xl bg-[#F5F0E8] text-gray-700 hover:bg-[#E8E4DC] transition">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={Package} label="إجمالي الطلبيات" value={stats.total} color="#1B5E38" bg="bg-white" />
          <StatCard icon={AlertTriangle} label="عاجلة" value={stats.urgent} color="#DC2626" bg="bg-red-50" trend="🔴" />
          <StatCard icon={Calendar} label="قريبة" value={stats.high} color="#F59E0B" bg="bg-amber-50" trend="🟡" />
              <StatCard icon={CheckCircle} label="تسليمات اليوم" value={stats.todayDel} color="#059669" bg="bg-emerald-50" />
              <StatCard icon={Zap} label="المبيعات" value={formatCurrency(stats.revenue)} color="#7C3AED" bg="bg-purple-50" />
              <StatCard icon={Bell} label="المتبقي" value={formatCurrency(stats.remaining)} color="#DC2626" bg="bg-red-50" />
            </div>

            {reminders.length > 0 && (
              <ReminderBanner reminders={reminders} onDismiss={handleDismissReminder} />
            )}

            {showFilters && (
              <div className="bg-white rounded-2xl p-5 border border-[#E8E4DC] shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">نوع المنتج</label>
                    <select
                      value={filters.productType}
                      onChange={(e) => setFilters(f => ({ ...f, productType: e.target.value as any }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-[#FAFAF8] focus:ring-2 focus:ring-[#1B5E38] focus:border-transparent outline-none"
                    >
                      <option value="all">الكل</option>
                      <option value="salon">ثوب الصالون</option>
                      <option value="khamiya">الخامية</option>
                      <option value="romani">الصالون الرومي</option>
                      <option value="bounge">البونج</option>
                      <option value="tapis">الزربية</option>
                      <option value="wood">العود</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">الحالة</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(f => ({ ...f, status: e.target.value as any }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-[#FAFAF8] focus:ring-2 focus:ring-[#1B5E38] focus:border-transparent outline-none"
                    >
                      <option value="all">الكل</option>
                      <option value="new">جديد</option>
                      <option value="review">قيد المراجعة</option>
                      <option value="tailor_assigned">تم تعيين الخياط</option>
                      <option value="cutting">التقطيع</option>
                      <option value="sewing">الخياطة</option>
                      <option value="quality_check">فحص الجودة</option>
                      <option value="ready">جاهز</option>
                      <option value="delivered">مُسلّم</option>
                      <option value="cancelled">ملغى</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">الأولوية</label>
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value as any }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-[#FAFAF8] focus:ring-2 focus:ring-[#1B5E38] focus:border-transparent outline-none"
                    >
                      <option value="all">الكل</option>
                      <option value="urgent">🔴 عاجل</option>
                      <option value="high">🟡 قريب</option>
                      <option value="normal">🔵 عادي</option>
                      <option value="low">🟢 مريح</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">فترة التسليم</label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => setFilters(f => ({ ...f, dateRange: e.target.value as any }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-[#FAFAF8] focus:ring-2 focus:ring-[#1B5E38] focus:border-transparent outline-none"
                    >
                      <option value="all">الكل</option>
                      <option value="today">اليوم</option>
                      <option value="week">هذا الأسبوع</option>
                      <option value="month">هذا الشهر</option>
                      <option value="overdue">متأخرة</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <p className="text-sm text-gray-500">النتائج: <span className="font-bold text-gray-800">{filteredOrders.length}</span> طلبية</p>
                  <button
                    onClick={() => setFilters({ productType: 'all', status: 'all', priority: 'all', searchQuery: '', dateRange: 'all' })}
                    className="text-sm text-[#1B5E38] font-bold hover:underline"
                  >
                    إعادة تعيين الفلاتر
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-[#E8E4DC] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E8E4DC] flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ابحث باسم الزبون، الهاتف، رقم الطلبية..."
                    value={filters.searchQuery}
                    onChange={(e) => setFilters(f => ({ ...f, searchQuery: e.target.value }))}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-[#FAFAF8] focus:ring-2 focus:ring-[#1B5E38] focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex items-center gap-1">
                  {(['date','delivery','amount','status','customer'] as SortField[]).map(field => (
                    <button
                      key={field}
                      onClick={() => {
                        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                        else { setSortField(field); setSortDir('desc'); }
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                        sortField === field ? 'bg-[#1B5E38] text-white' : 'bg-[#F5F0E8] text-gray-600 hover:bg-[#E8E4DC]'
                      }`}
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      {field === 'date' ? 'التاريخ' : field === 'delivery' ? 'التسليم' : field === 'amount' ? 'المبلغ' : field === 'status' ? 'الحالة' : 'الزبون'}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-10 h-10 border-3 border-[#1B5E38] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">جاري تحميل الطلبيات...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-bold">لا توجد طلبيات مطابقة</p>
                  <p className="text-gray-400 text-sm mt-1">جرب تغيير الفلاتر أو البحث</p>
                </div>
              ) : (
                <div className="divide-y divide-[#E8E4DC]">
                  {filteredOrders.map((order) => {
                    const daysLeft = getDaysLeft(order.delivery_date);
                    const priority = getPriorityLevel(daysLeft);
                    const isExpanded = expandedOrder === order.id;

                    return (
                      <div key={order.id} className={`transition-colors ${isExpanded ? 'bg-[#FAFAF8]' : 'hover:bg-[#FAFAF8]'}`}>
                        <div
                          onClick={() => toggleExpand(order.id)}
                          className="p-4 cursor-pointer"
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${priority.bg}`}>
                              {getProductIcon(order.product_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-bold text-gray-800">{order.order_number}</span>
                                <ProductBadge type={order.product_type} />
                                <StatusBadge status={order.workflow_status} />
                                <PriorityBadge daysLeft={daysLeft} />
                                {order.pending_reminders && order.pending_reminders > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-100 text-red-700 text-xs font-bold">
                                    <Bell className="w-3 h-3" />
                                    {order.pending_reminders} تذكير
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {order.customer_name || '—'}</span>
                                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {order.customer_phone || '—'}</span>
                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {order.delivery_date || '—'}</span>
                                <span className="flex items-center gap-1 font-bold text-gray-700">{formatCurrency(order.total_amount)}</span>
                                {order.tailor_name && (
                                  <span className="flex items-center gap-1"><Scissors className="w-3.5 h-3.5" /> {order.tailor_name}</span>
                                )}
                              </div>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 mt-2 ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-[#E8E4DC] pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="bg-white rounded-xl p-4 border border-gray-100">
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">معلومات الزبون</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between"><span className="text-gray-500">الاسم</span><span className="font-bold">{order.customer_name || '—'}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-500">الهاتف</span><span className="font-bold" dir="ltr">{order.customer_phone || '—'}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-500">المدينة</span><span className="font-bold">{order.customer_city || '—'}</span></div>
                                </div>
                              </div>
                              <div className="bg-white rounded-xl p-4 border border-gray-100">
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">المعلومات المالية</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between"><span className="text-gray-500">الإجمالي</span><span className="font-bold text-[#1B5E38]">{formatCurrency(order.total_amount)}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-500">التسبيق</span><span className="font-bold text-blue-600">{formatCurrency(order.deposit_amount)}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-500">المتبقي</span><span className="font-bold text-red-600">{formatCurrency(order.remaining_amount)}</span></div>
                                </div>
                              </div>
                              <div className="bg-white rounded-xl p-4 border border-gray-100 md:col-span-1">
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">التفاصيل التقنية</h4>
                                <div className="space-y-2 text-sm mb-3">
                                  <div className="flex justify-between"><span className="text-gray-500">المنتج</span><span className="font-bold">{getProductLabel(order.product_type)}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-500">الحالة</span><span className="font-bold">{getWorkflowStatusLabel(order.workflow_status)}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-500">التأخيرات</span><span className="font-bold">{order.delay_count || 0} مرة</span></div>
                                </div>
                                {order.items?.map((item: any) => (
                                  <div key={item.id} className="border-t pt-2 mt-2">
                                    <p className="font-bold text-xs mb-2">{item.product_name || item.label || 'منتج'} × {item.quantity || 1}</p>
                                    <TechnicalSummary item={item} />
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Link href={`/admin/orders/${order.id}`} className="px-4 py-2 rounded-xl bg-[#1B5E38] text-white text-sm font-bold flex items-center gap-2 hover:bg-[#144d2e] transition">
                                <Eye className="w-4 h-4" />
                                عرض التفاصيل الكاملة
                              </Link>

                              {['salon','khamiya','romani'].includes(order.product_type||'') && (
                                <div className="relative">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setShowAssignTailor(showAssignTailor === order.id ? null : order.id); }}
                                    className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-bold flex items-center gap-2 hover:bg-indigo-100 transition"
                                  >
                                    <Scissors className="w-4 h-4" />
                                    {order.tailor_name ? 'تغيير الخياط' : 'تعيين خياط'}
                                  </button>
                                  {showAssignTailor === order.id && (
                                    <div className="absolute z-20 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2">
                                      <p className="text-xs font-bold text-gray-400 px-2 py-1">اختر الخياط</p>
                                      {tailors.map(t => (
                                        <button
                                          key={t.id}
                                          onClick={() => handleAssignTailor(order.id, t.id)}
                                          className="w-full text-right px-3 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center justify-between"
                                        >
                                          <span>{t.full_name}</span>
                                          {order.assigned_tailor_id === t.id && <CheckCircle className="w-4 h-4 text-green-500" />}
                                        </button>
                                      ))}
                                      {order.assigned_tailor_id && (
                                        <button
                                          onClick={() => handleAssignTailor(order.id, null)}
                                          className="w-full text-right px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 mt-1 border-t border-gray-100"
                                        >
                                          إلغاء التعيين
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {order.product_type === 'bounge' && (
                                <div className="relative">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setShowAssignContact(showAssignContact === order.id ? null : order.id); }}
                                    className="px-4 py-2 rounded-xl bg-orange-50 text-orange-700 text-sm font-bold flex items-center gap-2 hover:bg-orange-100 transition"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                    {order.company_name ? 'تغيير الشركة' : 'تعيين شركة'}
                                  </button>
                                  {showAssignContact === order.id && (
                                    <div className="absolute z-20 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-2">
                                      <p className="text-xs font-bold text-gray-400 px-2 py-1">اختر الشركة</p>
                                      {companyContacts.filter(c => c.category === 'bounge').map(c => (
                                        <button
                                          key={c.id}
                                          onClick={() => handleAssignContact(order.id, c.id)}
                                          className="w-full text-right px-3 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center justify-between"
                                        >
                                          <div>
                                            <p className="font-bold">{c.company_name}</p>
                                            <p className="text-xs text-gray-400">{c.phone}</p>
                                          </div>
                                          {order.company_contact_id === c.id && <CheckCircle className="w-4 h-4 text-green-500" />}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="relative">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setShowStatusMenu(showStatusMenu === order.id ? null : order.id); }}
                                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold flex items-center gap-2 hover:bg-gray-200 transition"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  تغيير الحالة
                                </button>
                                {showStatusMenu === order.id && (
                                  <div className="absolute z-20 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2">
                                    {(['new','review','tailor_assigned','cutting','sewing','quality_check','ready','delivered','cancelled'] as WorkflowStatus[]).map(s => (
                                      <button
                                        key={s}
                                        onClick={() => handleStatusChange(order.id, s)}
                                        className="w-full text-right px-3 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center justify-between"
                                      >
                                        <span>{getWorkflowStatusLabel(s)}</span>
                                        {order.workflow_status === s && <CheckCircle className="w-4 h-4 text-green-500" />}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={(e) => { e.stopPropagation(); handleCopyTrackingLink(order); }}
                                className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-bold flex items-center gap-2 hover:bg-blue-100 transition"
                              >
                                <ClipboardCopy className="w-4 h-4" />
                                نسخ رابط التتبع
                              </button>

                              {order.customer_phone && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleSendWhatsApp(order.customer_phone!, `مرحباً ${order.customer_name}، طلبيتك ${order.order_number} قيد المتابعة.`); }}
                                  className="px-4 py-2 rounded-xl bg-green-50 text-green-700 text-sm font-bold flex items-center gap-2 hover:bg-green-100 transition"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  واتساب الزبون
                                </button>
                              )}

                              <button
                                onClick={(e) => { e.stopPropagation(); handleArchive(order.id); }}
                                disabled={actionLoading === order.id}
                                className="px-4 py-2 rounded-xl bg-red-50 text-red-700 text-sm font-bold flex items-center gap-2 hover:bg-red-100 transition disabled:opacity-50"
                              >
                                <Archive className="w-4 h-4" />
                                {actionLoading === order.id ? 'جاري...' : 'أرشفة'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      );
    }