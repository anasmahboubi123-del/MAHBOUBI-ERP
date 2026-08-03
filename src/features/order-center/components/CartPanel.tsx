'use client';

import React from 'react';
import { useOrder } from '../context/OrderContext';
import { ShoppingCart, Trash2, Plus, Minus, Package, RotateCcw, Copy, FileText } from 'lucide-react';

const C = {
  green: '#1B5E38', gold: '#C9A84C', cream: '#F5F0E8', dark: '#0D1F17',
  danger: '#DC2626', darkCard: '#1A2E22',
};

function formatCurrency(n: number): string {
  return n.toLocaleString('ar-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' د.م';
}

export function CartPanel() {
  const {
    cart, cartTotals, removeFromCart, updateItemQuantity,
    duplicateItem, updateItemNotes, clearCart,
  } = useOrder();

  if (cart.items.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: C.dark }} />
        <h2 className="text-2xl font-bold mb-2" style={{ color: C.dark }}>السلة فارغة</h2>
        <p className="opacity-60 mb-6">أضف منتجات من صفحات المنتجات</p>
        <button
          onClick={() => window.location.href = '/seller'}
          className="px-6 py-3 rounded-xl font-bold text-white transition hover:opacity-90"
          style={{ background: C.green }}
        >
          تصفح المنتجات
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: C.dark }}>بنود السلة</h2>
        <button onClick={clearCart} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition">
          <RotateCcw className="w-4 h-4" /> إفراغ السلة
        </button>
      </div>

      <div className="space-y-4">
        {cart.items.map((item) => (
          <div key={item.orderItemId} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 flex gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 opacity-20" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold mb-1" style={{ background: C.green + '15', color: C.green }}>
                      {item.productType === 'salon' && 'صالون'}
                      {item.productType === 'tapis' && 'زربية'}
                      {item.productType === 'wood' && 'عود'}
                      {item.productType === 'foam' && 'بونج'}
                      {item.productType === 'khamiya' && 'خامية'}
                      {item.productType === 'accessoire' && 'إكسسوار'}
                    </span>
                    <h3 className="font-bold text-lg truncate">{item.productName}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => duplicateItem(item.orderItemId)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-400 hover:text-blue-600 transition" title="تكرار">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeFromCart(item.orderItemId)} className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Production details preview */}
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  {item.details.seddari && (
                    <p>السداري: {item.details.seddari.lengthCm}×{item.details.seddari.widthCm} سم</p>
                  )}
                  {item.details.dimensions?.areaSqm && (
                    <p>المساحة: {item.details.dimensions.areaSqm.toFixed(2)} م²</p>
                  )}
                  {item.details.fabric && (
                    <p>القماش: {item.details.fabric.name}</p>
                  )}
                  {item.details.stitch && (
                    <p>الخياطة: {item.details.stitch.type}</p>
                  )}
                  {item.details.cushions && (
                    <p>المخدات: {item.details.cushions.count} مخدة</p>
                  )}
                  {item.calculations.fabricLengthCm && (
                    <p>طول القماش: {item.calculations.fabricLengthCm.toFixed(0)} سم</p>
                  )}
                </div>

                {/* Quantity & Price */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateItemQuantity(item.orderItemId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateItemQuantity(item.orderItemId, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-400">الوحدة: {formatCurrency(item.unitPrice)}</p>
                    <p className="text-xl font-bold" style={{ color: C.green }}>{formatCurrency(item.totalPrice)}</p>
                  </div>
                </div>

                {/* Line notes */}
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <FileText className="w-3 h-3" />
                    <span>ملاحظات البند</span>
                  </div>
                  <input
                    type="text"
                    value={item.lineNotes || ''}
                    onChange={(e) => updateItemNotes(item.orderItemId, e.target.value)}
                    placeholder="ملاحظات خاصة بهذا البند..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-green-600 transition"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="bg-white rounded-xl border-2 overflow-hidden" style={{ borderColor: C.gold }}>
        <div className="p-4 border-b" style={{ background: C.gold + '10', borderColor: C.gold + '30' }}>
          <h3 className="font-bold flex items-center gap-2" style={{ color: C.dark }}>
            <ShoppingCart className="w-5 h-5" style={{ color: C.gold }} />
            ملخص السلة
          </h3>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">المجموع الفرعي</span>
            <span className="font-bold">{formatCurrency(cartTotals.subtotal)}</span>
          </div>
          {cartTotals.discount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>الخصم</span>
              <span className="font-bold">-{formatCurrency(cartTotals.discount)}</span>
            </div>
          )}
          {cartTotals.delivery > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">التوصيل</span>
              <span className="font-bold">{formatCurrency(cartTotals.delivery)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t" style={{ color: C.dark }}>
            <span>الإجمالي</span>
            <span style={{ color: C.gold }}>{formatCurrency(cartTotals.total)}</span>
          </div>
          {cartTotals.deposit > 0 && (
            <>
              <div className="flex justify-between text-sm text-gray-500">
                <span>التسبيق</span>
                <span className="font-bold">{formatCurrency(cartTotals.deposit)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>الباقي</span>
                <span className="font-bold">{formatCurrency(cartTotals.remaining)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}