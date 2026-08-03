import { 
  KhamiyaOrder, 
  KhamiyaCalculationBreakdown, 
  CustomAddition,
  SeddariOrder,
  SeddariCalculationBreakdown 
} from '@/types/khamiya';

// ═══════════════════════════════════════════════════════════════
// ثوابت الأعمال (Business Constants)
// ═══════════════════════════════════════════════════════════════

export const FABRIC_ROLL_WIDTH = 2.8; // 280 سم بالمتر
export const FABRIC_LENGTH_RATIO = 2; // لكل متر عرض، نحتاج مترين طول

export const KHAMIYA_BASE_SEWING = 40; // درهم
export const SEDDARI_STANDARD_SEWING = 20; // درهم
export const SEDDARI_SPECIAL_SEWING = 50; // درهم

export const BOTTOM_FABRIC_PRICE_PER_METER = 50; // درهم
export const AQAQ_PRICE_PER_METER = 30; // درهم (تقريبي)
export const KABALA_PAIR_PRICE = 150; // درهم للزوج
export const OTHER_SHAPES_PRICE = 200; // درهم للشكل

// ═══════════════════════════════════════════════════════════════
// دوال الخامية (Khamiya Pure Functions)
// ═══════════════════════════════════════════════════════════════

/**
 * حساب طول القماش المطلوب بناءً على العرض
 * القاعدة: عرض الرول ثابت 280سم، وعرض الزبون يحدد الطول المطلوب
 * مثال: عرض 2م يتطلب 4م من القماش
 */
export function calculateFabricLength(width: number): number {
  if (width <= 0) return 0;
  // كل متر عرض = متران طول (بسبب النسق/الكسرات)
  const rawLength = width * FABRIC_LENGTH_RATIO;
  // تقريب لأعلى لأقرب 10 سم
  return Math.ceil(rawLength * 10) / 10;
}

/**
 * حساب تكلفة القماش الأساسي
 */
export function calculateFabricCost(
  width: number, 
  pricePerMeter: number
): number {
  const length = calculateFabricLength(width);
  return length * pricePerMeter;
}

/**
 * حساب تكلفة الطبقة السفلية (الفوتير/البطانة)
 */
export function calculateBottomFabricCost(
  hasBottomFabric: boolean,
  width: number
): number {
  if (!hasBottomFabric || width <= 0) return 0;
  return width * BOTTOM_FABRIC_PRICE_PER_METER;
}

/**
 * حساب تكلفة العقاق (الخرز/الإكسسوارات)
 */
export function calculateAqaqCost(aqaqWidth: number): number {
  if (aqaqWidth <= 0) return 0;
  return aqaqWidth * AQAQ_PRICE_PER_METER;
}

/**
 * حساب تكلفة الكبالة (تباع بالأزواج)
 */
export function calculateKabalaCost(count: number): number {
  return count * KABALA_PAIR_PRICE;
}

/**
 * حساب تكلفة الأشكال الأخرى
 */
export function calculateOtherShapesCost(count: number): number {
  return count * OTHER_SHAPES_PRICE;
}

/**
 * حساب تكلفة الخياطة للخامية
 */
export function calculateKhamiyaSewingCost(
  sewingType: string,
  customPrice?: number
): number {
  switch (sewingType) {
    case 'standard':
      return KHAMIYA_BASE_SEWING;
    case 'special':
      return KHAMIYA_BASE_SEWING + 30; // خياطة خاصة = 70 درهم
    case 'custom':
      return customPrice || KHAMIYA_BASE_SEWING;
    default:
      return KHAMIYA_BASE_SEWING;
  }
}

/**
 * حساب مجموع الإضافات المخصصة
 */
export function calculateCustomAdditionsTotal(
  additions: CustomAddition[]
): number {
  return additions.reduce((sum, add) => sum + add.price, 0);
}

/**
 * الدالة الرئيسية: حساب تفاصيل الخامية بالكامل
 */
