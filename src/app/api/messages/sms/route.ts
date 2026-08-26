// ════════════════════════════════════════════════════════════════
// src/app/api/messages/sms/route.ts
// ════════════════════════════════════════════════════════════════
// نقطة نهاية لإرسال رسائل SMS — تُستخدم في messaging.ts
// ════════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { to, body } = await req.json()

    // ─── التحقق من البيانات ───
    if (!to || !body) {
      return NextResponse.json(
        { success: false, error: 'رقم الهاتف والرسالة مطلوبان' },
        { status: 400 }
      )
    }

    // ─── الربط مع مزود خدمة SMS ───
    // أمثلة: Twilio, Nexmo (Vonage), Maroc SMS, إلخ
    //    يجب تعيين متغيرات البيئة التالية:
    //    - SMS_PROVIDER_URL
    //    - SMS_API_KEY
    //    - SMS_SENDER_ID (اختياري، افتراضي: MAHBOUBI)

    const providerUrl = process.env.SMS_PROVIDER_URL
    const apiKey = process.env.SMS_API_KEY
    const senderId = process.env.SMS_SENDER_ID || 'MAHBOUBI'

    if (!providerUrl || !apiKey) {
      console.warn('[SMS API] متغيرات البيئة غير مضبوطة — تم تخطي الإرسال')
      return NextResponse.json(
        { success: true, sent: false, reason: 'provider_not_configured' },
        { status: 200 }
      )
    }

    const cleanPhone = to.replace(/^0/, '212').replace(/[^0-9]/g, '')

    const response = await fetch(providerUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: cleanPhone,
        from: senderId,
        text: body,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      throw new Error(`SMS API error ${response.status}: ${errText}`)
    }

    return NextResponse.json({ success: true, sent: true })
  } catch (error) {
    console.error('[SMS API] Error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}