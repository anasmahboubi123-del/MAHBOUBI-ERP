/* ═══════════════════════════════════════════════════════════════
   BUILDER: Khamiya (خامية) — FIXED to match actual KhamiyaPage
   ═══════════════════════════════════════════════════════════════ */

import type { ProductResult } from '../types';

export interface KhamiyaDraft {
  selectedKhamiya: {
    id: string | number;
    name: string;
    price_per_m2: number;
    image_url?: string;
  };
  width: number;
  height: number;
  fabricMeters: number;
  shape: "solid_piece" | "cut_middle";
  selectedSewing: {
    id: string | number;
    name: string;
    price_per_meter: number;
  } | null;
  sewingTotalPrice: number;
  selectedAqiq: {
    id: string | number;
    name: string;
    price_per_meter: number;
    image_url?: string;
  } | null;
  hasBackground: boolean;
  selectedBackground: {
    id: string | number;
    name: string;
    price_per_m2: number;
    image_url?: string;
  } | null;
  bgWidth: number;
  bgHeight: number;
  bgFabricMeters: number;
  customAdditions: Array<{
    id: string;
    name: string;
    price: number;
    image?: string;
  }>;
  selectedCatalogAdditions: string[];
  catalogAdditions: Array<{
    id: string | number;
    name: string;
    price: number;
  }>;
  managerOverride: number | null;
  costEditReasons: Record<string, string>;
  notes: string;
}

export function buildKhamiyaCartItem(draft: KhamiyaDraft): ProductResult {
  const fabricCost = draft.selectedKhamiya.price_per_m2 * draft.fabricMeters;
  const sewingCost = draft.sewingTotalPrice;
  const aqiqCost = draft.selectedAqiq
    ? draft.selectedAqiq.price_per_meter * (draft.width * 2)
    : 0;
  const bgCost =
    draft.hasBackground && draft.selectedBackground
      ? draft.selectedBackground.price_per_m2 * draft.bgFabricMeters
      : 0;
  const customAdditionsCost = draft.customAdditions.reduce((s, a) => s + a.price, 0);
  const catalogAdditionsCost = draft.catalogAdditions
    .filter((a) => draft.selectedCatalogAdditions.includes(String(a.id)))
    .reduce((s, a) => s + a.price, 0);

  const rawTotal =
    fabricCost + sewingCost + aqiqCost + bgCost + customAdditionsCost + catalogAdditionsCost;
  const grandTotal = draft.managerOverride ?? rawTotal;

  return {
    id: `khamiya-${draft.selectedKhamiya.id}-${Date.now()}`,
    productType: "khamiya",
    productName: `خامية — ${draft.selectedKhamiya.name}`,
    unitPrice: grandTotal,
    quantity: 1,
    totalPrice: grandTotal,
    // ← FIXED: changed 'image' to 'thumbnailUrl' to match ProductResult
    thumbnailUrl: draft.selectedKhamiya.image_url ?? "",
    notes: draft.notes,
    addedAt: new Date().toISOString(),
    calculations: {
      subtotal: rawTotal,
      width: draft.width,
      height: draft.height,
      fabricMeters: draft.fabricMeters,
      shape: draft.shape,
      sewingTotalPrice: draft.sewingTotalPrice,
      aqiqCost,
      bgCost,
      customAdditionsCost,
      catalogAdditionsCost,
      managerOverride: draft.managerOverride,
    },
    details: {
      selectedKhamiya: draft.selectedKhamiya,
      selectedSewing: draft.selectedSewing,
      selectedAqiq: draft.selectedAqiq,
      hasBackground: draft.hasBackground,
      selectedBackground: draft.selectedBackground,
      customAdditions: draft.customAdditions,
      selectedCatalogAdditions: draft.selectedCatalogAdditions,
      costEditReasons: draft.costEditReasons,
    },
  };
}