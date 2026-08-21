// ============================================================
// El Mahboubi ERP — Foam Module Supabase Library
// بدون Shape — ارتفاع → منتج → سعر
// ============================================================

import { createClient } from '@supabase/supabase-js';
import type {
  FoamProduct, FoamProductHeight, FoamOrder, FoamOrderSeddar,
  Supplier, AuditLog, FoamSettings, FoamPriceCalc
} from '../types/foam-types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================
// SUPPLIERS
// ============================================================

export async function getSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('is_active', true)
    .order('company_name');
  if (error) throw error;
  return data || [];
}

export async function getDefaultSupplier(): Promise<Supplier | null> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('is_default', true)
    .eq('is_active', true)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// ============================================================
// FOAM PRODUCTS
// ============================================================

export async function getFoamProducts(withHeights = false): Promise<FoamProduct[]> {
  const { data, error } = await supabase
    .from('foam_products')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;

  const products = data || [];

  if (withHeights) {
    for (const product of products) {
      product.heights = await getFoamProductHeights(product.id);
    }
  }

  return products;
}

export async function getFoamProductById(id: string): Promise<FoamProduct | null> {
  const { data, error } = await supabase
    .from('foam_products')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;

  data.heights = await getFoamProductHeights(id);
  return data;
}

// ─── Height Input (للكاتالوج) ──────────────────────────────
export interface HeightInput {
  height_cm: number;
  price_per_meter: number;
  square_corner_price: number;
  triangle_corner_price: number;
}

export async function createFoamProduct(
  product: Omit<FoamProduct, 'id' | 'created_at' | 'updated_at' | 'heights'>,
  heights: HeightInput[]
): Promise<FoamProduct> {
  const { data, error } = await supabase
    .from('foam_products')
    .insert(product)
    .select()
    .single();
  if (error) throw error;

  if (heights.length > 0) {
    const heightRows = heights.map(h => ({
      product_id: data.id,
      height_cm: h.height_cm,
      price_per_meter: h.price_per_meter,
      square_corner_price: h.square_corner_price,
      triangle_corner_price: h.triangle_corner_price,
      is_active: true
    }));
    await supabase.from('foam_product_heights').insert(heightRows);
  }

  data.heights = await getFoamProductHeights(data.id);
  return data;
}

export async function updateFoamProduct(
  id: string,
  updates: Partial<FoamProduct>,
  heights?: HeightInput[]
): Promise<FoamProduct> {
  const { data, error } = await supabase
    .from('foam_products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  if (heights) {
    await supabase.from('foam_product_heights').delete().eq('product_id', id);
    if (heights.length > 0) {
      const heightRows = heights.map(h => ({
        product_id: id,
        height_cm: h.height_cm,
        price_per_meter: h.price_per_meter,
        square_corner_price: h.square_corner_price,
        triangle_corner_price: h.triangle_corner_price,
        is_active: true
      }));
      await supabase.from('foam_product_heights').insert(heightRows);
    }
  }

  data.heights = await getFoamProductHeights(id);
  return data;
}

