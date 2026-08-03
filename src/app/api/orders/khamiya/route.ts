import { NextRequest, NextResponse } from 'next/server';
import { saveKhamiyaOrder } from '@/lib/supabase';
import { sendWelcomeWhatsApp } from '@/lib/messaging';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Save to database
    const order = await saveKhamiyaOrder({
      ...body,
      created_at: new Date().toISOString(),
    });

    // Send welcome WhatsApp
    if (body.customer_phone) {
      await sendWelcomeWhatsApp(
        body.customer_phone,
        body.customer_name,
        order.id
      );
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}