import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(url, key);
export const supabaseConfigured = Boolean(url && key);

/** قراءة إعداد واحد من جدول settings مع قيمة افتراضية */
export async function getSetting(k: string, fallback: string): Promise<string> {
  if (!supabaseConfigured) return fallback;
  try {
    const { data } = await supabase.from('settings').select('value').eq('key', k).single();
    return data?.value ?? fallback;
  } catch {
    return fallback;
  }
}

/** رفع ملف إلى Supabase Storage وإرجاع الرابط العام */
export async function uploadToBucket(bucket: string, path: string, file: Blob): Promise<string | null> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) return null;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
