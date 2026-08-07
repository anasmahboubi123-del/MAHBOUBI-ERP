/* ═══════════════════════════════════════════════════════════════
   BUILDER: Salon (صالون مغربي) — UPDATED for new flow
   ═══════════════════════════════════════════════════════════════ */

import { ProductResult } from '../types';

// ─── أنواع بيانات الصالون المحدَّثة ───

export interface FabricItem {
  id: string;
  name: string;
  color?: string | null;
  price_per_meter: number;
  image_url?: string | null;
}

export interface Seddari {
  id: string;
  type?: "normal" | "formaja";
  length: number;
  width: number;
  height: number;
  fabricConsumption: number;
  hasFormaja: boolean;
}

export interface StitchStyle {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  isCustom?: boolean;
}

export interface SedariStitchSelection {
  seddariId: string;
  styleId: string;
  styleName: string;
  basePrice: number;
  finalPrice: number;
  imageUrl?: string | null;
}

export interface CushionItem {
  id: string;
  seddariId: string;
  size: number;
  count: number;
  fabricConsumption: number;
  stitchStyleId: string;
  stitchStyleName: string;
  stitchPrice: number;
  stitchFinalPrice: number;
  hasLwata: boolean;
  lwataPrice: number;
}

export interface DecorShape {
  id: string;
  name: string;
  image_url?: string | null;
  isCustom?: boolean;
}

export interface DecorCushionItem {
  id: string;
  shapeId: string;
  shapeName: string;
  shapeImage?: string | null;
  stitchStyleId: string;
  stitchStyleName: string;
  stitchStyleImage?: string | null;
  stitchPrice: number;
  stitchFinalPrice: number;
  count: number;
}

export interface LhayefSelection {
  enabled: boolean;
  lengthM: number;
  pricePerMeter: number;
  totalOverride?: number | null;
}

export interface TabouriaSelection {
  enabled: boolean;
  count: number;
  unitPrice: number;
  totalOverride?: number | null;
}

export interface ExtrasStageData {
  lhayef: LhayefSelection;
  tabouria: TabouriaSelection;
}

export interface StageTotals {
  fabric?: number;
  seddars?: number;
  stitch?: number;
  cushions?: number;
  decor?: number;
  extras?: number;
}

export interface SalonDraft {
  // المرحلة 1: الثوب
  selectedFabric?: FabricItem | null;

  // المرحلة 2: السدادر (عادية + فورمجة)
  seddars?: Seddari[];
  seddarsFabricTotalOverride?: number | null;

  // المرحلة 3: خياطة السدادر
  sedariStitches?: SedariStitchSelection[];
  stage3TotalOverride?: number | null;

  // المرحلة 4: المخاد
  cushionItems?: CushionItem[];
  stage4TotalOverride?: number | null;
  stage4FabricOverride?: number | null;

  // المرحلة 5: الكيدور
  decorItems?: DecorCushionItem[];
  stage5TotalOverride?: number | null;

  // المرحلة 6: الإضافات (لحايف + طابورية فقط)
  extrasStage?: ExtrasStageData | null;

  // أشكال يدوية مخصصة
  customStitchStyles?: StitchStyle[];
  customCushionStyles?: StitchStyle[];
  customDecorStyles?: StitchStyle[];
  customDecorShapes?: DecorShape[];

  // الإجماليات
  stageTotals?: StageTotals;
  calculatedTotal?: number;
  priceOverride?: {
    value: number;
    reason: string;
  } | null;
  notes?: string;
}

// ─── دوال المساعدة ───

export function calcSeddariFabricLength(lengthCm: number, heightCm: number, hasFormaja: boolean): number {
  // ✅ المعادلة الصحيحة: الطول + (2 × الارتفاع)
  let base = lengthCm + (2 * heightCm);
  if (hasFormaja) base += 250; // +250 سم إذا فورمجة
  return Math.ceil(base);
}

export function calcCushionCount(seddariLength: number, cushionSize: number): number {
  return Math.round(seddariLength / cushionSize);
}

export function calcCushionItemTotal(item: CushionItem): number {
  const stitchCost = item.count * item.stitchFinalPrice;
  const lwataCost = item.hasLwata ? item.count * item.lwataPrice : 0;
  return stitchCost + lwataCost;
}

export function calcDecorItemTotal(item: DecorCushionItem): number {
  // ✅ الكيدور بالقطعة فقط
  return item.count * item.stitchFinalPrice;
}

// ─── بناء عنصر السلة ───

