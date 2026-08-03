/* ═══════════════════════════════════════════════════════════════
   BUILDER: Salon (صالون مغربي) — FIXED with flexible types
   ═══════════════════════════════════════════════════════════════ */

import { ProductResult } from '../types';

export interface SalonDraft {
  // Fabric selection
  selectedFabric?: {
    id: string | number;
    name: string;
    price_per_meter?: number;
    image_url?: string;
  } | null;

  // Seddars
  seddars?: Array<{
    lengthCm?: number;
    length?: number;
    widthCm?: number;
    heightCm?: number;
    price?: number;
  }>;

  // Stitch
  selectedStitch?: {
    id: string | number;
    name: string;
    price?: number;
  } | null;

  // Cushions
  cushions?: {
    enabled: boolean;
    count?: number;
    totalPrice?: number;
  };

  // Decor
  decor?: {
    enabled: boolean;
    type?: string;
    price?: number;
  };

  // Extras
  extras?: Array<{
    name: string;
    enabled?: boolean;
    price?: number;
    lengthM?: number;
    qty?: number;
  }>;

  // Formage
  formage?: {
    enabled: boolean;
    corners?: number;
    price?: number;
  };

  // Totals from flow
  calculatedTotal?: number;
  priceOverride?: {
    value: number;
    reason: string;
  } | null;
  notes?: string;
}

export function calcSeddariFabricLength(lengthCm: number, widthCm: number, heightCm: number): number {
  // Standard formula: (length + width) * 2 + height * 2, all in meters
  const l = (lengthCm || 0) / 100;
  const w = (widthCm || 0) / 100;
  const h = (heightCm || 0) / 100;
  return parseFloat(((l + w) * 2 + h * 2).toFixed(2));
}

export function roundCushions(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 2;
  if (count <= 4) return 4;
  if (count <= 6) return 6;
  return Math.ceil(count / 2) * 2;
}

export function buildSalonCartItem(draft: SalonDraft): ProductResult {
  const totalPrice = draft.priceOverride?.value ?? (draft.calculatedTotal || 0);

  const details: Record<string, any> = {};

  if (draft.selectedFabric) {
    details.fabric = {
      id: String(draft.selectedFabric.id),
      name: draft.selectedFabric.name,
      pricePerMeter: draft.selectedFabric.price_per_meter,
    };
  }

  if (draft.seddars && draft.seddars.length > 0) {
    details.seddari = draft.seddars.map(s => ({
      lengthCm: s.lengthCm ?? s.length ?? 0,
      widthCm: s.widthCm ?? 70,
      heightCm: s.heightCm ?? 30,
      price: s.price ?? 0,
    }));
  }

  if (draft.selectedStitch) {
    details.stitch = {
      id: String(draft.selectedStitch.id),
      name: draft.selectedStitch.name,
      price: draft.selectedStitch.price,
    };
  }

  // Cushions — only if enabled
  if (draft.cushions?.enabled) {
    details.cushions = {
      enabled: true,
      count: draft.cushions.count || 0,
      totalPrice: draft.cushions.totalPrice || 0,
    };
  }

  // Decor — only if enabled
  if (draft.decor?.enabled) {
    details.decor = {
      enabled: true,
      type: draft.decor.type || '',
      price: draft.decor.price || 0,
    };
  }

  // Extras — only enabled ones
  if (draft.extras && draft.extras.length > 0) {
    const enabledExtras = draft.extras.filter(ex => ex.enabled !== false);
    if (enabledExtras.length > 0) {
      details.extras = enabledExtras;
    }
  }

  // Formage — only if enabled
  if (draft.formage?.enabled && (draft.formage.corners || 0) > 0) {
    details.formage = {
      enabled: true,
      corners: draft.formage.corners,
      price: draft.formage.price,
    };
  }

  if (draft.notes) {
    details.notes = draft.notes;
  }

  const calculations: Record<string, any> = {
    subtotal: draft.calculatedTotal || totalPrice,
    finalTotal: totalPrice,
  };

  if (draft.priceOverride) {
    calculations.priceOverride = draft.priceOverride;
  }

  return {
    id: 'salon-' + Date.now(),
    productType: 'salon',
    productName: `صالون مغربي — ${draft.selectedFabric?.name || ''}`,
    thumbnailUrl: draft.selectedFabric?.image_url,
    quantity: 1,
    unitPrice: totalPrice,
    totalPrice: totalPrice,
    details,
    calculations,
    addedAt: new Date().toISOString(),
  };
}