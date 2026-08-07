// src/lib/supabase-tailors-v2.ts
// Full Supabase integration for Admin Tailors Management
// FIXED to match REAL database schema (71 tables)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== TYPES (aligned with REAL DB schema) ====================

export interface Tailor {
  id: string;
  full_name: string;
  phone: string | null;
  pin_code: string | null;
  wage_percentage: number;
  active: boolean;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
}

export interface WorkItem {
  id: string;
  order_id: string;
  label: string | null;
  kind: string | null;              // PRIMARY type field in DB
  product_type: string | null;     // Secondary type field
  qty: number | null;
  sewing_cost: number;
  tailor_id: string | null;
  created_at: string;
  order_code?: string;
  customer_name?: string;
}

export interface WeeklyWage {
  id: string;
  tailor_id: string | null;
  week_start: string;   // date in DB
  week_end: string;       // date in DB
  total_sewing_value: number | null;  // FIXED: was "total_sewing_cost"
  wage_amount: number | null;
  wage_percentage: number | null;
  status: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface WeeklySummary {
  tailor_id: string;
  tailor_name: string;
  week_start: string;
  week_end: string;
  days_worked: number;
  total_orders: number;
  total_seddars: number;
  total_cushions: number;
  total_decor_cushions: number;
  total_formas: number;
  total_sewing_value: number;  // FIXED: was "total_sewing_cost"
  wage_amount: number;
  wage_percentage: number;
  status: 'pending' | 'paid';
}

export type MessageType = 'text' | 'voice' | 'image' | 'camera';

export interface ChatMessage {
  id: string;
  order_id: string | null;
  sender_role: string | null;
  sender_id: string;           // NOT NULL in DB
  sender_name: string;         // NOT NULL in DB
  recipient_id: string | null;
  body: string | null;
  message_type: string;        // NOT NULL in DB
  media_url: string | null;
  media_duration: number | null;
  media_size: number | null;
  attachment_url: string | null;  // Extra field in DB
  audio_url: string | null;     // Extra field in DB
  is_read: boolean;            // NOT NULL in DB
  created_at: string;
}

// ==================== TAILORS ====================

export async function getTailors(): Promise<Tailor[]> {
  const { data, error } = await supabase
    .from('tailors')
    .select('*')
    .order('full_name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getTailorById(id: string): Promise<Tailor | null> {
  const { data, error } = await supabase
    .from('tailors')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function createTailor(tailor: Omit<Tailor, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('tailors')
    .insert(tailor)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTailor(id: string, updates: Partial<Tailor>) {
  const { error } = await supabase
    .from('tailors')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

// ==================== WORK ITEMS ====================

export async function getTailorWorkItems(
  tailorId: string,
  fromDate: string,
  toDate: string
): Promise<WorkItem[]> {
  const { data, error } = await supabase
    .from('order_items')
    .select(`
      id,
      order_id,
      label,
      kind,
      product_type,
      qty,
      sewing_cost,
      tailor_id,
      created_at,
      orders:order_id (customer_name, id)
    `)
    .eq('tailor_id', tailorId)
    .gte('created_at', fromDate)
    .lte('created_at', toDate)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((item: any) => ({
    ...item,
    order_code: `ORD-${item.order_id.slice(-6).toUpperCase()}`,
    customer_name: item.orders?.customer_name || 'زبون غير معروف',
  }));
}

// ==================== WEEKLY WAGES ====================

export async function getWeeklyWages(tailorId?: string): Promise<WeeklyWage[]> {
  let query = supabase
    .from('weekly_wages')
    .select('*')
    .order('week_start', { ascending: false });

  if (tailorId) query = query.eq('tailor_id', tailorId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function calculateWeeklySummary(
  tailorId: string,
  weekStart: string,
  weekEnd: string
): Promise<WeeklySummary> {
  const { data: tailor } = await supabase
    .from('tailors')
    .select('*')
    .eq('id', tailorId)
    .single();

  const items = await getTailorWorkItems(tailorId, weekStart, weekEnd);

  let totalSewingValue = 0;  // FIXED: was totalSewingCost
  let totalSeddars = 0;
  let totalCushions = 0;
  let totalDecorCushions = 0;
  let totalFormas = 0;
  const uniqueOrders = new Set<string>();
  const uniqueDays = new Set<string>();

  for (const item of items) {
    const qty = item.qty || 1;
    totalSewingValue += item.sewing_cost * qty;
    uniqueOrders.add(item.order_id);
    uniqueDays.add(item.created_at.split('T')[0]);

    // Use BOTH kind and product_type for classification
    const typeStr = (item.kind || item.product_type || '').toLowerCase();
    const labelStr = (item.label || '').toLowerCase();

    if (typeStr.includes('seddari') || labelStr.includes('سداري')) {
      totalSeddars += qty;
    } else if (typeStr.includes('cushion') || labelStr.includes('مخدة') || labelStr.includes('مخد')) {
      if (typeStr.includes('decor') || labelStr.includes('ديكور')) {
        totalDecorCushions += qty;
      } else {
        totalCushions += qty;
      }
    } else if (typeStr.includes('forma') || labelStr.includes('فورمة')) {
      totalFormas += qty;
    }
  }

  const percentage = tailor?.wage_percentage || 40;
  return {
    tailor_id: tailorId,
    tailor_name: tailor?.full_name || 'خياط غير معروف',
    week_start: weekStart,
    week_end: weekEnd,
    days_worked: uniqueDays.size,
    total_orders: uniqueOrders.size,
    total_seddars: totalSeddars,
    total_cushions: totalCushions,
    total_decor_cushions: totalDecorCushions,
    total_formas: totalFormas,
    total_sewing_value: totalSewingValue,  // FIXED
    wage_amount: totalSewingValue * (percentage / 100),
    wage_percentage: percentage,
    status: 'pending',
  };
}

export async function saveWeeklyWage(summary: WeeklySummary): Promise<WeeklyWage> {
  const { data, error } = await supabase
    .from('weekly_wages')
    .insert({
      tailor_id: summary.tailor_id,
      week_start: summary.week_start,
      week_end: summary.week_end,
      total_sewing_value: summary.total_sewing_value,  // FIXED
      wage_amount: summary.wage_amount,
      wage_percentage: summary.wage_percentage,
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markWageAsPaid(wageId: string, _adminName: string) {
  // DB has no "paid_by" column — just mark as paid
  const { error } = await supabase
    .from('weekly_wages')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', wageId);
  if (error) throw error;
}

// ==================== MESSAGES (FULL SUPABASE) ====================

export async function getMessages(tailorId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${tailorId},recipient_id.eq.${tailorId}`)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function sendMessage(
  message: Omit<ChatMessage, 'id' | 'created_at' | 'is_read'>
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ ...message, is_read: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markMessagesAsRead(tailorId: string, adminId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('sender_id', tailorId)
    .eq('recipient_id', adminId)
    .eq('is_read', false);
  if (error) throw error;
}

export async function getUnreadCount(tailorId: string): Promise<number> {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', tailorId)
    .eq('is_read', false);
  if (error) throw error;
  return count || 0;
}

// ==================== MEDIA UPLOAD ====================

export async function uploadChatMedia(
  file: File | Blob,
  fileName: string,
  folder: 'voice' | 'images' | 'camera'
): Promise<string> {
  const path = `${folder}/${Date.now()}_${fileName}`;
  const { error } = await supabase.storage
    .from('chat-media')
    .upload(path, file, { contentType: file.type || 'application/octet-stream' });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('chat-media')
    .getPublicUrl(path);

  return publicUrl;
}

export async function deleteChatMedia(url: string) {
  const path = url.split('/chat-media/')[1];
  if (!path) return;
  const { error } = await supabase.storage.from('chat-media').remove([path]);
  if (error) throw error;
}

// ==================== REALTIME ====================

export function subscribeToMessages(callback: (msg: ChatMessage) => void) {
  return supabase
    .channel('messages-realtime')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => callback(payload.new as ChatMessage)
    )
    .subscribe();
}

export function subscribeToWages(tailorId: string, callback: (wage: WeeklyWage) => void) {
  return supabase
    .channel(`wages-${tailorId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'weekly_wages', filter: `tailor_id=eq.${tailorId}` },
      (payload) => callback(payload.new as WeeklyWage)
    )
    .subscribe();
}

// ==================== UTILS ====================

export function getWeekBounds(date: Date = new Date()): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diffToSat = day === 5 ? -6 : day === 6 ? 0 : -(day + 1);
  const diffToThu = day === 5 ? -1 : day === 6 ? 5 : 4 - day;

  const sat = new Date(d);
  sat.setDate(d.getDate() + diffToSat);
  sat.setHours(0, 0, 0, 0);

  const thu = new Date(d);
  thu.setDate(d.getDate() + diffToThu);
  thu.setHours(23, 59, 59, 999);

  return { start: sat.toISOString(), end: thu.toISOString() };
}

export function formatCurrency(amount: number): string {
  return `${amount.toFixed(2)} درهم`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-MA', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-MA', { month: 'short', day: 'numeric' });
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' });
}

export function getDayName(dateStr: string): string {
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأرباء', 'الخميس', 'الجمعة', 'السبت'];
  return days[new Date(dateStr).getDay()];
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}