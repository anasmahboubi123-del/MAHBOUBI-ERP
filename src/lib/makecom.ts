import { getSetting } from './supabase';

/** إرسال بيانات إلى Make.com Webhook */
async function post(url: string, payload: Record<string, unknown>) {
  if (!url) return false;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return true;
  } catch {
    return false;
  }
}

/** رسالة شكر WhatsApp بعد الطلبية (عبر Make.com) */
export async function sendWhatsAppThanks(name: string, phone: string, total: number, deliveryDate: string) {
  const url = await getSetting('whatsapp_webhook', '');
  return post(url, { type: 'order_thanks', name, phone, total, deliveryDate });
}

/** رسالة "طلبيتك جاهزة" للزبون (عبر Make.com) */
export async function sendWhatsAppReady(name: string, phone: string, orderNumber?: number) {
  const url = await getSetting('whatsapp_webhook', '');
  return post(url, { type: 'order_ready', name, phone, orderNumber });
}

/** إضافة موعد التسليم في Google Calendar (عبر Make.com) */
export async function addCalendarEvent(name: string, phone: string, deliveryDate: string, orderNumber?: number) {
  const url = await getSetting('calendar_webhook', '');
  return post(url, { type: 'delivery_event', name, phone, deliveryDate, orderNumber });
}
