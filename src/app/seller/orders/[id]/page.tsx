'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrder } from '@/features/order-center/context/OrderContext';
import { PrintModal } from '@/features/order-center/components/PrintModal';
import {
  ArrowRight, Printer, MessageCircle, ShoppingCart, Calendar,
  User, Phone, MapPin, FileText, Package, Truck, CreditCard
} from 'lucide-react';

export default function SellerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const { getOrderById, isLoading: ctxLoading } = useOrder();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDocType, setPrintDocType] = useState('devis');

  useEffect(() => {
    if (!orderId) return;
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    setLoading(true);
    const data = await getOrderById(orderId);
    setOrder(data);
    setLoading(false);
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      quotation: { label: 'عرض سعر', color: 'text-amber-700', bg: 'bg-amber-100' },
      confirmed: { label: 'مؤكد', color: 'text-blue-700', bg: 'bg-blue-100' },
      in_production: { label: 'قيد الإنتاج', color: 'text-purple-700', bg: 'bg-purple-100' },
      ready: { label: 'جاهز', color: 'text-emerald-700', bg: 'bg-emerald-100' },
      delivered: { label: 'مُسلّم', color: 'text-green-700', bg: 'bg-green-100' },
      cancelled: { label: 'ملغى', color: 'text-red-700', bg: 'bg-red-100' },
    };
    return map[status] || { label: status, color: 'text-gray-700', bg: 'bg-gray-100' };
  };

  const handleWhatsApp = () => {
    if (!order) return;
    const phone = order.customer?.phone?.replace(/\s/g, '');
    const msg = `مرحباً ${order.customer?.name || ''}،\n\nطلبك رقم *${order.orderNumber}* بقيمة *${order.total?.toLocaleString()} د.م*\n\nحالة الطلب: ${getStatusLabel(order.status).label}\n\nشكراً لثقتكم في المحبوبي للأثاث والديكور 🪑`;
    window.open(`https://wa.me/212${phone?.replace(/^0/, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const openPrint = (docType: string) => {
    setPrintDocType(docType);
    setShowPrintModal(true);
  };

  const printOrder: any = order ? {
    order_number: order.orderNumber,
    created_at: order.createdAt,
    status: order.status,
    customer_name: order.customer?.name || '',
    customer_phone: order.customer?.phone || '',
    customer_city: order.customer?.city || '',
    total_amount: order.total,
    discount_amount: order.discountAmount,
    delivery_fee: order.deliveryCost,
    deposit_amount: order.depositAmount,
    remaining_amount: order.remaining,
    items: order.items?.map((it: any) => ({
      productName: it.productName,
      quantity: it.quantity,
      total_price: it.totalPrice,
      details: it.details || {},
      calculations: it.calculations || {},
    })) || [],
  } : null;

  if (loading || ctxLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="text-[#1B5E38] text-lg">جاري تحميل الطلب...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">الطلب غير موجود</p>
          <button onClick={() => router.push('/seller/orders')} className="text-[#1B5E38] underline">
            العودة للطلبات
          </button>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusLabel(order.status);

  return (
    <div className="min-h-screen bg-[#F5F0E8]" dir="rtl">
      {/* Header */}
      <div className="bg-[#1B5E38] text-white px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button onClick={() => router.push('/seller/orders')} className="flex items-center gap-2 text-sm hover:opacity-80">
            <ArrowRight className="w-4 h-4" />
            طلباتي
          </button>
          <h1 className="text-lg font-bold">تفاصيل الطلب</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Order Number + Status */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-[#E8E0D0]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">رقم الطلب</p>
              <p className="text-2xl font-bold text-[#1B5E38]">#{order.orderNumber}</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${statusStyle.bg} ${statusStyle.color}`}>
              {statusStyle.label}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            {new Date(order.createdAt).toLocaleDateString('ar-MA', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-[#E8E0D0]">
          <h2 className="text-[#1B5E38] font-bold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            بيانات الزبون
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-[#C9A84C]" />
              <div>
                <p className="text-xs text-gray-500">الاسم</p>
                <p className="font-medium">{order.customer?.name || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-[#C9A84C]" />
              <div>
                <p className="text-xs text-gray-500">الهاتف</p>
                <p className="font-medium">{order.customer?.phone || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#C9A84C]" />
              <div>
                <p className="text-xs text-gray-500">المدينة</p>
                <p className="font-medium">{order.customer?.city || '—'}</p>
              </div>
            </div>
          </div>
          {order.customer?.address && (
            <div className="mt-3 pt-3 border-t border-[#E8E0D0] text-sm text-gray-600">
              📍 {order.customer.address}
            </div>
          )}
        </div>

        {/* Delivery Info */}
        {order.delivery?.method && order.delivery.method !== 'pickup' && (
          <div className="bg-white rounded-xl shadow-sm p-5 border border-[#E8E0D0]">
            <h2 className="text-[#1B5E38] font-bold mb-3 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              التوصيل
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>الطريقة: {order.delivery.method === 'delivery' ? 'توصيل للمنزل' : 'شحن'}</p>
              {order.delivery.address && <p>العنوان: {order.delivery.address}</p>}
              {order.delivery.expectedDate && <p>التاريخ المتوقع: {order.delivery.expectedDate}</p>}
            </div>
          </div>
        )}

        {/* Products with Details */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-[#E8E0D0]">
          <h2 className="text-[#1B5E38] font-bold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            المنتجات ({order.items?.length || 0})
          </h2>
          <div className="space-y-4">
            {order.items?.map((item: any, idx: number) => (
              <div key={item.orderItemId || item.id || idx} className="p-4 bg-[#F5F0E8] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-[#1B5E38]">{item.productName}</p>
                    <p className="text-xs text-gray-500">{item.productType} × {item.quantity}</p>
                  </div>
                  <p className="font-bold text-[#1B5E38]">{item.totalPrice?.toLocaleString()} د.م</p>
                </div>

                {item.details && Object.keys(item.details).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#E8E0D0]/50">
                    <p className="text-xs font-bold text-gray-500 mb-1">التفاصيل:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-gray-600">
                      {Object.entries(item.details)
                        .filter(([_, v]) => v !== null && v !== undefined && v !== false && v !== '')
                        .map(([k, v]) => {
                          const labels: Record<string, string> = {
                            fabric: 'القماش', seddari: 'السدادر', stitch: 'الخياطة',
                            cushions: 'المخاد', decor: 'الديكور', extras: 'إضافات',
                            formage: 'الفرمجة', material: 'الخامة', dimensions: 'الأبعاد',
                            model: 'الموديل', woodItems: 'قطع الخشب', product: 'المنتج',
                            aqiq: 'العقيق', background: 'الخلفية', customAdditions: 'إضافات مخصصة',
                            catalogAdditions: 'إضافات الكتالوج', khamiyaShape: 'شكل الخامية',
                            notes: 'ملاحظات',
                          };
                          let display = typeof v === 'object' ? JSON.stringify(v) : String(v);
                          if (display.length > 80) display = display.slice(0, 80) + '...';
                          return (
                            <div key={k} className="flex gap-2">
                              <span className="text-gray-400 whitespace-nowrap">{labels[k] || k}:</span>
                              <span className="font-medium truncate">{display}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {item.calculations && Object.keys(item.calculations).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#E8E0D0]/50">
                    <p className="text-xs font-bold text-gray-500 mb-1">الحسابات:</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                      {Object.entries(item.calculations)
                        .filter(([_, v]) => typeof v === 'number' && v > 0)
                        .map(([k, v]) => {
                          const labels: Record<string, string> = {
                            fabricCost: 'القماش', laborCost: 'الخياطة', cushionsCost: 'المخاد',
                            decorCost: 'الديكور', extrasCost: 'إضافات', formageCost: 'الفرمجة',
                            materialCost: 'الخامة', backingCost: 'الخلفية', edgingCost: 'التشطيب',
                            seddariTotal: 'السدادر', itemsTotal: 'القطع', subtotal: 'المجموع',
                          };
                          return (
                            <span key={k} className="bg-white px-2 py-1 rounded">
                              {labels[k] || k}: <b>{(v as number).toLocaleString()} د.م</b>
                            </span>
                          );
                        })}
                    </div>
                  </div>
                )}

                {item.lineNotes && (
                  <div className="mt-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                    📝 {item.lineNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-[#E8E0D0]">
          <h2 className="text-[#1B5E38] font-bold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            الملخص المالي
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">المجموع الفرعي</span>
              <span>{order.subtotal?.toLocaleString()} د.م</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>الخصم</span>
                <span>- {order.discountAmount.toLocaleString()} د.م</span>
              </div>
            )}
            {order.deliveryCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">التوصيل</span>
                <span>+ {order.deliveryCost.toLocaleString()} د.م</span>
              </div>
            )}
            <div className="flex justify-between text-amber-700">
              <span>العربون</span>
              <span>{order.depositAmount?.toLocaleString()} د.م</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg text-[#1B5E38]">
              <span>الإجمالي</span>
              <span>{order.total?.toLocaleString()} د.م</span>
            </div>
            <div className="flex justify-between font-bold text-amber-700">
              <span>المتبقي</span>
              <span>{order.remaining?.toLocaleString()} د.م</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.customerNotes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-800">
              <span className="font-bold">ملاحظات الزبون: </span>
              {order.customerNotes}
            </p>
          </div>
        )}
        {order.internalNotes && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-700">
              <span className="font-bold">ملاحظات داخلية: </span>
              {order.internalNotes}
            </p>
          </div>
        )}

        {/* Payments */}
        {order.payments && order.payments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5 border border-[#E8E0D0]">
            <h2 className="text-[#1B5E38] font-bold mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              المدفوعات
            </h2>
            <div className="space-y-2">
              {order.payments.map((p: any, i: number) => (
                <div key={p.id || i} className="flex justify-between items-center text-sm p-2 bg-[#F5F0E8] rounded">
                  <span>{p.type === 'deposit' ? 'عربون' : 'دفعة'} — {p.method}</span>
                  <span className="font-bold text-[#1B5E38]">{p.amount?.toLocaleString()} د.م</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
          <button
            onClick={() => openPrint('devis')}
            className="flex items-center justify-center gap-2 bg-[#1B5E38] text-white py-3 rounded-xl font-semibold hover:bg-[#144a2b] transition-colors"
          >
            <Printer className="w-5 h-5" />
            طباعة Devis
          </button>

          <button
            onClick={() => openPrint('bon_de_commande')}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            <FileText className="w-5 h-5" />
            طباعة BC
          </button>

          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            إرسال WhatsApp
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/seller/order-center')}
            className="flex items-center justify-center gap-2 bg-[#C9A84C] text-white py-3 rounded-xl font-semibold hover:bg-[#b8983d] transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            طلب جديد
          </button>
          <button
            onClick={() => router.push('/seller/orders')}
            className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            طلباتي
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center text-sm text-blue-700">
          <p>🔒 تغيير الحالة وطباعة الفاتورة متاحة فقط للمدير</p>
        </div>
      </div>

      {/* Print Modal — using React.createElement to bypass TS */}
      {showPrintModal && printOrder && (
        <>
          {(() => {
            const Modal = PrintModal as any;
            return <Modal order={printOrder} docType={printDocType} onClose={() => setShowPrintModal(false)} />;
          })()}
        </>
      )}
    </div>
  );
}