// src/features/order-center/services/orderCounter.ts
import { supabase } from '@/lib/supabase';

/**
 * يولد رقم طلب تسلسلي: 2026-0001, 2026-0002...
 * يستخدم جدول order_counters في Supabase للتزامن بين البائعين
 */
export async function getNextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();

  // محاولة قراءة العداد الحالي
  const { data: existing } = await supabase
    .from('order_counters')
    .select('last_number')
    .eq('year', year)
    .maybeSingle();

  const nextNum = (existing?.last_number || 0) + 1;

  // تحديث العداد
  const { error } = await supabase
    .from('order_counters')
    .upsert({ year, last_number: nextNum }, { onConflict: 'year' });

  if (error) {
    // fallback: رقم عشوائي إذا فشل Supabase
    const rand = Math.floor(Math.random() * 9000) + 1000;
    return `${year}-${rand}`;
  }

  return `${year}-${String(nextNum).padStart(4, '0')}`;
}