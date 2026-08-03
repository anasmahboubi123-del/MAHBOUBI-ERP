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
  length: number;      // cm
  width: number;       // cm - افتراضي 70
  height: number;      // cm - 20/30/50
  junction: JunctionType;
  insertDirection?: 'into_next' | 'from_next';
  x?: number;
  y?: number;
  angle?: number;
}

/* ─── خياطة السداري (المرحلة 3) ─── */
export interface SedariStitchSelection {
  seddariId: string;
  styleId: string;
  styleName: string;
  price: number;
}

export interface CushionPlan {
  seddariId: string;
  size: number;        // 75 | 80 | 100
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

/* ─── مجموعات المراحل ─── */
export interface StageTotals {
  fabric: number;
  seddars: number;
  stitch: number;
  cushions: number;
  decor: number;
  extras: number;
}

/* ─── إضافات المرحلة 6 ─── */
export interface LhayefSelection {
  enabled: boolean;
  lengthM: number;
  lengthOverridden: boolean;
  colorName: string;
  photoUrl: string | null;
  pricePerMeter: number;
  totalOverride: number | null;
}

export interface TabouriaSelection {
  enabled: boolean;
  count: number;
  unitPrice: number;
  totalOverride: number | null;
}

export interface CustomExtraItem {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
}

export interface ExtrasStageData {
  lhayef: LhayefSelection;
  tabouria: TabouriaSelection;
  customItems: CustomExtraItem[];
  stageTotalOverride: number | null;
}

export interface StageOverrides {
  fabric?: number | null;
  stitch?: number | null;
  cushions?: number | null;
  decor?: number | null;
  extras?: number | null;
}

/* ═══════════════════════════════════════
   OrderDraft — consolidated & fixed
   ═══════════════════════════════════════ */
export interface OrderDraft {
  // المرحلة 1 & 2
  fabric: FabricItem | null;
  seddars: Seddari[];
  drawingPng: string | null;

  // المرحلة 3 — تفصيلي (flow)
  sedariStitches?: SedariStitchSelection[];
  stage3Total?: number;
  stage3TotalOverride?: number | null;

  // المرحلة 3 — مبسّط (cart)
  stitchConfig?: {
    type: string;
    price: number;
  };

  // المرحلة 4 — تفصيلي (flow)
  cushions: CushionPlan[];

  // المرحلة 4 — مبسّط (cart)
  cushionsConfig?: {
    totalCm: number;
    count: number;
    unitPrice: number;
  };

  // المرحلة 5 — تفصيلي (flow)
  decorCushions: DecorCushionPlan[];
  decorItems?: any[];
  decorTotalOverride?: number | null;

  // المرحلة 5 — مبسّط (cart)
  decorConfig?: {
    price: number;
  };

  // المرحلة 6
  extras: ExtraLine[];
  extrasStage?: ExtrasStageData;

  // الفورماج (cart)
  formage?: {
    corners: number;
    pricePerCorner: number;
  };

  // الإجماليات
  stageTotals?: StageTotals;
  totalOverride: number | null;
  manualTotal?: number;           // ← alias for cart mode
  deposit: number;

  // العميل
  customer: CustomerInfoData;

  // أخرى
  stageOverrides?: StageOverrides;
  specialDiscount?: number;
  summaryViewMode?: 'detailed' | 'compact';
  discount?: number;
}

export const emptyDraft = (): OrderDraft => ({
  fabric: null,
  seddars: [],
  drawingPng: null,
  sedariStitches: [],
  stage3Total: 0,
  stage3TotalOverride: null,
  cushions: [],
  decorCushions: [],
  extras: [],
  stageTotals: { fabric: 0, seddars: 0, stitch: 0, cushions: 0, decor: 0, extras: 0 },
  totalOverride: null,
  deposit: 0,
  customer: { name: '', phone: '', deliveryDate: '', notes: '' }
});