// ════════════════════════════════════════════════════════════════
// src/components/admin/SectionTitle.tsx
// ════════════════════════════════════════════════════════════════

'use client'

interface SectionTitleProps {
  icon: string
  title: string
}

export default function SectionTitle({ icon, title }: SectionTitleProps) {
  return (
    <h3 className="text-lg font-bold text-[#1B5E3B] mb-4 flex items-center gap-2">
      <span>{icon}</span> {title}
    </h3>
  )
}