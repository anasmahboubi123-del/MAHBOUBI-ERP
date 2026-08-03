'use client';

import React, { useState, useCallback } from 'react';
import { useOrder } from '../context/OrderContext';
import { User, Phone, MapPin, Mail, Calendar, Search, Check, AlertCircle } from 'lucide-react';

const C = { green: '#1B5E38', gold: '#C9A84C', dark: '#0D1F17', cream: '#F5F0E8' };

export function CustomerPanel() {
  const { cart, updateCustomer, updateDelivery, searchCustomer } = useOrder();
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handlePhoneSearch = useCallback(async (phone: string) => {
    if (phone.length < 4) { setResults([]); return; }
    setSearching(true);
    const found = await searchCustomer(phone);
    setResults(found);
    setSearching(false);
  }, [searchCustomer]);

  const selectCustomer = (c: any) => {
    updateCustomer({
      id: c.id,
      name: c.name,
      phone: c.phone,
      phone2: c.phone2,
      email: c.email,
      address: c.address,
      city: c.city,
    });
    setResults([]);
  };

  const markTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const isNameInvalid = touched.name && !cart.customer.name.trim();
  const isPhoneInvalid = touched.phone && !cart.customer.phone.trim();
  const isDateInvalid = touched.expectedDate && !cart.delivery.expectedDate;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: C.dark }}>بيانات الزبون</h2>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
        <label className="block text-sm font-semibold text-gray-700">بحث سريع برقم الهاتف</label>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="tel"
            defaultValue={cart.customer.phone}
            onChange={(e) => handlePhoneSearch(e.target.value)}
            placeholder="06XXXXXXXX"
            className="w-full pr-10 pl-4 py-3 rounded-lg border-2 border-gray-200 outline-none focus:border-green-600 transition text-left"
          />
        </div>
        {searching && <p className="text-sm text-gray-400">جاري البحث...</p>}
        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">زبائن موجودون:</p>
            {results.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCustomer(c)}
                className="w-full text-right p-3 rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-300 transition flex items-center justify-between"
              >
                <div>
                  <p className="font-bold">{c.name}</p>
                  <p className="text-sm text-gray-500">{c.phone} {c.city ? `· ${c.city}` : ''}</p>
                </div>
                <Check className="w-4 h-4 text-green-600" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Customer Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            اسم الزبون <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={cart.customer.name}
              onChange={(e) => updateCustomer({ name: e.target.value })}
              onBlur={() => markTouched('name')}
              placeholder="الاسم الكامل"
              className={`w-full pr-10 pl-4 py-3 rounded-lg border-2 outline-none transition ${
                isNameInvalid ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-green-600'
              }`}
            />
          </div>
          {isNameInvalid && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> الاسم مطلوب
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              الهاتف <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={cart.customer.phone}
                onChange={(e) => updateCustomer({ phone: e.target.value })}
                onBlur={() => markTouched('phone')}
                placeholder="06XXXXXXXX"
                className={`w-full pr-10 pl-4 py-3 rounded-lg border-2 outline-none transition text-left ${
                  isPhoneInvalid ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-green-600'
                }`}
              />
            </div>
            {isPhoneInvalid && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> الهاتف مطلوب
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">هاتف ثاني</label>
            <input
              type="tel"
              value={cart.customer.phone2 || ''}
              onChange={(e) => updateCustomer({ phone2: e.target.value })}
              placeholder="05XXXXXXXX"
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 outline-none focus:border-green-600 transition text-left"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">العنوان</label>
          <div className="relative">
            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={cart.customer.address || ''}
              onChange={(e) => updateCustomer({ address: e.target.value })}
              placeholder="عنوان التوصيل"
              className="w-full pr-10 pl-4 py-3 rounded-lg border-2 border-gray-200 outline-none focus:border-green-600 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">المدينة</label>
            <input
              type="text"
              value={cart.customer.city || ''}
              onChange={(e) => updateCustomer({ city: e.target.value })}
              placeholder="المدينة"
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 outline-none focus:border-green-600 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={cart.customer.email || ''}
                onChange={(e) => updateCustomer({ email: e.target.value })}
                placeholder="email@example.com"
                className="w-full pr-10 pl-4 py-3 rounded-lg border-2 border-gray-200 outline-none focus:border-green-600 transition text-left"
              />
            </div>
          </div>
        </div>

        {/* Delivery Date — REQUIRED */}
        <div className="border-t border-gray-100 pt-4">
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            موعد التسليم المتوقع <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={cart.delivery.expectedDate || ''}
              onChange={(e) => updateDelivery({ expectedDate: e.target.value })}
              onBlur={() => markTouched('expectedDate')}
              className={`w-full pr-10 pl-4 py-3 rounded-lg border-2 outline-none transition ${
                isDateInvalid ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-green-600'
              }`}
            />
          </div>
          {isDateInvalid && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> موعد التسليم مطلوب
            </p>
          )}
        </div>
      </div>
    </div>
  );
}