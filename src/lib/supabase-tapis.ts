import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Types ───
export interface Tapis {
  id: string;
  name: string;
  description: string | null;
  price_per_m2: number;
  stock_m2: number | null;
  image_url: string | null;
  supplier: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TapisOrderPayload {
  tapis_id: string;
  tapis_name: string;
  original_length_m: number;
  original_width_m: number;
  cut_margin_cm: number;
  final_length_m: number;
  final_width_m: number;
  area_m2: number;
  waste_percent: number;
  final_area_m2: number;
  rounding_type: 'none' | 'half' | 'one';
  price_per_m2: number;
  total_price: number;
}

// ─── Fetch ───
export async function fetchTapis(): Promise<Tapis[]> {
  const { data, error } = await supabase
    .from('tapis')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ─── Insert Order ───
export async function insertTapisOrder(params: {
  customer_name: string;
  customer_phone: string;
  delivery_date: string | null;
  deposit: number;
  total: number;
  payload: TapisOrderPayload;
}) {
  // 1) إنشاء الطلبية الرئيسية
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: params.customer_name,
      customer_phone: params.customer_phone,
      delivery_date: params.delivery_date,
      status: 'pending',
      total: params.total,
      deposit: params.deposit,
      created_by: 'seller',
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // 2) إنشاء بند الطلبية
  const { error: itemError } = await supabase
    .from('order_items')
    .insert({
      order_id: orderData.id,
      kind: 'tapis',
      label: `زربية — ${params.payload.tapis_name}`,
      qty: 1,
      unit_price: params.payload.price_per_m2,
      total: params.payload.total_price,
      payload: params.payload,
    });

  if (itemError) throw itemError;

  return orderData;
}

// ─── Upload Image ───
export async function uploadTapisImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
  const { error: uploadError } = await supabase.storage
    .from('tapis')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from('tapis').getPublicUrl(fileName);
  return data.publicUrl;
}