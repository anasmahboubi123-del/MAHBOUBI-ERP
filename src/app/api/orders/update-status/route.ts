import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/supabase';
import { sendReadyNotification } from '@/lib/messaging';

export async function POST(req: NextRequest) {
  try {
    const { orderId, status, table = 'khamiya_orders', customerPhone, customerName } = await req.json();
    
    await updateOrderStatus(table, orderId, status);

    // Send ready notification
    if (status === 'ready' && customerPhone) {
      await sendReadyNotification(customerPhone, customerName, orderId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}