/* ═══════════════════════════════════════════════════════════════
   BUILDER: Foam (بونج) — FIXED
   ═══════════════════════════════════════════════════════════════ */

import { ProductResult } from '../types';

export interface FoamDraft {
  selectedProduct: {
    id: string | number;
    name: string;
    price_per_meter: number;
    image_url?: string;
    square_corner_price?: number;
    triangle_corner_price?: number;
  };
  selectedHeight: number;
  widthCm: number;
  seddars: number[];
  hasCorners: boolean | null;
  squareCorners: number;
  triangleCorners: number;
  priceAdjustment?: {
    value: number;
    reason: string;
  };
  notes?: string;
}

export function buildFoamCartItem(draft: FoamDraft): ProductResult {
  const productPrice = draft.selectedProduct.price_per_meter || 0;
  const heightM = draft.selectedHeight / 100;

  // Calculate seddars cost
  const seddarsCost = draft.seddars.reduce((sum, lenM) => {
    return sum + (lenM * productPrice * heightM);
  }, 0);

  // Calculate corners cost
  let cornersCost = 0;
  if (draft.hasCorners) {
    cornersCost += (draft.squareCorners || 0) * (draft.selectedProduct.square_corner_price || 0);
    cornersCost += (draft.triangleCorners || 0) * (draft.selectedProduct.triangle_corner_price || 0);
  }

  const calculatedTotal = seddarsCost + cornersCost;
  const displayTotal = draft.priceAdjustment?.value ?? calculatedTotal;

  // Build details
  const details: Record<string, any> = {
    product: {
      id: String(draft.selectedProduct.id),
      name: draft.selectedProduct.name,
      pricePerMeter: draft.selectedProduct.price_per_meter,
    },
    heightCm: draft.selectedHeight,
    widthCm: draft.widthCm,
    foamSeddars: draft.seddars,
  };

  // Only add corners if enabled
  if (draft.hasCorners) {
    if (draft.squareCorners > 0) {
      details.squareCorners = draft.squareCorners;
    }
    if (draft.triangleCorners > 0) {
      details.triangleCorners = draft.triangleCorners;
    }
  }

  if (draft.notes) {
    details.notes = draft.notes;
  }

  const calculations: Record<string, any> = {
    subtotal: calculatedTotal,
    materialCost: seddarsCost,
    formageCost: cornersCost,
    finalTotal: displayTotal,
  };

  if (draft.priceAdjustment) {
    calculations.priceAdjustment = draft.priceAdjustment;
  }

  return {
    id: 'foam-' + Date.now(),
    productType: 'foam',
    productName: `بونج — ${draft.selectedProduct.name} (${draft.selectedHeight} سم)`,
    thumbnailUrl: draft.selectedProduct.image_url,
    quantity: 1,
    unitPrice: displayTotal,
    totalPrice: displayTotal,
    details,
    calculations,
    addedAt: new Date().toISOString(),
  };
}