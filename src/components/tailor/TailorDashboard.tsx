'use client';

import { useState } from 'react';
import { TailorOrderView } from '@/types/khamiya';
import { Check, Camera, Eye, Phone, User, Ruler } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';

interface TailorDashboardProps {
  orders: TailorOrderView[];
}

export default function TailorDashboard({ orders }: TailorDashboardProps) {
  const [selectedOrder, setSelectedOrder] = useState<TailorOrderView | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await fetch(`/api/orders/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      // Refresh or update local state
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleImageUpload = async (orderId: string, file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orderId', orderId);

      await fetch('/api/upload/client-request-image', {
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  if (selectedOrder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setSelectedOrder(null)}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← العودة للقائمة
            </button>
            <h1 className="font-bold text-lg">تفاصيل الطلب #{selectedOrder.orderId}</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Measurements - NO FINANCIAL DATA */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Ruler className="w-5 h-5 text-amber-600" />
              القياسات والأبعاد
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(selectedOrder.measurements).map(([key, value]) => (
                <div key={key} className="bg-amber-50 rounded-xl p-4 text-center">
                  <p className="text-gray-600 text-sm">{key}</p>
                  <p className="text-2xl font-bold text-amber-900">{value} م</p>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Requests */}
          {selectedOrder.customRequests && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-3">طلبات خاصة</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-gray-800 leading-relaxed">
                {selectedOrder.customRequests}
              </div>
            </div>
          )}

          {/* 2D Sketch */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">الرسم التقني</h2>
            <div 
              className="bg-gray-50 rounded-xl p-4 flex justify-center"
              dangerouslySetInnerHTML={{ __html: selectedOrder.sketchSvg }}
            />
          </div>

          {/* Fabric Images */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">صور الأقمشة المختارة</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {selectedOrder.fabricImages.map((img, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={img} alt={`Fabric ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Sewing Style Images */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">أنماط الخياطة</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {selectedOrder.sewingStyleImages.map((img, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={img} alt={`Sewing ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Client Request Images Upload */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">صور طلبات العميل</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {selectedOrder.clientRequestImages.map((img, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={img} alt={`Request ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-amber-400 hover:bg-amber-50 cursor-pointer transition-all">
              <Camera className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">رفع صورة جديدة</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  if (e.target.files?.[0]) {
                    handleImageUpload(selectedOrder.orderId, e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => handleStatusUpdate(selectedOrder.orderId, 'ready')}
              className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              تحديد كـ جاهز
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <BackButton label="رجوع" />
          <h1 className="text-2xl font-bold text-gray-900">لوحة الخياط</h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid gap-4">
          {orders.map(order => (
            <div
              key={order.orderId}
              onClick={() => setSelectedOrder(order)}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-amber-200 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center
                    ${order.status === 'ready' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}
                  `}>
                    {order.status === 'ready' ? <Check className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">طلب #{order.orderId}</h3>
                    <p className="text-sm text-gray-500">{order.productType === 'khamiya' ? 'خامية' : 'صالون'}</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${order.status === 'ready' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-amber-100 text-amber-700'
                    }
                  `}>
                    {order.status === 'ready' ? 'جاهز' : 'قيد التنفيذ'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}