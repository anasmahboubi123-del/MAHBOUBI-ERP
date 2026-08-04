export interface WoodPricingModel {
  id: string;
  name: string;
  code: string;
  wood_type: string;
  seddari_price_per_meter: number;
  takia_price: number;
  formaja_price: number;
  kwan_price: number;
  kouti_price: number;
  soundri_price: number;
  big_table_price: number;
  small_table_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WoodModelExtra {
  id: string;
  model_id: string;
  name: string;
  price: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface WoodOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  model_id: string;
  final_total: number;
  status: string;
  deposit_amount: number;
  remaining_amount: number;
  created_at: string;
  updated_at: string;
}

export interface WoodOrderSeddari {
  id: string;
  order_id: string;
  seddari_index: number;
  length_cm: number;
  seddari_price?: number;
  created_at: string;
}

export interface WoodOrderItem {
  id: string;
  order_id: string;
  item_type: string;
  item_name: string;
  quantity: number;
  current_price: number;
  total_price: number;
  created_at: string;
}

export interface WoodPriceSnapshot {
  id: string;
  order_id: string;
  snapshot_data: any;
  created_at: string;
}

export interface WoodDrawing {
  id: string;
  order_id: string;
  drawing_data: any;
  created_at: string;
  updated_at: string;
}

export interface WoodAuditLog {
  id: string;
  order_id: string;
  action_type: string;
  old_value?: string;
  new_value?: string;
  actor_role: string;
  actor_id: string;
  actor_name: string;
  created_at: string;
}

export interface WoodPricingSimulation {
  id: string;
  model_id: string;
  simulation_data: any;
  created_at: string;
}

export interface WoodOrderSummary {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  model_name: string;
  final_total: number;
  status: string;
  deposit_amount: number;
  remaining_amount: number;
  created_at: string;
}

export interface WoodCalculationResult {
  seddari_total: number;
  extras_total: number;
  subtotal: number;
  discount_amount: number;
  final_total: number;
  deposit_amount: number;
  remaining_amount: number;
  breakdown: any;
}

export interface WoodModelSnapshot {
  id: string;
  name: string;
  code: string;
  wood_type: string;
  seddari_price_per_meter: number;
  takia_price: number;
  formaja_price: number;
  kwan_price: number;
  kouti_price: number;
  soundri_price: number;
  big_table_price: number;
  small_table_price: number;
  extras: WoodModelExtra[];
}