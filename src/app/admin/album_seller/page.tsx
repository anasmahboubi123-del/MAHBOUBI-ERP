"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Trash2, ImageIcon, Plus, X } from "lucide-react";
import Image from "next/image";
import { AlbumItem } from "@/types/seller.types";
import {
  fetchAlbumItems,
  addAlbumItem,
  deleteAlbumItem,
  uploadImageToStorage,
  getPublicImageUrl,
} from "@/lib/supabase-seller";

export default function AdminAlbumPage() {
  const [items, setItems] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const data = await fetchAlbumItems();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !price || !selectedFile) return;

    setUploading(true);
    try {
      const imagePath = await uploadImageToStorage("seller-album", selectedFile);
      if (imagePath) {
        const newItem = await addAlbumItem({
          title: title.trim(),
          price: Number(price),
          image_url: imagePath,
        });
        if (newItem) {
          setItems((prev) => [newItem, ...prev]);
          setTitle("");
          setPrice("");
          setSelectedFile(null);
          setPreviewUrl(null);
          setShowForm(false);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الصورة؟")) return;
    const ok = await deleteAlbumItem(id);
    if (ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة ألبوم البائع</h1>
            <p className="text-sm text-gray-500 mt-1">أضف أو احذف صوراً من ألبوم الأعمال المعروض للبائع</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1B5E3B] text-white rounded-xl font-medium hover:bg-[#145030] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صورة</span>
          </button>
        </div>

        {/* Upload Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-white rounded-[20px] shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">صورة جديدة</h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الصورة</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="album-image"
                      />
                      <label
                        htmlFor="album-image"
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#1B5E3B] hover:bg-[#1B5E3B]/5 transition-colors"
                      >
                        {previewUrl ? (
                          <Image
                            src={previewUrl}
                            alt="Preview"
                            width={200}
                            height={150}
                            className="h-full w-full object-cover rounded-xl"
                          />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">اضغط لرفع صورة</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">العنوان</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="مثال: صالون كلاسيكي ذهبي"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">السعر (د.م)</label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="12500"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20"
                      />
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={!title.trim() || !price || !selectedFile || uploading}
                      className="w-full py-3 bg-[#1B5E3B] text-white rounded-xl font-semibold hover:bg-[#145030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? "جاري الرفع..." : "حفظ الصورة"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Album Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-[16px] h-48 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[20px] shadow-sm">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">الألبوم فارغ</p>
            <p className="text-gray-300 text-sm mt-1">أضف صوراً من الزر أعلاه</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {items.map((item) => {
              const imageUrl = getPublicImageUrl("seller-album", item.image_url);
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="group relative overflow-hidden rounded-[16px] bg-white shadow-sm"
                >
                  <div className="relative h-48 overflow-hidden bg-[#F5F0E8]">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="20vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🛋️</div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
                  </div>

                  <div className="absolute bottom-0 inset-x-0 p-3">
                    <h4 className="font-bold text-white text-xs truncate">{item.title}</h4>
                    <p className="text-[#C9A84C] text-xs font-semibold">
                      {item.price.toLocaleString("ar-MA")} د.م
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="absolute top-2 left-2 w-8 h-8 bg-red-500/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}