// src/features/order-center/utils/salonBuilder.ts
import { ProductResult } from '../types';

export function buildSalonCartItem(draft: any): ProductResult {
  const fabric = draft.fabric;
  const seddari = draft.seddari || draft.seddars?.[0];
  const stitch = draft.stitchConfig || draft.stitch;
  const cushions = draft.cushionsConfig || draft.cushions;
  const decor = draft.decorConfig || draft.decor;
  const extras = draft.extras || [];
  const formage = draft.formage;

  const fabricLengthCm = seddari?.lengthCm && seddari?.heightCm
    ? seddari.lengthCm + (seddari.heightCm * 2) : 0;
  const fabricLengthMeters = fabricLengthCm / 100;
  const fabricCost = fabric?.pricePerMeter ? fabricLengthMeters * fabric.pricePerMeter : 0;
  const laborCost = stitch?.price || 0;
  const cushionsCount = cushions?.totalCm ? Math.max(1, Math.round(cushions.totalCm / 100)) : (cushions?.count || 0);
  const cushionsUnitPrice = cushions?.unitPrice || 0;
  const cushionsCost = cushionsCount * cushionsUnitPrice;
  const decorCost = decor?.price || 0;
  const extrasCost = extras.reduce((sum: number, ex: any) => sum + (ex.price || 0), 0);
  const formageCost = formage?.corners && formage?.pricePerCorner
    ? formage.corners * formage.pricePerCorner : 0;
  const subtotal = fabricCost + laborCost + cushionsCost + decorCost + extrasCost + formageCost;

  return {
    id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
    productType: 'salon',
    productName: `صالون — ${fabric?.name || 'غير محدد'}`,
    thumbnailUrl: fabric?.imageUrl,
    quantity: 1,
    unitPrice: subtotal,
    totalPrice: subtotal,
    details: {
      fabric: fabric ? { id: fabric.id, name: fabric.name, color: fabric.color, pricePerMeter: fabric.pricePerMeter } : undefined,
      seddari: seddari ? { lengthCm: seddari.lengthCm, widthCm: seddari.widthCm, heightCm: seddari.heightCm } : undefined,
      stitch: stitch ? { type: stitch.type, price: stitch.price } : undefined,
      cushions: cushionsCount > 0 ? { count: cushionsCount, type: cushions.type || 'قياسي', unitPrice: cushionsUnitPrice, totalPrice: cushionsCost } : undefined,
      decor: decor ? { type: decor.type, price: decor.price } : undefined,
      extras: extras.length > 0 ? extras.map((ex: any) => ({ name: ex.name, price: ex.price })) : undefined,
      formage: formage?.corners > 0 ? { corners: formage.corners, pricePerCorner: formage.pricePerCorner, totalPrice: formageCost } : undefined,
      notes: draft.notes,
    },
    calculations: {
      fabricLengthCm, fabricCost, laborCost, cushionsCost, decorCost, extrasCost, formageCost, subtotal,
    },
    addedAt: new Date().toISOString(),
  };
}