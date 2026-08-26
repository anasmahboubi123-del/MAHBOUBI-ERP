'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getOrderByTrackingToken, getTrackingSteps, formatCurrency, getProductLabel, getWorkflowStatusLabel, type UnifiedOrder, type WorkflowStep } from '@/lib/orders-unified';
import { Package, CheckCircle, Clock, MapPin, Phone, Calendar, AlertTriangle, Loader2, User } from 'lucide-react';

export default function TrackingPage() {
  const params = useParams();
  const token = params.token as string;

  const [order, setOrder] = useState<UnifiedOrder | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const o = await getOrderByTrackingToken(token);
        if (!o) { setError('الرابط غير صالح أو انتهت صلاحيته'); setLoading(false); return; }
        setOrder(o);
        const s = await getTrackingSteps(o.id);
        setSteps(s);
      } catch (err) {
        setError('حدث خطأ أثناء التحميل');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0EDE8] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#1B5E38] animate-spin mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل تفاصيل طلبيتك...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#F0EDE8] flex items-center justify-center" dir="rtl">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md mx-4">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">عذراً!</h1>
          <p className="text-gray-500">{error || 'الطلبية غير موجودة'}</p>
        </div>
      </div>
    );
  }

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F0EDE8]" dir="rtl">
      <header className="bg-white border-b border-[#E8E4DC]">
        <div className="max-w-2xl mx-auto px-4 py-6 text-center">
          <div className="w-16 h-16 bg-[#1B5E38] rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-4">
            {getProductLabel(order.product_type).charAt(0)}
          </div>
          <h1 className="text-2xl font-bold text-gray-800">El Mahboubi</h1>
          <p className="text-gray-500 mt-1">تتبع طلبيتك</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-[#E8E4DC] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 font-bold">رقم الطلبية</p>
              <p className="text-xl font-bold text-gray-800">{order.order_number}</p>
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-400 font-bold">الحالة</p>
              <p className="text-lg font-bold text-[#1B5E38]">{getWorkflowStatusLabel(order.workflow_status)}</p>
            </div>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
            <div className="bg-[#1B5E38] h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-center text-sm text-gray-500">{progress}% مكتمل</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E8E4DC] shadow-sm space-y-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2"><Package className="w-5 h-5 text-[#1B5E38]" /> معلومات الطلبية</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /> <span className="text-gray-500">الزبون:</span> <span className="font-bold">{order.customer_name || '—'}</span></div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> <span className="text-gray-500">الهاتف:</span> <span className="font-bold" dir="ltr">{order.customer_phone || '—'}</span></div>
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /> <span className="text-gray-500">موعد التسليم:</span> <span className="font-bold">{order.delivery_date || '—'}</span></div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> <span className="text-gray-500">المدينة:</span> <span className="font-bold">{order.customer_city || '—'}</span></div>
          </div>
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-gray-500 text-sm">المبلغ الإجمالي</span>
            <span className="text-xl font-bold text-[#1B5E38]">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E8E4DC] shadow-sm">
          <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><Clock className="w-5 h-5 text-[#1B5E38]" /> مسار العمل</h2>
          <div className="relative">
            <div className="absolute right-5 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-6">
              {steps.map((step, idx) => (
                <div key={step.id} className="relative flex items-start gap-4 pr-2">
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                    step.status === 'completed' ? 'bg-green-500 text-white' :
                    step.status === 'in_progress' ? 'bg-amber-500 text-white ring-4 ring-amber-100' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {step.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className={`font-bold text-sm ${step.status === 'completed' ? 'text-green-700' : step.status === 'in_progress' ? 'text-amber-700' : 'text-gray-500'}`}>
                      {step.step_label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {step.status === 'completed' ? `تم في ${step.completed_at?.split('T')[0] || ''}` :
                       step.status === 'in_progress' ? 'قيد التنفيذ حالياً' : 'في الانتظار'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {steps.length === 0 && <p className="text-gray-400 text-center py-4">لا توجد خطوات مسار عمل</p>}
        </div>

        <div className="text-center text-xs text-gray-400 pt-4">
          <p>El Mahboubi - محل المحبوبي للأثاث والديكور</p>
          <p className="mt-1">للاستفسار: يرجى التواصل معنا عبر الواتساب</p>
        </div>
      </main>
    </div>
  );
}