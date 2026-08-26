// ════════════════════════════════════════════════════════════════
// src/lib/performance.ts
// أدوات قياس وتحسين الأداء
// ════════════════════════════════════════════════════════════════

/**
 * يقيس وقت تنفيذ دالة — للتطوير فقط
 */
export function measurePerformance<T>(name: string, fn: () => T): T {
  if (process.env.NODE_ENV !== 'development') return fn()

  const start = performance.now()
  const result = fn()
  const end = performance.now()
  console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`)
  return result
}

/**
 * يؤجل تنفيذ دالة غير مهمة (Idle Callback)
 */
export function runWhenIdle(fn: () => void, timeout = 2000): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(fn, { timeout })
  } else {
    setTimeout(fn, 1)
  }
}

/**
 * يحمّل script خارجي بشكل كسول
 */
export function loadScript(src: string, async = true): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      resolve()
      return
    }
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = async
    script.onload = () => resolve()
    script.onerror = reject
    document.head.appendChild(script)
  })
}