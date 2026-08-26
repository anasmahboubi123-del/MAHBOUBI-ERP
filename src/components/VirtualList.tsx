// ════════════════════════════════════════════════════════════════
// src/components/VirtualList.tsx
// يعرض فقط العناصر المرئية — مثالي لقوائم الطلبيات الطويلة
// ════════════════════════════════════════════════════════════════

'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'

interface VirtualListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  itemHeight: number
  containerHeight: number
  overscan?: number
  className?: string
}

export default function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 5,
  className = '',
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop)
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const { virtualItems, totalHeight, startIndex } = useMemo(() => {
    const totalHeight = items.length * itemHeight
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2
    const endIndex = Math.min(items.length, startIndex + visibleCount)

    const virtualItems = items.slice(startIndex, endIndex).map((item, idx) => ({
      item,
      index: startIndex + idx,
      style: {
        position: 'absolute' as const,
        top: (startIndex + idx) * itemHeight,
        height: itemHeight,
        left: 0,
        right: 0,
      },
    }))

    return { virtualItems, totalHeight, startIndex }
  }, [items, scrollTop, itemHeight, containerHeight, overscan])

  return (
    <div
      ref={containerRef}
      className={`overflow-auto relative ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map(({ item, index, style }) => (
          <div key={index} style={style}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}