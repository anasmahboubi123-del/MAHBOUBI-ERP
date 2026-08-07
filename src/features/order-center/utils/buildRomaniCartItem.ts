import { ProductResult } from '../types';

export interface RomaniDraft {
  selectedModel: {
    id: string;
    name: string;
    price_per_meter: number;
    image_url?: string | null;
  };
  selectedColor: {
    id: string;
    name: string;
    image_url?: string | null;
  };
  seddars: Array<{
    id: string;
    length_cm: number;
    has_kotik: boolean;
    kotik_count: number;
    has_formaja: boolean;
    formaja_length_meters: number;
    price_per_meter: number;
    total_price: number;
  }>;
  notes?: string;
}

export function buildRomaniCartItem(draft: RomaniDraft): ProductResult {
  const totalLengthMeters = draft.seddars.reduce((sum, s) => sum + s.length_cm / 100, 0);
  const totalKotikMeters = draft.seddars.reduce(
    (sum, s) => sum + (s.has_kotik ? s.kotik_count : 0),
    0
  );
  const totalFormajaMeters = draft.seddars.reduce(
    (sum, s) => sum + (s.has_formaja ? s.formaja_length_meters : 0),
    0
  );
  const totalMeters = totalLengthMeters + totalKotikMeters;
  const totalPrice = draft.seddars.reduce((sum, s) => sum + s.total_price, 0);

  const result: ProductResult = {
    id: 'romani-' + Date.now(),
    productType: 'salon',
    productName: `صالون رومي — ${draft.selectedModel.name} (${draft.selectedColor.name})`,
    thumbnailUrl: draft.selectedModel.image_url || undefined,
    quantity: 1,
    unitPrice: totalPrice,
    totalPrice: totalPrice,
    details: {
      model: {
        id: draft.selectedModel.id,
        name: draft.selectedModel.name,
        price_per_meter: draft.selectedModel.price_per_meter,
        image_url: draft.selectedModel.image_url,
      },
      color: {
        id: draft.selectedColor.id,
        name: draft.selectedColor.name,
        image_url: draft.selectedColor.image_url,
      },
      seddars: draft.seddars,
      isRomani: true,
      notes: draft.notes,
    },
    calculations: {
      subtotal: totalPrice,
      totalLengthMeters: Number(totalLengthMeters.toFixed(2)),
      totalKotikMeters,
      totalFormajaMeters: Number(totalFormajaMeters.toFixed(2)),
      totalMeters: Number(totalMeters.toFixed(2)),
      seddarsCount: draft.seddars.length,
    },
    notes: draft.notes,
    addedAt: new Date().toISOString(),
  };

  return result;
}