// ============================================================
// lib/orders-unified.ts
// Unified Orders System - Core Functions
// ============================================================

import { supabase } from './supabase';

// ─── Types ───

export type ProductType = 'salon' | 'khamiya' | 'romani' | 'bounge' | 'tapis' | 'wood' | 'mixed';

export type WorkflowStatus =
  | 'new'
  | 'review'
  | 'tailor_assigned'
  | 'cutting'
  | 'sewing'
  | 'quality_check'
  | 'ready'
  | 'delivered'
  | 'cancelled'
  | 'archived';

export type PriorityLevel = 'low' | 'normal' | 'high' | 'urgent';

export interface UnifiedOrder {
  id: string;
  order_number: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_city: string | null;
  total_amount: number | null;
  deposit_amount: number | null;
  remaining_amount: number | null;
  status: string | null;
  workflow_status: string | null;
  product_type: string | null;
  delivery_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  assigned_tailor_id: string | null;
  company_contact_id: string | null;
  is_archived: boolean | null;
  archived_at: string | null;
  tracking_token: string | null;
  delay_count: number | null;
  notes: string | null;
  payload: any;
  original_table: string | null;
  tailor_name?: string | null;
  tailor_phone?: string | null;
  company_name?: string | null;
  company_phone?: string | null;
  company_whatsapp?: string | null;
  pending_reminders?: number;
  completed_steps?: number;
  total_steps?: number;
  total_carpenter_paid?: number;
}

export interface OrderReminder {
  id: string;
  order_id: string;
  reminder_type: string;
  title: string;
  description: string | null;
  trigger_date: string;
  is_triggered: boolean;
  is_dismissed: boolean;
  priority: PriorityLevel;
  whatsapp_template: string | null;
  created_at: string;
}

export interface WorkflowStep {
  id: string;
  order_id: string;
  step_name: string;
  step_label: string;
  step_icon: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  started_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  photo_url: string | null;
  sort_order: number;
}

