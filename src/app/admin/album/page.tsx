"use client";

import { useState, useRef } from "react";
import Link from "next/link";

type AlbumImage = {
  id: number;
  src: string;
  title: string;
  category: string;
};

const CATEGORIES = [
  { id: "works", name: "أعمالنا" },
  { id: "sewing", name: "طريقة الخياطة" },
  { id: "fabrics", name: "الأثواب والأقمشة" },
];

export default function AdminAlbumPage() {
  const [images, setImages] = useState<AlbumImage[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("works");
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addImage = () => {
    if (!preview || !title) return;
    const newImage: AlbumImage = {
      id: Date.now(),
      src: preview,
      title,
      category,
    };
    setImages([...images, newImage]);
    setTitle("");
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const deleteImage = (id: number) => {
    setImages(images.filter((img) => img.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] p-6" dir="rtl">
      <header className="bg-[#1B5E3B] text-white p-4 rounded-xl mb-6 flex items-center justify-between">
        <h1 className="font-bold text-xl">إدارة ألبوم الصور</h1>
        <Link href="/admin" className="text-[#C9A84C] hover:text-white">← رجوع للوحة التحكم</Link>
      </header>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* نموذج الإضافة */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#E8E4DC]">
          <h2 className="text-lg font-bold text-[#1B5E3B] mb-4">إضافة صورة جديدة</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#6B7B6E] mb-1">الفئة</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#E8E4DC] bg-[#F5F0E8] text-[#1B5E3B] font-bold"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-[#6B7B6E] mb-1">عنوان الصورة</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: صالون كلاسيكي"
                className="w-full p-3 rounded-lg border border-[#E8E4DC] bg-[#F5F0E8] text-[#1B5E3B] font-bold"
              />
            </div>

            <div>
              <label className="block text-sm text-[#6B7B6E] mb-1">اختر الصورة</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full p-3 rounded-lg border border-[#E8E4DC] bg-white file:bg-[#1B5E3B] file:text-white file:px-4 file:py-2 file:rounded-lg file:border-0"
              />
            </div>

            {preview && (
              <div className="w-40 h-40 rounded-xl overflow-hidden border-2 border-[#C9A84C]">
                <img src={preview} alt="معاينة" className="w-full h-full object-cover" />
              </div>
            )}

            <button
              onClick={addImage}
              disabled={!preview || !title}
              className="w-full py-3 bg-[#1B5E3B] text-white rounded-xl font-bold hover:bg-[#C9A84C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ➕ إضافة للألبوم
            </button>
          </div>
        </div>

        {/* عرض الصور المضافة */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#E8E4DC]">
          <h2 className="text-lg font-bold text-[#1B5E3B] mb-4">الصور في الألبوم ({images.length})</h2>
          
          {images.length === 0 ? (
            <p className="text-[#6B7B6E] text-center py-8">لا توجد صور بعد. أضف صوراً من الأعلى.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-[#E8E4DC] group">
                  <img src={img.src} alt={img.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <p className="text-white text-xs font-bold text-center px-2">{img.title}</p>
                    <span className="text-[#C9A84C] text-xs">{CATEGORIES.find(c => c.id === img.category)?.name}</span>
                    <button
                      onClick={() => deleteImage(img.id)}
                      className="mt-2 px-3 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}