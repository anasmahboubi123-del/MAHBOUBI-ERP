/* ═══════════════════════════════════════════════════════════════
   BUILDER: Tapis (زربية) — FIXED to match actual TapisOrderFlow
   ═══════════════════════════════════════════════════════════════ */

import { ProductResult } from '../types';

export type RoundingType = 'none' | 'half' | 'whole';

export interface TapisDraft {
  selectedTapis: {
    id: string | number;
    name: string;
    price_per_m2: number;
    image_url?: string;
  };
  // TapisOrderFlow passes a calc object
  calc: {
    originalLength: number;
    originalWidth: number;
    cutMarginCm: number;
    wastePercent: number;
    rounding: RoundingType;
  };
  finalArea: number;
  notes?: string;
}

export function calcFinalArea(calc: {
  originalLength: number;
  originalWidth: number;
  cutMarginCm: number;
  wastePercent: number;
  rounding: RoundingType;
}): number {
  const marginM = (calc.cutMarginCm || 0) / 100;
  const lengthWithMargin = calc.originalLength + marginM * 2;
  const widthWithMargin = calc.originalWidth + marginM * 2;
  const area = lengthWithMargin * widthWithMargin;
  const wasteFactor = 1 + (calc.wastePercent || 0) / 100;

  let finalArea = area * wasteFactor;

  if (calc.rounding === 'half') {
    finalArea = Math.ceil(finalArea * 2) / 2;
  } else if (calc.rounding === 'whole') {
    finalArea = Math.ceil(finalArea);
  }

  return parseFloat(finalArea.toFixed(2));
}

export function buildTapisCartItem(draft: TapisDraft): ProductResult {
  const finalArea = draft.finalArea || calcFinalArea(draft.calc);
  const totalPrice = finalArea * (draft.selectedTapis.price_per_m2 || 0);

  const details: Record<string, any> = {
    material: {
      id: String(draft.selectedTapis.id),
      name: draft.selectedTapis.name,
      pricePerSqm: draft.selectedTapis.price_per_m2,
      imageUrl: draft.selectedTapis.image_url,
    },
    dimensions: {
      lengthCm: draft.calc.originalLength * 100,
      widthCm: draft.calc.originalWidth * 100,
      areaSqm: finalArea,
    },
    cutMarginCm: draft.calc.cutMarginCm,
    wastePercent: draft.calc.wastePercent,
    rounding: draft.calc.rounding,
  };

  if (draft.notes) {
    details.notes = draft.notes;
  }

  return {
    id: 'tapis-' + Date.now(),
    productType: 'tapis',
    productName: `زربية — ${draft.selectedTapis.name}`,
    thumbnailUrl: draft.selectedTapis.image_url,
    quantity: 1,
    unitPrice: totalPrice,
    totalPrice: totalPrice,
    details,
    calculations: {
      subtotal: totalPrice,
      materialCost: totalPrice,
      finalTotal: totalPrice,
    },
    addedAt: new Date().toISOString(),
  };
}