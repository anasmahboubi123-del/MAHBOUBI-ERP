export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // ✅ Lazy imports to avoid build-time errors
    const { updateOrderStatus } = await import('@/lib/supabase');
    const { sendReadyNotification } = await import('@/lib/messaging');

    const { orderId, status, table = 'khamiya_orders', customerPhone, customerName } = await req.json();
    
    await updateOrderStatus(table, orderId, status);

    // Send ready notification
    if (status === 'ready' && customerPhone) {
      await sendReadyNotification(customerPhone, customerName, orderId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}