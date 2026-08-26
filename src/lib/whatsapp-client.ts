const WHATSAPP_URL = process.env.NEXT_PUBLIC_WHATSAPP_URL || 'http://localhost:3001';

export interface WhatsAppResult {
  success: boolean;
  error?: string;
}

export async function sendWhatsApp(phone: string, message: string): Promise<WhatsAppResult> {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const res = await fetch(`${WHATSAPP_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone, message }),
    });
    const data = await res.json();
    return { success: data.success, error: data.error };
  } catch (err: any) {
    console.error('WhatsApp send error:', err);
    return { success: false, error: err.message };
  }
}

export async function sendWhatsAppImage(phone: string, imageUrl: string, message?: string): Promise<WhatsAppResult> {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const res = await fetch(`${WHATSAPP_URL}/send-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone, imageUrl, message }),
    });
    const data = await res.json();
    return { success: data.success, error: data.error };
  } catch (err: any) {
    console.error('WhatsApp image send error:', err);
    return { success: false, error: err.message };
  }
}

export async function isWhatsAppConnected(): Promise<boolean> {
  try {
    const res = await fetch(`${WHATSAPP_URL}/status`, { cache: 'no-store' });
    const data = await res.json();
    return data.connected === true;
  } catch {
    return false;
  }
}

export function buildOrderCreatedMessage(order: any): string {
  return `مرحباً ${order.customer_name || 'عزيزي الزبون'} 👋

تم استلام طلبيتك رقم *#${order.order_number}* بنجاح! ✅

💰 المبلغ الإجمالي: *${(order.total_amount || 0).toLocaleString()} DH*
💳 التسبيق: *${(order.deposit_amount || 0).toLocaleString()} DH*
📅 موعد التسليم: ${order.delivery_date || 'سيتم تحديده'}

يمكنك متابعة طلبيتك عبر الرابط:
${order.tracking_url || ''}

شكراً لاختياركم El Mahboubi ❤️`;
}

export function buildOrderReadyMessage(order: any): string {
  const remaining = (order.total_amount || 0) - (order.deposit_amount || 0);
  return `مرحباً ${order.customer_name || 'عزيزي الزبون'} 👋

طلبيتك رقم *#${order.order_number}* أصبحت جاهزة للاستلام! 🎉

📦 المنتج: ${order.product_type || '—'}
💰 المبلغ المتبقي: *${remaining.toLocaleString()} DH*
📅 موعد الاستلام: ${order.delivery_date || 'خلال 48 ساعة'}

📍 العنوان: محل المحبوبي للأثاث والديكور

شكراً لثقتكم بنا ❤️`;
}

export function buildDelayApologyMessage(order: any, newDate: string, reason?: string): string {
  return `مرحباً ${order.customer_name || 'عزيزي الزبون'} 👋

نعتذر عن التأخير في طلبيتك رقم *#${order.order_number}* ⏰

${reason ? `السبب: ${reason}\n` : ''}📅 موعد التسليم الجديد: *${newDate}*

شكراً لتفهمكم 🙏
El Mahboubi`;
}

export function buildFoamCompanyMessage(order: any, contactName?: string): string {
  const payload = order.payload || {};
  return `مرحباً ${contactName || 'فريق البونج'} 👋

لدينا طلبية بونج جديدة:

📋 رقم الطلبية: *${order.order_number}*
👤 الزبون: ${order.customer_name || '—'}
📐 الارتفاع: ${payload.height_cm || '—'} سم
📐 العرض: ${payload.width_cm || '—'} سم
📏 الكمية: ${payload.total_length_meters || '—'} متر
💰 السعر النهائي: *${(order.total_amount || 0).toLocaleString()} DH*
📅 موعد التسليم: ${order.delivery_date || '—'}

يرجى تأكيد الاستلام.

El Mahboubi`;
}

export function buildTapisReminderMessage(order: any): string {
  return `تذكير 🔔

طلبية زربية جديدة:
📋 رقم: *${order.order_number}*
👤 الزبون: ${order.customer_name || '—'}
📅 موعد التسليم: ${order.delivery_date || '—'}

يرجى تأكيد جاهزية الطلبية.

El Mahboubi`;
}

export function buildWoodCarpenterMessage(order: any): string {
  return `مرحباً نجار العود 👋

لدينا طلبية عود جديدة:
📋 رقم: *${order.order_number}*
👤 الزبون: ${order.customer_name || '—'}
📅 موعد التسليم: ${order.delivery_date || '—'}
💰 السعر: *${(order.total_amount || 0).toLocaleString()} DH*

يرجى تأكيد الاستلام.

El Mahboubi`;
}

export function buildWorkflowStepMessage(order: any, stepLabel: string): string {
  return `مرحباً ${order.customer_name || 'عزيزي الزبون'} 👋

تحديث طلبيتك رقم *#${order.order_number}* 📱

✅ ${stepLabel}

سنُبلغك بالخطوة التالية إن شاء الله.

El Mahboubi`;
}