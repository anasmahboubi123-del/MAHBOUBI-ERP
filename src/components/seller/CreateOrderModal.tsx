// src/components/seller/CreateOrderModal.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, User, Phone, MapPin, Calendar, FileText, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { Product, OrderLine, CreateOrderPayload } from '@/types/seller.types';
import { getPublicImageUrl } from '@/lib/supabase-seller';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (order: CreateOrderPayload) => void;
  initialProducts?: Product[];
}

export default function CreateOrderModal({ isOpen, onClose, onSubmit, initialProducts = [] }: CreateOrderModalProps) {
  const [step, setStep] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<OrderLine[]>(
    initialProducts.map((p) => ({
      id: crypto.randomUUID(),
      product_id: p.id,
      product_name: p.name,
      quantity: 1,
      unit_price: p.price,
      total: p.price,
      image_url: p.image_url || undefined,
    }))
  );

  const totalAmount = lines.reduce((sum, line) => sum + line.total, 0);
  const depositAmount = Math.round(totalAmount * 0.3);

  const updateQuantity = (lineId: string, delta: number) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.id === lineId) {
          const newQty = Math.max(1, line.quantity + delta);
          return { ...line, quantity: newQty, total: newQty * line.unit_price };
        }
        return line;
      })
    );
  };

  const removeLine = (lineId: string) => {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  };

  const handleSubmit = () => {
    if (!customerName.trim() || lines.length === 0) return;
    onSubmit({
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_city: customerCity,
      delivery_date: deliveryDate || undefined,
      notes: notes || undefined,
      lines,
      deposit_amount: depositAmount,
    });
    // Reset
    setStep(1);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerCity('');
    setDeliveryDate('');
    setNotes('');
    setLines([]);
  };

  const cities = ['بني ملال', 'الفقيه بن صالح', 'خريبكة', 'أزيلال', 'قصبة تادلة', 'خنيفرة', 'أخرى'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {step === 1 ? 'طلبية جديدة' : 'بيانات الزبون'}
                </h2>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Progress */}
              <div className="flex gap-2 mt-4">
                {[1, 2].map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      s <= step ? 'bg-[#4A6741]' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {step === 1 ? (
                <div className="space-y-4">
                  {/* Order Lines */}
                  {lines.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                      <p className="text-gray-400 text-sm">لا توجد منتجات في الطلب</p>
                      <p className="text-gray-300 text-xs mt-1">أضف منتجات من الكتالوج</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lines.map((line) => (
                        <motion.div
                          key={line.id}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl"
                        >
                          <div className="w-14 h-14 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
                            {line.image_url ? (
                              <Image
                                src={getPublicImageUrl('catalogue', line.image_url)}
                                alt={line.product_name}
                                width={56}
                                height={56}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">🛋️</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">{line.product_name}</p>
                            <p className="text-xs text-[#4A6741] font-semibold mt-0.5">
                              {line.unit_price.toLocaleString('ar-MA')} د.م
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(line.id, -1)}
                              className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold">{line.quantity}</span>
                            <button
                              onClick={() => updateQuantity(line.id, 1)}
                              className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeLine(line.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Total */}
                  <div className="p-4 bg-gradient-to-br from-[#F5ECD7] to-[#f0e5cc] rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">المجموع</span>
                      <span className="text-xl font-bold text-[#4A6741]">
                        {totalAmount.toLocaleString('ar-MA')} د.م
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#C9A84C]/20">
                      <span className="text-xs text-gray-500">التسبيق الإلزامي (30%)</span>
                      <span className="text-sm font-bold text-[#C9A84C]">
                        {depositAmount.toLocaleString('ar-MA')} د.م
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Customer Name */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                      <User className="w-4 h-4 text-gray-400" />
                      اسم الزبون *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="محمد العلوي"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A6741]/20 focus:border-[#4A6741]/30 transition-all"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                      <Phone className="w-4 h-4 text-gray-400" />
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0661 23 45 67"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A6741]/20 focus:border-[#4A6741]/30 transition-all"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      المدينة
                    </label>
                    <div className="relative">
                      <select
                        value={customerCity}
                        onChange={(e) => setCustomerCity(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A6741]/20 focus:border-[#4A6741]/30 transition-all appearance-none"
                      >
                        <option value="">اختر المدينة</option>
                        {cities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Delivery Date */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      تاريخ التسليم
                    </label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A6741]/20 focus:border-[#4A6741]/30 transition-all"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                      <FileText className="w-4 h-4 text-gray-400" />
                      ملاحظات
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="أي ملاحظات خاصة بالطلبية..."
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A6741]/20 focus:border-[#4A6741]/30 transition-all resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100">
              {step === 1 ? (
                <button
                  onClick={() => setStep(2)}
                  disabled={lines.length === 0}
                  className="w-full py-3.5 bg-[#4A6741] text-white rounded-xl font-semibold hover:bg-[#3d5635] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  متابعة
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    رجوع
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!customerName.trim()}
                    className="flex-1 py-3.5 bg-[#4A6741] text-white rounded-xl font-semibold hover:bg-[#3d5635] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    إنشاء الطلبية
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}