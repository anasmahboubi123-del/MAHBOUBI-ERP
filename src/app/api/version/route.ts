// ════════════════════════════════════════════════════════════════
// src/app/api/version/route.ts
// ════════════════════════════════════════════════════════════════
// نقطة نهاية لإرجاع رقم إصدار التطبيق — تُستخدم في UpdateBanner
// ════════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    version: process.env.npm_package_version || '2.0.0',
    buildTime: process.env.BUILD_TIME || new Date().toISOString(),
  })
}