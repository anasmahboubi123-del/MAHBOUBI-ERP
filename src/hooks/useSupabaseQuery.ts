// ════════════════════════════════════════════════════════════════
// src/hooks/useSupabaseQuery.ts
// Hook لاستعلامات Supabase مع أنواع صحيحة
// ════════════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { PostgrestError } from '@supabase/supabase-js'

interface UseSupabaseQueryOptions<T> {
  table: string
  columns?: string
  filters?: Array<{
    column: string
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in'
    value: unknown
  }>
  orderBy?: { column: string; ascending?: boolean }
  limit?: number
  enabled?: boolean
}

interface UseSupabaseQueryResult<T> {
  data: T[] | null
  loading: boolean
  error: PostgrestError | null
  refetch: () => Promise<void>
}

export function useSupabaseQuery<T = Record<string, unknown>>(
  options: UseSupabaseQueryOptions<T>
): UseSupabaseQueryResult<T> {
  const { table, columns = '*', filters = [], orderBy, limit, enabled = true } = options

  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<PostgrestError | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    let query = supabase.from(table).select(columns)

    filters.forEach((filter) => {
      query = query.filter(filter.column, filter.operator, filter.value)
    })

    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false })
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data: result, error: queryError } = await query

    if (queryError) {
      setError(queryError)
      setData(null)
    } else {
      setData(result as T[])
    }

    setLoading(false)
  }, [table, columns, filters, orderBy, limit, enabled])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}