export async function deleteFoamProduct(id: string): Promise<void> {
  const { error } = await supabase.from('foam_products').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// FOAM PRODUCT HEIGHTS
// ============================================================

export async function getFoamProductHeights(
  productId: string
): Promise<FoamProductHeight[]> {
  const { data, error } = await supabase
    .from('foam_product_heights')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('height_cm');
  if (error) throw error;
  return data || [];
}

// ─── Helper: جلب السعر الصحيح لـ (منتج + ارتفاع) ──────────
export function getHeightPrice(
  product: FoamProduct,
  heightCm: number
): {
  pricePerMeter: number;
  squareCornerPrice: number;
  triangleCornerPrice: number;
  heightRecord: FoamProductHeight | null;
} {
  const record = product.heights?.find(h => h.height_cm === heightCm) || null;

  return {
    pricePerMeter: record?.price_per_meter ?? 0,
    squareCornerPrice: record?.square_corner_price ?? 0,
    triangleCornerPrice: record?.triangle_corner_price ?? 0,
    heightRecord: record,
  };
}

// ============================================================
// FOAM ORDERS
// ============================================================

export async function getFoamOrders(status?: string): Promise<FoamOrder[]> {
  let query = supabase
    .from('foam_orders')
    .select(`
      *,
      seddars:foam_order_seddars(*),
      supplier:suppliers(*)
    `)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getFoamOrderById(id: string): Promise<FoamOrder | null> {
  const { data, error } = await supabase
    .from('foam_orders')
    .select(`
      *,
      seddars:foam_order_seddars(*),
      supplier:suppliers(*)
    `)
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export interface CreateFoamOrderInput {
  product: FoamProduct;
  heightCm: number;
  widthCm: number;
  seddars: number[];
  hasCorners: boolean;
  squareCorners: number;
  triangleCorners: number;
  customerName: string;
  customerPhone: string;
  deliveryDate: string;
  notes: string;
  deposit: number;
  pricePerMeter?: number;
  squareCornerPrice?: number;
  triangleCornerPrice?: number;
  priceAdjustment?: {
    type: 'discount' | 'increase';
    value: number;
    reason: string;
  } | null;
  createdBy?: string;
  createdByRole?: string;
}

export async function createFoamOrder(
  input: CreateFoamOrderInput
): Promise<FoamOrder> {
  const heightPrice = getHeightPrice(input.product, input.heightCm);
  const effectivePricePerMeter = input.pricePerMeter ?? heightPrice.pricePerMeter;
  const effectiveSquareCornerPrice = input.squareCornerPrice ?? heightPrice.squareCornerPrice;
  const effectiveTriangleCornerPrice = input.triangleCornerPrice ?? heightPrice.triangleCornerPrice;

  const totalLength = input.seddars.reduce((sum, len) => sum + len, 0);
  const seddarsTotal = totalLength * effectivePricePerMeter;
  const squareCornersTotal = input.hasCorners
    ? input.squareCorners * effectiveSquareCornerPrice
    : 0;
  const triangleCornersTotal = input.hasCorners
    ? input.triangleCorners * effectiveTriangleCornerPrice
    : 0;
  const subtotal = seddarsTotal + squareCornersTotal + triangleCornersTotal;

  let finalTotal = subtotal;
  if (input.priceAdjustment) {
    finalTotal = input.priceAdjustment.type === 'discount'
      ? Math.max(0, subtotal - input.priceAdjustment.value)
      : subtotal + input.priceAdjustment.value;
  }

  const remaining = finalTotal - input.deposit;

  const { data: orderNumData, error: orderNumError } = await supabase.rpc(
    'generate_foam_order_number'
  );
  if (orderNumError) throw orderNumError;

  const orderNumber = orderNumData || `MHB-FOAM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
  const invoiceNumber = `INV-${orderNumber}`;

  const orderData = {
    order_number: orderNumber,
    invoice_number: invoiceNumber,
    product_id: input.product.id,
    product_name: input.product.name,
    height_cm: input.heightCm,
    width_cm: input.widthCm,
    price_per_meter: effectivePricePerMeter,
    square_corner_price: effectiveSquareCornerPrice,
    triangle_corner_price: effectiveTriangleCornerPrice,
    total_length_meters: totalLength,
    seddars_total: seddarsTotal,
    square_corners_count: input.hasCorners ? input.squareCorners : 0,
    square_corners_total: squareCornersTotal,
    triangle_corners_count: input.hasCorners ? input.triangleCorners : 0,
    triangle_corners_total: triangleCornersTotal,
    subtotal: subtotal,
    price_adjustment_type: input.priceAdjustment?.type || null,
    price_adjustment_value: input.priceAdjustment?.value || 0,
    price_adjustment_reason: input.priceAdjustment?.reason || null,
    final_total: finalTotal,
    customer_name: input.customerName,
    customer_phone: input.customerPhone || null,
    delivery_date: input.deliveryDate || null,
    notes: input.notes || null,
    deposit_amount: input.deposit,
    remaining_amount: remaining,
    status: 'pending',
    created_by: input.createdBy || 'system',
    created_by_role: input.createdByRole || 'seller',
  };

  const { data: order, error } = await supabase
    .from('foam_orders')
    .insert(orderData)
    .select()
    .single();
  if (error) throw error;

  if (input.seddars.length > 0) {
    const seddarRows = input.seddars.map((len, idx) => ({
      order_id: order.id,
      length_meters: len,
      sort_order: idx,
    }));
    await supabase.from('foam_order_seddars').insert(seddarRows);
  }

  await createAuditLog({
    table_name: 'foam_orders',
    record_id: order.id,
    operation: 'INSERT',
    action_type: 'create_order',
    user_name: input.createdBy,
    user_role: input.createdByRole,
    new_values: orderData,
    reason: 'إنشاء طلب بونج جديد',
  });

  return getFoamOrderById(order.id) as Promise<FoamOrder>;
}

export async function updateFoamOrderStatus(
  id: string,
  status: string,
  userName?: string,
  userRole?: string
): Promise<FoamOrder> {
  const { data: oldOrder } = await supabase
    .from('foam_orders')
    .select('*')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('foam_orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  await createAuditLog({
    table_name: 'foam_orders',
    record_id: id,
    operation: 'UPDATE',
    action_type: 'status_change',
    user_name: userName,
    user_role: userRole,
    old_values: { status: oldOrder?.status },
    new_values: { status },
    reason: `تغيير الحالة من ${oldOrder?.status} إلى ${status}`,
  });

  return data;
}

export async function deleteFoamOrder(
  id: string,
  userName?: string,
  userRole?: string
): Promise<void> {
  const { data: oldOrder } = await supabase
    .from('foam_orders')
    .select('*')
    .eq('id', id)
    .single();

  const { error } = await supabase.from('foam_orders').delete().eq('id', id);
  if (error) throw error;

  await createAuditLog({
    table_name: 'foam_orders',
    record_id: id,
    operation: 'DELETE',
    action_type: 'delete_order',
    user_name: userName,
    user_role: userRole,
    old_values: oldOrder,
    reason: 'حذف طلب بونج',
  });
}

// ============================================================
// AUDIT LOGS
// ============================================================

export async function createAuditLog(
  log: Omit<AuditLog, 'id' | 'created_at'>
): Promise<AuditLog> {
  const { data, error } = await supabase
    .from('audit_logs')
    .insert(log)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAuditLogs(
  tableName?: string,
  recordId?: string
): Promise<AuditLog[]> {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (tableName) query = query.eq('table_name', tableName);
  if (recordId) query = query.eq('record_id', recordId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ============================================================
// SETTINGS
// ============================================================

export async function getFoamSettings(): Promise<FoamSettings> {
  const keys = [
    'foam_supplier_reminder_days',
    'foam_order_prefix',
    'foam_manager_pin',
  ];
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', keys);

  if (error) throw error;

  const settingsMap = new Map(data?.map(s => [s.key, s.value]) || []);

  const rawDays = settingsMap.get('foam_supplier_reminder_days') || '"20"';
  const rawPrefix = settingsMap.get('foam_order_prefix') || '"MHB-FOAM"';
  const rawPin = settingsMap.get('foam_manager_pin') || '"9999"';

  const stripQuotes = (s: string) => s.replace(/^"/, '').replace(/"$/, '');

  return {
    supplier_reminder_days: parseInt(stripQuotes(rawDays)),
    order_prefix: stripQuotes(rawPrefix),
    manager_pin: stripQuotes(rawPin),
  };
}

// ============================================================
// PRICE CALCULATIONS
// ============================================================

export function calculateFoamPrice(
  seddars: number[],
  pricePerMeter: number,
  hasCorners: boolean,
  squareCorners: number,
  triangleCorners: number,
  squareCornerPrice: number,
  triangleCornerPrice: number,
  adjustment?: { type: 'discount' | 'increase'; value: number } | null
): FoamPriceCalc {
  const totalLength = seddars.reduce((sum, len) => sum + len, 0);
  const seddarsTotal = totalLength * pricePerMeter;
  const squareCornersTotal = hasCorners ? squareCorners * squareCornerPrice : 0;
  const triangleCornersTotal = hasCorners ? triangleCorners * triangleCornerPrice : 0;
  const subtotal = seddarsTotal + squareCornersTotal + triangleCornersTotal;

  let adjustmentAmount = 0;
  if (adjustment) {
    adjustmentAmount = adjustment.type === 'discount' ? -adjustment.value : adjustment.value;
  }

  const finalTotal = Math.max(0, subtotal + adjustmentAmount);

  return {
    totalLength,
    seddarsTotal,
    squareCornersTotal,
    triangleCornersTotal,
    subtotal,
    adjustmentAmount,
    finalTotal,
  };
}

// ============================================================
// WHATSAPP MESSAGE
// ============================================================

export function generateWhatsAppMessage(
  order: FoamOrder,
  supplier: Supplier
): string {
  const seddarsList = order.seddars
    ?.map(s => `• ${s.length_meters.toFixed(2)} م`)
    .join('\n') || '';

  return `السلام عليكم،

نرجو تجهيز الطلب التالي:

رقم الطلب: ${order.order_number}
المنتج: ${order.product_name}
الارتفاع: ${order.height_cm} سم
العرض: ${order.width_cm} سم

أطوال السدادر:
${seddarsList}

إجمالي الأطوال: ${order.total_length_meters.toFixed(2)} متر
الفورمجة المربعة: ${order.square_corners_count}
الفورمجة المثلثة: ${order.triangle_corners_count}

تاريخ التسليم: ${order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('ar-MA') : 'غير محدد'}

المرجو تأكيد استلام الطلب.`;
}

export function openWhatsApp(phone: string, message: string): void {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
}

// ============================================================
// REALTIME SUBSCRIPTIONS
// ============================================================

export function subscribeToFoamOrders(
  callback: (order: FoamOrder) => void
) {
  return supabase
    .channel('foam_orders_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'foam_orders' },
      payload => callback(payload.new as FoamOrder)
    )
    .subscribe();
}

// ============================================================
// STATISTICS
// ============================================================

export async function getFoamStats(
  period: 'today' | 'week' | 'month' = 'month'
) {
  const since = new Date();
  if (period === 'today') since.setHours(0, 0, 0, 0);
  else if (period === 'week') since.setDate(since.getDate() - 7);
  else since.setDate(since.getDate() - 30);

  const { data } = await supabase
    .from('foam_orders')
    .select('final_total, status, delivery_date, deposit_amount')
    .gte('created_at', since.toISOString());

  const orders = data || [];
  return {
    totalSales: orders.reduce((s, o) => s + (o.final_total || 0), 0),
    totalOrders: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    inProduction: orders.filter(o => o.status === 'in_production').length,
    ready: orders.filter(o => o.status === 'ready').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    avgOrderValue: orders.length > 0
      ? orders.reduce((s, o) => s + (o.final_total || 0), 0) / orders.length
      : 0,
    totalDeposit: orders.reduce((s, o) => s + (o.deposit_amount || 0), 0),
  };
}

// ============================================================
// REMINDERS
// ============================================================

export async function getFoamReminders(daysAhead: number = 3) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const future = new Date(today);
  future.setDate(future.getDate() + daysAhead);

  const { data } = await supabase
    .from('foam_orders')
    .select(`
      *,
      seddars:foam_order_seddars(*),
      supplier:suppliers(*)
    `)
    .gte('delivery_date', today.toISOString().split('T')[0])
    .lte('delivery_date', future.toISOString().split('T')[0])
    .not('status', 'in', '(delivered,cancelled)')
    .order('delivery_date', { ascending: true });

  return (data as FoamOrder[]) || [];
}

// ============================================================
// CSV EXPORT
// ============================================================

export function exportFoamOrdersToCSV(orders: FoamOrder[]) {
  const headers = [
    'رقم الطلب', 'الزبون', 'الهاتف', 'المنتج', 'الارتفاع', 'العرض',
    'أطوال السدادر', 'إجمالي الأطوال', 'السعر لكل متر', 'السعر الأساسي',
    'نوع التعديل', 'قيمة التعديل', 'السعر النهائي', 'التسبيق', 'المتبقي',
    'الحالة', 'تاريخ التسليم', 'تاريخ الإنشاء',
  ];

  const rows = orders.map(o => [
    o.order_number, o.customer_name, o.customer_phone, o.product_name || '—',
    o.height_cm, o.width_cm,
    o.seddars?.map(s => s.length_meters).join(';') || '—',
    o.total_length_meters, o.price_per_meter, o.subtotal,
    o.price_adjustment_type || '—', o.price_adjustment_value || 0,
    o.final_total, o.deposit_amount, o.remaining_amount,
    o.status, o.delivery_date || '—', o.created_at,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `foam-orders-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// DASHBOARD CHART DATA
// ============================================================

export async function getFoamSalesChartData(days: number = 30) {
  const result: { day: string; sales: number; count: number }[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    const dayLabel = d.getDate().toString();

    const { data } = await supabase
      .from('foam_orders')
      .select('final_total')
      .gte('created_at', dayStr)
      .lt('created_at', dayStr + 'T23:59:59');

    const sales = (data || []).reduce((s, o) => s + (o.final_total || 0), 0);
    result.push({ day: dayLabel, sales, count: data?.length || 0 });
  }

  return result;
}