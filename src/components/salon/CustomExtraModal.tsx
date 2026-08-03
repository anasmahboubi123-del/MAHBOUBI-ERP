'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CustomExtraItem } from '@/lib/types';

interface CustomExtraModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: CustomExtraItem) => void;
}

export default function CustomExtraModal({ open, onClose, onAdd }: CustomExtraModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const reset = () => {
    setName('');
    setPrice('');
    setImageUrl(null);
  };

  const handlePhotoPick = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `custom/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('extras').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('extras').getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch (err) {
      console.error('لم يتم رفع الصورة:', err);
      alert('تعذّر رفع الصورة، حاول مرة أخرى');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    const priceNum = Number(price);
    if (!name.trim() || !priceNum) return;
    onAdd({
      id: `custom-${Date.now()}`,
      name: name.trim(),
      imageUrl,
      price: priceNum,
    });
    reset();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#0D1F17]">➕ إضافة عنصر مخصص</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">الاسم *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: مسند إضافي"
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 focus:border-[#1B5E3B] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">الثمن الإجمالي (DH) *</label>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 focus:border-[#1B5E3B] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">صورة (اختياري)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handlePhotoPick(e.target.files?.[0])}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F0E8] text-[#1B5E3B] hover:bg-[#ECE3D2] disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              </button>
              {imageUrl && (
                <img src={imageUrl} alt="" className="h-10 w-10 rounded-lg border border-gray-200 object-cover" />
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !Number(price)}
            className="flex-1 rounded-xl bg-[#1B5E3B] py-2.5 text-sm font-bold text-white hover:bg-[#164a30] disabled:opacity-40"
          >
            حفظ وإضافة
          </button>
        </div>
      </div>
    </div>
  );
}