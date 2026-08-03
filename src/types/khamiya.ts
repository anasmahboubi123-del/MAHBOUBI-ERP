export interface KhamiyaOrder {
  id?: string;
  customerName: string;
  customerPhone: string;
  width: number; // in meters
  height: number; // in meters
  shape: 'cut_middle' | 'solid_piece';
  hasBottomFabric: boolean;
  bottomFabricWidth?: number;
  aqaqWidth: number;
  kabalaCount: number;
  otherShapesCount: number;
  sewingType: 'standard' | 'special' | 'custom';
  customSewingPrice?: number;
  customAdditions: CustomAddition[];
  fabricType: string;
  fabricImageUrl?: string;
  totalPrice: number;
  fabricLengthNeeded: number;
  createdAt?: string;
  status: 'pending' | 'in_progress' | 'ready' | 'delivered';
}

export interface CustomAddition {
  id: string;
  name: string;
  price: number;
}

export interface Fabric {
  id: string;
  name: string;
  imageUrl: string;
  pricePerMeter: number;
  color: string;
}

export interface KhamiyaCalculationBreakdown {
  fabricLength: number;
  fabricCost: number;
  bottomFabricCost: number;
  aqaqCost: number;
  kabalaCost: number;
  otherShapesCost: number;
  sewingCost: number;
  customAdditionsTotal: number;
  grandTotal: number;
}

export interface SeddariOrder {
  id?: string;
  customerName: string;
  customerPhone: string;
  length: number;
  width: number;
  height: number;
  sewingType: 'standard' | 'special' | 'custom';
  customSewingPrice?: number;
  pillowLength?: number;
  pillowCustomSizes: number[];
  fabricType: string;
  fabricImageUrl?: string;
  totalPrice: number;
  createdAt?: string;
  status: 'pending' | 'in_progress' | 'ready' | 'delivered';
}

export interface SeddariCalculationBreakdown {
  baseCost: number;
  sewingCost: number;
  pillowCost: number;
  customAdditionsTotal: number;
  grandTotal: number;
}

export type ProductCategory = 'salon' | 'khamiya' | 'khshab' | 'bounj' | 'zarbiya';

export interface WoodOrder {
  id?: string;
  type: string;
  dimensions: { length: number; width: number; thickness: number };
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  notes?: string;
}

export interface SpongeOrder {
  id?: string;
  type: 'standard' | 'high_density' | 'memory_foam';
  dimensions: { length: number; width: number; thickness: number };
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface ZarbiyaRequest {
  id?: string;
  customerName: string;
  customerPhone: string;
  size: string;
  pattern: string;
  colorPreference: string;
  notes: string;
  budget?: number;
  status: 'requested' | 'sourced' | 'quoted' | 'approved';
  createdAt?: string;
}

export interface TailorOrderView {
  orderId: string;
  productType: ProductCategory;
  measurements: Record<string, number>;
  customRequests: string;
  sketchSvg: string;
  fabricImages: string[];
  sewingStyleImages: string[];
  clientRequestImages: string[];
  status: 'pending' | 'in_progress' | 'ready' | 'delivered';
}

export interface WhatsAppMessage {
  to: string;
  body: string;
  mediaUrl?: string;
}

export type SewingMethod = {
  id: string;
  name: string;
  nameAr: string;
  basePrice: number;
  imageUrl: string;
  category: 'seddari' | 'khamiya';
};