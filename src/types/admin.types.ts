// ════════════════════════════════════════════════════════════════
// src/types/admin.types.ts
// أنواع مخصصة لواجهة المدير — بديل عن any
// ════════════════════════════════════════════════════════════════

import type { Database } from './database.types'

// ─── Order من قاعدة البيانات ───
export type DbOrder = Database['public']['Tables']['orders']['Row']
export type DbOrderPart = Database['public']['Tables']['order_parts']['Row']
export type DbTailor = Database['public']['Tables']['tailors']['Row']
export type DbTimeline = Database['public']['Tables']['order_timeline']['Row']

// ─── Order مع أجزاء ───
export interface OrderWithParts extends DbOrder {
  parts: DbOrderPart[]
}

// ─── Order مع الحقول المحسوبة ───
export interface OrderWithTotals extends DbOrder {
  total_amount: number
  total: number
  parts: DbOrderPart[]
}

// ─── إحصائيات الخياط ───
export interface TailorStat {
  id: string
  name: string
  count: number
  completed: number
}

// ─── أفضل زبون ───
export interface BestCustomer {
  name: string
  total: number
  count: number
}

// ─── أفضل منتج ───
export interface BestProduct {
  name: string
  count: number
  revenue: number
}

// ─── ضغط العمل ───
export interface WorkPressure {
  label: string
  color: string
  bar: string
  percent: number
  icon: string
}

// ─── فترة التقرير ───
export type Period = 'today' | 'week' | 'month'

// ─── KPI Card Props ───
export interface KPICardProps {
  title: string
  value: string | number
  sub?: string
  trend: string
  trendUp: boolean
  icon: string
  bg: string
  textColor: string
}

// ─── Foam Order مع العلاقات ───
export interface FoamOrderWithProduct {
  id: string
  final_total: number | null
  status: string | null
  delivery_date: string | null
  foam_products?: { name: string } | null
  suppliers?: { name: string } | null
}

// ─── Wood Order ───
export interface WoodOrder {
  id: string
  final_total: number | null
  status: string | null
  delivery_date: string | null
  [key: string]: unknown
}

// ─── مساعد: استخراج total من Order بأمان ───
export function getOrderTotal(order: DbOrder): number {
  const totalAmount = 'total_amount' in order ? Number(order.total_amount ?? 0) : 0
  const total = 'total' in order ? Number(order.total ?? 0) : 0

  return totalAmount || total
}