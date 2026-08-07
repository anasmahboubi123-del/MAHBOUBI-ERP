/* ═══════════════════════════════════════════════════════════════
   TYPES: Order Center — FIXED
   ═══════════════════════════════════════════════════════════════ */

// ─── Product Types ───
export type ProductType = 'salon' | 'khamiya' | 'wood' | 'foam' | 'tapis' | 'accessoire';

// ─── Document Types ───
export type DocumentType = 'devis' | 'bon_de_commande' | 'facture';

// ─── Document Language ───
export type DocumentLanguage = 'ar' | 'fr' | 'es' | 'it' | 'bilingual';

// ─── Customer ───
export interface Customer {
  id?: string;
  name: string;
  phone: string;
  phone2?: string;
  email?: string;
  address?: string;
  city?: string;
  customerType?: 'individual' | 'company';
  companyName?: string;
  ice?: string;
  if?: string;
  rc?: string;
  notes?: string;
}

// ─── Delivery ───
export interface Delivery {
  method: 'pickup' | 'delivery' | 'home_delivery' | 'carrier';
  expectedDate?: string;
  status: 'pending' | 'in_transit' | 'delivered';
  cost: number;
  address?: string;
}

// ─── Cart Financial ───
export interface CartFinancial {
  discountAmount: number;
  discountInput: string;
  depositAmount: number;
  depositInput: string;
  deliveryCost: number;
}

// ─── Cart Notes ───
export interface CartNotes {
  customer: string;
  internal: string;
  production: string;
}

// ─── Product Result (from builders) ───
export interface ProductResult {
  id: string;
  productType: ProductType;
  productName: string;
  thumbnailUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  details: Record<string, any>;
  calculations: Record<string, any>;
  productionDetails?: Record<string, any>;
  lineNotes?: string;
  lineDiscount?: number;
  notes?: string;
  addedAt: string;
}

// ─── Order Item (in cart) ───
export interface OrderItem extends ProductResult {
  orderItemId: string;
}

// ─── Cart State ───
export interface CartState {
  items: OrderItem[];
  customer: Customer;
  delivery: Partial<Delivery>;
  financial: CartFinancial;
  notes: CartNotes;
}

// ─── Print Options ───
export interface PrintOptions {
  documentType: DocumentType;
  printVariant: 'client' | 'workshop' | 'admin';
  language: DocumentLanguage;
  includeProductionDetails: boolean;
  includePrices: boolean;
  includeCosts: boolean;
  includeSignatures: boolean;
  includeQrCode: boolean;
  includeStamp: boolean;
}

// ─── Business Profile ───
export interface BusinessProfile {
  name: string;
  nameAr?: string;
  nameFr?: string;
  address: string;
  city: string;
  phone: string;
  email?: string;
  ice?: string;
  if?: string;
  rc?: string;
  logoUrl?: string;
  stampUrl?: string;
}

// ─── Document Conditions ───
export interface DocumentConditions {
  docType: DocumentType;
  conditions: string[];
  validDays: number;
}

// ─── Order (from DB) ───
export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerPhone2?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerCity?: string;
  customerType?: string;
  companyName?: string;
  ice?: string;
  if?: string;
  rc?: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  discountReason?: string;
  deliveryCost: number;
  depositAmount: number;
  total: number;
  remaining: number;
  expectedDeliveryDate?: string;
  deliveryMethod?: string;
  deliveryAddress?: string;
  customerNotes?: string;
  internalNotes?: string;
  productionNotes?: string;
  createdAt: string;
  updatedAt?: string;
  items?: OrderItem[];
}

// ─── UnifiedOrder for OrderHistory ───
export interface UnifiedOrder {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
  };
  status: string;
  total: number;
  items: OrderItem[];
  createdAt: string;
}