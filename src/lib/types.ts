export interface FabricItem {
  id: string;
  name: string;
  color: string | null;
  price_per_meter: number;
  image_url: string | null;
  gallery: string[] | null;
}

export type JunctionType = 'formaja' | 'insert' | 'wooden_box' | 'none';

export interface Seddari {
  id: string;
  length: number; // cm
  width: number; // cm - افتراضي 70
  height: number; // cm - 20/30/50
  junction: JunctionType; // الربط مع السداري الموالي
  insertDirection?: 'into_next' | 'from_next';
  x?: number; // موقع الرسم 2D
  y?: number;
  angle?: number;
}

export interface CushionPlan {
  seddariId: string;
  size: number; // 75 | 80 | 100
  count: number;
  stitchPrice: number;
  stuffing: boolean;
}

export interface DecorCushionPlan {
  shape: string;
  count: number;
  stitchPrice: number;
}

export interface ExtraLine {
  name: string;
  price: number;
  qty: number;
}

export interface CustomerInfoData {
  name: string;
  phone: string;
  deliveryDate: string;
  notes: string;
}

export interface OrderDraft {
  fabric: FabricItem | null;
  seddars: Seddari[];
  drawingPng: string | null;
  cushions: CushionPlan[];
  decorCushions: DecorCushionPlan[];
  extras: ExtraLine[];
  totalOverride: number | null;
  deposit: number;
  customer: CustomerInfoData;
}

export const emptyDraft = (): OrderDraft => ({
  fabric: null,
  seddars: [],
  drawingPng: null,
  cushions: [],
  decorCushions: [],
  extras: [],
  totalOverride: null,
  deposit: 0,
  customer: { name: '', phone: '', deliveryDate: '', notes: '' }
});
