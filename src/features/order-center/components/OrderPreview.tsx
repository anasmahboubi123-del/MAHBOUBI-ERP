'use client';

import React from 'react';
import { useOrder } from '../context/OrderContext';
import { Package, User, Truck, DollarSign, FileText, AlertCircle } from 'lucide-react';

const C = { green: '#1B5E38', gold: '#C9A84C', dark: '#0D1F17', danger: '#DC2626', success: '#10B981' };

function formatCurrency(n: number): string {
  return n.toLocaleString('ar-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' د.م';
}

export function OrderPreview() {
 const { cart, cartTotals } = useOrder();
const itemCount = cart.items.length;

  const warnings: string[] = [];
  if (itemCount === 0) warnings.push('السلة فارغة');
  if (!cart.customer.name.trim()) warnings.push('اسم الزبون مطلوب');
  if (!cart.customer.phone.trim()) warnings.push('رقم الهاتف مطلوب');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: C.dark }}>مراجعة الطلب</h2>

      {warnings.length > 0 && (
        <div className="p-4 rounded-xl space-y-2" style={{ background: C.danger + '10', border: `1px solid ${C.danger}30` }}>
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Products */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
          <Package className="w-5 h-5 text-gray-500" />
          <h3 className="font-bold">المنتجات ({itemCount})</h3>
        </div>
        <div className="divide-y">
          {cart.items.map((item) => (
            <div key={item.orderItemId} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-bold">{item.productName}</p>
                <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                {item.lineNotes && <p className="text-xs text-amber-600 mt-1">📝 {item.lineNotes}</p>}
              </div>
              <p className="font-bold" style={{ color: C.green }}>{formatCurrency(item.totalPrice)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Customer */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-5 h-5 text-gray-500" />
          <h3 className="font-bold">الزبون</h3>
        </div>
        <div className="text-sm space-y-1 text-gray-700">
          <p><span className="text-gray-400">الاسم:</span> {cart.customer.name || '—'}</p>
          <p><span className="text-gray-400">الهاتف:</span> {cart.customer.phone || '—'}</p>
          <p><span className="text-gray-400">المدينة:</span> {cart.customer.city || '—'}</p>
          <p><span className="text-gray-400">العنوان:</span> {cart.customer.address || '—'}</p>
          {cart.customer.customerType === 'company' && (
            <p><span className="text-gray-400">الشركة:</span> {cart.customer.companyName} (ICE: {cart.customer.ice})</p>
          )}
        </div>
      </div>

      {/* Delivery */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="w-5 h-5 text-gray-500" />
          <h3 className="font-bold">التوصيل</h3>
        </div>
        <p className="text-sm text-gray-700">
          {cart.delivery.method === 'pickup' && 'استلام من المحل'}
          {cart.delivery.method === 'home_delivery' && 'توصيل للمنزل'}
          {cart.delivery.method === 'carrier' && 'شركة نقل'}
          {cart.delivery.expectedDate && ` · موعد: ${cart.delivery.expectedDate}`}
        </p>
      </div>

      {/* Financial */}
      <div className="bg-white rounded-xl border-2 overflow-hidden" style={{ borderColor: C.gold }}>
        <div className="p-4 border-b" style={{ background: C.gold + '10' }}>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" style={{ color: C.gold }} />
            <h3 className="font-bold">الملخص المالي</h3>
          </div>
        </div>
        <div className="p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-600">المجموع الفرعي</span><span className="font-bold">{formatCurrency(cartTotals.subtotal)}</span></div>
          {cartTotals.discount > 0 && <div className="flex justify-between text-red-600"><span>الخصم</span><span className="font-bold">-{formatCurrency(cartTotals.discount)}</span></div>}
          {cartTotals.delivery > 0 && <div className="flex justify-between"><span className="text-gray-600">التوصيل</span><span className="font-bold">{formatCurrency(cartTotals.delivery)}</span></div>}
          <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>الإجمالي</span><span style={{ color: C.gold }}>{formatCurrency(cartTotals.total)}</span></div>
          {cartTotals.deposit > 0 && (
            <>
              <div className="flex justify-between text-sm"><span className="text-gray-500">التسبيق</span><span className="font-bold">{formatCurrency(cartTotals.deposit)}</span></div>
              <div className="flex justify-between text-sm font-bold"><span className="text-gray-500">الباقي</span><span>{formatCurrency(cartTotals.remaining)}</span></div>
            </>
          )}
        </div>
      </div>

      {/* Notes */}
      {(cart.notes.customer || cart.notes.internal || cart.notes.production) && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-gray-500" />
            <h3 className="font-bold">الملاحظات</h3>
          </div>
          <div className="space-y-2 text-sm">
            {cart.notes.customer && <p><span className="text-gray-400">للزبون:</span> {cart.notes.customer}</p>}
            {cart.notes.internal && <p><span className="text-gray-400">داخلية:</span> {cart.notes.internal}</p>}
            {cart.notes.production && <p><span className="text-gray-400">إنتاج:</span> {cart.notes.production}</p>}
          </div>
        </div>
      )}
    </div>
  );
}