export interface CarpenterPayment {
  id: string;
  order_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  receipt_url: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CompanyContact {
  id: string;
  company_name: string;
  contact_name: string | null;
  phone: string;
  email: string | null;
  whatsapp_number: string | null;
  category: string;
  is_primary: boolean;
  active: boolean;
}

export interface InvoiceArchiveItem {
  id: string;
  order_id: string;
  invoice_number: string | null;
  invoice_image_url: string;
  supplier_name: string | null;
  amount: number | null;
  invoice_date: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface DelayLog {
  id: string;
  order_id: string;
  old_delivery_date: string | null;
  new_delivery_date: string;
  reason: string | null;
  apology_message: string | null;
  apology_sent: boolean;
  sent_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface WhatsAppMessage {
  id: string;
  order_id: string;
  recipient_phone: string;
  message_type: string;
  message_content: string;
  status: string;
  sent_at: string | null;
  created_at: string;
}

// ─── Product Labels ───

export const PRODUCT_LABELS: Record<
  ProductType,
  { label: string; icon: string; color: string; bg: string }
> = {
  salon:    { label: 'ثوب الصالون', icon: '🛋️', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  khamiya:  { label: 'الخامية', icon: '🧵', color: 'text-blue-700', bg: 'bg-blue-50' },
  romani:   { label: 'الصالون الرومي', icon: '🏛️', color: 'text-amber-700', bg: 'bg-amber-50' },
  bounge:   { label: 'البونج', icon: '🧽', color: 'text-orange-700', bg: 'bg-orange-50' },
  tapis:    { label: 'الزربية', icon: '🧶', color: 'text-purple-700', bg: 'bg-purple-50' },
  wood:     { label: 'العود', icon: '🪵', color: 'text-amber-800', bg: 'bg-amber-50' },
  mixed:    { label: 'مختلط', icon: '📦', color: 'text-gray-700', bg: 'bg-gray-50' },
};

export const WORKFLOW_STATUS_LABELS: Record<
  WorkflowStatus,
  { label: string; color: string; bg: string }
> = {
  new:              { label: 'جديد', color: 'text-gray-700', bg: 'bg-gray-100' },
  review:           { label: 'قيد المراجعة', color: 'text-blue-700', bg: 'bg-blue-100' },
  tailor_assigned:  { label: 'تم تعيين الخياط', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  cutting:          { label: 'التقطيع', color: 'text-amber-700', bg: 'bg-amber-100' },
  sewing:           { label: 'الخياطة', color: 'text-pink-700', bg: 'bg-pink-100' },
  quality_check:    { label: 'فحص الجودة', color: 'text-cyan-700', bg: 'bg-cyan-100' },
  ready:            { label: 'جاهز', color: 'text-green-700', bg: 'bg-green-100' },
  delivered:        { label: 'مُسلّم', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  cancelled:        { label: 'ملغى', color: 'text-red-700', bg: 'bg-red-100' },
  archived:         { label: 'مؤرشف', color: 'text-gray-500', bg: 'bg-gray-100' },
};

export const PRIORITY_CONFIG: Record<
  PriorityLevel,
  { label: string; color: string; bg: string; border: string }
> = {
  low:    { label: 'منخفض', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  normal: { label: 'عادي', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  high:   { label: 'مهم', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  urgent: { label: 'عاجل', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

// ─── Helpers ───

export function formatCurrency(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return 'DH 0';
  return `DH ${Math.round(n).toLocaleString('fr-MA')}`;
}

export function getDaysLeft(deliveryDate: string | null | undefined): number {
  if (!deliveryDate) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(deliveryDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getPriorityLevel(daysLeft: number): {
  level: PriorityLevel;
  label: string;
  color: string;
  bg: string;
  icon: string;
} {
  if (daysLeft < 0) return { level: 'urgent', label: 'متأخر', color: 'text-red-700', bg: 'bg-red-100', icon: '🔴' };
  if (daysLeft <= 3) return { level: 'urgent', label: 'عاجل جداً', color: 'text-red-700', bg: 'bg-red-100', icon: '🔴' };
  if (daysLeft <= 7) return { level: 'high', label: 'قريب', color: 'text-orange-700', bg: 'bg-orange-100', icon: '🟡' };
  if (daysLeft <= 14) return { level: 'normal', label: 'قريب نسبياً', color: 'text-blue-700', bg: 'bg-blue-100', icon: '🔵' };
  return { level: 'low', label: 'مريح', color: 'text-green-700', bg: 'bg-green-100', icon: '🟢' };
}

export function getProductLabel(type: string | null): string {
  return PRODUCT_LABELS[(type as ProductType) || 'mixed']?.label || type || '—';
}

export function getProductIcon(type: string | null): string {
  return PRODUCT_LABELS[(type as ProductType) || 'mixed']?.icon || '📦';
}

export function getWorkflowStatusLabel(status: string | null): string {
  return WORKFLOW_STATUS_LABELS[(status as WorkflowStatus) || 'new']?.label || status || 'جديد';
}

export function generateOrderNumber(productType: ProductType): string {
  const prefix = {
    salon: 'SLN', khamiya: 'KHM', romani: 'RMN',
    bounge: 'BNG', tapis: 'TPS', wood: 'WOD', mixed: 'MXD'
  }[productType] || 'ORD';
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}`;
}

export function generateTrackingToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// ─── Fetch Functions ───

export async function fetchUnifiedOrders(filters?: {
  productType?: ProductType | 'all';
  status?: WorkflowStatus | 'all';
  searchQuery?: string;
  tailorId?: string;
  isArchived?: boolean;
  dateFrom?: string;
  dateTo?: string;
}): Promise<UnifiedOrder[]> {
  let query = supabase
    .from('unified_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.productType && filters.productType !== 'all') {
    query = query.eq('product_type', filters.productType);
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('workflow_status', filters.status);
  }
  if (filters?.tailorId) {
    query = query.eq('assigned_tailor_id', filters.tailorId);
  }
  if (filters?.isArchived !== undefined) {
    query = query.eq('is_archived', filters.isArchived);
  } else {
    query = query.or('is_archived.eq.false,is_archived.is.null');
  }
  if (filters?.dateFrom) {
    query = query.gte('delivery_date', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('delivery_date', filters.dateTo);
  }
  if (filters?.searchQuery) {
    const q = filters.searchQuery.trim();
    query = query.or(
      `customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,order_number.ilike.%${q}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error('fetchUnifiedOrders error:', error);
    throw error;
  }
  return (data || []) as UnifiedOrder[];
}

export async function fetchOrderById(orderId: string): Promise<UnifiedOrder | null> {
  const { data, error } = await supabase
    .from('unified_orders')
    .select('*')
    .eq('id', orderId)
    .single();
  if (error) {
    console.error('fetchOrderById error:', error);
    return null;
  }
  return data as UnifiedOrder | null;
}

export async function updateOrderWorkflowStatus(
  orderId: string,
  status: WorkflowStatus
): Promise<void> {
  const { error } = await (supabase
    .from('orders') as any)
    .update({ workflow_status: status, updated_at: new Date().toISOString() })
    .eq('id', orderId);
  if (error) throw error;
}

export async function assignTailor(orderId: string, tailorId: string | null): Promise<void> {
  const { error } = await (supabase
    .from('orders') as any)
    .update({
      assigned_tailor_id: tailorId,
      workflow_status: tailorId ? 'tailor_assigned' : 'review',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);
  if (error) throw error;
}

export async function assignCompanyContact(
  orderId: string,
  contactId: string | null
): Promise<void> {
  const { error } = await (supabase
    .from('orders') as any)
    .update({ company_contact_id: contactId, updated_at: new Date().toISOString() })
    .eq('id', orderId);
  if (error) throw error;
}

// ─── Reminders ───

export async function fetchOrderReminders(orderId: string): Promise<OrderReminder[]> {
  const { data, error } = await supabase
    .from('order_reminders')
    .select('*')
    .eq('order_id', orderId)
    .order('trigger_date', { ascending: true });
  if (error) throw error;
  return (data || []) as OrderReminder[];
}

export async function fetchActiveReminders(): Promise<OrderReminder[]> {
  const { data, error } = await supabase
    .from('order_reminders')
    .select('*, orders!inner(order_number, customer_name, product_type, delivery_date)')
    .eq('is_triggered', false)
    .eq('is_dismissed', false)
    .lte(
      'trigger_date',
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    )
    .order('trigger_date', { ascending: true });
  if (error) {
    console.error('fetchActiveReminders error:', error);
    throw error;
  }
  return (data || []) as any[];
}

export async function dismissReminder(reminderId: string, dismissedBy: string): Promise<void> {
  const { error } = await (supabase
    .from('order_reminders') as any)
    .update({
      is_dismissed: true,
      dismissed_at: new Date().toISOString(),
      dismissed_by: dismissedBy,
    })
    .eq('id', reminderId);
  if (error) throw error;
}

export async function triggerReminder(reminderId: string): Promise<void> {
  const { error } = await (supabase
    .from('order_reminders') as any)
    .update({ is_triggered: true, triggered_at: new Date().toISOString() })
    .eq('id', reminderId);
  if (error) throw error;
}

// ─── Workflow Steps ───

export async function fetchWorkflowSteps(orderId: string): Promise<WorkflowStep[]> {
  const { data, error } = await supabase
    .from('order_workflow_steps')
    .select('*')
    .eq('order_id', orderId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []) as WorkflowStep[];
}

export async function startWorkflowStep(stepId: string, startedBy?: string): Promise<void> {
  const { error } = await (supabase
    .from('order_workflow_steps') as any)
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', stepId);
  if (error) throw error;
}

export async function completeWorkflowStep(
  stepId: string,
  completedBy: string,
  notes?: string,
  photoUrl?: string
): Promise<void> {
  const { error } = await (supabase
    .from('order_workflow_steps') as any)
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: completedBy,
      notes: notes || null,
      photo_url: photoUrl || null,
    })
    .eq('id', stepId);
  if (error) throw error;
}

// ─── Carpenter Payments ───

export async function fetchCarpenterPayments(orderId: string): Promise<CarpenterPayment[]> {
  const { data, error } = await supabase
    .from('carpenter_payments')
    .select('*')
    .eq('order_id', orderId)
    .order('payment_date', { ascending: false });
  if (error) throw error;
  return (data || []) as CarpenterPayment[];
}

export async function addCarpenterPayment(
  payment: Omit<CarpenterPayment, 'id' | 'created_at'>
): Promise<CarpenterPayment> {
  const { data, error } = await supabase
    .from('carpenter_payments')
    .insert(payment as any)
    .select()
    .single();
  if (error) throw error;
  return data as CarpenterPayment;
}

export async function deleteCarpenterPayment(paymentId: string): Promise<void> {
  const { error } = await supabase
    .from('carpenter_payments')
    .delete()
    .eq('id', paymentId);
  if (error) throw error;
}

export function getCarpenterRemaining(order: UnifiedOrder): number {
  const totalPaid = order.total_carpenter_paid || 0;
  const totalAmount = order.total_amount || 0;
  return Math.max(0, totalAmount - totalPaid);
}

// ─── Company Contacts ───

export async function fetchCompanyContacts(category?: string): Promise<CompanyContact[]> {
  let query = supabase
    .from('company_contacts')
    .select('*')
    .eq('active', true)
    .order('company_name');
  if (category) query = query.eq('category', category);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as CompanyContact[];
}

export async function addCompanyContact(
  contact: Omit<CompanyContact, 'id' | 'created_at'>
): Promise<CompanyContact> {
  const { data, error } = await supabase
    .from('company_contacts')
    .insert(contact as any)
    .select()
    .single();
  if (error) throw error;
  return data as CompanyContact;
}

// ─── Invoice Archive ───

export async function fetchInvoiceArchive(orderId: string): Promise<InvoiceArchiveItem[]> {
  const { data, error } = await supabase
    .from('invoice_archive')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as InvoiceArchiveItem[];
}

export async function addInvoiceToArchive(
  invoice: Omit<InvoiceArchiveItem, 'id' | 'created_at'>
): Promise<InvoiceArchiveItem> {
  const { data, error } = await supabase
    .from('invoice_archive')
    .insert(invoice as any)
    .select()
    .single();
  if (error) throw error;
  return data as InvoiceArchiveItem;
}

// ─── Delay & Apology ───

export async function logDeliveryDelay(
  log: Omit<DelayLog, 'id' | 'created_at'>
): Promise<DelayLog> {
  const { data, error } = await supabase
    .from('delivery_delay_logs')
    .insert(log as any)
    .select()
    .single();
  if (error) throw error;

  // Increment delay_count manually
  const { data: orderData } = await supabase
    .from('orders')
    .select('delay_count')
    .eq('id', log.order_id)
    .single() as { data: { delay_count: number } | null };

  await (supabase
    .from('orders') as any)
    .update({
      delay_count: ((orderData?.delay_count || 0)) + 1,
      delivery_date: log.new_delivery_date,
      updated_at: new Date().toISOString(),
    })
    .eq('id', log.order_id);

  return data as DelayLog;
}

export async function fetchDelayLogs(orderId: string): Promise<DelayLog[]> {
  const { data, error } = await supabase
    .from('delivery_delay_logs')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as DelayLog[];
}

// ─── Archive ───

export async function archiveOrder(orderId: string, archivedBy: string, reason?: string): Promise<void> {
  await supabase.from('order_archive_log').insert({
    order_id: orderId,
    archived_by: archivedBy,
    archive_reason: reason || null,
    archived_at: new Date().toISOString(),
  } as any);
  await (supabase
    .from('orders') as any)
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
      workflow_status: 'archived',
    })
    .eq('id', orderId);
}

export async function restoreOrder(orderId: string, restoredBy: string): Promise<void> {
  await (supabase
    .from('order_archive_log') as any)
    .update({ restored_at: new Date().toISOString(), restored_by: restoredBy })
    .eq('order_id', orderId)
    .is('restored_at', null);

  await (supabase
    .from('orders') as any)
    .update({ is_archived: false, archived_at: null, workflow_status: 'ready' })
    .eq('id', orderId);
}

export async function fetchArchivedOrders(): Promise<UnifiedOrder[]> {
  const { data, error } = await supabase
    .from('unified_orders')
    .select('*')
    .eq('is_archived', true)
    .order('archived_at', { ascending: false });
  if (error) throw error;
  return (data || []) as UnifiedOrder[];
}

// ─── Tracking Token ───

export async function getOrCreateTrackingToken(orderId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('order_tracking_tokens')
    .select('token')
    .eq('order_id', orderId)
    .eq('is_active', true)
    .single() as { data: { token: string } | null };

  if (existing?.token) return existing.token;

  const token = generateTrackingToken();
  await (supabase
    .from('order_tracking_tokens') as any)
    .insert({
      order_id: orderId,
      token,
      is_active: true,
    });

  const { error } = await (supabase
    .from('orders') as any)
    .update({ tracking_token: token })
    .eq('id', orderId);
  if (error) throw error;
  return token;
}

export async function getOrderByTrackingToken(token: string): Promise<UnifiedOrder | null> {
  const { data: tokenData } = await supabase
    .from('order_tracking_tokens')
    .select('order_id, access_count')
    .eq('token', token)
    .eq('is_active', true)
    .single() as { data: { order_id: string; access_count: number } | null };

  if (!tokenData?.order_id) return null;

  await (supabase
    .from('order_tracking_tokens') as any)
    .update({
      access_count: (tokenData.access_count || 0) + 1,
      last_accessed_at: new Date().toISOString(),
    })
    .eq('token', token);

  return fetchOrderById(tokenData.order_id);
}

export async function getTrackingSteps(orderId: string): Promise<WorkflowStep[]> {
  const steps = await fetchWorkflowSteps(orderId);
  if (steps.length > 0) return steps;

  const order = await fetchOrderById(orderId);
  if (!order) return [];

  const defaultSteps: WorkflowStep[] = [];

  if (order.product_type === 'bounge') {
    defaultSteps.push(
      { id: '1', order_id: orderId, step_name: 'new', step_label: 'تم استلام الطلبية', step_icon: '📥', status: 'completed', started_at: order.created_at, completed_at: order.created_at, completed_by: null, notes: null, photo_url: null, sort_order: 1 },
      { id: '2', order_id: orderId, step_name: 'sent_to_company', step_label: 'إرسال للشركة', step_icon: '📤', status: order.workflow_status !== 'new' ? 'completed' : 'pending', started_at: null, completed_at: null, completed_by: null, notes: null, photo_url: null, sort_order: 2 },
      { id: '3', order_id: orderId, step_name: 'in_production', step_label: 'قيد الإنتاج', step_icon: '🏭', status: ['in_production', 'ready', 'delivered'].includes(order.workflow_status || '') ? 'completed' : 'pending', started_at: null, completed_at: null, completed_by: null, notes: null, photo_url: null, sort_order: 3 },
      { id: '4', order_id: orderId, step_name: 'ready', step_label: 'جاهز للتسليم', step_icon: '✅', status: ['ready', 'delivered'].includes(order.workflow_status || '') ? 'completed' : 'pending', started_at: null, completed_at: null, completed_by: null, notes: null, photo_url: null, sort_order: 4 },
    );
  } else if (order.product_type === 'tapis') {
    defaultSteps.push(
      { id: '1', order_id: orderId, step_name: 'new', step_label: 'تم استلام الطلبية', step_icon: '📥', status: 'completed', started_at: order.created_at, completed_at: order.created_at, completed_by: null, notes: null, photo_url: null, sort_order: 1 },
      { id: '2', order_id: orderId, step_name: 'contacted_shop', step_label: 'الاتصال بمحل الزرابي', step_icon: '📞', status: order.workflow_status !== 'new' ? 'completed' : 'pending', started_at: null, completed_at: null, completed_by: null, notes: null, photo_url: null, sort_order: 2 },
      { id: '3', order_id: orderId, step_name: 'ready', step_label: 'جاهز للتسليم', step_icon: '✅', status: ['ready', 'delivered'].includes(order.workflow_status || '') ? 'completed' : 'pending', started_at: null, completed_at: null, completed_by: null, notes: null, photo_url: null, sort_order: 3 },
    );
  } else if (order.product_type === 'wood') {
    defaultSteps.push(
      { id: '1', order_id: orderId, step_name: 'new', step_label: 'تم استلام الطلبية', step_icon: '📥', status: 'completed', started_at: order.created_at, completed_at: order.created_at, completed_by: null, notes: null, photo_url: null, sort_order: 1 },
      { id: '2', order_id: orderId, step_name: 'contacted_carpenter', step_label: 'الاتصال بالنجار', step_icon: '📞', status: order.workflow_status !== 'new' ? 'completed' : 'pending', started_at: null, completed_at: null, completed_by: null, notes: null, photo_url: null, sort_order: 2 },
      { id: '3', order_id: orderId, step_name: 'in_progress', step_label: 'قيد التصنيع', step_icon: '🔨', status: ['in_progress', 'ready', 'delivered'].includes(order.workflow_status || '') ? 'completed' : 'pending', started_at: null, completed_at: null, completed_by: null, notes: null, photo_url: null, sort_order: 3 },
      { id: '4', order_id: orderId, step_name: 'ready', step_label: 'جاهز للتسليم', step_icon: '✅', status: ['ready', 'delivered'].includes(order.workflow_status || '') ? 'completed' : 'pending', started_at: null, completed_at: null, completed_by: null, notes: null, photo_url: null, sort_order: 4 },
    );
  } else if (['salon', 'khamiya', 'romani'].includes(order.product_type || '')) {
    defaultSteps.push(
      { id: '1', order_id: orderId, step_name: 'new', step_label: 'تم استلام الطلبية', step_icon: '📥', status: 'completed', started_at: order.created_at, completed_at: order.created_at, completed_by: null, notes: null, photo_url: null, sort_order: 1 },
      { id: '2', order_id: orderId, step_name: 'tailor_assigned', step_label: 'تعيين الخياط', step_icon: '👔', status: order.workflow_status !== 'new' ? 'completed' : 'pending', started_at: null, completed_at: null, completed_by: null, notes: null, photo_url: null, sort_order: 2 },
      { id: '3', order_id: orderId, step_name: 'cutting', step_label: 'التقطيع', step_icon: '✂️', status: ['cutting', 'sewing', 'quality_check', 'ready', 'delivered'].includes(order.workflow_status || '') ? 'completed' : 'pending', started_at: null, completed_at: null, completed_by: null, notes: null, photo_url: null, sort_order: 3 },
      { id: '4', order_id: orderId, step_name: 'sewing', step_label: 'الخياطة', step_icon: '🪡', status: ['sewing', 'quality_check', 'ready', 'delivered'].includes(order.workflow_status || '') ? 'completed' : 'pending', started_at: null, completed_at: null, completed_by: null, notes: null, photo_url: null, sort_order: 4 },
      { id: '5', order_id: orderId, step_name: 'quality_check', step_label: 'فحص الجودة', step_icon: '🔍', status: ['quality_check', 'ready', 'delivered'].includes(order.workflow_status || '') ? 'completed' : 'pending', started_at: null, completed_at: null, completed_by: null, notes: null, photo_url: null, sort_order: 5 },
      { id: '6', order_id: orderId, step_name: 'ready', step_label: 'جاهز للتسليم', step_icon: '✅', status: ['ready', 'delivered'].includes(order.workflow_status || '') ? 'completed' : 'pending', started_at: null, completed_at: null, completed_by: null, notes: null, photo_url: null, sort_order: 6 },
    );
  }

  return defaultSteps;
}

// ─── WhatsApp (Basic - uses wa.me links) ───

export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export async function sendWhatsAppMessage(
  orderId: string,
  phone: string,
  message: string,
  messageType: string
): Promise<void> {
  await supabase.from('whatsapp_messages').insert({
    order_id: orderId,
    recipient_phone: phone,
    message_type: messageType,
    message_content: message,
    status: 'pending',
  } as any);
  window.open(buildWhatsAppUrl(phone, message), '_blank');
}

export function buildFoamWhatsAppMessage(order: UnifiedOrder, contact: CompanyContact): string {
  const payload = order.payload as any;
  return `مرحباً ${contact.contact_name || contact.company_name}،

طلبية بونج جديدة:
رقم الطلبية: ${order.order_number}
الزبون: ${order.customer_name || '—'}
المنتج: ${payload?.foam_product_name || '—'}
الارتفاع: ${payload?.height_cm || '—'} سم
العرض: ${payload?.width_cm || '—'} سم
الكمية: ${payload?.total_length_meters || '—'} متر
السعر النهائي: ${formatCurrency(order.total_amount)}
موعد التسليم: ${order.delivery_date || '—'}

يرجى تأكيد الاستلام.`;
}

export function buildDelayApologyMessage(
  order: UnifiedOrder,
  newDate: string,
  reason?: string
): string {
  return `مرحباً ${order.customer_name || 'عزيزي الزبون'}،

نأسف لإبلاغك بأنه تم تأجيل موعد تسليم طلبيتك ${order.order_number} إلى ${newDate}.

${reason ? `السبب: ${reason}` : ''}

نقدر تفهمكم ونتطلع لتسليم طلبيتكم في أقرب وقت.

شكراً لثقتكم بنا - El Mahboubi`;
}

export function buildReadyNotificationMessage(order: UnifiedOrder): string {
  return `مرحباً ${order.customer_name || 'عزيزي الزبون'}،

نُسرّ بإبلاغك أن طلبيتك ${order.order_number} جاهزة للتسليم!

يمكنكم مراجعة تفاصيل الطلبية عبر الرابط:
https://mahboubi-erp.vercel.app/track/${order.tracking_token || ''}

شكراً لاختياركم El Mahboubi`;
}

// ─── Export ───

export async function exportOrdersToCSV(orders: UnifiedOrder[]): Promise<string> {
  const headers = [
    'رقم الطلبية', 'الزبون', 'الهاتف', 'المنتج', 'الحالة',
    'المبلغ', 'التسبيق', 'الباقي', 'موعد التسليم', 'الخياط', 'تاريخ الإنشاء',
  ];
  const rows = orders.map((o) => [
    o.order_number,
    o.customer_name,
    o.customer_phone,
    getProductLabel(o.product_type),
    getWorkflowStatusLabel(o.workflow_status),
    o.total_amount,
    o.deposit_amount,
    o.remaining_amount,
    o.delivery_date,
    o.tailor_name,
    o.created_at,
  ]);
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');
  return csv;
}

// ============================================================
// WhatsApp Integration (Baileys)
// ============================================================

import {
  sendWhatsApp as sendViaBaileys,
  buildOrderCreatedMessage,
  buildOrderReadyMessage,
  buildDelayApologyMessage as buildBaileysDelayMsg,
  buildFoamCompanyMessage,
  buildTapisReminderMessage,
  buildWoodCarpenterMessage,
  buildWorkflowStepMessage,
} from './whatsapp-client';

export async function sendOrderCreatedWhatsApp(order: UnifiedOrder): Promise<void> {
  if (!order.customer_phone) return;
  const msg = buildOrderCreatedMessage(order);
  await sendViaBaileys(order.customer_phone, msg);
}

export async function sendOrderReadyWhatsApp(order: UnifiedOrder): Promise<void> {
  if (!order.customer_phone) return;
  const msg = buildOrderReadyMessage(order);
  await sendViaBaileys(order.customer_phone, msg);
}

export async function sendDelayApologyWhatsApp(
  order: UnifiedOrder,
  newDate: string,
  reason?: string
): Promise<void> {
  if (!order.customer_phone) return;
  const msg = buildBaileysDelayMsg(order, newDate, reason);
  await sendViaBaileys(order.customer_phone, msg);
}

export async function sendFoamCompanyWhatsApp(
  order: UnifiedOrder,
  contactPhone: string,
  contactName?: string
): Promise<void> {
  const msg = buildFoamCompanyMessage(order, contactName);
  await sendViaBaileys(contactPhone, msg);
}

export async function sendTapisReminderWhatsApp(
  order: UnifiedOrder,
  shopPhone: string
): Promise<void> {
  const msg = buildTapisReminderMessage(order);
  await sendViaBaileys(shopPhone, msg);
}

export async function sendWoodCarpenterWhatsApp(
  order: UnifiedOrder,
  carpenterPhone: string
): Promise<void> {
  const msg = buildWoodCarpenterMessage(order);
  await sendViaBaileys(carpenterPhone, msg);
}

export async function sendWorkflowStepWhatsApp(
  order: UnifiedOrder,
  stepLabel: string
): Promise<void> {
  if (!order.customer_phone) return;
  const msg = buildWorkflowStepMessage(order, stepLabel);
  await sendViaBaileys(order.customer_phone, msg);
}

export async function sendInvoiceImageWhatsApp(
  order: UnifiedOrder,
  phone: string,
  imageUrl: string
): Promise<void> {
  const { sendWhatsAppImage } = await import('./whatsapp-client');
  await sendWhatsAppImage(phone, imageUrl, `فاتورة طلبية ${order.order_number}`);
}