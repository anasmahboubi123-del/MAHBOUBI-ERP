// src/features/order-center/services/documentBackgrounds.ts
import { supabase } from '@/lib/supabase';
import { DocumentType } from '../types';

const STORAGE_BUCKET = 'site-assets';
const STORAGE_FOLDER = 'backgrounds/documents';

/**
 * يحمل خلفية المستند من Supabase Storage
 * المسار المتوقع: site-assets/backgrounds/documents/devis-bg.png
 */
export async function getDocumentBackgroundUrl(docType: DocumentType): Promise<string | null> {
  const fileName = `${docType}-bg.png`;
  const filePath = `${STORAGE_FOLDER}/${fileName}`;

  try {
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    if (data?.publicUrl) {
      // نتحقق من وجود الملف فعلياً
      const response = await fetch(data.publicUrl, { method: 'HEAD' });
      if (response.ok) return data.publicUrl;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * يرفع خلفية جديدة للمستند
 */
export async function uploadDocumentBackground(
  docType: DocumentType,
  file: File
): Promise<string | null> {
  const fileName = `${docType}-bg.png`;
  const filePath = `${STORAGE_FOLDER}/${fileName}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, { upsert: true, contentType: 'image/png' });

  if (error) {
    console.error('Upload background error:', error);
    return null;
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data?.publicUrl || null;
}

/**
 * يحذف خلفية مستند
 */
export async function removeDocumentBackground(docType: DocumentType): Promise<boolean> {
  const fileName = `${docType}-bg.png`;
  const filePath = `${STORAGE_FOLDER}/${fileName}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
  return !error;
}