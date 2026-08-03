import { WhatsAppMessage } from '@/types/khamiya';

const WHATSAPP_API_URL = process.env.NEXT_PUBLIC_WHATSAPP_API_URL;
const SMS_API_URL = process.env.NEXT_PUBLIC_SMS_API_URL;

/**
 * إرسال رسالة ترحيب عبر واتساب عند اختيار المتجر/تقديم الطلب
 */
export async function sendWelcomeWhatsApp(
  phone: string,
  customerName: string,
  orderId: string
): Promise<boolean> {
  const message: WhatsAppMessage = {
    to: phone,
    body: `مرحباً ${customerName}! 🌟\n\nشكراً لاختيارك صالون مغربي. تم استلام طلبك رقم #${orderId} بنجاح.\n\nسنبدأ العمل على طلبك فوراً وسنُبقيك على اطلاع بكل التحديثات.\n\n📍 متجر صالون مغربي\n📞 للاستفسار: 0522-XXXXXX`,
  };

  try {
    const response = await fetch('/api/messages/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    return response.ok;
  } catch (error) {
    console.error('WhatsApp welcome error:', error);
    return false;
  }
}

/**
 * إرسال إشعار جاهزية الطلب (واتساب + SMS)
 */
export async function sendReadyNotification(
  phone: string,
  customerName: string,
  orderId: string
): Promise<{ whatsapp: boolean; sms: boolean }> {
  const readyMessage = `أهلاً ${customerName}! 🎉\n\nطلبك رقم #${orderId} أصبح جاهزاً للاستلام!\n\n📍 يمكنك زيارتنا في أي وقت خلال ساعات العمل.\n\nتابعنا لمزيد من الإلهام:\n📱 TikTok: https://tiktok.com/@salonmarocain\n📸 Instagram: https://instagram.com/salonmarocain\n\nشكراً لثقتك بنا! ✨`;

  let whatsappSuccess = false;
  let smsSuccess = false;

  // WhatsApp
  try {
    const waResponse = await fetch('/api/messages/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: phone, body: readyMessage }),
    });
    whatsappSuccess = waResponse.ok;
  } catch (error) {
    console.error('WhatsApp ready error:', error);
  }

  // SMS
  try {
    const smsResponse = await fetch('/api/messages/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: phone, body: readyMessage }),
    });
    smsSuccess = smsResponse.ok;
  } catch (error) {
    console.error('SMS ready error:', error);
  }

  return { whatsapp: whatsappSuccess, sms: smsSuccess };
}

/**
 * نقاط النهاية للـ API Routes
 */
// app/api/messages/whatsapp/route.ts
export const whatsappRouteHandler = `
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { to, body, mediaUrl } = await req.json();
    
    // هنا يتم الربط مع مزود خدمة WhatsApp Business API
    // مثل: Twilio, Meta Business API, 360dialog, إلخ
    const response = await fetch(process.env.WHATSAPP_PROVIDER_URL!, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${process.env.WHATSAPP_API_KEY}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to.replace('+', ''),
        type: mediaUrl ? 'image' : 'text',
        [mediaUrl ? 'image' : 'text']: mediaUrl 
          ? { link: mediaUrl, caption: body }
          : { body, preview_url: false },
      }),
    });

    if (!response.ok) {
      throw new Error(\`WhatsApp API error: \${response.status}\`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
`;

// app/api/messages/sms/route.ts
export const smsRouteHandler = `
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { to, body } = await req.json();
    
    // الربط مع مزود خدمة SMS
    // مثل: Twilio, Nexmo, أو مزود محلي مغربي
    const response = await fetch(process.env.SMS_PROVIDER_URL!, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${process.env.SMS_API_KEY}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        from: process.env.SMS_SENDER_ID || 'SALONMAR',
        text: body,
      }),
    });

    if (!response.ok) {
      throw new Error(\`SMS API error: \${response.status}\`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
`;