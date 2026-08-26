// ════════════════════════════════════════════════════════════════
// src/app/api/messages/whatsapp/route.ts
// ════════════════════════════════════════════════════════════════
// نقطة نهاية لإرسال رسائل WhatsApp — تُستخدم في messaging.ts
// ════════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { to, body, mediaUrl } = await req.json()

    // ─── التحقق من البيانات ───
    if (!to || !body) {
      return NextResponse.json(
        { success: false, error: 'رقم الهاتف والرسالة مطلوبان' },
        { status: 400 }
      )
    }

    // ─── الربط مع مزود خدمة WhatsApp Business API ───
    // أمثلة: Twilio, Meta Business API, 360dialog, UltraMsg, إلخ
    //    يجب تعيين متغيرات البيئة التالية:
    //    - WHATSAPP_PROVIDER_URL
    //    - WHATSAPP_API_KEY
    //    - WHATSAPP_SENDER_ID (اختياري)

    const providerUrl = process.env.WHATSAPP_PROVIDER_URL
    const apiKey = process.env.WHATSAPP_API_KEY

    if (!providerUrl || !apiKey) {
      console.warn('[WhatsApp API] متغيرات البيئة غير مضبوطة — تم تخطي الإرسال')
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
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: mediaUrl ? 'image' : 'text',
        ...(mediaUrl
          ? { image: { link: mediaUrl, caption: body } }
          : { text: { body, preview_url: false } }),
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      throw new Error(`WhatsApp API error ${response.status}: ${errText}`)
    }

    return NextResponse.json({ success: true, sent: true })
  } catch (error) {
    console.error('[WhatsApp API] Error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}