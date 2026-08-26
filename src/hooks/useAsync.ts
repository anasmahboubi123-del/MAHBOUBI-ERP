// ════════════════════════════════════════════════════════════════
// src/hooks/useAsync.ts
// Hook عام للعمليات غير المتزامنة مع حالات التحميل والخطأ
// ════════════════════════════════════════════════════════════════

'use client'

import { useState, useCallback } from 'react'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

type AsyncFunction<T, Args extends unknown[]> = (...args: Args) => Promise<T>

export function useAsync<T, Args extends unknown[] = unknown[]>(
  asyncFunction: AsyncFunction<T, Args>,
  immediate = false
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  })

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const data = await asyncFunction(...args)
        setState({ data, loading: false, error: null })
        return data
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير معروف'
        setState({ data: null, loading: false, error: errorMessage })
        return null
      }
    },
    [asyncFunction]
  )

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return { ...state, execute, reset }
}