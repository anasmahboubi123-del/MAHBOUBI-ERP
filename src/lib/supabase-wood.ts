// ============================================================
// El Mahboubi Salon ERP — Wood ERP Engine Supabase Functions
// دوال Supabase لمحرك العود
// ============================================================

import { createClient } from '@supabase/supabase-js';
import type {
  WoodPricingModel,
  WoodModelExtra,
  WoodOrder,
  WoodOrderSeddari,
  WoodOrderItem,
  WoodPriceSnapshot,
  WoodDrawing,
  WoodAuditLog,
  WoodPricingSimulation,
  WoodOrderSummary,
  WoodCalculationResult,
  WoodModelSnapshot,
} from './wood-types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseWood = createClient(supabaseUrl, supabaseKey);

// ============================================================
// نماذج التسعير (Pricing Models)
// ============================================================

export async function getWoodPricingModels(activeOnly = true): Promise<WoodPricingModel[]> {
  let query = supabaseWood
    .from('wood_pricing_models')
    .select('*')
    .order('created_at', { ascending: false });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getWoodPricingModelById(id: string): Promise<WoodPricingModel | null> {
  const { data, error } = await supabaseWood
    .from('wood_pricing_models')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getWoodPricingModelByCode(code: string): Promise<WoodPricingModel | null> {
  const { data, error } = await supabaseWood
    .from('wood_pricing_models')
    .select('*')
    .eq('code', code)
    .single();

  if (error) throw error;
  return data;
}

export async function createWoodPricingModel(
  model: Omit<WoodPricingModel, 'id' | 'created_at' | 'updated_at'>
): Promise<WoodPricingModel> {
  const { data, error } = await supabaseWood
    .from('wood_pricing_models')
    .insert(model)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWoodPricingModel(
  id: string,
  updates: Partial<WoodPricingModel>
): Promise<WoodPricingModel> {
  const { data, error } = await supabaseWood
    .from('wood_pricing_models')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWoodPricingModel(id: string): Promise<void> {
  const { error } = await supabaseWood
    .from('wood_pricing_models')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================
// عناصر إضافية ديناميكية (Model Extras)
// ============================================================

export async function getModelExtras(modelId: string): Promise<WoodModelExtra[]> {
  const { data, error } = await supabaseWood
    .from('wood_model_extras')
    .select('*')
    .eq('model_id', modelId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createModelExtra(
  extra: Omit<WoodModelExtra, 'id' | 'created_at'>
): Promise<WoodModelExtra> {
  const { data, error } = await supabaseWood
    .from('wood_model_extras')
    .insert(extra)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateModelExtra(
  id: string,
  updates: Partial<WoodModelExtra>
): Promise<WoodModelExtra> {
  const { data, error } = await supabaseWood
    .from('wood_model_extras')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteModelExtra(id: string): Promise<void> {
  const { error } = await supabaseWood
    .from('wood_model_extras')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================
// الطلبيات (Orders)
// ============================================================

export async function getWoodOrders(filters?: {
  status?: string;
  customerPhone?: string;
  dateFrom?: string;
  dateTo?: string;
  modelId?: string;
}): Promise<WoodOrderSummary[]> {
  let query = supabaseWood
    .from('wood_orders')
    .select(`
      id,
      order_number,
      customer_name,
      customer_phone,
      model_id,
      final_total,
      status,
      deposit_amount,
      remaining_amount,
      created_at,
      wood_pricing_models!inner(name)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.customerPhone) query = query.ilike('customer_phone', `%${filters.customerPhone}%`);
  if (filters?.dateFrom) query = query.gte('order_date', filters.dateFrom);
  if (filters?.dateTo) query = query.lte('order_date', filters.dateTo);
  if (filters?.modelId) query = query.eq('model_id', filters.modelId);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    order_number: row.order_number,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    model_name: row.wood_pricing_models?.name || 'غير معروف',
    final_total: row.final_total,
    status: row.status,
    deposit_amount: row.deposit_amount,
    remaining_amount: row.remaining_amount,
    created_at: row.created_at,
  }));
}

export async function getWoodOrderById(id: string): Promise<WoodOrder | null> {
  const { data, error } = await supabaseWood
    .from('wood_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getWoodOrderByNumber(orderNumber: string): Promise<WoodOrder | null> {
  const { data, error } = await supabaseWood
    .from('wood_orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single();

  if (error) throw error;
  return data;
}

export async function createWoodOrder(
  order: Omit<WoodOrder, 'id' | 'order_number' | 'created_at' | 'updated_at'>
): Promise<WoodOrder> {
  const { data, error } = await supabaseWood
    .from('wood_orders')
    .insert(order)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWoodOrder(
  id: string,
  updates: Partial<WoodOrder>
): Promise<WoodOrder> {
  const { data, error } = await supabaseWood
    .from('wood_orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWoodOrderStatus(
  id: string,
  status: WoodOrder['status'],
  actor: { role: string; id: string; name: string }
): Promise<WoodOrder> {
  const order = await getWoodOrderById(id);
  if (!order) throw new Error('Order not found');

  const { data, error } = await supabaseWood
    .from('wood_orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // تسجيل في Audit Log
  await createWoodAuditLog({
    order_id: id,
    action_type: 'status_change',
    old_value: order.status,
    new_value: status,
    actor_role: actor.role,
    actor_id: actor.id,
    actor_name: actor.name,
  });

  return data;
}

export async function deleteWoodOrder(id: string): Promise<void> {
  const { error } = await supabaseWood
    .from('wood_orders')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================
// السدادر (Order Seddars)
// ============================================================

export async function getOrderSeddars(orderId: string): Promise<WoodOrderSeddari[]> {
  const { data, error } = await supabaseWood
    .from('wood_order_seddars')
    .select('*')
    .eq('order_id', orderId)
    .order('seddari_index', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createOrderSeddari(
  seddari: Omit<WoodOrderSeddari, 'id' | 'created_at'>
): Promise<WoodOrderSeddari> {
  const { data, error } = await supabaseWood
    .from('wood_order_seddars')
    .insert(seddari)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateOrderSeddari(
  id: string,
  updates: Partial<WoodOrderSeddari>
): Promise<WoodOrderSeddari> {
  const { data, error } = await supabaseWood
    .from('wood_order_seddars')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteOrderSeddari(id: string): Promise<void> {
  const { error } = await supabaseWood
    .from('wood_order_seddars')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function bulkCreateOrderSeddars(
  seddars: Omit<WoodOrderSeddari, 'id' | 'created_at'>[]
): Promise<WoodOrderSeddari[]> {
  const { data, error } = await supabaseWood
    .from('wood_order_seddars')
    .insert(seddars)
    .select();

  if (error) throw error;
  return data || [];
}

// ============================================================
// عناصر الطلب (Order Items)
// ============================================================

export async function getOrderItems(orderId: string): Promise<WoodOrderItem[]> {
  const { data, error } = await supabaseWood
    .from('wood_order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createOrderItem(
  item: Omit<WoodOrderItem, 'id' | 'created_at'>
): Promise<WoodOrderItem> {
  const { data, error } = await supabaseWood
    .from('wood_order_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateOrderItem(
  id: string,
  updates: Partial<WoodOrderItem>
): Promise<WoodOrderItem> {
  const { data, error } = await supabaseWood
    .from('wood_order_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteOrderItem(id: string): Promise<void> {
  const { error } = await supabaseWood
    .from('wood_order_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function bulkCreateOrderItems(
  items: Omit<WoodOrderItem, 'id' | 'created_at'>[]
): Promise<WoodOrderItem[]> {
  const { data, error } = await supabaseWood
    .from('wood_order_items')
    .insert(items)
    .select();

  if (error) throw error;
  return data || [];
}

// ============================================================
// لقطات الأسعار (Price Snapshots)
// ============================================================

export async function createPriceSnapshot(
  snapshot: Omit<WoodPriceSnapshot, 'id' | 'created_at'>
): Promise<WoodPriceSnapshot> {
  const { data, error } = await supabaseWood
    .from('wood_price_snapshots')
    .insert(snapshot)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPriceSnapshots(orderId: string): Promise<WoodPriceSnapshot[]> {
  const { data, error } = await supabaseWood
    .from('wood_price_snapshots')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ============================================================
// الرسم 2D (Drawings)
// ============================================================

export async function getDrawingByOrderId(orderId: string): Promise<WoodDrawing | null> {
  const { data, error } = await supabaseWood
    .from('wood_drawings')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function createDrawing(
  drawing: Omit<WoodDrawing, 'id' | 'created_at' | 'updated_at'>
): Promise<WoodDrawing> {
  const { data, error } = await supabaseWood
    .from('wood_drawings')
    .insert(drawing)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDrawing(
  id: string,
  updates: Partial<WoodDrawing>
): Promise<WoodDrawing> {
  const { data, error } = await supabaseWood
    .from('wood_drawings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// سجل التعديلات (Audit Log)
// ============================================================

export async function createWoodAuditLog(
  log: Omit<WoodAuditLog, 'id' | 'created_at'>
): Promise<WoodAuditLog> {
  const { data, error } = await supabaseWood
    .from('wood_audit_log')
    .insert(log)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getWoodAuditLogs(orderId: string): Promise<WoodAuditLog[]> {
  const { data, error } = await supabaseWood
    .from('wood_audit_log')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ============================================================
// محاكي الأسعار (Pricing Simulator)
// ============================================================

export async function createPricingSimulation(
  simulation: Omit<WoodPricingSimulation, 'id' | 'created_at'>
): Promise<WoodPricingSimulation> {
  const { data, error } = await supabaseWood
    .from('wood_pricing_simulations')
    .insert(simulation)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPricingSimulations(modelId?: string): Promise<WoodPricingSimulation[]> {
  let query = supabaseWood
    .from('wood_pricing_simulations')
    .select('*')
    .order('created_at', { ascending: false });

  if (modelId) query = query.eq('model_id', modelId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ============================================================
// دوال حسابية (Calculation Engine)
// ============================================================

export function calculateSeddariPrice(
  lengthCm: number,
  pricePerMeter: number
): number {
  const meters = lengthCm / 100;
  return Math.round(meters * pricePerMeter * 100) / 100;
}

export function calculateWoodOrderTotal(
  seddars: WoodOrderSeddari[],
  items: WoodOrderItem[],
  discountAmount = 0
): WoodCalculationResult {
  const seddariTotal = seddars.reduce((sum, s) => sum + (s.seddari_price || 0), 0);
  const extrasTotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const subtotal = seddariTotal + extrasTotal;
  const finalTotal = Math.max(0, subtotal - discountAmount);
  const depositAmount = finalTotal * 0.30; // 30% تسبيق افتراضي
  const remainingAmount = finalTotal - depositAmount;

  return {
    seddari_total: Math.round(seddariTotal * 100) / 100,
    extras_total: Math.round(extrasTotal * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    discount_amount: discountAmount,
    final_total: Math.round(finalTotal * 100) / 100,
    deposit_amount: Math.round(depositAmount * 100) / 100,
    remaining_amount: Math.round(remainingAmount * 100) / 100,
    breakdown: {
      seddars: seddars.map((s, i) => ({
        index: s.seddari_index,
        length: s.length_cm,
        price: s.seddari_price || 0,
      })),
      items: items.map(item => ({
        type: item.item_type,
        name: item.item_name,
        qty: item.quantity,
        price: item.current_price,
        total: item.total_price,
      })),
    },
  };
}

export function createModelSnapshot(model: WoodPricingModel, extras: WoodModelExtra[]): WoodModelSnapshot {
  return {
    id: model.id,
    name: model.name,
    code: model.code,
    wood_type: model.wood_type,
    seddari_price_per_meter: model.seddari_price_per_meter,
    takia_price: model.takia_price,
    formaja_price: model.formaja_price,
    kwan_price: model.kwan_price,
    kouti_price: model.kouti_price,
    soundri_price: model.soundri_price,
    big_table_price: model.big_table_price,
    small_table_price: model.small_table_price,
    extras: extras,
  };
}

export function compareWithMasterPrice(
  systemTotal: number,
  masterTotal: number
): { difference: number; differencePercent: number; isAccurate: boolean } {
  const difference = systemTotal - masterTotal;
  const differencePercent = masterTotal > 0 ? (difference / masterTotal) * 100 : 0;
  const isAccurate = Math.abs(differencePercent) <= 5; // مقبول إن كان الفرق ≤ 5%

  return {
    difference: Math.round(difference * 100) / 100,
    differencePercent: Math.round(differencePercent * 100) / 100,
    isAccurate,
  };
}

// ============================================================
// Realtime Subscriptions
// ============================================================

export function subscribeToWoodOrders(
  callback: (payload: any) => void
) {
  return supabaseWood
    .channel('wood_orders_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'wood_orders' },
      callback
    )
    .subscribe();
}

export function subscribeToWoodOrder(
  orderId: string,
  callback: (payload: any) => void
) {
  return supabaseWood
    .channel(`wood_order_${orderId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'wood_orders', filter: `id=eq.${orderId}` },
      callback
    )
    .subscribe();
}

// ============================================================
// Storage (رفع صور الموديلات)
// ============================================================

export async function uploadWoodModelImage(
  file: File,
  modelCode: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${modelCode}_${Date.now()}.${fileExt}`;
  const filePath = `wood-models/${fileName}`;

  const { error: uploadError } = await supabaseWood.storage
    .from('catalogue')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabaseWood.storage
    .from('catalogue')
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function deleteWoodModelImage(url: string): Promise<void> {
  const path = url.split('/').slice(-2).join('/');
  const { error } = await supabaseWood.storage
    .from('catalogue')
    .remove([path]);

  if (error) throw error;
}