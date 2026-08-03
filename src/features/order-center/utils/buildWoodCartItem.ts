/* ═══════════════════════════════════════════════════════════════
   BUILDER: Wood (عود / خشب) — FIXED to match actual WoodSellerFlow
   ═══════════════════════════════════════════════════════════════ */

import { ProductResult } from '../types';

export interface WoodDraft {
  selectedModel: {
    id: string;
    name: string;
    code: string;
    wood_type: string;
    image_url?: string;
  };
  salonShape: string;
  seddars: Array<{
    index: number;
    length: number;        // ← WoodSellerFlow uses "length"
    price: number;
  }>;
  items: Array<{           // ← WoodSellerFlow calls it "items" not "extras"
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  priceModified?: boolean;
  finalPrice?: number;
  discountAmount?: number;
  discountReason?: string;
  notes?: string;
}

export function buildWoodCartItem(draft: WoodDraft): ProductResult {
  const seddariTotal = draft.seddars.reduce((s, sed) => s + (sed.price || 0), 0);
  const extrasTotal = draft.items.reduce((s, ex) => s + (ex.total_price || 0), 0);
  const calculatedTotal = seddariTotal + extrasTotal;

  const displayTotal = (draft.priceModified && draft.finalPrice) 
    ? draft.finalPrice 
    : calculatedTotal;

  // Build details — filter out qty=0 extras
  const woodItems = draft.items
    .filter(ex => (ex.quantity || 0) > 0)
    .map(ex => ({
      type: ex.item_name,
      name: ex.item_name,
      quantity: ex.quantity,
      unitPrice: ex.unit_price,
      totalPrice: ex.total_price,
    }));

  const details: Record<string, any> = {
    model: {
      id: draft.selectedModel.id,
      name: draft.selectedModel.name,
      code: draft.selectedModel.code,
      woodType: draft.selectedModel.wood_type,
    },
    salonShape: draft.salonShape,
    seddars: draft.seddars.map(s => ({
      index: s.index,
      lengthCm: s.length,
      price: s.price,
    })),
  };

  if (woodItems.length > 0) {
    details.woodItems = woodItems;
  }

  if (draft.notes) {
    details.notes = draft.notes;
  }

  const calculations: Record<string, any> = {
    subtotal: calculatedTotal,
    seddariTotal,
    itemsTotal: extrasTotal,
    finalTotal: displayTotal,
  };

  if (draft.discountAmount && draft.discountAmount > 0) {
    calculations.discountAmount = draft.discountAmount;
  }

  return {
    id: 'wood-' + Date.now(),
    productType: 'wood',
    productName: `عود — ${draft.selectedModel.name}`,
    thumbnailUrl: draft.selectedModel.image_url,
    quantity: 1,
    unitPrice: displayTotal,
    totalPrice: displayTotal,
    details,
    calculations,
    addedAt: new Date().toISOString(),
  };
}