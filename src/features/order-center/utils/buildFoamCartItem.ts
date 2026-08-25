/* ═══════════════════════════════════════════════════════════════
   BUILDER: Foam (بونج) — FIXED: removed erroneous height multiplier
   ═══════════════════════════════════════════════════════════════ */

import type { ProductResult } from '../types';

export interface FoamProduct {
  id: string | number;
  name: string;
  image_url?: string | null;
}

export interface FoamProductHeight {
  id: string | number;
  price_per_meter: number;
  square_corner_price: number;
  triangle_corner_price: number;
}

export interface FoamDraft {
  selectedProduct: FoamProduct;
  selectedHeight: number;
  selectedHeightRecord: FoamProductHeight | null;
  widthCm: number;
  seddars: number[];
  hasCorners: boolean;
  squareCorners: number;
  triangleCorners: number;
  priceAdjustment?: {
    type: 'discount' | 'increase';
    value: number;
    reason: string;
  };
  customPricePerMeter?: number;
  notes?: string;
}

export function buildFoamCartItem(draft: FoamDraft): ProductResult {
  // السعر الفعلي: معدّل يدوياً → سجل الارتفاع → 0
  const productPrice = draft.customPricePerMeter
    ?? draft.selectedHeightRecord?.price_per_meter
    ?? 0;

  const squareCornerPrice = draft.selectedHeightRecord?.square_corner_price ?? 0;
  const triangleCornerPrice = draft.selectedHeightRecord?.triangle_corner_price ?? 0;

  // ❌ REMOVED: const heightM = draft.selectedHeight / 100;
  // السعر للمتر في قاعدة البيانات هو سعر هذا الارتفاع المحدد، لا داعي لضربه مرة أخرى

  // حساب السدادر — FIXED: بدون ضرب في الارتفاع
  const seddarsCost = draft.seddars.reduce((sum, lenM) => {
    return sum + (lenM * productPrice);  // ✅ فقط: طول × سعر المتر
  }, 0);

  // حساب الفورمجة
  let cornersCost = 0;
  if (draft.hasCorners) {
    cornersCost += (draft.squareCorners || 0) * squareCornerPrice;
    cornersCost += (draft.triangleCorners || 0) * triangleCornerPrice;
  }

  const calculatedTotal = seddarsCost + cornersCost;

  // تطبيق التعديل (خصم/زيادة)
  let finalTotal = calculatedTotal;
  if (draft.priceAdjustment) {
    if (draft.priceAdjustment.type === 'discount') {
      finalTotal = Math.max(0, calculatedTotal - draft.priceAdjustment.value);
    } else {
      finalTotal = calculatedTotal + draft.priceAdjustment.value;
    }
  }

  // Build details
  const details: Record<string, any> = {
    product: {
      id: String(draft.selectedProduct.id),
      name: draft.selectedProduct.name,
      pricePerMeter: productPrice,
      defaultPricePerMeter: draft.selectedHeightRecord?.price_per_meter ?? null,
      density: (draft.selectedProduct as any).density ?? null,
    },
    heightCm: draft.selectedHeight,
    widthCm: draft.widthCm,
    foamSeddars: draft.seddars,
    heightRecord: draft.selectedHeightRecord
      ? {
          id: draft.selectedHeightRecord.id,
          price_per_meter: draft.selectedHeightRecord.price_per_meter,
          square_corner_price: draft.selectedHeightRecord.square_corner_price,
          triangle_corner_price: draft.selectedHeightRecord.triangle_corner_price,
        }
      : null,
  };

  if (draft.hasCorners) {
    if (draft.squareCorners > 0) details.squareCorners = draft.squareCorners;
    if (draft.triangleCorners > 0) details.triangleCorners = draft.triangleCorners;
  }

  if (draft.notes) details.notes = draft.notes;

  const calculations: Record<string, any> = {
    subtotal: calculatedTotal,
    materialCost: seddarsCost,
    formageCost: cornersCost,
    finalTotal: finalTotal,
    squareCornerPrice,
    triangleCornerPrice,
  };

  if (draft.priceAdjustment) {
    calculations.priceAdjustment = draft.priceAdjustment;
  }

  if (draft.customPricePerMeter !== undefined) {
    calculations.customPricePerMeter = draft.customPricePerMeter;
  }

  return {
    id: 'foam-' + Date.now(),
    productType: 'foam',
    productName: `بونج — ${draft.selectedProduct.name} (${draft.selectedHeight} سم)`,
    thumbnailUrl: draft.selectedProduct.image_url ?? undefined,
    quantity: 1,
    unitPrice: finalTotal,
    totalPrice: finalTotal,
    details,
    calculations,
    notes: draft.notes,
    addedAt: new Date().toISOString(),
  };
}