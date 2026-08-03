"use client";

import { useState } from "react";
import Link from "next/link";

// بيانات الألبوم — يملأها المدير لاحقاً
const albumCategories = [
  {
    id: "sewing",
    name: "طريقة الخياطة",
    images: [
      { id: 1, src: "/images/album/sewing-1.jpg", title: "خياطة الزيب" },
      { id: 2, src: "/images/album/sewing-2.jpg", title: "خياطة التاك" },
      { id: 3, src: "/images/album/sewing-3.jpg", title: "تثبيت المخاد" },
    ],
  },
  {
    id: "works",
    name: "أعمالنا",
    images: [
      { id: 4, src: "/images/album/work-1.jpg", title: "صالون كلاسيكي" },
      { id: 5, src: "/images/album/work-2.jpg", title: "صالون عصري" },
      { id: 6, src: "/images/album/work-3.jpg", title: "خامية فاخرة" },
    ],
  },
  {
    id: "fabrics",
    name: "الأثواب والأقمشة",
    images: [
      { id: 7, src: "/images/album/fabric-1.jpg", title: "ثوب مخملي" },
      { id: 8, src: "/images/album/fabric-2.jpg", title: "ثوب كريمي" },
    ],
  },
];

export default function AlbumPage() {
  const [selectedCategory, setSelectedCategory] = useState("works");
  const [modalImage, setModalImage] = useState<string | null>(null);

  const currentCategory = albumCategories.find((c) => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-[#F5F0E8] p-6" dir="rtl">
      <header className="bg-[#1B5E3B] text-white p-4 rounded-xl mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/seller" className="text-[#C9A84C] hover:text-white">← رجوع</Link>
          <h1 className="font-bold text-xl">ألبوم أعمال المحبوبي</h1>
        </div>
      </header>

      {/* أزرار الفئات */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
        {albumCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? "bg-[#1B5E3B] text-white"
                : "bg-white text-[#1B5E3B] border border-[#E8E4DC] hover:bg-[#1B5E3B]/10"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* شبكة الصور */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {currentCategory?.images.map((img) => (
          <button
            key={img.id}
            onClick={() => setModalImage(img.src)}
            className="group relative aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-[#E8E4DC] bg-white"
          >
            <img
              src={img.src}
              alt={img.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/logo.jpg";
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity">🔍</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-[#1B5E3B]/90 p-2">
              <p className="text-white text-xs text-center">{img.title}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Modal تكبير */}
      {modalImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setModalImage(null)}>
          <div className="relative max-w-5xl w-full">
            <button
              onClick={() => setModalImage(null)}
              className="absolute -top-12 left-0 w-10 h-10 bg-[#1B5E3B] text-white rounded-full flex items-center justify-center hover:bg-[#C9A84C] transition-colors"
            >
              ✕
            </button>
            <img src={modalImage} alt="عمل" className="w-full h-auto max-h-[85vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}