// ============================================================
// El Mahboubi Salon ERP — Foam Module Type Definitions
// ============================================================

export interface FoamProduct {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  price_per_meter: number;          // fallback / default price
  square_corner_price: number;
  triangle_corner_price: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  heights?: FoamProductHeight[];
}

export interface FoamProductHeight {
  id: string;
  product_id: string;
  height_cm: number;
  price_per_meter: number;          // ← NEW: price for this specific height
  is_active: boolean;
  created_at?: string;
}

export interface FoamOrderSeddar {
  id: string;
  order_id: string;
  length_meters: number;
  sort_order: number;
  created_at?: string;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  junction?: string;
}

export interface FoamOrder {
  id: string;
  order_number: string;
  invoice_number: string;
  product_id: string;
  product_name: string;
  height_cm: number;
  width_cm: number;
  price_per_meter: number;
  square_corner_price: number;
  triangle_corner_price: number;
  total_length_meters: number;
  seddars_total: number;
  square_corners_count: number;
  square_corners_total: number;
  triangle_corners_count: number;
  triangle_corners_total: number;
  subtotal: number;
  price_adjustment_type: string | null;
  price_adjustment_value: number;
  price_adjustment_reason: string | null;
  final_total: number;
  final_price: number;
  customer_name: string;
  customer_phone: string | null;
  delivery_date: string | null;
  notes: string | null;
  deposit_amount: number;
  deposit: number;
  remaining_amount: number;
  status: string;
  created_by: string;
  created_by_role: string;
  created_at?: string;
  updated_at?: string;
  seddars?: FoamOrderSeddar[];
  supplier?: Supplier;
  total_meters: number;
  base_price: number;
  formage_enabled: boolean;
  formage_count: number;
  formage_type: string;
  price_adjustment: number;
  foam_products?: any;
  suppliers?: any;
}

export interface Supplier {
  id: string;
  company_name: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active?: boolean;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  created_at: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  action_type: string;
  user_name?: string;
  user_role?: string;
  old_values?: any;
  new_values?: any;
  reason?: string;
}

export interface FoamSettings {
  supplier_reminder_days: number;
  order_prefix: string;
  manager_pin: string;
}