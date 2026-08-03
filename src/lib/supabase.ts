import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Types (مؤقتة — استبدل بـ database.types.ts لاحقاً) ───
export type Fabric = {
  id: string; name: string; color: string | null;
  price_per_meter: number; cost_per_meter: number | null;
  image_url: string | null; gallery: any; stock_meters: number | null;
  min_stock: number | null; supplier: string | null; active: boolean | null;
  created_at: string | null;
};

export type StitchStyle = {
  id: string; name: string; target: string;
  price: number; cost_price: number | null;
  image_url: string | null; description: string | null; active: boolean | null;
  created_at: string | null;
};

export type CushionStyle = {
  id: string; name: string; size_cm: number;
  price: number; cost_price: number | null;
  image_url: string | null; active: boolean | null;
  created_at: string | null;
};

export type Extra = {
  id: string; name: string; category: string | null;
  price: number; cost_price: number | null;
  image_url: string | null; stock: number | null;
  min_stock: number | null; active: boolean | null;
  created_at: string | null;
};

export type Forma = {
  id: string; name: string; fabric_cm: number | null;
  sewing_price: number | null; cost_price: number | null;
  image_url: string | null; active: boolean | null;
  created_at: string | null;
};

export type Bounge = {
  id: string; name: string; density: string | null;
  price_per_m3: number | null; cost_per_m3: number | null;
  stock_m3: number | null; supplier: string | null;
  image_url: string | null; active: boolean | null;
  created_at: string | null;
};

export type Tapis = {
  id: string; name: string; length_m: number | null; width_m: number | null;
  price: number | null; cost_price: number | null;
  stock: number | null; supplier: string | null;
  image_url: string | null; active: boolean | null;
  created_at: string | null;
};

export type Bois = {
  id: string; name: string; wood_type: string | null;
  price: number | null; cost_price: number | null;
  stock: number | null; supplier: string | null;
  image_url: string | null; active: boolean | null;
  created_at: string | null;
};

export type Khamiya = {
  id: string; name: string; quality: string | null;
  price_per_m2: number | null; cost_per_m2: number | null;
  stock_m2: number | null; supplier: string | null;
  image_url: string | null; active: boolean | null;
  created_at: string | null;
};

export type Rembourrage = {
  id: string; name: string; type: string | null;
  price_per_cushion: number | null; cost_per_cushion: number | null;
  stock: number | null; active: boolean | null;
  created_at: string | null;
};

export type DecorCushion = {
  id: string; name: string; shape: string | null;
  price: number | null; cost_price: number | null;
  image_url: string | null; active: boolean | null;
  created_at: string | null;
};

// ✅ تم التعديل: value هو jsonb (ليس string)
export type Setting = { key: string; value: any; description: string | null };

// ─── Generic CRUD ───
export async function fetchTable<T>(table: string): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as T[];
}

export async function insertRow<T>(table: string, row: Partial<T>): Promise<T> {
  const { data, error } = await supabase.from(table).insert([row as any]).select().single();
  if (error) throw error;
  return data as T;
}

export async function updateRow<T>(table: string, id: string, updates: Partial<T>): Promise<T> {
  const { data, error } = await supabase.from(table).update(updates as any).eq('id', id).select().single();
  if (error) throw error;
  return data as T;
}

export async function deleteRow(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

// ─── Specific fetchers ───
export const fetchFabrics = () => fetchTable<Fabric>('fabrics');
export const fetchStitchStyles = () => fetchTable<StitchStyle>('stitch_styles');
export const fetchCushionStyles = () => fetchTable<CushionStyle>('cushion_styles');
export const fetchExtras = () => fetchTable<Extra>('extras');
export const fetchFormas = () => fetchTable<Forma>('formas');
export const fetchBounge = () => fetchTable<Bounge>('bounge');
export const fetchTapis = () => fetchTable<Tapis>('tapis');
export const fetchBois = () => fetchTable<Bois>('bois');
export const fetchKhamiya = () => fetchTable<Khamiya>('khamiya');
export const fetchRembourrage = () => fetchTable<Rembourrage>('rembourrage');
export const fetchDecorCushions = () => fetchTable<DecorCushion>('decor_cushions');

// ✅ تم التعديل: يتعامل مع jsonb (رقم أو نص أو object)
export async function getSetting(key: string, fallback: string): Promise<string> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error || !data) return fallback;

  const raw = (data as any).value;
  if (raw === null || raw === undefined) return fallback;

  // If it's an object (like pins), return as JSON string
  if (typeof raw === 'object') return JSON.stringify(raw);

  // Otherwise convert to string and clean extra quotes
  return String(raw).replace(/^"|"$/g, '').trim();
}

// ─── Storage Upload ───
export async function uploadImage(bucket: string, file: File, fileName?: string): Promise<string | null> {
  const name = fileName || `${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from(bucket).upload(name, file, { upsert: true });
  if (error) { console.error('Upload error:', error); return null; }
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data?.path ?? name);
  return urlData?.publicUrl ?? null;
}

export async function deleteImage(bucket: string, path: string): Promise<void> {
  await supabase.storage.from(bucket).remove([path]);
}

// ─── Orders ───
export type Order = {
  id: string; order_number: number; customer_id: string | null;
  customer_name: string | null; customer_phone: string | null;
  status: string; priority: string | null;
  total: number; deposit: number; delivery_date: string | null;
  notes: string | null; payload: any; created_by: string | null;
  created_at: string | null;
};

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Order[];
}

export async function createOrder(order: Partial<Order>): Promise<Order> {
  const { data, error } = await supabase.from('orders').insert([order as any]).select().single();
  if (error) throw error;
  return data as Order;
}

export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (error) throw error;
}

// ─── Realtime Messages ───
export function subscribeToOrderMessages(orderId: string, callback: (msg: any) => void) {
  return supabase
    .channel(`order_${orderId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `order_id=eq.${orderId}` }, callback)
    .subscribe();
}
export type AqiqShape = { id: string; name: string; price_per_meter: number | null; image_url: string | null; active: boolean | null; created_at: string | null; };
export type KhamiyaAddition = { id: string; name: string; price: number | null; category: string | null; image_url: string | null; active: boolean | null; created_at: string | null; };
export const fetchAqiqShapes = () => fetchTable<AqiqShape>('aqiq_shapes');
export const fetchKhamiyaAdditions = () => fetchTable<KhamiyaAddition>('khamiya_additions');