export function buildSalonCartItem(draft: SalonDraft): ProductResult {
  const fabric = draft.selectedFabric;
  const seddars = draft.seddars || [];
  const stitches = draft.sedariStitches || [];
  const cushions = draft.cushionItems || [];
  const decor = draft.decorItems || [];
  const extras = draft.extrasStage;

  // حسابات
  const seddarsFabricTotal = draft.seddarsFabricTotalOverride ?? seddars.reduce((sum, s) => sum + s.fabricConsumption, 0);
  const fabricCost = fabric ? (seddarsFabricTotal / 100) * fabric.price_per_meter : 0;

  const stitchTotal = draft.stage3TotalOverride ?? stitches.reduce((sum, s) => sum + s.finalPrice, 0);

  const cushionsTotal = draft.stage4TotalOverride ?? cushions.reduce((sum, c) => sum + calcCushionItemTotal(c), 0);

  const decorTotal = draft.stage5TotalOverride ?? decor.reduce((sum, d) => sum + calcDecorItemTotal(d), 0);

  const extrasTotal = extras
    ? (extras.lhayef?.enabled ? (extras.lhayef.totalOverride ?? (extras.lhayef.lengthM * extras.lhayef.pricePerMeter)) : 0)
    + (extras.tabouria?.enabled ? (extras.tabouria.totalOverride ?? (extras.tabouria.count * extras.tabouria.unitPrice)) : 0)
    : 0;

  const calculatedTotal = fabricCost + stitchTotal + cushionsTotal + decorTotal + extrasTotal;
  const totalPrice = draft.priceOverride?.value ?? calculatedTotal;

  // تفاصيل
  const details: Record<string, any> = {};

  if (fabric) {
    details.fabric = {
      id: fabric.id,
      name: fabric.name,
      pricePerMeter: fabric.price_per_meter,
      consumptionMeters: (seddarsFabricTotal / 100).toFixed(2),
    };
  }

  if (seddars.length > 0) {
    details.seddari = seddars.map(s => ({
      type: s.type || "normal",
      length: s.length,
      width: s.width,
      height: s.height,
      fabricConsumptionCm: s.fabricConsumption,
      isFormaja: s.type === "formaja",
    }));
  }

  if (stitches.length > 0) {
    details.stitch = stitches.map(s => ({
      seddariId: s.seddariId,
      styleName: s.styleName,
      basePrice: s.basePrice,
      finalPrice: s.finalPrice,
    }));
  }

  if (cushions.length > 0) {
    details.cushions = cushions.map(c => ({
      size: c.size,
      count: c.count,
      stitchStyle: c.stitchStyleName,
      stitchPrice: c.stitchFinalPrice,
      hasLwata: c.hasLwata,
      lwataPrice: c.lwataPrice,
      total: calcCushionItemTotal(c),
    }));
  }

  if (decor.length > 0) {
    details.decor = decor.map(d => ({
      shape: d.shapeName,
      count: d.count,
      stitchStyle: d.stitchStyleName,
      stitchPrice: d.stitchFinalPrice,
      total: calcDecorItemTotal(d),
    }));
  }

  if (extras) {
    const enabledExtras: any[] = [];
    if (extras.lhayef?.enabled) {
      enabledExtras.push({
        name: "اللحايف",
        lengthM: extras.lhayef.lengthM,
        pricePerMeter: extras.lhayef.pricePerMeter,
        total: extras.lhayef.totalOverride ?? (extras.lhayef.lengthM * extras.lhayef.pricePerMeter),
      });
    }
    if (extras.tabouria?.enabled) {
      enabledExtras.push({
        name: "الطابورية",
        count: extras.tabouria.count,
        unitPrice: extras.tabouria.unitPrice,
        total: extras.tabouria.totalOverride ?? (extras.tabouria.count * extras.tabouria.unitPrice),
      });
    }
    if (enabledExtras.length > 0) {
      details.extras = enabledExtras;
    }
  }

  if (draft.notes) {
    details.notes = draft.notes;
  }

  const calculations: Record<string, any> = {
    fabricCost: fabricCost.toFixed(2),
    stitchTotal,
    cushionsTotal,
    decorTotal,
    extrasTotal,
    subtotal: calculatedTotal.toFixed(2),
    finalTotal: totalPrice,
  };

  if (draft.priceOverride) {
    calculations.priceOverride = draft.priceOverride;
  }

  return {
    id: 'salon-' + Date.now(),
    productType: 'salon',
    productName: `صالون مغربي — ${fabric?.name || 'بدون ثوب'}`,
    thumbnailUrl: fabric?.image_url ?? undefined,
    quantity: 1,
    unitPrice: totalPrice,
    totalPrice: totalPrice,
    details,
    calculations,
    addedAt: new Date().toISOString(),
  };
}