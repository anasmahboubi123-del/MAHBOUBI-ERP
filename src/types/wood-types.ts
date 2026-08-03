// ============================================================
// El Mahboubi Salon ERP — Wood ERP Engine Types
// أنواع TypeScript لمحرك العود
// ============================================================

export interface WoodPricingModel {
  id: string;
  name: string;
  code: string;
  image_url?: string;
  wood_type: string;
  engraving_type?: string;
  description?: string;
  is_active: boolean;

  // أسعار السدادر
  seddari_price_per_meter: number;

  // أسعار القطع
  takia_price: number;
  formaja_price: number;
  kwan_price: number;
  kouti_price: number;
  soundri_price: number;
  big_table_price: number;
  small_table_price: number;

  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface WoodModelExtra {
  id: string;
  model_id: string;
  item_key: string;
  item_name: string;
  item_name_ar?: string;
  default_price: number;
  cost_price: number;
  unit: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface WoodOrder {
  id: string;
  order_number: string;
  model_id: string;
  model_snapshot?: WoodModelSnapshot;
  salon_shape: 'straight' | 'L' | 'U' | 'custom';
  total_length_meters: number;

  // بيانات الزبون
  customer_name: string;
  customer_phone?: string;
  customer_city?: string;
  customer_address?: string;

  // التواريخ
  order_date: string;
  delivery_date?: string;

  // الأسعار
  seddari_total: number;
  extras_total: number;
  subtotal: number;
  discount_amount: number;
  discount_reason?: string;
  final_total: number;

  // التسبيق
  deposit_amount: number;
  deposit_required: boolean;
  remaining_amount: number;

  // الحالة
  status: WoodOrderStatus;

  // ملاحظات
  seller_notes?: string;
  carpenter_notes?: string;
  manager_notes?: string;

  // تعديل السعر النهائي
  final_price_modified: boolean;
  final_price_old_value?: number;
  final_price_modified_by?: string;
  final_price_modified_at?: string;
  final_price_modify_reason?: string;

  created_at: string;
  updated_at: string;
  created_by: string;
  assigned_carpenter_id?: string;
}

export type WoodOrderStatus = 
  | 'new' 
  | 'pending' 
  | 'approved' 
  | 'in_progress' 
  | 'ready' 
  | 'delivered' 
  | 'cancelled' 
  | 'rejected';

export interface WoodOrderSeddari {
  id: string;
  order_id: string;
  seddari_index: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  junction_type: 'none' | 'formaja' | 'overlap_into_prev' | 'overlap_from_prev' | 'wooden_divider';
  junction_details?: {
    formaja_fabric_m?: number;
    formaja_sewing_price?: number;
    overlap_length_cm?: number;
    wooden_divider_size_cm?: number;
  };
  fabric_length_cm?: number;
  seddari_price: number;
  created_at: string;
}

export interface WoodOrderItem {
  id: string;
  order_id: string;
  item_type: WoodItemType;
  item_name: string;
  quantity: number;
  original_price: number;
  current_price: number;
  total_price: number;
  price_modified: boolean;
  price_modified_by?: string;
  price_modified_at?: string;
  price_modify_reason?: string;
  model_extra_id?: string;
  created_at: string;
}

export type WoodItemType = 
  | 'takia' 
  | 'formaja' 
  | 'kwan' 
  | 'kouti' 
  | 'soundri' 
  | 'big_table' 
  | 'small_table' 
  | 'custom_extra';

export interface WoodPriceSnapshot {
  id: string;
  order_id: string;
  snapshot_type: 'initial' | 'after_modify' | 'final';
  model_name?: string;
  model_code?: string;
  wood_type?: string;
  seddari_price_per_meter: number;
  takia_price: number;
  formaja_price: number;
  kwan_price: number;
  kouti_price: number;
  soundri_price: number;
  big_table_price: number;
  small_table_price: number;
  extras_snapshot: WoodModelExtra[];
  created_at: string;
  created_by?: string;
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

export interface WoodDrawing {
  id: string;
  order_id: string;
  drawing_data: DrawingPiece[];
  shape_type: 'straight' | 'L' | 'U' | 'custom';
  total_width_cm?: number;
  total_depth_cm?: number;
  placed_items: PlacedDrawingItem[];
  carpenter_notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface DrawingPiece {
  id: string;
  type: 'seddari' | 'formaja' | 'wooden_divider' | 'table' | 'custom';
  x: number;
  y: number;
  width_cm: number;
  length_cm: number;
  rotation: number;
  label: string;
  color: string;
}

export interface PlacedDrawingItem {
  type: WoodItemType;
  x: number;
  y: number;
  rotation: number;
  label: string;
}

export interface WoodAuditLog {
  id: string;
  order_id: string;
  action_type: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  reason?: string;
  reason_category?: string;
  actor_role: string;
  actor_id?: string;
  actor_name?: string;
  created_at: string;
}

export interface WoodPricingSimulation {
  id: string;
  model_id: string;
  master_total: number;
  system_total: number;
  difference: number;
  difference_percent: number;
  comparison_details: SimulationComparisonDetail[];
  notes?: string;
  is_accurate?: boolean;
  created_at: string;
  created_by?: string;
}

export interface SimulationComparisonDetail {
  item_name: string;
  master_value: number;
  system_value: number;
  difference: number;
  unit: string;
}

// ============================================================
// أنواع مساعدة للواجهات
// ============================================================

export interface WoodOrderSummary {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  model_name: string;
  final_total: number;
  status: WoodOrderStatus;
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
  breakdown: WoodCalculationBreakdown;
}

export interface WoodCalculationBreakdown {
  seddars: { index: number; length: number; price: number }[];
  items: { type: string; name: string; qty: number; price: number; total: number }[];
}

export interface WoodFlowState {
  step: 'model' | 'measurements' | 'shape' | 'extras' | 'summary' | 'customer' | 'invoice';
  selectedModel?: WoodPricingModel;
  seddars: WoodOrderSeddari[];
  items: WoodOrderItem[];
  salonShape: 'straight' | 'L' | 'U' | 'custom';
  customer: {
    name: string;
    phone: string;
    city: string;
    address: string;
  };
  deliveryDate?: string;
  depositPercent: number;
  discountAmount: number;
  discountReason: string;
  notes: string;
  finalPrice?: number;
  priceModified: boolean;
}

export const WOOD_ORDER_STATUS_LABELS: Record<WoodOrderStatus, string> = {
  new: 'جديد',
  pending: 'بانتظار الموافقة',
  approved: 'تمت الموافقة',
  in_progress: 'قيد التصنيع',
  ready: 'جاهز',
  delivered: 'مسلّم',
  cancelled: 'ملغى',
  rejected: 'مرفوض',
};

export const WOOD_ORDER_STATUS_COLORS: Record<WoodOrderStatus, string> = {
  new: 'bg-blue-500',
  pending: 'bg-yellow-500',
  approved: 'bg-green-500',
  in_progress: 'bg-orange-500',
  ready: 'bg-purple-500',
  delivered: 'bg-emerald-600',
  cancelled: 'bg-red-500',
  rejected: 'bg-gray-500',
};

export const WOOD_ITEM_TYPE_LABELS: Record<WoodItemType, string> = {
  takia: 'التكاية',
  formaja: 'الفرماجة',
  kwan: 'الكوان',
  kouti: 'الكوطي',
  soundri: 'السوندري',
  big_table: 'الطاولة الكبيرة',
  small_table: 'الطاولة الصغيرة',
  custom_extra: 'إضافي',
};

export const SALON_SHAPE_LABELS: Record<string, string> = {
  straight: 'مستقيم',
  L: 'L',
  U: 'U',
  custom: 'مخصص',
};

export const JUNCTION_TYPE_LABELS: Record<string, string> = {
  none: 'بدون ربط',
  formaja: 'فورماجة',
  overlap_into_prev: 'يدخل في السابق',
  overlap_from_prev: 'السابق يدخل فيه',
  wooden_divider: 'صندوق خشبي فاصل',
};

export const MODIFY_REASONS = [
  { value: 'discount', label: 'خصم للزبون' },
  { value: 'loyal_customer', label: 'زبون دائم' },
  { value: 'competition', label: 'منافسة' },
  { value: 'correction', label: 'تصحيح سعر' },
  { value: 'gift', label: 'هدية' },
  { value: 'other', label: 'سبب آخر' },
] as const;