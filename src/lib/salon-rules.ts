// src/lib/salon-rules.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface SalonRules {
  id?: number;
  // أسعار السداري
  seddari_base_price: number;        // سعر السداري الأساسي
  seddari_fabric_per_cm: number;     // سم ثوب لكل سم طول
  seddari_height_extra: number;      // إضافة لكل سم ارتفاع
  // أسعار الربط
  formaja_price: number;             // سعر الفورمجة
  insert_price: number;              // سعر التداخل (الديوان)
  wooden_box_price: number;          // سعر الصندوق الخشبي
  // أسعار المخدات
  cushion_small_price: number;
  cushion_medium_price: number;
  cushion_large_price: number;
  cushion_xl_price: number;
  // أسعار اللواط
  lwat_price_per_meter: number;
  // أسعار الإضافات
  handrest_price: number;
  curtain_price_per_meter: number;
  carpet_price_per_meter: number;
  // استهلاك الثوب
  fabric_formaja_extra_cm: number;   // إضافة ثوب الفورمجة (سم)
  fabric_insert_extra_cm: number;    // إضافة ثوب التداخل (سم)
  fabric_cushion_small_cm: number;     // ثوب مخدة صغيرة
  fabric_cushion_medium_cm: number;
  fabric_cushion_large_cm: number;
  fabric_cushion_xl_cm: number;
  fabric_lwat_per_meter: number;     // ثوب اللواط لكل متر
  fabric_handrest_cm: number;
  fabric_curtain_per_meter: number;
  // أسعار الثوب
  fabric_price_per_meter: number;    // سعر متر الثوب
  // خياطة
  stitch_price_per_seddari: number;  // سعر خياطة السداري
}

export const defaultRules: SalonRules = {
  seddari_base_price: 150,
  seddari_fabric_per_cm: 1,
  seddari_height_extra: 2,
  formaja_price: 80,
  insert_price: 50,
  wooden_box_price: 200,
  cushion_small_price: 25,
  cushion_medium_price: 35,
  cushion_large_price: 45,
  cushion_xl_price: 60,
  lwat_price_per_meter: 120,
  handrest_price: 40,
  curtain_price_per_meter: 80,
  carpet_price_per_meter: 60,
  fabric_formaja_extra_cm: 250,
  fabric_insert_extra_cm: 30,
  fabric_cushion_small_cm: 80,
  fabric_cushion_medium_cm: 120,
  fabric_cushion_large_cm: 160,
  fabric_cushion_xl_cm: 200,
  fabric_lwat_per_meter: 150,
  fabric_handrest_cm: 50,
  fabric_curtain_per_meter: 200,
  fabric_price_per_meter: 35,
  stitch_price_per_seddari: 100,
};

// جلب القواعد من Supabase
export async function fetchSalonRules(): Promise<SalonRules> {
  try {
    const { data, error } = await supabase
      .from('salon_rules')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.warn('No salon rules in DB, using defaults');
      return defaultRules;
    }

    return { ...defaultRules, ...data };
  } catch {
    return defaultRules;
  }
}

// حفظ القواعد في Supabase
export async function saveSalonRules(rules: SalonRules): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('salon_rules')
      .upsert({ ...rules, updated_at: new Date().toISOString() });

    if (error) {
      console.error('Error saving rules:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Exception saving rules:', e);
    return false;
  }
}

// حساب ثوب السدادر
export function calcSeddariFabric(
  seddars: Array<{ length: number; height: number; junction: string }>,
  rules: SalonRules
): number {
  let total = 0;
  for (const s of seddars) {
    total += s.length * rules.seddari_fabric_per_cm;
    total += s.height * rules.seddari_height_extra;
    if (s.junction === 'formaja') total += rules.fabric_formaja_extra_cm;
    if (s.junction === 'insert') total += rules.fabric_insert_extra_cm;
  }
  return Math.ceil(total);
}

// حساب ثمن السدادر
export function calcSeddariPrice(
  seddars: Array<{ length: number; height: number; junction: string }>,
  rules: SalonRules
): number {
  let total = 0;
  for (const s of seddars) {
    total += rules.seddari_base_price;
    if (s.junction === 'formaja') total += rules.formaja_price;
    if (s.junction === 'insert') total += rules.insert_price;
    if (s.junction === 'wooden_box') total += rules.wooden_box_price;
  }
  return total;
}

// حساب ثمن المخدات
export function calcCushionPrice(
  cushions: Record<string, number>,
  rules: SalonRules
): number {
  return (
    (cushions.small || 0) * rules.cushion_small_price +
    (cushions.medium || 0) * rules.cushion_medium_price +
    (cushions.large || 0) * rules.cushion_large_price +
    (cushions.extraLarge || 0) * rules.cushion_xl_price
  );
}

// حساب ثوب المخدات
export function calcCushionFabric(
  cushions: Record<string, number>,
  rules: SalonRules
): number {
  return (
    (cushions.small || 0) * rules.fabric_cushion_small_cm +
    (cushions.medium || 0) * rules.fabric_cushion_medium_cm +
    (cushions.large || 0) * rules.fabric_cushion_large_cm +
    (cushions.extraLarge || 0) * rules.fabric_cushion_xl_cm
  );
}

// حساب ثمن اللواط
export function calcLwatPrice(
  lwatLength: number,
  rules: SalonRules
): number {
  return Math.ceil((lwatLength / 100) * rules.lwat_price_per_meter);
}

// حساب ثمن الإضافات
export function calcExtrasPrice(
  extras: { handrest?: number; curtain?: number; carpet?: number },
  rules: SalonRules
): number {
  let total = 0;
  if (extras.handrest) total += extras.handrest * rules.handrest_price;
  if (extras.curtain) total += (extras.curtain / 100) * rules.curtain_price_per_meter;
  if (extras.carpet) total += (extras.carpet / 100) * rules.carpet_price_per_meter;
  return total;
}

// حساب الثوب الكلي
export function calcTotalFabric(
  seddars: Array<{ length: number; height: number; junction: string }>,
  cushions: Record<string, number>,
  lwatLength: number,
  extras: { handrest?: number; curtain?: number },
  rules: SalonRules
): number {
  let total = calcSeddariFabric(seddars, rules);
  total += calcCushionFabric(cushions, rules);
  total += Math.ceil((lwatLength / 100) * rules.fabric_lwat_per_meter);
  if (extras.handrest) total += extras.handrest * rules.fabric_handrest_cm;
  if (extras.curtain) total += (extras.curtain / 100) * rules.fabric_curtain_per_meter;
  return Math.ceil(total);
}

// حساب الثمن الكلي
export function calcTotalPrice(
  seddars: Array<{ length: number; height: number; junction: string }>,
  cushions: Record<string, number>,
  lwatLength: number,
  extras: { handrest?: number; curtain?: number; carpet?: number },
  rules: SalonRules
): number {
  let total = calcSeddariPrice(seddars, rules);
  total += calcCushionPrice(cushions, rules);
  total += calcLwatPrice(lwatLength, rules);
  total += calcExtrasPrice(extras, rules);
  total += calcTotalFabric(seddars, cushions, lwatLength, extras, rules) / 100 * rules.fabric_price_per_meter;
  total += seddars.length * rules.stitch_price_per_seddari;
  return Math.ceil(total);
}