export function calculateKhamiyaBreakdown(
  order: Omit<KhamiyaOrder, 'id' | 'createdAt' | 'status' | 'totalPrice' | 'fabricLengthNeeded'>,
  fabricPricePerMeter: number
): KhamiyaCalculationBreakdown {
  const fabricLength = calculateFabricLength(order.width);
  const fabricCost = calculateFabricCost(order.width, fabricPricePerMeter);
  const bottomFabricCost = calculateBottomFabricCost(
    order.hasBottomFabric, 
    order.bottomFabricWidth || order.width
  );
  const aqaqCost = calculateAqaqCost(order.aqaqWidth);
  const kabalaCost = calculateKabalaCost(order.kabalaCount);
  const otherShapesCost = calculateOtherShapesCost(order.otherShapesCount);
  const sewingCost = calculateKhamiyaSewingCost(
    order.sewingType, 
    order.customSewingPrice
  );
  const customAdditionsTotal = calculateCustomAdditionsTotal(order.customAdditions);

  const grandTotal = 
    fabricCost + 
    bottomFabricCost + 
    aqaqCost + 
    kabalaCost + 
    otherShapesCost + 
    sewingCost + 
    customAdditionsTotal;

  return {
    fabricLength,
    fabricCost,
    bottomFabricCost,
    aqaqCost,
    kabalaCost,
    otherShapesCost,
    sewingCost,
    customAdditionsTotal,
    grandTotal,
  };
}

// ═══════════════════════════════════════════════════════════════
// دوال الصداري (Seddari Pure Functions)
// ═══════════════════════════════════════════════════════════════

/**
 * حساب حجم/مساحة الصدرية
 */
export function calculateSeddariVolume(
  length: number,
  width: number,
  height: number
): number {
  return length * width * height;
}

/**
 * حساب تكلفة الخياطة للصداري
 * تضاف بعد حساب الأبعاد
 */
export function calculateSeddariSewingCost(
  sewingType: 'standard' | 'special' | 'custom',
  customPrice?: number
): number {
  switch (sewingType) {
    case 'standard':
      return SEDDARI_STANDARD_SEWING;
    case 'special':
      return SEDDARI_SPECIAL_SEWING;
    case 'custom':
      return customPrice || SEDDARI_STANDARD_SEWING;
    default:
      return SEDDARI_STANDARD_SEWING;
  }
}

/**
 * حساب تكلفة الوسائد الإضافية
 */
export function calculatePillowCost(
  pillowLength: number,
  customSizes: number[]
): number {
  const standardPillowPrice = 15; // درهم للوسادة القياسية
  const customPillowPrice = 25; // درهم للوسادة المخصصة
  
  let total = 0;
  if (pillowLength > 0) {
    total += standardPillowPrice;
  }
  total += customSizes.length * customPillowPrice;
  return total;
}

/**
 * الدالة الرئيسية: حساب تفاصيل الصداري
 */
export function calculateSeddariBreakdown(
  order: Omit<SeddariOrder, 'id' | 'createdAt' | 'status' | 'totalPrice'>,
  basePricePerCubicMeter: number = 800
): SeddariCalculationBreakdown {
  const volume = calculateSeddariVolume(order.length, order.width, order.height);
  const baseCost = volume * basePricePerCubicMeter;
  
  // الخياطة تضاف بعد حساب الأبعاد
  const sewingCost = calculateSeddariSewingCost(
    order.sewingType,
    order.customSewingPrice
  );
  
  const pillowCost = calculatePillowCost(
    order.pillowLength || 0,
    order.pillowCustomSizes
  );

  const grandTotal = baseCost + sewingCost + pillowCost;

  return {
    baseCost,
    sewingCost,
    pillowCost,
    customAdditionsTotal: 0,
    grandTotal,
  };
}

// ═══════════════════════════════════════════════════════════════
// منسق الأرقام والعملة
// ═══════════════════════════════════════════════════════════════

export function formatCurrency(amount: number): string {
  return `${amount.toFixed(2)} درهم`;
}

export function formatDimension(value: number): string {
  return `${value.toFixed(2)} م`;
}