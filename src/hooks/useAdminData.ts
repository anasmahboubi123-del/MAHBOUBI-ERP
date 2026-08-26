// ════════════════════════════════════════════════════════════════
// src/hooks/useAdminData.ts
// Hook مكتوب بـ TypeScript صارم — بديل عن any
// ════════════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  OrderWithParts,
  DbTailor,
  DbTimeline,
  FoamOrderWithProduct,
  WoodOrder,
  TailorStat,
  BestCustomer,
  BestProduct,
  WorkPressure,
  Period,
} from '@/types/admin.types'
import { getOrderTotal } from '@/types/admin.types'

/* ─── Helpers ─── */
function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function getPeriodStart(period: Period): string {
  const d = new Date()
  if (period === 'today') return getTodayStr()
  if (period === 'week') {
    d.setDate(d.getDate() - 7)
  } else {
    d.setDate(d.getDate() - 30)
  }
  return d.toISOString()
}

function formatCurrency(n: number): string {
  return `DH ${Math.round(n).toLocaleString()}`
}

function getPressureLevel(weeklyOrders: number): WorkPressure {
  if (weeklyOrders < 8) {
    return {
      label: 'أقل من العادي',
      color: 'bg-blue-100 text-blue-700',
      bar: 'bg-blue-500',
      percent: Math.min((weeklyOrders / 8) * 33, 33),
      icon: '😌',
    }
  }
  if (weeklyOrders <= 14) {
    return {
      label: 'ضغط عادي',
      color: 'bg-green-100 text-green-700',
      bar: 'bg-green-500',
      percent: 33 + ((weeklyOrders - 8) / 6) * 34,
      icon: '✅',
    }
  }
  return {
    label: 'ضغط مرتفع جداً',
    color: 'bg-red-100 text-red-700',
    bar: 'bg-red-500',
    percent: Math.min(67 + ((weeklyOrders - 14) / 10) * 33, 100),
    icon: '🔥',
  }
}

