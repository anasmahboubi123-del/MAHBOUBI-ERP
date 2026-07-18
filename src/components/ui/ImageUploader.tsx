'use client';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { uploadToBucket } from '@/lib/supabase';

/** ضغط الصورة قبل الرفع */
async function compress(file: File, maxW = 1280, quality = 0.8): Promise<Blob> {
  const img = document.createElement('img');
  img.src = URL.createObjectURL(file);
  await new Promise((r) => (img.onload = r));
  const scale = Math.min(1, maxW / img.width);
  const canvas = document.createElement('canvas');
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b ?? file), 'image/jpeg', quality));
}

/** رفع صورة (كاميرا أو معرض) إلى Supabase Storage */
export default function ImageUploader({
  bucket,
  folder = '',
  onUploaded,
  label = '📷 إضافة صورة'
}: {
  bucket: string;
  folder?: string;
  onUploaded: (url: string) => void;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const blob = await compress(file);
    const path = `${folder ? folder + '/' : ''}${Date.now()}.jpg`;
    const url = await uploadToBucket(bucket, path, blob);
    setBusy(false);
    if (url) {
      onUploaded(url);
      toast.success('تم رفع الصورة');
    } else {
      toast.error('فشل رفع الصورة - تأكد من إنشاء Bucket باسم ' + bucket);
    }
    e.target.value = '';
  }

  return (
    <>
      <input ref={ref} type="file" accept="image/*" capture="environment" hidden onChange={handle} />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className="rounded-xl border-2 border-dashed border-brand-600 px-4 py-3 font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-50"
      >
        {busy ? 'جارٍ الرفع...' : label}
      </button>
    </>
  );
}
