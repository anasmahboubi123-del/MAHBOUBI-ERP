// ════════════════════════════════════════════════════════════════
// src/app/api/health/route.ts
// ════════════════════════════════════════════════════════════════
// نقطة نهاية لفحص صحة الخادم — تُستخدم في page.tsx لمؤشر الاتصال
// ════════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'mahboubi-erp',
      version: process.env.npm_package_version || '2.0.0',
    },
    { status: 200 }
  )
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}