function getDaysLeft(deliveryDate: string | null | undefined): number {
  if (!deliveryDate) return 999
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(deliveryDate)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/* ─── Hook ─── */
export function useAdminData(period: Period) {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderWithParts[]>([])
  const [tailors, setTailors] = useState<DbTailor[]>([])
  const [timeline, setTimeline] = useState<DbTimeline[]>([])
  const [target, setTarget] = useState(15000)
  const [foamOrders, setFoamOrders] = useState<FoamOrderWithProduct[]>([])
  const [woodOrders, setWoodOrders] = useState<WoodOrder[]>([])

  const todayStr = getTodayStr()

  /* Fetch all data */
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const since = getPeriodStart(period)

      const [
        { data: ordersData },
        { data: partsData },
        { data: tailorsData },
        { data: timelineData },
        { data: targetData },
        { data: foamData },
        { data: woodData },
      ] = await Promise.all([
        supabase.from('orders').select('*').gte('created_at', since).order('created_at', { ascending: false }),
        supabase.from('order_parts').select('*').order('created_at', { ascending: false }),
        supabase.from('tailors').select('*').eq('is_active', true).order('full_name', { ascending: true }),
        supabase.from('order_timeline').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('settings').select('value').eq('key', 'monthly_target').single(),
        supabase.from('foam_orders').select('*, foam_products(name), suppliers(name)').gte('created_at', since).order('created_at', { ascending: false }).limit(100),
        supabase.from('wood_orders').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(100),
      ])

      const ordersWithParts: OrderWithParts[] = (ordersData as Omit<OrderWithParts, 'parts'>[] ?? []).map((o) => ({
        ...o,
        parts: ((partsData as OrderWithParts['parts'] | null) ?? []).filter((p) => p.order_id === o.id),
      }))

      setOrders(ordersWithParts)
      setTailors(tailorsData ?? [])
      setTimeline(timelineData ?? [])
      setFoamOrders((foamData ?? []) as FoamOrderWithProduct[])
      setWoodOrders((woodData ?? []) as WoodOrder[])
      const monthlyTarget = targetData as unknown as { value?: string | number | null } | null
      if (monthlyTarget?.value) setTarget(Number(monthlyTarget.value) || 15000)
    } catch (err) {
      console.error('فشل تحميل لوحة التحكم:', err)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    loadData()
  }, [loadData])

  /* ─── Derived Data (Memoized) ─── */

  // KPIs
  const totalSales = useMemo(
    () => orders.reduce((s, o) => s + getOrderTotal(o), 0),
    [orders]
  )
  const totalOrders = orders.length
  const uniqueCustomers = useMemo(
    () => new Set(orders.map((o) => o.customer_name).filter(Boolean)).size,
    [orders]
  )
  const targetPercent = Math.min(Math.round((totalSales / target) * 100), 100)

  // Foam stats
  const foamTotalSales = useMemo(
    () => foamOrders.reduce((s, o) => s + (o.final_total ?? 0), 0),
    [foamOrders]
  )
  const foamPending = useMemo(
    () => foamOrders.filter((o) => o.status === 'pending').length,
    [foamOrders]
  )
  const foamInProduction = useMemo(
    () => foamOrders.filter((o) => o.status === 'in_production').length,
    [foamOrders]
  )
  const foamReady = useMemo(
    () => foamOrders.filter((o) => o.status === 'ready').length,
    [foamOrders]
  )
  const foamUrgent = useMemo(() => {
    return foamOrders.filter((o) => {
      const days = getDaysLeft(o.delivery_date)
      return o.status !== 'delivered' && o.status !== 'ready' && days <= 3 && days >= 0
    })
  }, [foamOrders])

  // Wood stats
  const woodTotalSales = useMemo(
    () => woodOrders.reduce((s, o) => s + (o.final_total ?? 0), 0),
    [woodOrders]
  )
  const woodPending = useMemo(
    () => woodOrders.filter((o) => o.status === 'new' || o.status === 'pending').length,
    [woodOrders]
  )
  const woodInProgress = useMemo(
    () => woodOrders.filter((o) => o.status === 'in_progress').length,
    [woodOrders]
  )
  const woodReady = useMemo(
    () => woodOrders.filter((o) => o.status === 'ready').length,
    [woodOrders]
  )

  // Tapis orders
  const tapisOrdersCount = useMemo(
    () =>
      orders.filter((o) =>
        o.parts.some((p) => p.part_type === 'tapis' && p.status !== 'done' && p.status !== 'ready')
      ).length,
    [orders]
  )

  const tapisUrgentCount = useMemo(
    () =>
      orders.filter((o) => {
        const hasTapis = o.parts.some(
          (p) => p.part_type === 'tapis' && p.status !== 'done' && p.status !== 'ready'
        )
        if (!hasTapis) return false
        const days = getDaysLeft(o.delivery_date)
        return days <= 5 && days >= 0
      }).length,
    [orders]
  )

  // Today's deliveries
  const todayDeliveries = useMemo(
    () =>
      orders.filter(
        (o) => o.delivery_date === todayStr && o.status !== 'delivered' && o.status !== 'ready'
      ),
    [orders, todayStr]
  )

  // Tailor stats
  const tailorStats = useMemo((): TailorStat[] => {
    const stats: Record<string, TailorStat> = {}
    orders.forEach((o) => {
      o.parts.forEach((p) => {
        if (!p.tailor_id) return
        if (!stats[p.tailor_id]) {
          const t = tailors.find((tl) => tl.id === p.tailor_id)
          stats[p.tailor_id] = {
            id: p.tailor_id,
            name: t?.full_name || 'خياط',
            count: 0,
            completed: 0,
          }
        }
        stats[p.tailor_id].count++
        if (p.status === 'done' || p.status === 'ready') stats[p.tailor_id].completed++
      })
    })
    return Object.values(stats)
  }, [orders, tailors])

  // Work pressure
  const weeklyActiveOrders = useMemo(
    () =>
      orders.filter((o) => ['pending', 'sent', 'in_progress', 'partial'].includes(o.status ?? ''))
        .length,
    [orders]
  )
  const pressure = useMemo(() => getPressureLevel(weeklyActiveOrders), [weeklyActiveOrders])

  // Best customer
  const bestCustomer = useMemo((): BestCustomer | null => {
    const map: Record<string, BestCustomer> = {}
    orders.forEach((o) => {
      const name = o.customer_name || '—'
      if (!map[name]) map[name] = { name, total: 0, count: 0 }
      map[name].total += getOrderTotal(o)
      map[name].count++
    })
    return Object.values(map).sort((a, b) => b.total - a.total)[0] || null
  }, [orders])

  // Best product
  const bestProduct = useMemo((): BestProduct | null => {
    const map: Record<string, BestProduct> = {}
    orders.forEach((o) => {
      o.parts.forEach((p) => {
        const name = p.label || p.part_type || '—'
        if (!map[name]) map[name] = { name, count: 0, revenue: 0 }
        map[name].count++
        const orderPartsCount = o.parts.length || 1
        map[name].revenue += getOrderTotal(o) / orderPartsCount
      })
    })
    return Object.values(map).sort((a, b) => b.revenue - a.revenue)[0] || null
  }, [orders])

  return {
    loading,
    orders,
    tailors,
    timeline,
    target,
    foamOrders,
    woodOrders,
    // Derived
    totalSales,
    totalOrders,
    uniqueCustomers,
    targetPercent,
    foamTotalSales,
    foamPending,
    foamInProduction,
    foamReady,
    foamUrgent,
    woodTotalSales,
    woodPending,
    woodInProgress,
    woodReady,
    tapisOrdersCount,
    tapisUrgentCount,
    todayDeliveries,
    tailorStats,
    pressure,
    bestCustomer,
    bestProduct,
    // Helpers
    formatCurrency,
    getDaysLeft,
    reload: loadData,
  }
}