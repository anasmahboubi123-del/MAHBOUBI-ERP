'use client';

import React, { useState, useRef } from 'react';
import { Upload, ImageIcon, Save, RefreshCw, Palette, Type, FileText, Phone, MapPin, Mail } from 'lucide-react';
import { useInvoiceTemplate } from './hooks/useInvoiceTemplate';
import { uploadImage } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function InvoiceTemplateUploader() {
  const { template, loading, saveTemplate, refresh } = useInvoiceTemplate();
  const [editing, setEditing] = useState({ ...template });
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.loading('جارٍ رفع الشعار...');
    const url = await uploadImage('invoices', file, `logo-${Date.now()}.png`);
    toast.dismiss();
    if (url) {
      setEditing(prev => ({ ...prev, logoUrl: url }));
      toast.success('تم رفع الشعار');
    } else {
      toast.error('فشل رفع الشعار');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveTemplate(editing);
      toast.success('تم حفظ القالب بنجاح');
    } catch (err) {
      toast.error('فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEditing({ ...template });
    toast('تم استعادة القالب الأصلي');
  };

  if (loading) {
    return <div className="text-center p-8 text-gray-400">جارٍ التحميل...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-[#1B5E3B] rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">🧾 إعدادات الفاتورة</h1>
        <p className="text-[#C9A84C] mt-1">خصص شكل الفاتورة التي يُطبعها التطبيق</p>
      </div>

      {/* Preview Toggle */}
      <div className="flex justify-center">
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className={`px-6 py-2 rounded-xl font-bold transition ${previewMode ? 'bg-[#1B5E3B] text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          {previewMode ? '✏️ وضع التعديل' : '👁️ معاينة الفاتورة'}
        </button>
      </div>

      {previewMode ? (
        /* Preview */
        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-8">
          <div className="w-[210mm] mx-auto bg-[#FDFCF8] p-12 shadow-lg">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-5xl font-bold text-[#8B7355] tracking-wider mb-4">FACTURE</h1>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Fait le {new Date().toLocaleDateString('fr-FR')}</p>
                  <p>{editing.address}</p>
                  <p dir="ltr">{editing.phone}</p>
                </div>
              </div>
              <div className="text-center">
                {editing.logoUrl ? (
                  <img src={editing.logoUrl} alt="Logo" className="w-24 h-24 object-contain mx-auto mb-2" />
                ) : (
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mb-2 mx-auto" style={{ backgroundColor: editing.accentColor }}>
                    <span className="text-white text-3xl font-bold">M</span>
                  </div>
                )}
                <p className="font-bold text-lg" style={{ color: editing.accentColor }}>{editing.companyName}</p>
              </div>
            </div>
            <div className="border-t-2 pt-4" style={{ borderColor: editing.accentColor }}>
              <p className="text-xs text-gray-500">هذه معاينة للشكل العام — البيانات تُملأ تلقائياً من الطلبية</p>
            </div>
          </div>
        </div>
      ) : (
        /* Editor */
        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-6 space-y-6">
          {/* Logo Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B5E3B] flex items-center gap-2">
              <ImageIcon className="w-5 h-5" /> شعار المحل
            </h3>
            <div className="flex items-center gap-4">
              {editing.logoUrl ? (
                <div className="relative">
                  <img src={editing.logoUrl} alt="Logo" className="w-24 h-24 object-contain rounded-xl border border-[#E8E4DC]" />
                  <button
                    onClick={() => setEditing(prev => ({ ...prev, logoUrl: null }))}
                    className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                  <span className="text-gray-400 text-xs">لا يوجد شعار</span>
                </div>
              )}
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1B5E3B] text-white rounded-xl text-sm font-bold hover:bg-[#144d2f] transition"
                >
                  <Upload className="w-4 h-4" /> رفع شعار جديد
                </button>
                <p className="text-xs text-gray-400 mt-2">PNG أو JPG — يُفضل مربع شفاف</p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#E8E4DC]" />

          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="font-bold text-[#1B5E3B] flex items-center gap-2">
              <Type className="w-5 h-5" /> معلومات المحل
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">اسم المحل</label>
                <input
                  type="text"
                  value={editing.companyName}
                  onChange={e => setEditing(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#1B5E3B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">اللون الرئيسي</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editing.accentColor}
                    onChange={e => setEditing(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <span className="text-sm text-gray-500 font-mono">{editing.accentColor}</span>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> العنوان
                </label>
                <input
                  type="text"
                  value={editing.address}
                  onChange={e => setEditing(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#1B5E3B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Phone className="w-4 h-4" /> الهاتف
                </label>
                <input
                  type="text"
                  value={editing.phone}
                  onChange={e => setEditing(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#1B5E3B] focus:outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Mail className="w-4 h-4" /> البريد الإلكتروني
                </label>
                <input
                  type="text"
                  value={editing.email}
                  onChange={e => setEditing(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#1B5E3B] focus:outline-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[#E8E4DC]" />

          {/* Social & Terms */}
          <div className="space-y-4">
            <h3 className="font-bold text-[#1B5E3B] flex items-center gap-2">
              <FileText className="w-5 h-5" /> التواصل والشروط
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">TikTok</label>
                <input
                  type="text"
                  value={editing.tiktok}
                  onChange={e => setEditing(prev => ({ ...prev, tiktok: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#1B5E3B] focus:outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Instagram</label>
                <input
                  type="text"
                  value={editing.instagram}
                  onChange={e => setEditing(prev => ({ ...prev, instagram: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#1B5E3B] focus:outline-none"
                  dir="ltr"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">شروط البيع</label>
                <textarea
                  value={editing.terms}
                  onChange={e => setEditing(prev => ({ ...prev, terms: e.target.value }))}
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#1B5E3B] focus:outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-[#E8E4DC]">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition"
            >
              <RefreshCw className="w-4 h-4" /> استعادة
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-[#1B5E3B] text-white rounded-xl font-bold hover:bg-[#144d2f] transition disabled:opacity-40"
            >
              <Save className="w-5 h-5" />
              {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}