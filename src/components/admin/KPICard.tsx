// ════════════════════════════════════════════════════════════════
// src/components/admin/KPICard.tsx
// مكون KPI مكتوب بـ TypeScript صارم
// ════════════════════════════════════════════════════════════════

'use client'

import type { KPICardProps } from '@/types/admin.types'

export default function KPICard({
  title,
  value,
  sub,
  trend,
  trendUp,
  icon,
  bg,
  textColor,
}: KPICardProps) {
  return (
    <div
      className={`${bg} rounded-2xl p-5 shadow-sm border border-white/50 hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full ${
            trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {trend}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}