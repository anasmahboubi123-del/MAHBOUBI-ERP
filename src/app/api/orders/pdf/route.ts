export type ProductType = "salon" | "khamiya" | "wood" | "foam" | "tapis";

export type DocumentType = "devis" | "bon_de_commande" | "facture" | "work_order";

export type DocumentLanguage = "ar" | "fr" | "es" | "it" | "bilingual";

export interface PrintOptions {
  showPrices?: boolean;
  showDetails?: boolean;
  showSignatures?: boolean;
  showStamp?: boolean;
  showQr?: boolean;
  showConditions?: boolean;
  language?: DocumentLanguage;
  // Aliases for compatibility with user's page.tsx
  includePrices?: boolean;
  includeProductionDetails?: boolean;
  includeSignatures?: boolean;
  includeStamp?: boolean;
  includeQrCode?: boolean;
}

export interface ProductResult {
  productType: ProductType;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  details: Record<string, any>;
  calculations: Record<string, any>;
  notes?: string;
}

export interface OrderItem {
  id?: string;
  orderItemId?: string;
  productType: ProductType | string;
  productName: string;
  product_name?: string;
  quantity: number;
  unitPrice: number;
  unit_price?: number;
  totalPrice: number;
  total_price?: number;
  details: Record<string, any>;
  calculations: Record<string, any>;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  addedAt?: string;
  created_at?: string;
  notes?: string;
}

export interface BusinessProfile {
  id?: string;
  company_name: string;
  commercial_name?: string;
  address?: string;
  city?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  ice?: string;
  if_?: string;
  rc?: string;
  patente?: string;
  logo_url?: string;
  stamp_url?: string;
  signature_url?: string;
  bank_name?: string;
  rib?: string;
  iban?: string;
  swift?: string;
  primary_color?: string;
  secondary_color?: string;
}
