/* ═══════════════════════════════════════════════════════════════
   BUILDER: Salon (صالون مغربي) — FULLY FIXED (no deletions)
   ═══════════════════════════════════════════════════════════════ */

import type { CartItem } from "@/contexts/OrderCartContext";
import type { OrderDraft } from "@/lib/types";

/* ─── دوال المساعدة (محفوظة كما هي) ─── */

export function calcSeddariFabricLength(lengthCm: number, heightCm: number, hasFormaja: boolean): number {
  let base = lengthCm + (2 * heightCm);
  if (hasFormaja) base += 250;
  return Math.ceil(base);
}

export function calcCushionCount(seddariLength: number, cushionSize: number): number {
  return Math.round(seddariLength / cushionSize);
}

export function calcCushionItemTotal(
  item: NonNullable<OrderDraft["cushionItems"]>[number],
  fabricPricePerMeter: number = 0
): number {
  const fabricConsumptionMeters = item.fabricConsumption / 100;
  const fabricCostPerPillow = fabricPricePerMeter * fabricConsumptionMeters;
  const stitchCost = item.count * item.stitchFinalPrice;
  const lwataCost = item.hasLwata ? item.count * item.lwataPrice : 0;
  const fabricCostTotal = item.count * fabricCostPerPillow;
  return stitchCost + lwataCost + fabricCostTotal;
}

export function calcDecorItemTotal(
  item: NonNullable<OrderDraft["decorItems"]>[number]
): number {
  return item.count * item.stitchFinalPrice;
}

/* ─── بناء عنصر السلة ─── */

export function buildSalonCartItem(draft: OrderDraft): CartItem {
  /* ✅ FIXED: draft.fabric (وليس draft.selectedFabric) */
  const fabric = draft.fabric;
  const seddars = draft.seddars || [];
  const stitches = draft.sedariStitches || [];
  const cushions = draft.cushionItems || [];
  const decor = draft.decorItems || [];
  const extras = draft.extrasStage;

  /* ── 1. ثمن ثوب السدادر ── */
  const seddarsFabricTotal =
    draft.seddarsFabricTotalOverride ??
    seddars.reduce((sum, s) => sum + s.fabricConsumption, 0);
  const fabricCost = fabric
    ? (seddarsFabricTotal / 100) * fabric.price_per_meter
    : 0;

  /* ── 2. خياطة السدادر ── */
  const stitchTotal =
    draft.stage3TotalOverride ??
    stitches.reduce((sum, s) => sum + s.finalPrice, 0);

  /* ── 3. المخاد (مع ثمن الثوب) ── */
  const cushionsTotal =
    draft.stage4TotalOverride ??
    cushions.reduce(
      (sum, c) => sum + calcCushionItemTotal(c, fabric?.price_per_meter || 0),
      0
    );

  /* ── 4. الكيدور ── */
  const decorTotal =
    draft.stage5TotalOverride ??
    decor.reduce((sum, d) => sum + calcDecorItemTotal(d), 0);

  /* ── 5. الإضافات ── */
  let extrasTotal = 0;
  if (extras) {
    if (extras.stageTotalOverride != null) {
      extrasTotal = extras.stageTotalOverride;
    } else {
      const lhayefTotal = extras.lhayef?.enabled
        ? (extras.lhayef.totalOverride ??
           extras.lhayef.lengthM * extras.lhayef.pricePerMeter)
        : 0;
      const tabouriaTotal = extras.tabouria?.enabled
        ? (extras.tabouria.totalOverride ??
           extras.tabouria.count * extras.tabouria.unitPrice)
        : 0;
      const customTotal = (extras.customItems || []).reduce(
        (s, i) => s + i.price,
        0
      );
      extrasTotal = lhayefTotal + tabouriaTotal + customTotal;
    }
  }

  /* ✅ FIXED: draft.totalOverride (وليس draft.priceOverride?.value) */
  const calculatedTotal =
    fabricCost + stitchTotal + cushionsTotal + decorTotal + extrasTotal;
  const totalPrice = draft.totalOverride ?? calculatedTotal;

  /* ── تفاصيل ── */
  const details: Record<string, any> = {};

  if (fabric) {
    details.fabric = {
      id: fabric.id,
      name: fabric.name,
      pricePerMeter: fabric.price_per_meter,
      consumptionCm: seddarsFabricTotal,
      consumptionMeters: Number((seddarsFabricTotal / 100).toFixed(2)),
    };
  }

  if (seddars.length > 0) {
    details.seddari = seddars.map((s) => ({
      type: s.type || "normal",
      length: s.length,
      width: s.width,
      height: s.height,
      fabricConsumptionCm: s.fabricConsumption,
      isFormaja: s.type === "formaja",
      shape: s.shape,
      shapeCustom: s.shapeCustom,
    }));
  }

  if (stitches.length > 0) {
    details.stitch = stitches.map((s) => ({
      seddariId: s.seddariId,
      styleName: s.styleName,
      basePrice: s.basePrice,
      finalPrice: s.finalPrice,
    }));
  }

  if (cushions.length > 0) {
    details.cushions = cushions.map((c) => {
      const fabricPricePerMeter = fabric?.price_per_meter || 0;
      const fabricConsumptionMeters = c.fabricConsumption / 100;
      const fabricCostPerPillow = fabricPricePerMeter * fabricConsumptionMeters;
      return {
        size: c.size,
        count: c.count,
        stitchStyle: c.stitchStyleName,
        stitchPrice: c.stitchFinalPrice,
        hasLwata: c.hasLwata,
        lwataPrice: c.lwataPrice,
        fabricCostPerPillow: Number(fabricCostPerPillow.toFixed(2)),
        total: Number(calcCushionItemTotal(c, fabricPricePerMeter).toFixed(2)),
      };
    });
  }

  if (decor.length > 0) {
    details.decor = decor.map((d) => ({
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
        total:
          extras.lhayef.totalOverride ??
          extras.lhayef.lengthM * extras.lhayef.pricePerMeter,
      });
    }
    if (extras.tabouria?.enabled) {
      enabledExtras.push({
        name: "الطابورية",
        count: extras.tabouria.count,
        unitPrice: extras.tabouria.unitPrice,
        total:
          extras.tabouria.totalOverride ??
          extras.tabouria.count * extras.tabouria.unitPrice,
      });
    }
    if (extras.customItems && extras.customItems.length > 0) {
      enabledExtras.push(
        ...extras.customItems.map((item) => ({
          name: item.name,
          price: item.price,
        }))
      );
    }
    if (enabledExtras.length > 0) {
      details.extras = enabledExtras;
    }
  }

  if (draft.customer?.notes) {
    details.notes = draft.customer.notes;
  }

  const calculations: Record<string, any> = {
    fabricCost: Number(fabricCost.toFixed(2)),
    stitchTotal,
    cushionsTotal,
    decorTotal,
    extrasTotal,
    subtotal: Number(calculatedTotal.toFixed(2)),
    finalTotal: totalPrice,
  };

  return {
    id: "salon-" + Date.now(),
    productType: "salon",
    productName: `صالون مغربي — ${fabric?.name || "بدون ثوب"}`,
    thumbnailUrl: fabric?.image_url ?? undefined,
    quantity: 1,
    unitPrice: totalPrice,
    totalPrice: totalPrice,
    details,
    calculations,
  };
}