'use client';

import React, { useState } from 'react';
import { useOrder } from '../context/OrderContext';
import { DollarSign, Banknote, Truck, StickyNote, Receipt } from 'lucide-react';

const C = { green: '#1B5E38', gold: '#C9A84C', dark: '#0D1F17', cream: '#F5F0E8' };

function formatCurrency(n: number): string {
  return n.toLocaleString('ar-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' د.م';
}

export function FinancialPanel() {
  const {
    cart, cartTotals,
    applyDiscount, applyDeposit, updateDeliveryCost, updateNotes, updateDelivery,
  } = useOrder();

  const [discountReason, setDiscountReason] = useState('');

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: C.dark }}>المالية والتوصيل</h2>

      {/* Discount */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold flex items-center gap-2 text-lg">
          <DollarSign className="w-5 h-5" style={{ color: C.gold }} />
          الخصم
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">مبلغ الخصم (درهم)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={cart.financial.discountInput}
              onChange={(e) => {
                const val = e.target.value;
                /* ✅ تحديث العرض فوراً */
                // نحتاج طريقة لتحديث input فقط - لكن الـ context لا يوفرها مباشرة
                // لذا نستخدم applyDiscount مباشرة
                applyDiscount(parseFloat(val) || 0, discountReason);
              }}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 outline-none focus:border-green-600 transition text-left"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">سبب الخصم</label>
            <input
              type="text"
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              placeholder="تخفيض موسمي، زبون دائم..."
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 outline-none focus:border-green-600 transition"
            />
          </div>
        </div>
        {cart.financial.discountAmount > 0 && (
          <p className="text-sm text-red-600 text-center">الخصم المطبق: {formatCurrency(cart.financial.discountAmount)}</p>
        )}
      </div>

      {/* Deposit */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold flex items-center gap-2 text-lg">
          <Banknote className="w-5 h-5" style={{ color: C.gold }} />
          التسبيق (العربون)
        </h3>
        <div>
          <label className="block text-sm text-gray-600 mb-1">مبلغ التسبيق (درهم)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={cart.financial.depositInput}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              applyDeposit(val);
            }}
            placeholder="0.00"
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 outline-none focus:border-green-600 transition text-left"
          />
        </div>
        {cart.financial.depositAmount > 0 && (
          <div className="p-3 rounded-lg text-center" style={{ background: C.green + '10' }}>
            <p className="text-sm text-gray-600">
              مبلغ التسبيق: <span className="font-bold" style={{ color: C.green }}>{formatCurrency(cartTotals.deposit)}</span>
            </p>
            <p className="text-sm text-gray-600">
              المبلغ المتبقي: <span className="font-bold">{formatCurrency(cartTotals.remaining)}</span>
            </p>
          </div>
        )}
      </div>

      {/* Delivery */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold flex items-center gap-2 text-lg">
          <Truck className="w-5 h-5" style={{ color: C.gold }} />
          التوصيل
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {(['pickup', 'home_delivery', 'carrier'] as const).map((m) => (
            <button
              key={m}
              onClick={() => updateDelivery({ method: m })}
              className={`py-2 rounded-lg text-sm font-bold border-2 transition ${
                cart.delivery.method === m ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={cart.delivery.method === m ? { background: C.green, borderColor: C.green } : { borderColor: '#e5e7eb' }}
            >
              {m === 'pickup' && 'استلام من المحل'}
              {m === 'home_delivery' && 'توصيل للمنزل'}
              {m === 'carrier' && 'شركة نقل'}
            </button>
          ))}
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">تكلفة التوصيل (درهم)</label>
          <input
            type="number"
            min="0"
            value={cart.financial.deliveryCost}
            onChange={(e) => updateDeliveryCost(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 outline-none focus:border-green-600 transition text-left"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border-2 overflow-hidden" style={{ borderColor: C.gold }}>
        <div className="p-4" style={{ background: C.gold + '10' }}>
          <h3 className="font-bold flex items-center gap-2" style={{ color: C.dark }}>
            <Receipt className="w-5 h-5" style={{ color: C.gold }} />
            الملخص المالي
          </h3>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex justify-between"><span className="text-gray-600">المجموع الفرعي</span><span className="font-bold">{formatCurrency(cartTotals.subtotal)}</span></div>
          {cartTotals.discount > 0 && <div className="flex justify-between text-red-600"><span>الخصم</span><span className="font-bold">-{formatCurrency(cartTotals.discount)}</span></div>}
          {cartTotals.delivery > 0 && <div className="flex justify-between"><span className="text-gray-600">التوصيل</span><span className="font-bold">{formatCurrency(cartTotals.delivery)}</span></div>}
          <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>الإجمالي</span><span style={{ color: C.gold }}>{formatCurrency(cartTotals.total)}</span></div>
          {cartTotals.deposit > 0 && (
            <>
              <div className="flex justify-between text-sm"><span className="text-gray-500">التسبيق</span><span className="font-bold">{formatCurrency(cartTotals.deposit)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">الباقي</span><span className="font-bold">{formatCurrency(cartTotals.remaining)}</span></div>
            </>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold flex items-center gap-2 text-lg">
          <StickyNote className="w-5 h-5" style={{ color: C.gold }} />
          الملاحظات
        </h3>
        <div>
          <label className="block text-sm text-gray-600 mb-1">ملاحظات للزبون</label>
          <textarea
            value={cart.notes.customer}
            onChange={(e) => updateNotes('customer', e.target.value)}
            placeholder="تظهر على المستند..."
            rows={2}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 outline-none focus:border-green-600 transition resize-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">ملاحظات داخلية</label>
          <textarea
            value={cart.notes.internal}
            onChange={(e) => updateNotes('internal', e.target.value)}
            placeholder="لا تظهر للزبون..."
            rows={2}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 outline-none focus:border-green-600 transition resize-none bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">ملاحظات الإنتاج (للخياط/النجار)</label>
          <textarea
            value={cart.notes.production}
            onChange={(e) => updateNotes('production', e.target.value)}
            placeholder="تفاصيل تقنية للورشة..."
            rows={2}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 outline-none focus:border-green-600 transition resize-none bg-amber-50"
          />
        </div>
      </div>
    </div>
  );
}