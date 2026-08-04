'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PrintModal } from '@/features/documents/components/PrintModal';
import type { DocumentType } from '@/features/documents/components/PrintModal';
import {
  ArrowRight, Printer, MessageCircle, ShoppingCart, Calendar,
  User, Phone, MapPin, FileText, Package, Truck, CreditCard
} from 'lucide-react';

export default function SellerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDocType, setPrintDocType] = useState<DocumentType>('devis');

  useEffect(() => {
    if (!orderId) return;
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();
      setOrder(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
    const phone = order.customer_phone?.replace(/\s/g, '');
    const msg = `مرحباً ${order.customer_name || ''}،\n\nطلبك رقم *${order.order_number}* بقيمة *${order.total?.toLocaleString()} د.م*\n\nحالة الطلب: ${getStatusLabel(order.status).label}\n\nشكراً لثقتكم في المحبوبي للأثاث والديكور 🪑`;
    window.open(`https://wa.me/212${phone?.replace(/^0/, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const openPrint = (docType: DocumentType) => {
    setPrintDocType(docType);
    setShowPrintModal(true);
  };

  if (loading) {
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

  const orderItemsForPrint = (order.order_items || []).map((it: any, idx: number) => ({
    id: it.id || `item-${idx}`,
    orderItemId: it.id || `item-${idx}`,
    productType: it.product_type || 'product',
    productName: it.product_name || 'منتج',
    quantity: it.quantity || 1,
    unitPrice: it.unit_price || 0,
    totalPrice: it.total_price || 0,
    details: it.details || {},
    thumbnailUrl: it.thumbnail_url,
    addedAt: it.created_at || new Date().toISOString(),
  }));

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
              <p className="text-2xl font-bold text-[#1B5E38]">#{order.order_number}</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${statusStyle.bg} ${statusStyle.color}`}>
              {statusStyle.label}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            {new Date(order.created_at).toLocaleDateString('ar-MA', { year: 'numeric', month: 'long', day: 'numeric' })}
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
                <p className="font-medium">{order.customer_name || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-[#C9A84C]" />
              <div>
                <p className="text-xs text-gray-500">الهاتف</p>
                <p className="font-medium">{order.customer_phone || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#C9A84C]" />
              <div>
                <p className="text-xs text-gray-500">المدينة</p>
                <p className="font-medium">{order.customer_city || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-[#E8E0D0]">
          <h2 className="text-[#1B5E38] font-bold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            المنتجات ({order.order_items?.length || 0})
          </h2>
          <div className="space-y-4">
            {order.order_items?.map((item: any, idx: number) => (
              <div key={item.id || idx} className="p-4 bg-[#F5F0E8] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-[#1B5E38]">{item.product_name}</p>
                    <p className="text-xs text-gray-500">{item.product_type} × {item.quantity}</p>
                  </div>
                  <p className="font-bold text-[#1B5E38]">{item.total_price?.toLocaleString()} د.م</p>
                </div>
                {item.details && Object.keys(item.details).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#E8E0D0]/50 text-xs text-gray-600">
                    {JSON.stringify(item.details).slice(0, 200)}
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
              <span>{(order.total || 0).toLocaleString()} د.م</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg text-[#1B5E38]">
              <span>الإجمالي</span>
              <span>{(order.total || 0).toLocaleString()} د.م</span>
            </div>
          </div>
        </div>

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
      </div>

      {/* PrintModal */}
      {showPrintModal && (
        <PrintModal
          orderItems={orderItemsForPrint}
          orderNumber={String(order.order_number || '')}
          customerName={order.customer_name || '—'}
          customerPhone={order.customer_phone || '—'}
          customerCity={order.customer_city}
          totalAmount={order.total || 0}
          discountAmount={order.discount_amount || 0}
          depositAmount={order.deposit || 0}
          deliveryCost={order.delivery_cost || 0}
          documentType={printDocType}
          printOptions={{
            documentType: printDocType,
            printVariant: 'standard',
            language: 'ar',
            includeProductionDetails: true,
            includePrices: true,
            includeCosts: false,
            includeSignatures: true,
            includeQrCode: false,
            includeStamp: false,
          }}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}