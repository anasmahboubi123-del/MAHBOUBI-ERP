'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  fetchOrderById, fetchWorkflowSteps, fetchCarpenterPayments,
  fetchOrderReminders, fetchDelayLogs, fetchInvoiceArchive,
  getTrackingSteps, addCarpenterPayment, deleteCarpenterPayment,
  startWorkflowStep, completeWorkflowStep, logDeliveryDelay,
  updateOrderWorkflowStatus, archiveOrder, getOrCreateTrackingToken,
  formatCurrency, getDaysLeft, getPriorityLevel,
  getProductLabel, getWorkflowStatusLabel, getCarpenterRemaining,
  type UnifiedOrder, type WorkflowStep, type CarpenterPayment,
  type OrderReminder, type DelayLog, type InvoiceArchiveItem,
} from '@/lib/orders-unified';
import {
  ArrowRight, Calendar, User, Phone, MapPin, Package,
  Scissors, CheckCircle, Clock, AlertTriangle, Bell,
  DollarSign, CreditCard, FileText, Image, MessageSquare,
  ClipboardCopy, Archive, RotateCcw, ChevronDown, ChevronUp,
  Plus, Trash2, Save, Send,
} from 'lucide-react';

type TabType = 'info' | 'workflow' | 'payments' | 'reminders' | 'delays' | 'invoices';

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<UnifiedOrder | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [payments, setPayments] = useState<CarpenterPayment[]>([]);
  const [reminders, setReminders] = useState<OrderReminder[]>([]);
  const [delays, setDelays] = useState<DelayLog[]>([]);
  const [invoices, setInvoices] = useState<InvoiceArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [actionLoading, setActionLoading] = useState(false);

  // Forms
  const [newPayment, setNewPayment] = useState({ amount: '', date: '', notes: '' });
  const [delayForm, setDelayForm] = useState({ newDate: '', reason: '', sendApology: true });
  const [trackingUrl, setTrackingUrl] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [o, s, p, r, d, i] = await Promise.all([
        fetchOrderById(orderId),
        getTrackingSteps(orderId),
        fetchCarpenterPayments(orderId),
        fetchOrderReminders(orderId),
        fetchDelayLogs(orderId),
        fetchInvoiceArchive(orderId),
      ]);
      setOrder(o);
      setSteps(s);
      setPayments(p);
      setReminders(r);
      setDelays(d);
      setInvoices(i);
      if (o) {
        const token = await getOrCreateTrackingToken(o.id);
        setTrackingUrl(`${window.location.origin}/track/${token}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [orderId]);

  const handleStepStart = async (stepId: string) => {
    setActionLoading(true);
    await startWorkflowStep(stepId);
    await loadAll();
    setActionLoading(false);
  };

  const handleStepComplete = async (stepId: string) => {
    setActionLoading(true);
    await completeWorkflowStep(stepId, 'المدير');
    await loadAll();
    setActionLoading(false);
  };

  const handleAddPayment = async () => {
    if (!newPayment.amount || !newPayment.date) return;
    setActionLoading(true);
    await addCarpenterPayment({
      order_id: orderId,
      amount: parseFloat(newPayment.amount),
      payment_date: newPayment.date,
      notes: newPayment.notes || null,
      receipt_url: null,
      created_by: 'المدير',
    });
    setNewPayment({ amount: '', date: '', notes: '' });
    await loadAll();
    setActionLoading(false);
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدفعة؟')) return;
    setActionLoading(true);
    await deleteCarpenterPayment(id);
    await loadAll();
    setActionLoading(false);
  };

  const handleDelaySubmit = async () => {
    if (!delayForm.newDate) return;
    setActionLoading(true);
    await logDeliveryDelay({
      order_id: orderId,
      old_delivery_date: order?.delivery_date || null,
      new_delivery_date: delayForm.newDate,
      reason: delayForm.reason || null,
      apology_message: delayForm.sendApology ? `نعتذر عن التأخير، موعد التسليم الجديد: ${delayForm.newDate}` : null,
      apology_sent: false,
      sent_at: null,
      created_by: 'المدير',
    });
    setDelayForm({ newDate: '', reason: '', sendApology: true });
    await loadAll();
    setActionLoading(false);
  };

  const handleArchive = async () => {
    if (!confirm('أرشفة الطلبية؟')) return;
    setActionLoading(true);
    await archiveOrder(orderId, 'المدير');
    await loadAll();
    setActionLoading(false);
  };

  const copyTracking = () => {
    navigator.clipboard.writeText(trackingUrl);
    alert('تم النسخ!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0EDE8] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1B5E38] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F0EDE8] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-bold">الطلبية غير موجودة</p>
          <Link href="/admin/orders" className="text-[#1B5E38] font-bold mt-4 inline-block hover:underline">
            العودة للطلبيات
          </Link>
        </div>
      </div>
    );
  }

  const daysLeft = getDaysLeft(order.delivery_date);
  const priority = getPriorityLevel(daysLeft);
  const carpenterRemaining = getCarpenterRemaining(order);

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'info', label: 'المعلومات', icon: Package },
    { key: 'workflow', label: 'مسار العمل', icon: Scissors },
    { key: 'payments', label: 'الأقساط', icon: DollarSign },
    { key: 'reminders', label: 'التذكيرات', icon: Bell },
    { key: 'delays', label: 'التأجيلات', icon: Clock },
    { key: 'invoices', label: 'الفواتير', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#F0EDE8]" dir="rtl">
      <header className="bg-white border-b border-[#E8E4DC]">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Link href="/admin/orders" className="p-2 rounded-xl bg-[#F5F0E8] hover:bg-[#E8E4DC] transition">
                <ArrowRight className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-800">{order.order_number}</h1>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${priority.bg} ${priority.color}`}>
                    {priority.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{getProductLabel(order.product_type)} • {getWorkflowStatusLabel(order.workflow_status)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={copyTracking} className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-bold flex items-center gap-2 hover:bg-blue-100 transition">
                <ClipboardCopy className="w-4 h-4" />
                رابط التتبع
              </button>
              <button onClick={handleArchive} disabled={actionLoading} className="px-3 py-2 rounded-xl bg-red-50 text-red-700 text-sm font-bold flex items-center gap-2 hover:bg-red-100 transition disabled:opacity-50">
                <Archive className="w-4 h-4" />
                أرشفة
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-[#E8E4DC]">
            <p className="text-xs font-bold text-gray-400 mb-1">الزبون</p>
            <p className="font-bold text-gray-800 flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /> {order.customer_name || '—'}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8E4DC]">
            <p className="text-xs font-bold text-gray-400 mb-1">الهاتف</p>
            <p className="font-bold text-gray-800 flex items-center gap-2" dir="ltr"><Phone className="w-4 h-4 text-gray-400" /> {order.customer_phone || '—'}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8E4DC]">
            <p className="text-xs font-bold text-gray-400 mb-1">موعد التسليم</p>
            <p className="font-bold text-gray-800 flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /> {order.delivery_date || '—'} <span className="text-xs text-gray-400">({daysLeft >= 0 ? `${daysLeft} يوم` : `${Math.abs(daysLeft)} يوم متأخر`})</span></p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8E4DC]">
            <p className="text-xs font-bold text-gray-400 mb-1">المبلغ الإجمالي</p>
            <p className="font-bold text-[#1B5E38] text-lg">{formatCurrency(order.total_amount)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
          <div className="flex overflow-x-auto border-b border-[#E8E4DC]">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-bold flex items-center gap-2 whitespace-nowrap transition border-b-2 ${
                  activeTab === tab.key
                    ? 'border-[#1B5E38] text-[#1B5E38] bg-[#F5F0E8]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Package className="w-5 h-5 text-[#1B5E38]" /> معلومات الطلبية</h3>
                    <div className="bg-[#FAFAF8] rounded-xl p-4 space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">رقم الطلبية</span><span className="font-bold">{order.order_number}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">نوع المنتج</span><span className="font-bold">{getProductLabel(order.product_type)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">الحالة الحالية</span><span className="font-bold">{getWorkflowStatusLabel(order.workflow_status)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">المدينة</span><span className="font-bold">{order.customer_city || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">ملاحظات</span><span className="font-bold">{order.notes || '—'}</span></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><DollarSign className="w-5 h-5 text-[#1B5E38]" /> المعلومات المالية</h3>
                    <div className="bg-[#FAFAF8] rounded-xl p-4 space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">المبلغ الإجمالي</span><span className="font-bold text-[#1B5E38]">{formatCurrency(order.total_amount)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">التسبيق</span><span className="font-bold text-blue-600">{formatCurrency(order.deposit_amount)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">المبلغ المتبقي</span><span className="font-bold text-red-600">{formatCurrency(order.remaining_amount)}</span></div>
                      {order.product_type === 'wood' && (
                        <div className="flex justify-between border-t border-gray-200 pt-2 mt-2"><span className="text-gray-500">مدفوع للنجار</span><span className="font-bold text-amber-600">{formatCurrency(order.total_carpenter_paid)}</span></div>
                      )}
                    </div>
                  </div>
                </div>

                {order.payload && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><FileText className="w-5 h-5 text-[#1B5E38]" /> التفاصيل التقنية</h3>
                    <div className="bg-[#FAFAF8] rounded-xl p-4">
                      <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(order.payload, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {order.tailor_name && (
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                    <h3 className="font-bold text-indigo-800 flex items-center gap-2 mb-2"><Scissors className="w-5 h-5" /> معلومات الخياط</h3>
                    <p className="text-sm text-indigo-700">الاسم: <span className="font-bold">{order.tailor_name}</span></p>
                    <p className="text-sm text-indigo-700">الهاتف: <span className="font-bold" dir="ltr">{order.tailor_phone || '—'}</span></p>
                  </div>
                )}

                {order.company_name && (
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                    <h3 className="font-bold text-orange-800 flex items-center gap-2 mb-2"><MessageSquare className="w-5 h-5" /> جهة الاتصال (الشركة)</h3>
                    <p className="text-sm text-orange-700">الشركة: <span className="font-bold">{order.company_name}</span></p>
                    <p className="text-sm text-orange-700">الهاتف: <span className="font-bold" dir="ltr">{order.company_phone || '—'}</span></p>
                    {order.company_whatsapp && (
                      <a href={`https://wa.me/${order.company_whatsapp.replace(/\D/g,'')}`} target="_blank" className="inline-flex items-center gap-1 mt-2 text-sm text-green-600 font-bold hover:underline">
                        <MessageSquare className="w-4 h-4" /> واتساب
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'workflow' && (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Scissors className="w-5 h-5 text-[#1B5E38]" /> مسار العمل</h3>
                <div className="space-y-3">
                  {steps.map((step, idx) => (
                    <div key={step.id} className={`flex items-center gap-4 p-4 rounded-xl border ${
                      step.status === 'completed' ? 'bg-green-50 border-green-200' :
                      step.status === 'in_progress' ? 'bg-amber-50 border-amber-200' :
                      'bg-white border-gray-200'
                    }`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                        step.status === 'completed' ? 'bg-green-500 text-white' :
                        step.status === 'in_progress' ? 'bg-amber-500 text-white' :
                        'bg-gray-200 text-gray-500'
                      }`}>
                        {step.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : step.step_icon || idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{step.step_label}</p>
                        <p className="text-xs text-gray-500">
                          {step.status === 'completed' ? `تم الإنجاز: ${step.completed_at?.split('T')[0] || ''}` :
                           step.status === 'in_progress' ? 'قيد التنفيذ...' : 'في الانتظار'}
                        </p>
                        {step.notes && <p className="text-xs text-gray-400 mt-1">{step.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {step.status === 'pending' && (
                          <button
                            onClick={() => handleStepStart(step.id)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition disabled:opacity-50"
                          >
                            بدأ
                          </button>
                        )}
                        {step.status === 'in_progress' && (
                          <button
                            onClick={() => handleStepComplete(step.id)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition disabled:opacity-50"
                          >
                            إتمام
                          </button>
                        )}
                        {step.status === 'completed' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {steps.length === 0 && <p className="text-gray-400 text-center py-8">لا توجد خطوات مسار عمل لهذا المنتج</p>}
              </div>
            )}

            {activeTab === 'payments' && order.product_type === 'wood' && (
              <div className="space-y-6">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><DollarSign className="w-5 h-5 text-[#1B5E38]" /> أقساط النجار</h3>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700">المبلغ الإجمالي</p>
                    <p className="text-xl font-bold text-amber-800">{formatCurrency(order.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-amber-700">المدفوع</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(order.total_carpenter_paid || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-amber-700">المتبقي</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(carpenterRemaining)}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">إضافة دفعة جديدة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="number"
                      placeholder="المبلغ (DH)"
                      value={newPayment.amount}
                      onChange={e => setNewPayment(p => ({ ...p, amount: e.target.value }))}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#1B5E38] outline-none"
                    />
                    <input
                      type="date"
                      value={newPayment.date}
                      onChange={e => setNewPayment(p => ({ ...p, date: e.target.value }))}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#1B5E38] outline-none"
                    />
                    <input
                      type="text"
                      placeholder="ملاحظات (اختياري)"
                      value={newPayment.notes}
                      onChange={e => setNewPayment(p => ({ ...p, notes: e.target.value }))}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#1B5E38] outline-none"
                    />
                  </div>
                  <button
                    onClick={handleAddPayment}
                    disabled={actionLoading || !newPayment.amount || !newPayment.date}
                    className="mt-3 px-4 py-2 rounded-lg bg-[#1B5E38] text-white text-sm font-bold flex items-center gap-2 hover:bg-[#144d2e] transition disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة الدفعة
                  </button>
                </div>

                <div className="space-y-2">
                  {payments.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
                      <div>
                        <p className="font-bold text-gray-800">{formatCurrency(p.amount)}</p>
                        <p className="text-xs text-gray-500">{p.payment_date} {p.notes && `• ${p.notes}`}</p>
                      </div>
                      <button
                        onClick={() => handleDeletePayment(p.id)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {payments.length === 0 && <p className="text-gray-400 text-center py-8">لا توجد دفعات مسجلة</p>}
                </div>
              </div>
            )}

            {activeTab === 'payments' && order.product_type !== 'wood' && (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500">نظام الأقساط متاح فقط لطلبيات العود</p>
              </div>
            )}

            {activeTab === 'reminders' && (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Bell className="w-5 h-5 text-[#1B5E38]" /> التذكيرات</h3>
                <div className="space-y-2">
                  {reminders.map(r => (
                    <div key={r.id} className={`p-4 rounded-xl border-r-4 ${
                      r.priority === 'urgent' ? 'bg-red-50 border-red-500' :
                      r.priority === 'high' ? 'bg-orange-50 border-orange-500' :
                      'bg-blue-50 border-blue-500'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">{r.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{r.description}</p>
                          <p className="text-xs text-gray-400 mt-1">تاريخ التذكير: {r.trigger_date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.is_triggered ? (
                            <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold">تم</span>
                          ) : r.is_dismissed ? (
                            <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold">تم التجاهل</span>
                          ) : (
                            <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold">معلق</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {reminders.length === 0 && <p className="text-gray-400 text-center py-8">لا توجد تذكيرات</p>}
                </div>
              </div>
            )}

            {activeTab === 'delays' && (
              <div className="space-y-6">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Clock className="w-5 h-5 text-[#1B5E38]" /> تأجيل موعد التسليم</h3>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">موعد التسليم الجديد</label>
                      <input
                        type="date"
                        value={delayForm.newDate}
                        onChange={e => setDelayForm(f => ({ ...f, newDate: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#1B5E38] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">السبب (اختياري)</label>
                      <input
                        type="text"
                        placeholder="سبب التأجيل..."
                        value={delayForm.reason}
                        onChange={e => setDelayForm(f => ({ ...f, reason: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#1B5E38] outline-none"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <input
                      type="checkbox"
                      checked={delayForm.sendApology}
                      onChange={e => setDelayForm(f => ({ ...f, sendApology: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-[#1B5E38] focus:ring-[#1B5E38]"
                    />
                    إرسال رسالة اعتذار للزبون
                  </label>
                  <button
                    onClick={handleDelaySubmit}
                    disabled={actionLoading || !delayForm.newDate}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    تأجيل وإرسال اعتذار
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-gray-700">سجل التأجيلات</h4>
                  {delays.map(d => (
                    <div key={d.id} className="p-4 bg-white rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {d.old_delivery_date || '—'} → <span className="text-red-600">{d.new_delivery_date}</span>
                          </p>
                          {d.reason && <p className="text-xs text-gray-500 mt-1">السبب: {d.reason}</p>}
                        </div>
                        <span className="text-xs text-gray-400">{d.created_at?.split('T')[0]}</span>
                      </div>
                    </div>
                  ))}
                  {delays.length === 0 && <p className="text-gray-400 text-center py-4">لا توجد تأجيلات مسجلة</p>}
                </div>
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><FileText className="w-5 h-5 text-[#1B5E38]" /> أرشيف الفواتير</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {invoices.map(inv => (
                    <div key={inv.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {inv.invoice_image_url && (
                        <img src={inv.invoice_image_url} alt="فاتورة" className="w-full h-48 object-cover" />
                      )}
                      <div className="p-4">
                        <p className="font-bold text-sm">{inv.invoice_number || 'فاتورة بدون رقم'}</p>
                        <p className="text-xs text-gray-500 mt-1">{inv.supplier_name || '—'} • {formatCurrency(inv.amount)}</p>
                        <p className="text-xs text-gray-400 mt-1">{inv.invoice_date || '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {invoices.length === 0 && <p className="text-gray-400 text-center py-8">لا توجد فواتير مسجلة</p>}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}