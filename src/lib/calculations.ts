import { OrderDraft, Seddari } from './types';

/** القيم الافتراضية - قابلة للتعديل من جدول settings */
export const DEFAULTS = {
  seddariSewingPrice: 10, // dh لكل سداري
  formajaSewingPrice: 50, // dh لكل فورماجة
  formajaFabricCm: 250, // 2.5m ثوب لكل فورماجة
  stuffingPrice: 100, // dh لكل وسادة (لواط)
  minDepositRatio: 0.3, // الحد الأدنى للتسبيق 30%
  defaultWidth: 70, // cm العرض الافتراضي للسداري
  heights: [20, 30, 50],
  cushionSizes: [75, 80, 100],
  cushionStitchPrices: [20, 40, 50, 60],
  decorStitchPrices: [50, 75, 100, 150]
};

/** ثوب السداري = الطول + (الارتفاع × 2) */
export const seddariFabricCm = (s: Seddari) => s.length + s.height * 2;

/** العدد المقترح للمخاد = طول السداري ÷ حجم الوسادة (تقريب) */
export const suggestedCushionCount = (lengthCm: number, size: number) =>
  Math.max(1, Math.round(lengthCm / size));

export interface Totals {
  fabricCm: number;
  fabricCost: number;
  seddariSewing: number;
  formajaCount: number;
  formajaCost: number;
  cushionsCost: number;
  stuffingCost: number;
  decorCost: number;
  extrasCost: number;
  total: number;
  minDeposit: number;
}

export function computeTotals(draft: OrderDraft): Totals {
  const pricePerCm = (draft.fabric?.price_per_meter ?? 0) / 100;

  const seddarsFabric = draft.seddars.reduce((s, x) => s + seddariFabricCm(x), 0);
  const formajaCount = draft.seddars.filter(
    (s) => (s as Seddari & { junction?: string }).junction === 'formaja'
  ).length;
  const fabricCm = seddarsFabric + formajaCount * DEFAULTS.formajaFabricCm;
  const fabricCost = fabricCm * pricePerCm;

  const seddariSewing = draft.seddars.length * DEFAULTS.seddariSewingPrice;
  const formajaCost = formajaCount * DEFAULTS.formajaSewingPrice;

  const cushions = (draft as OrderDraft & {
    cushions?: Array<{ count: number; stitchPrice: number; stuffing?: boolean }>;
  }).cushions ?? [];
  const cushionsCost = cushions.reduce((s, c) => s + c.count * c.stitchPrice, 0);
  const stuffingCost = cushions.reduce(
    (s, c) => s + (c.stuffing ? c.count * DEFAULTS.stuffingPrice : 0),
    0
  );
  const decorCushions = (draft as OrderDraft & {
    decorCushions?: Array<{ count: number; stitchPrice: number }>;
  }).decorCushions ?? [];
  const decorCost = decorCushions.reduce((s, d) => s + d.count * d.stitchPrice, 0);
  const extrasCost = draft.extras.reduce((s, e) => s + e.qty * e.price, 0);

  const computed =
    fabricCost + seddariSewing + formajaCost + cushionsCost + stuffingCost + decorCost + extrasCost;
  const total = draft.totalOverride ?? Math.round(computed);

  return {
    fabricCm,
    fabricCost: Math.round(fabricCost),
    seddariSewing,
    formajaCount,
    formajaCost,
    cushionsCost,
    stuffingCost,
    decorCost,
    extrasCost,
    total,
    minDeposit: Math.ceil(total * DEFAULTS.minDepositRatio)
  };
}

export const fmtDh = (n: number) => `${n.toLocaleString('fr-MA')} DH`;
export const fmtM = (cm: number) => `${(cm / 100).toFixed(2)} m`;
