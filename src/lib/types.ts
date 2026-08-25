export interface FabricItem {
  id: string;
  name: string;
  color: string | null;
  price_per_meter: number;
  image_url: string | null;
  gallery: string[] | null;
}

/* ─── السداري ─── */
export interface Seddari {
  id: string;
  type?: "normal" | "formaja";  // ← تمييز السداري العادي عن الفورمجة
  length: number;      // cm
  width: number;       // cm - افتراضي 70
  height: number;      // cm - 30/50/70 أو مخصص
  fabricConsumption: number; // استهلاك الثوب بالسم
  hasFormaja: boolean; // هل يوجد فورمجة؟
  shape?: string;              // ← جديد: شكل السداري (مربع، مثلث، نص مخصص...)
  shapeCustom?: string;        // ← جديد: نص الشكل المخصص
}

/* ─── شكل خياطة (من قاعدة البيانات أو يدوي) ─── */
export interface DecorShape {
  id: string;
  name: string;
  image_url: string | null;
  isCustom?: boolean;
}

export interface StitchStyle {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  gallery: string[] | null;
  description: string | null;
  isCustom?: boolean;  // ← شكل يدوي مخصص للطلبية
}

/* ─── خياطة السداري ─── */
export interface SedariStitchSelection {
  seddariId: string;
  styleId: string;
  styleName: string;
  basePrice: number;    // السعر الأساسي من الكتالوج
  finalPrice: number;   // السعر النهائي (يمكن تعديله للزبون)
  imageUrl: string | null;
}

/* ─── الفورمة للسداري ─── */
export interface SedariFormaja {
  seddariId: string;
  enabled: boolean;
  price: number;        // ثمن الفورمة
  finalPrice: number;   // السعر النهائي (يمكن تعديله)
}

/* ─── المخدة (تخصيص فردي) ─── */
export interface CushionItem {
  id: string;
  seddariId: string;      // لأي سداري تنتمي؟
  size: number;           // 75 | 80 | 100
  count: number;          // عدد المخاد
  fabricConsumption: number; // استهلاك الثوب لكل مخدة بالسم
  stitchStyleId: string;  // شكل الخياطة
  stitchStyleName: string;
  stitchPrice: number;    // ثمن خياطة كل مخدة
  stitchFinalPrice: number; // السعر النهائي بعد التعديل
  hasLwata: boolean;      // هل يوجد لواط؟
  lwataPrice: number;     // ثمن اللواط لكل مخدة (افتراضي 110)
  hasFormaja: boolean;    // هل يوجد فورمجة؟
  formajaPrice: number;   // ثمن الفورمة لكل مخدة
}

/* ─── مخدة الكيدور ─── */
export interface DecorCushionItem {
  id: string;
  shapeId: string;
  shapeName: string;
  shapeImage: string | null;
  fabricConsumption: number; // استهلاك الثوب بالسم
  stitchStyleId: string;
  stitchStyleName: string;
  stitchStyleImage: string | null;
  stitchPrice: number;
  stitchFinalPrice: number;
  count: number;
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
   OrderDraft
   ═══════════════════════════════════════ */
export interface OrderDraft {
  // المرحلة 1
  fabric: FabricItem | null;

  // المرحلة 2 — السدادر
  seddars: Seddari[];
  seddarsFabricTotalOverride: number | null;

  // المرحلة 3 — خياطة السدادر
  sedariStitches: SedariStitchSelection[];
  sedariFormajas: SedariFormaja[];
  stage3TotalOverride: number | null;

  // المرحلة 4 — المخاد
  cushionItems: CushionItem[];
  stage4TotalOverride: number | null;
  stage4FabricOverride: number | null; // تعديل استهلاك الثوب

  // المرحلة 5 — مخاد الكيدور
  decorItems: DecorCushionItem[];
  stage5TotalOverride: number | null;

  // المرحلة 6 — الإضافات
  extras: ExtraLine[];
  extrasStage: ExtrasStageData | null;

  // الإجماليات
  stageTotals: StageTotals;
  totalOverride: number | null;
  deposit: number;

  // العميل
  customer: CustomerInfoData;

  // أخرى
  stageOverrides?: StageOverrides;
  specialDiscount?: number;
  summaryViewMode?: 'detailed' | 'compact';
  discount?: number;

  // أشكال خياطة يدوية مخصصة للطلبية
  customStitchStyles?: StitchStyle[];
  customCushionStyles?: StitchStyle[];
  customDecorStyles?: StitchStyle[];
  customDecorShapes?: DecorShape[];
}

export const emptyDraft = (): OrderDraft => ({
  fabric: null,
  seddars: [],
  seddarsFabricTotalOverride: null,
  sedariStitches: [],
  sedariFormajas: [],
  stage3TotalOverride: null,
  cushionItems: [],
  stage4TotalOverride: null,
  stage4FabricOverride: null,
  decorItems: [],
  stage5TotalOverride: null,
  extras: [],
  extrasStage: null,
  stageTotals: { fabric: 0, seddars: 0, stitch: 0, cushions: 0, decor: 0, extras: 0 },
  totalOverride: null,
  deposit: 0,
  customer: { name: '', phone: '', deliveryDate: '', notes: '' },
  customStitchStyles: [],
  customCushionStyles: [],
  customDecorStyles: [],
  customDecorShapes: [],
});