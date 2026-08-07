"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Trash2, Upload, ImageOff, X } from "lucide-react";
import Image from "next/image";

import {
  fetchAlbumItems,
  addAlbumItem,
  deleteAlbumItem,
  uploadImageToStorage,
  getPublicImageUrl,
  ALBUM_CATEGORIES,
  AlbumCategory,
} from "@/lib/supabase-seller";
import { AlbumItem } from "@/types/seller.types";

export default function AdminAlbumPage() {
  const [images, setImages] = useState<AlbumItem[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<AlbumCategory>("salon");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<AlbumCategory | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAlbumItems(filterCategory || undefined);
      setImages(data || []); // ← تأكد من عدم كونها undefined
    } catch {
      setImages([]);
    }
    setLoading(false);
  }, [filterCategory]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("image/")) {
      alert("صورة فقط");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert("أقل من 5MB");
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const addImage = async () => {
    if (!file || !title.trim() || !price.trim()) {
      alert("املأ جميع الحقول");
      return;
    }
    setUploading(true);
    try {
      const uploadedName = await uploadImageToStorage('seller-album', file);
      if (!uploadedName) {
        alert("فشل رفع الصورة");
        setUploading(false);
        return;
      }
      const imageUrl = getPublicImageUrl('seller-album', uploadedName);
      const result = await addAlbumItem({
        title: title.trim(),
        price: parseFloat(price),
        category,
        image_url: imageUrl,
      });
      if (!result) {
        alert("فشل الحفظ");
        setUploading(false);
        return;
      }
      setTitle("");
      setPrice("");
      setPreview(null);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await loadImages();
    } catch {
      alert("خطأ");
    }
    setUploading(false);
  };

  const handleDelete = async (image: AlbumItem) => {
    if (!confirm(`حذف "${image.title}"؟`)) return;
    setDeleting(image.id);
    try {
      await deleteAlbumItem(image.id);
      await loadImages();
    } catch {
      alert("خطأ في الحذف");
    }
    setDeleting(null);
  };

  const filteredImages = filterCategory
    ? images.filter((i) => i.category === filterCategory)
    : images;

  return (
    <div className="min-h-screen bg-[#F5F0E8] p-4 sm:p-6" dir="rtl">
      <header className="bg-[#1B5E3B] text-white p-4 rounded-2xl mb-6 flex justify-between shadow-lg">
        <h1 className="font-bold text-xl">🖼️ إدارة ألبوم الصور</h1>
        <Link href="/admin" className="text-[#C9A84C] hover:text-white font-bold">← رجوع</Link>
      </header>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Form */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#E8E4DC]">
          <h2 className="text-lg font-bold text-[#1B5E3B] mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" /> إضافة صورة جديدة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#6B7B6E] mb-1 font-bold">القسم</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AlbumCategory)}
                className="w-full p-3 rounded-xl border border-[#E8E4DC] bg-[#F5F0E8] text-[#1B5E3B] font-bold"
              >
                {ALBUM_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#6B7B6E] mb-1 font-bold">اسم الصنف</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="صالون كلاسيكي ذهبي"
                className="w-full p-3 rounded-xl border border-[#E8E4DC] bg-[#F5F0E8] text-[#1B5E3B] font-bold"
              />
            </div>
            <div>
              <label className="block text-sm text-[#6B7B6E] mb-1 font-bold">السعر (درهم)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="12500"
                min="0"
                className="w-full p-3 rounded-xl border border-[#E8E4DC] bg-[#F5F0E8] text-[#1B5E3B] font-bold"
              />
            </div>
            <div>
              <label className="block text-sm text-[#6B7B6E] mb-1 font-bold">الصورة</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full p-3 rounded-xl border border-[#E8E4DC] bg-white file:bg-[#1B5E3B] file:text-white file:px-4 file:py-2 file:rounded-lg file:border-0"
              />
            </div>
          </div>

          {preview && (
            <div className="mt-4 relative w-48 h-48 rounded-xl overflow-hidden border-2 border-[#C9A84C]">
              <Image src={preview} alt="معاينة" fill className="object-cover" />
              <button
                onClick={() => {
                  setPreview(null);
                  setFile(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="absolute top-2 left-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={addImage}
            disabled={uploading || !preview || !title.trim() || !price.trim()}
            className="mt-4 w-full py-3 bg-[#1B5E3B] text-white rounded-xl font-bold hover:bg-[#C9A84C] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> جاري الرفع...
              </>
            ) : (
              "➕ إضافة للألبوم"
            )}
          </button>
        </div>

        {/* Gallery */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#E8E4DC]">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-[#1B5E3B]">
              🖼️ الصور ({filteredImages.length})
            </h2>
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setFilterCategory(null)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold ${filterCategory === null ? "bg-[#1B5E3B] text-white" : "bg-[#F5F0E8] text-[#1B5E3B]"}`}
              >
                الكل
              </button>
              {ALBUM_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilterCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap ${filterCategory === c.id ? "bg-[#1B5E3B] text-white" : "bg-[#F5F0E8] text-[#1B5E3B]"}`}
                >
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-10 h-10 text-[#1B5E3B] animate-spin" />
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-16">
              <ImageOff className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-[#6B7B6E]">لا توجد صور</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredImages.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square rounded-xl overflow-hidden border border-[#E8E4DC] group bg-white"
                >
                  {img.image_url ? (
                    <Image
                      src={img.image_url}
                      alt={img.title}
                      fill
                      className="object-cover"
                      sizes="25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <ImageOff className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                    <p className="text-white text-xs font-bold text-center">{img.title}</p>
                    <p className="text-[#C9A84C] font-bold text-sm">
                      {img.price?.toLocaleString("ar-MA")} درهم
                    </p>
                    <button
                      onClick={() => handleDelete(img)}
                      disabled={deleting === img.id}
                      className="mt-1 px-3 py-1 bg-red-500 text-white rounded-lg text-xs flex items-center gap-1 disabled:opacity-50"
                    >
                      {deleting === img.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      حذف
                    </button>
                  </div>
                  <div className="absolute top-2 left-2 bg-[#1B5E3B]/80 text-white text-[10px] px-2 py-0.5 rounded-md">
                    {ALBUM_CATEGORIES.find((c) => c.id === img.category)?.name}
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