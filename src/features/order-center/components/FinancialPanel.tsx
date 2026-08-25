'use client';

import React, { useState } from 'react';
import { useOrderCart } from '@/contexts/OrderCartContext';
import { DollarSign, Percent, Wallet, CreditCard, AlertCircle, Lock, ChevronDown } from 'lucide-react';

const C = { green: '#1B5E38', gold: '#C9A84C', dark: '#0D1F17', cream: '#F5F0E8' };

const DISCOUNT_REASONS = [
  { value: 'loyal_customer', label: 'عميل دائم' },
  { value: 'seasonal_offer', label: 'عرض موسمي' },
  { value: 'fabric_defect', label: 'عطل في القماش' },
  { value: 'bulk_order', label: 'طلبية كبيرة' },
  { value: 'other', label: 'سبب آخر (اكتب)' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'نقدي', icon: Wallet },
  { value: 'card', label: 'بطاقة بنكية', icon: CreditCard },
  { value: 'transfer', label: 'تحويل بنكي', icon: DollarSign },
];

export function FinancialPanel() {
  const { cart, getCartTotals, updateFinancials } = useOrderCart();
  const totals = getCartTotals();
  const [managerCode, setManagerCode] = useState('');
  const [showManagerInput, setShowManagerInput] = useState(false);
  const [customReason, setCustomReason] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const financials = cart.financials;

  const handleDiscountChange = (val: string) => {
    const num = Math.max(0, Number(val) || 0);
    updateFinancials({ discount: num });
  };

  const handleDepositChange = (val: string) => {
    const num = Math.max(0, Number(val) || 0);
    updateFinancials({ deposit: num });
  };

  const handleReasonChange = (reason: string) => {
    if (reason === 'other') {
      updateFinancials({ discountReason: customReason });
    } else {
      updateFinancials({ discountReason: reason });
      setCustomReason('');
    }
  };

  const isDepositInvalid = touched.deposit && financials.deposit <= 0;
  const isDiscountInvalid = touched.discount && financials.discount > 0 && !financials.discountReason;

  const remaining = Math.max(0, totals.total - financials.deposit);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: C.dark }}>المالية والتوصيل</h2>

      {/* Totals summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-gray-700 mb-3">ملخص المبالغ</h3>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">المجموع الفرعي</span>
          <span className="font-bold">{totals.subtotal.toFixed(2)} د.م</span>
        </div>
        {financials.discount > 0 && (
          <div className="flex justify-between text-sm text-red-600">
            <span>الخصم</span>
            <span className="font-bold">-{financials.discount.toFixed(2)} د.م</span>
          </div>
        )}
        <div className="border-t pt-2 flex justify-between text-lg font-bold">
          <span>الإجمالي</span>
          <span style={{ color: C.gold }}>{totals.total.toFixed(2)} د.م</span>
        </div>
      </div>

      {/* Discount — requires manager code + reason */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Percent className="w-5 h-5" style={{ color: C.green }} />
          <h3 className="font-bold text-gray-800">الخصم</h3>
          <span className="text-xs text-gray-400">(يتطلب كود المدير)</span>
        </div>

        {/* Manager code toggle */}
        <button
          onClick={() => setShowManagerInput(!showManagerInput)}
          className="flex items-center gap-2 text-sm text-green-700 hover:text-green-800 font-semibold"
        >
          <Lock className="w-4 h-4" />
          {showManagerInput ? 'إخفاء كود المدير' : 'إدخال كود المدير للخصم'}
        </button>

        {showManagerInput && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">كود المدير</label>
              <input
                type="password"
                value={managerCode}
                onChange={(e) => setManagerCode(e.target.value)}
                placeholder="أدخل كود المدير..."
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-green-600 transition text-left"
              />
            </div>

            {managerCode.length >= 4 && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">مبلغ الخصم (د.م)</label>
                  <input
                    type="number"
                    min={0}
                    max={totals.subtotal}
                    value={financials.discount || ''}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, discount: true }))}
                    placeholder="0"
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-green-600 transition text-left"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">سبب الخصم</label>
                  <div className="relative">
                    <select
                      value={financials.discountReason || ''}
                      onChange={(e) => handleReasonChange(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-green-600 transition appearance-none bg-white"
                    >
                      <option value="">اختر سبب الخصم...</option>
                      {DISCOUNT_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {financials.discountReason === 'other' && (
                    <input
                      type="text"
                      value={customReason}
                      onChange={(e) => {
                        setCustomReason(e.target.value);
                        updateFinancials({ discountReason: e.target.value });
                      }}
                      placeholder="اكتب سبب الخصم..."
                      className="w-full mt-2 px-4 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-green-600 transition"
                    />
                  )}
                </div>

                {isDiscountInvalid && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> يجب اختيار سبب الخصم
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Deposit — REQUIRED */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-5 h-5" style={{ color: C.green }} />
          <h3 className="font-bold text-gray-800">العربون <span className="text-red-500">*</span></h3>
        </div>

        <input
          type="number"
          min={0}
          max={totals.total}
          value={financials.deposit || ''}
          onChange={(e) => handleDepositChange(e.target.value)}
          onBlur={() => setTouched(prev => ({ ...prev, deposit: true }))}
          placeholder="أدخل مبلغ العربون..."
          className={`w-full px-4 py-2 rounded-lg border-2 outline-none transition text-left ${
            isDepositInvalid ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-green-600'
          }`}
        />
        {isDepositInvalid && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> العربون مطلوب
          </p>
        )}

        <div className="flex justify-between text-sm bg-gray-50 rounded-lg p-3">
          <span className="text-gray-600">الباقي</span>
          <span className="font-bold" style={{ color: C.gold }}>{remaining.toFixed(2)} د.م</span>
        </div>
      </div>

      {/* Payment method */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-800">طريقة الدفع</h3>
        <div className="grid grid-cols-3 gap-3">
          {PAYMENT_METHODS.map((m) => {
            const Icon = m.icon;
            const active = financials.paymentMethod === m.value;
            return (
              <button
                key={m.value}
                onClick={() => updateFinancials({ paymentMethod: m.value })}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition ${
                  active
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-green-300 text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-bold">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <label className="block text-sm font-semibold mb-2 text-gray-700">ملاحظات مالية</label>
        <textarea
          value={financials.notes || ''}
          onChange={(e) => updateFinancials({ notes: e.target.value })}
          placeholder="أي ملاحظات إضافية..."
          rows={3}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-green-600 transition resize-none"
        />
      </div>
    </div>
  );
}