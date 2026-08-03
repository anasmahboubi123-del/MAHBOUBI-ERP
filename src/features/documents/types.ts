/* ═══════════════════════════════════════════════════════════════
   DOCUMENT SYSTEM TYPES
   Devis · Bon de Commande · Facture · Work Order
   ═══════════════════════════════════════════════════════════════ */

export type DocumentType = 'devis' | 'bon_de_commande' | 'facture' | 'work_order';
export type PrintVariant = 'client' | 'production' | 'manager' | 'accounting';
export type DocumentLanguage = 'ar' | 'fr' | 'bilingual';

export interface DocumentTemplate {
  id: string;
  documentType: DocumentType;
  name: string;
  header: {
    showLogo: boolean;
    showCompanyInfo: boolean;
    showDocumentTitle: boolean;
    primaryColor: string;
    secondaryColor: string;
  };
  sections: {
    companyInfo: boolean;
    customerInfo: boolean;
    documentInfo: boolean;
    productsTable: boolean;
    measurements: boolean;
    financialSummary: boolean;
    conditions: boolean;
    signatures: boolean;
    qrCode: boolean;
    footer: boolean;
  };
  columns: {
    product: boolean;
    description: boolean;
    fabric: boolean;
    foam: boolean;
    wood: boolean;
    dimensions: boolean;
    quantity: boolean;
    unitPrice: boolean;
    discount: boolean;
    total: boolean;
  };
  financial: {
    showSubtotal: boolean;
    showDiscount: boolean;
    showDeposit: boolean;
    showRemaining: boolean;
    showDelivery: boolean;
    showTotal: boolean;
  };
  language: DocumentLanguage;
  margins: { top: number; right: number; bottom: number; left: number };
  pageSize: 'A4' | 'A5';
  orientation: 'portrait' | 'landscape';
}

export interface GeneratedDocument {
  id: string;
  orderId: string;
  type: DocumentType;
  printVariant: PrintVariant;
  number: string;
  language: DocumentLanguage;
  pdfUrl?: string;
  storagePath?: string;
  generatedBy: string;
  generatedByName?: string;
  generatedAt: string;
  fileSize?: number;
  version: number;
}

export interface BusinessProfile {
  logoUrl?: string;
  companyName: string;
  commercialName?: string;
  address: string;
  city: string;
  phone: string;
  mobile?: string;
  email: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  ice: string;
  if_: string;
  rc: string;
  patente?: string;
  bankName?: string;
  rib?: string;
  iban?: string;
  swift?: string;
  stampUrl?: string;
  signatureUrl?: string;
}

export interface DocumentConditions {
  devis: string;
  bonDeCommande: string;
  facture: string;
}

export interface PrintJob {
  documentType: DocumentType;
  printVariant: PrintVariant;
  language: DocumentLanguage;
  orderId: string;
  includeProductionDetails: boolean;
  includePrices: boolean;
  includeCosts: boolean;
  includeSignatures: boolean;
  includeQrCode: boolean;
  includeStamp: boolean;
}