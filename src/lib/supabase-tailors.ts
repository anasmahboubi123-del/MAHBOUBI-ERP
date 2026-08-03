// src/lib/supabase-tailors-v2.ts
// Full Supabase integration for Admin Tailors Management
// Supports: Text, Voice, Image, Camera messages + Realtime across devices

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== TYPES ====================

export interface Tailor {
  id: string;
  full_name: string;
  phone: string;
  pin_code: string;
  wage_percentage: number;
  is_active: boolean;
  avatar_url?: string;
  created_at?: string;
}

export interface WorkItem {
  id: string;
  order_id: string;
  label: string;
  kind: string;
  qty: number;
  sewing_cost: number;
  created_at: string;
  order_code?: string;
  customer_name?: string;
}

export interface WeeklyWage {
  id: string;
  tailor_id: string;
  week_start: string;
  week_end: string;
  total_sewing_cost: number;
  wage_amount: number;
  wage_percentage: number;
  status: 'pending' | 'paid';
  paid_at?: string;
  paid_by?: string;
  notes?: string;
  created_at?: string;
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
  total_sewing_cost: number;
  wage_amount: number;
  wage_percentage: number;
  status: 'pending' | 'paid';
}

export type MessageType = 'text' | 'voice' | 'image' | 'camera';

export interface ChatMessage {
  id: string;
  order_id?: string;
  sender_role: 'admin' | 'tailor' | 'seller';
  sender_id: string;
  sender_name: string;
  recipient_id?: string;
  body: string;
  message_type: MessageType;
  media_url?: string;
  media_duration?: number;
  media_size?: number;
  is_read: boolean;
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
      qty,
      sewing_cost,
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

  let totalSewingCost = 0;
  let totalSeddars = 0;
  let totalCushions = 0;
  let totalDecorCushions = 0;
  let totalFormas = 0;
  const uniqueOrders = new Set<string>();
  const uniqueDays = new Set<string>();

  for (const item of items) {
    totalSewingCost += item.sewing_cost * item.qty;
    uniqueOrders.add(item.order_id);
    uniqueDays.add(item.created_at.split('T')[0]);

    if (item.kind.includes('seddari') || item.kind.includes('سداري')) totalSeddars += item.qty;
    else if (item.kind.includes('cushion') || item.kind.includes('مخدة')) {
      if (item.kind.includes('decor') || item.kind.includes('ديكور')) totalDecorCushions += item.qty;
      else totalCushions += item.qty;
    } else if (item.kind.includes('forma') || item.kind.includes('فورمة')) totalFormas += item.qty;
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
    total_sewing_cost: totalSewingCost,
    wage_amount: totalSewingCost * (percentage / 100),
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
      total_sewing_cost: summary.total_sewing_cost,
      wage_amount: summary.wage_amount,
      wage_percentage: summary.wage_percentage,
      status: 'pending',
      notes: `طلبيات: ${summary.total_orders} | سدادر: ${summary.total_seddars} | مخاد: ${summary.total_cushions} | ديكور: ${summary.total_decor_cushions} | فورمات: ${summary.total_formas} | أيام: ${summary.days_worked}`,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markWageAsPaid(wageId: string, adminName: string) {
  const { error } = await supabase
    .from('weekly_wages')
    .update({ status: 'paid', paid_at: new Date().toISOString(), paid_by: adminName })
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
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[new Date(dateStr).getDay()];
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}