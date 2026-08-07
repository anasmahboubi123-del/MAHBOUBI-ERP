// src/types/seller.types.ts
// أنواع بيانات واجهة البائع — El Mahboubi Salon ERP

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  stock?: number;
  is_favorite?: boolean;
}

export interface Work {
  id: string;
  customer_name: string;
  city: string;
  status: WorkStatus;
  image_url: string | null;
  created_at: string;
  total_amount?: number;
  delivery_date?: string;
}

export type WorkStatus =
  | 'جديد'
  | 'قيد_التنفيذ'
  | 'بانتظار_التسبيق'
  | 'قيد_الخياطة'
  | 'جاهز_للتسليم'
  | 'مكتمل'
  | 'ملغي';

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  product_count: number;
  flow_type: 'salon_detailed' | 'simple';
  display_order: number;
}

export interface AlbumItem {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  created_at: string;
  category?: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'order' | 'system' | 'message';
  is_read: boolean;
  created_at: string;
}

export interface OrderLine {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  image_url?: string;
}

export interface CreateOrderPayload {
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  lines: OrderLine[];
  deposit_amount: number;
  delivery_date?: string;
  notes?: string;
}
