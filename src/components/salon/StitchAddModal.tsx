"use client";

import { useState, useRef } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PinLock from "@/components/ui/PinLock";

interface StitchAddModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: (style: { id: string; name: string; price: number; image_url: string | null }) => void;
}

export default function StitchAddModal({ open, onClose, onAdded }: StitchAddModalProps) {
  const [adminOk, setAdminOk] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    const priceNum = Number(price);
    if (!name.trim() || priceNum <= 0) return;

    setUploading(true);
    let imageUrl: string | null = null;

    try {
      if (imageFile) {
        const fileName = `stitch-${Date.now()}-${imageFile.name}`;
        const { data, error } = await supabase.storage
          .from("stitch-styles")
          .upload(fileName, imageFile, { upsert: false });
        if (!error && data) {
          const { data: urlData } = supabase.storage
            .from("stitch-styles")
            .getPublicUrl(data.path);
          imageUrl = urlData?.publicUrl ?? null;
        }
      }

      const { data: row, error: dbError } = await supabase
        .from("stitch_styles")
        .insert({
          name: name.trim(),
          price: priceNum,
          image_url: imageUrl,
          description: description.trim() || null,
          target: "seddari",
          active: true,
        } as any)
        .select("id, name, price, image_url")
        .single();

      if (!dbError && row) {
        onAdded(row as any);
        // reset
        setName("");
        setPrice("");
        setDescription("");
        setImageFile(null);
        setPreviewUrl(null);
        setAdminOk(false);
        onClose();
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute left-3 top-3 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-6 text-center text-xl font-bold text-[#0D1F17]">
          ➕ إضافة شكل خياطة جديد
        </h2>

        {!adminOk ? (
          <div className="py-4">
            <p className="mb-4 text-center text-gray-600">
              أدخل كود المدير لإضافة شكل جديد للكتالوج
            </p>
            <PinLock
              role="admin"
              onSuccess={() => setAdminOk(true)}
              onCancel={onClose}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* اسم */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                اسم الشكل *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: كلاسيكي، عصري، ملكي..."
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20"
              />
            </div>

            {/* الثمن */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                الثمن لكل سداري (DH) *
              </label>
              <input
                type="number"
                dir="ltr"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="مثال: 20"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-lg font-bold text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20"
              />
            </div>

            {/* وصف للخياط */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                وصف للخياط (اختياري)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="كيف يتم تنفيذ هذا الشكل..."
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20"
              />
            </div>

            {/* صورة */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                صورة توضيحية
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-4 text-gray-500 transition hover:border-[#1B5E3B]/40 hover:bg-[#F5F0E8]"
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="preview" className="h-16 w-16 rounded-lg object-cover" />
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    <span>اضغط لرفع صورة</span>
                  </>
                )}
              </button>
            </div>

            {/* حفظ */}
            <button
              onClick={handleSave}
              disabled={!name.trim() || !price || Number(price) <= 0 || uploading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B5E3B] py-3 text-base font-bold text-white transition hover:bg-[#144d30] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                "💾 حفظ في الكتالوج"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}