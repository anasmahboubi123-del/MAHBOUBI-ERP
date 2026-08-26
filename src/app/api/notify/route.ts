import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsApp, sendWhatsAppImage } from '@/lib/whatsapp-client';

export async function POST(req: NextRequest) {
  try {
    const { phone, message, imageUrl } = await req.json();

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: 'Phone and message are required' },
        { status: 400 }
      );
    }

    let result;
    if (imageUrl) {
      result = await sendWhatsAppImage(phone, imageUrl, message);
    } else {
      result = await sendWhatsApp(phone, message);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}