'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/* ═══════════════════════════════════════════════════════════════
   HYBRID ARCHITECTURE:
   - localStorage: Draft cart (temporary, device-specific, offline)
   - Supabase: Saved orders (permanent, shared, secure)
   ═══════════════════════════════════════════════════════════════ */

/* ── Types ── */
export interface CartItemCalculation {
  fabricLengthCm?: number;
  fabricCost?: number;
  laborCost?: number;
  cushionsCost?: number;
  decorCost?: number;
  extrasCost?: number;
  formageCost?: number;
  materialCost?: number;
  backingCost?: number;
  edgingCost?: number;
  seddariTotal?: number;
  itemsTotal?: number;
  subtotal: number;
  discountAmount?: number;
  finalTotal?: number;
}

export interface CartItemDetails {
  notes?: string;
  fabric?: { id: string; name: string; color?: string; pricePerMeter: number; imageUrl?: string };
  seddari?: { lengthCm: number; widthCm: number; heightCm: number; heightType?: string; count?: number };
  stitch?: { id?: string; type: string; price: number };
  cushions?: { count: number; type: string; unitPrice: number; totalPrice: number };
  decor?: { type: string; price: number };
  extras?: Array<{ name: string; price: number }>;
  formage?: { corners: number; pricePerCorner: number; totalPrice: number };
  dimensions?: { lengthCm?: number; widthCm?: number; areaSqm?: number; originalLength?: number; originalWidth?: number };
  material?: { id: string; name: string; pricePerSqm?: number; pricePerMeter?: number; imageUrl?: string };
  backing?: { type: string; price: number };
  edging?: { type: string; price: number };
  cutMarginCm?: number;
  wastePercent?: number;
  roundingType?: string;
  model?: { id: string; name: string; code: string; woodType: string; imageUrl?: string };
  salonShape?: string;
  seddars?: Array<{ index: number; lengthCm: number; widthCm: number; heightCm: number; price: number; junctionType?: string }>;
  woodItems?: Array<{ type: string; name: string; quantity: number; unitPrice: number; totalPrice: number }>;
  product?: { id: string; name: string; pricePerMeter: number; imageUrl?: string };
  heightCm?: number;
  widthCm?: number;
  foamSeddars?: number[];
  squareCorners?: number;
  triangleCorners?: number;
  squareCornerPrice?: number;
  triangleCornerPrice?: number;
  priceAdjustment?: { type: 'discount' | 'increase'; value: number; reason: string };
  khamiyaShape?: 'solid_piece' | 'cut_middle';
  aqiq?: { id: string; name: string; pricePerMeter: number };
  background?: { id: string; name: string; width: number; height: number; meters: number; cost: number };
  customAdditions?: Array<{ name: string; price: number; image?: string }>;
  catalogAdditions?: Array<{ id: string; name: string; price: number }>;
  costEditReasons?: Record<string, string>;
}

export interface CartItem {
  id: string;
  productType: 'salon' | 'tapis' | 'bois' | 'wood' | 'foam' | 'bounj' | 'khamiya' | 'store' | 'accessoire' | string;
  productName: string;
  thumbnailUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  details: CartItemDetails;
  calculations: CartItemCalculation;
  addedAt: string;
}

export interface OrderCartState {
  items: CartItem[];
  customerInfo: {
    name: string;
    phone: string;
    address: string;
    email: string;
    city?: string;
  };
  deliveryDate: string;
  depositAmount: number;
  discountAmount: number;
  sellerNotes: string;
}

export interface SavedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: 'draft' | 'confirmed' | 'in_progress' | 'delivered' | 'cancelled';
  createdAt: string;
  itemCount: number;
}

/* ── Helpers ── */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function calcSeddariFabricLength(lengthCm: number, heightCm: number): number {
  return lengthCm + (heightCm * 2);
}

export function roundCushions(totalCm: number): number {
  const count = Math.round(totalCm / 100);
  return Math.max(1, count);
}

export function formatCurrency(n: number): string {
  return n.toLocaleString('ar-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' د.م';
}

export function generateOrderNumber(): string {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${yy}${mm}${dd}-${rand}`;
}

/* ── Builders ── */
export function buildSalonCartItem(draft: any): CartItem {
  const fabric = draft.fabric;
  const seddari = draft.seddari;
  const stitch = draft.stitch;
  const cushions = draft.cushions;
  const decor = draft.decor;
  const extras = draft.extras || [];
  const formage = draft.formage;

  const fabricLengthCm = seddari?.lengthCm && seddari?.heightCm
    ? calcSeddariFabricLength(seddari.lengthCm, seddari.heightCm) : 0;
  const fabricLengthMeters = fabricLengthCm / 100;
  const fabricCost = fabric?.pricePerMeter ? fabricLengthMeters * fabric.pricePerMeter : 0;
  const laborCost = stitch?.price || 0;
  const cushionsCount = cushions?.totalCm ? roundCushions(cushions.totalCm) : (cushions?.count || 0);
  const cushionsUnitPrice = cushions?.unitPrice || 0;
  const cushionsCost = cushionsCount * cushionsUnitPrice;
  const decorCost = decor?.price || 0;
  const extrasCost = extras.reduce((sum: number, ex: any) => sum + (ex.price || 0), 0);
  const formageCost = formage?.corners && formage?.pricePerCorner
    ? formage.corners * formage.pricePerCorner : 0;
  const subtotal = fabricCost + laborCost + cushionsCost + decorCost + extrasCost + formageCost;

  return {
    id: generateId(), productType: 'salon',
    productName: `صالون — ${fabric?.name || 'غير محدد'}`,
    thumbnailUrl: fabric?.imageUrl, quantity: 1, unitPrice: subtotal, totalPrice: subtotal,
    details: {
      fabric: fabric ? { id: fabric.id, name: fabric.name, color: fabric.color, pricePerMeter: fabric.pricePerMeter, imageUrl: fabric.imageUrl } : undefined,
      seddari: seddari ? { lengthCm: seddari.lengthCm, widthCm: seddari.widthCm, heightCm: seddari.heightCm, heightType: seddari.heightType } : undefined,
      stitch: stitch ? { id: stitch.id, type: stitch.type, price: stitch.price } : undefined,
      cushions: cushionsCount > 0 ? { count: cushionsCount, type: cushions.type || 'قياسي', unitPrice: cushionsUnitPrice, totalPrice: cushionsCost } : undefined,
      decor: decor ? { type: decor.type, price: decor.price } : undefined,
      extras: extras.length > 0 ? extras.map((ex: any) => ({ name: ex.name, price: ex.price })) : undefined,
      formage: formage?.corners > 0 ? { corners: formage.corners, pricePerCorner: formage.pricePerCorner, totalPrice: formageCost } : undefined,
      notes: draft.notes,
    },
    calculations: { fabricLengthCm, fabricCost, laborCost, cushionsCost, decorCost, extrasCost, formageCost, subtotal },
    addedAt: new Date().toISOString(),
  };
}

export function buildTapisCartItem(draft: any): CartItem {
  const tapis = draft.selectedTapis || draft.material;
  const calc = draft.calc || draft.dimensions;
  const finalArea = draft.finalArea || (calc?.originalLength && calc?.originalWidth
    ? (calc.originalLength + (calc.cutMarginCm || 0) / 100) * (calc.originalWidth + (calc.cutMarginCm || 0) / 100) * (1 + (calc.wastePercent || 0) / 100) : 0);
  const roundedArea = calc?.rounding === 'half' ? Math.ceil(finalArea * 2) / 2
    : calc?.rounding === 'one' ? Math.ceil(finalArea) : finalArea;
  const materialCost = tapis?.pricePerSqm || tapis?.price_per_m2 ? roundedArea * (tapis.pricePerSqm || tapis.price_per_m2) : 0;

  return {
    id: generateId(), productType: 'tapis',
    productName: `زربية — ${tapis?.name || 'غير محدد'}`,
    thumbnailUrl: tapis?.imageUrl || tapis?.image_url, quantity: 1, unitPrice: materialCost, totalPrice: materialCost,
    details: {
      material: tapis ? { id: tapis.id, name: tapis.name, pricePerSqm: tapis.pricePerSqm || tapis.price_per_m2, imageUrl: tapis.imageUrl || tapis.image_url } : undefined,
      dimensions: calc ? { originalLength: calc.originalLength, originalWidth: calc.originalWidth, areaSqm: roundedArea } : undefined,
      cutMarginCm: calc?.cutMarginCm, wastePercent: calc?.wastePercent, roundingType: calc?.rounding,
      notes: draft.notes,
    },
    calculations: { materialCost, subtotal: materialCost },
    addedAt: new Date().toISOString(),
  };
}

export function buildWoodCartItem(draft: any): CartItem {
  const model = draft.selectedModel;
  const seddars = draft.seddars || [];
  const items = draft.items || [];
  const shape = draft.salonShape || 'straight';
  const seddariTotal = seddars.reduce((sum: number, s: any) => sum + (s.seddari_price || s.price || 0), 0);
  const itemsTotal = items.reduce((sum: number, item: any) => sum + (item.total_price || item.price || 0), 0);
  const subtotal = seddariTotal + itemsTotal;

  return {
    id: generateId(), productType: 'wood',
    productName: `عود — ${model?.name || 'غير محدد'}`,
    thumbnailUrl: model?.image_url || model?.imageUrl, quantity: 1, unitPrice: subtotal, totalPrice: subtotal,
    details: {
      model: model ? { id: model.id, name: model.name, code: model.code, woodType: model.wood_type || model.woodType, imageUrl: model.image_url || model.imageUrl } : undefined,
      salonShape: shape,
      seddars: seddars.map((s: any, idx: number) => ({
        index: s.seddari_index || idx + 1, lengthCm: s.length_cm || s.lengthCm,
        widthCm: s.width_cm || s.widthCm || 70, heightCm: s.height_cm || s.heightCm || 30,
        price: s.seddari_price || s.price || 0, junctionType: s.junction_type || s.junctionType || 'none',
      })),
      woodItems: items.map((item: any) => ({
        type: item.item_type || item.type, name: item.item_name || item.name,
        quantity: item.quantity, unitPrice: item.original_price || item.unitPrice || item.price,
        totalPrice: item.total_price || item.totalPrice || 0,
      })),
      notes: draft.notes,
    },
    calculations: { seddariTotal, itemsTotal, subtotal },
    addedAt: new Date().toISOString(),
  };
}

export function buildFoamCartItem(draft: any): CartItem {
  const product = draft.selectedProduct || draft.product;
  const seddars = draft.seddars || draft.foamSeddars || [];
  const totalLength = seddars.reduce((sum: number, len: any) => sum + (typeof len === 'number' ? len : (len.length_cm || len.lengthCm || 0) / 100), 0);
  const seddarsTotal = totalLength * (product?.price_per_meter || product?.pricePerMeter || 0);
  const hasCorners = draft.hasCorners;
  const sq = draft.squareCorners || 0;
  const tri = draft.triangleCorners || 0;
  const sqTotal = hasCorners ? sq * (product?.square_corner_price || 0) : 0;
  const triTotal = hasCorners ? tri * (product?.triangle_corner_price || 0) : 0;
  let subtotal = seddarsTotal + sqTotal + triTotal;
  const adj = draft.priceAdjustment;
  if (adj) { if (adj.type === 'discount') subtotal -= adj.value; else subtotal += adj.value; }

  return {
    id: generateId(), productType: 'foam',
    productName: `بونج — ${product?.name || 'غير محدد'}`,
    thumbnailUrl: product?.image_url || product?.imageUrl, quantity: 1, unitPrice: subtotal, totalPrice: subtotal,
    details: {
      product: product ? { id: product.id, name: product.name, pricePerMeter: product.price_per_meter || product.pricePerMeter, imageUrl: product.image_url || product.imageUrl } : undefined,
      heightCm: draft.selectedHeight || draft.heightCm, widthCm: draft.widthCm || 70,
      foamSeddars: seddars.map((s: any) => typeof s === 'number' ? s : (s.length_cm || s.lengthCm || 0) / 100),
      squareCorners: hasCorners ? sq : 0, triangleCorners: hasCorners ? tri : 0,
      squareCornerPrice: product?.square_corner_price, triangleCornerPrice: product?.triangle_corner_price,
      priceAdjustment: adj, notes: draft.notes,
    },
    calculations: { fabricCost: seddarsTotal, laborCost: sqTotal + triTotal, subtotal },
    addedAt: new Date().toISOString(),
  };
}

export function buildKhamiyaCartItem(draft: any): CartItem {
  const khamiya = draft.selectedKhamiya;
  const width = draft.width || 2;
  const height = draft.height || 2.5;
  const fabricMeters = draft.fabricMeters || Math.ceil(width * 2 * 10) / 10;
  const shape = draft.shape || 'solid_piece';
  const sewing = draft.selectedSewing;
  const aqiq = draft.selectedAqiq;
  const background = draft.hasBackground ? draft.selectedBackground : null;
  const bgFabricMeters = draft.bgFabricMeters || Math.ceil((draft.bgWidth || width) * 2 * 10) / 10;
  const customAdditions = draft.customAdditions || [];
  const catalogAdditions = draft.selectedCatalogAdditions || [];
  const catalogItems = draft.catalogAdditions || [];

  const fabricCost = (khamiya?.price_per_m2 || 0) * fabricMeters;
  const sewingCost = draft.sewingTotalPrice || sewing?.price || 0;
  const aqiqCost = aqiq ? (aqiq.price_per_meter || 0) * (width * 2) : 0;
  const bgCost = background ? (background.price_per_m2 || 0) * bgFabricMeters : 0;
  const customAdditionsCost = customAdditions.reduce((s: number, a: any) => s + (a.price || 0), 0);
  const catalogAdditionsCost = catalogAdditions.reduce((sum: number, id: string) => {
    const item = catalogItems.find((a: any) => a.id === id); return sum + (item?.price || 0);
  }, 0);

  const subtotal = fabricCost + sewingCost + aqiqCost + bgCost + customAdditionsCost + catalogAdditionsCost;
  const grandTotal = draft.managerOverride ?? subtotal;

  return {
    id: generateId(), productType: 'khamiya',
    productName: `خامية — ${khamiya?.name || 'غير محدد'}`,
    thumbnailUrl: khamiya?.image_url || khamiya?.imageUrl, quantity: 1, unitPrice: grandTotal, totalPrice: grandTotal,
    details: {
      fabric: khamiya ? { id: khamiya.id, name: khamiya.name, pricePerMeter: khamiya.price_per_m2 || khamiya.pricePerMeter, imageUrl: khamiya.image_url || khamiya.imageUrl } : undefined,
      dimensions: { lengthCm: width * 100, widthCm: height * 100, areaSqm: width * height },
      khamiyaShape: shape,
      stitch: sewing ? { id: sewing.id, type: sewing.name, price: sewingCost } : undefined,
      aqiq: aqiq ? { id: aqiq.id, name: aqiq.name, pricePerMeter: aqiq.price_per_meter || aqiq.pricePerMeter } : undefined,
      background: background ? { id: background.id, name: background.name, width: draft.bgWidth || width, height: draft.bgHeight || height, meters: bgFabricMeters, cost: bgCost } : undefined,
      customAdditions: customAdditions.length > 0 ? customAdditions.map((a: any) => ({ name: a.name, price: a.price, image: a.image })) : undefined,
      catalogAdditions: catalogAdditions.length > 0 ? catalogAdditions.map((id: string) => {
        const item = catalogItems.find((a: any) => a.id === id); return { id, name: item?.name, price: item?.price };
      }) : undefined,
      costEditReasons: draft.costEditReasons, notes: draft.notes,
    },
    calculations: { fabricCost, laborCost: sewingCost, materialCost: aqiqCost, backingCost: bgCost, extrasCost: customAdditionsCost + catalogAdditionsCost, subtotal, discountAmount: grandTotal - subtotal, finalTotal: grandTotal },
    addedAt: new Date().toISOString(),
  };
}

export function buildSimpleCartItem(productType: string, productName: string, draft: any): CartItem {
  const qty = draft.quantity || 1;
  const unitPrice = draft.unitPrice || draft.price || 0;
  const subtotal = unitPrice * qty;
  return {
    id: generateId(), productType, productName,
    thumbnailUrl: draft.imageUrl || draft.image_url, quantity: qty, unitPrice, totalPrice: subtotal,
    details: { notes: draft.notes, ...draft.details },
    calculations: { subtotal },
    addedAt: new Date().toISOString(),
  };
}

/* ═══════════════════════════════════════════════════════════════
   CONTEXT
   ═══════════════════════════════════════════════════════════════ */

interface OrderCartContextValue {
  // ── Draft Cart (localStorage) ──
  cart: OrderCartState;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateCustomerInfo: (info: Partial<OrderCartState['customerInfo']>) => void;
  updateDeliveryDate: (date: string) => void;
  updateDepositAmount: (amount: number) => void;
  updateDiscount: (amount: number) => void;
  updateSellerNotes: (notes: string) => void;
  clearCart: () => void;
  getCartTotals: () => { subtotal: number; discount: number; deposit: number; total: number; remaining: number };
  itemCount: number;

  // ── Supabase Operations ──
  saveOrder: (status?: 'draft' | 'confirmed') => Promise<{ success: boolean; orderId?: string; error?: string }>;
  loadSavedOrders: () => Promise<SavedOrder[]>;
  getOrderDetails: (orderId: string) => Promise<any>;
}

const OrderCartContext = createContext<OrderCartContextValue | undefined>(undefined);
const STORAGE_KEY = 'el_mahboubi_order_cart';

const EMPTY_STATE: OrderCartState = {
  items: [],
  customerInfo: { name: '', phone: '', address: '', email: '', city: '' },
  deliveryDate: '',
  depositAmount: 0,
  discountAmount: 0,
  sellerNotes: '',
};

export function OrderCartProvider({ children }: { children: React.ReactNode }) {
  // 1. Always start with the same empty state on server AND client
  const [cart, setCart] = useState<OrderCartState>(EMPTY_STATE);

  // 2. After mount, hydrate from localStorage (safe, runs only in browser)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCart({
          items: parsed.items || [],
          customerInfo: parsed.customerInfo || { name: '', phone: '', address: '', email: '', city: '' },
          deliveryDate: parsed.deliveryDate || '',
          depositAmount: parsed.depositAmount || 0,
          discountAmount: parsed.discountAmount || 0,
          sellerNotes: parsed.sellerNotes || '',
        });
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  // 3. Persist changes back to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart]);

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => ({ ...prev, items: [...prev.items, item] }));
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== itemId) }));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((i) => i.id === itemId ? { ...i, quantity, totalPrice: i.unitPrice * quantity } : i),
    }));
  }, []);

  const updateCustomerInfo = useCallback((info: Partial<OrderCartState['customerInfo']>) => {
    setCart((prev) => ({ ...prev, customerInfo: { ...prev.customerInfo, ...info } }));
  }, []);

  const updateDeliveryDate = useCallback((date: string) => {
    setCart((prev) => ({ ...prev, deliveryDate: date }));
  }, []);

  const updateDepositAmount = useCallback((amount: number) => {
    setCart((prev) => ({ ...prev, depositAmount: Math.max(0, amount) }));
  }, []);

  const updateDiscount = useCallback((amount: number) => {
    setCart((prev) => ({ ...prev, discountAmount: Math.max(0, amount) }));
  }, []);

  const updateSellerNotes = useCallback((notes: string) => {
    setCart((prev) => ({ ...prev, sellerNotes: notes }));
  }, []);

  const clearCart = useCallback(() => {
    setCart(EMPTY_STATE);
  }, []);

  const getCartTotals = useCallback(() => {
    const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = cart.discountAmount || 0;
    const total = Math.max(0, subtotal - discount);
    const deposit = cart.depositAmount || 0;
    const remaining = Math.max(0, total - deposit);
    return { subtotal, discount, deposit, total, remaining };
  }, [cart]);

  const itemCount = cart.items.length;

  /* ── Supabase: Save Order ── */
  const saveOrder = useCallback(async (status: 'draft' | 'confirmed' = 'draft') => {
    try {
      const totals = getCartTotals();
      const orderNumber = generateOrderNumber();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Insert order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: cart.customerInfo.name,
          customer_phone: cart.customerInfo.phone,
          customer_address: cart.customerInfo.address,
          customer_email: cart.customerInfo.email,
          customer_city: cart.customerInfo.city,
          delivery_date: cart.deliveryDate || null,
          deposit_amount: totals.deposit,
          discount_amount: totals.discount,
          subtotal: totals.subtotal,
          total_amount: totals.total,
          remaining_amount: totals.remaining,
          seller_notes: cart.sellerNotes,
          seller_id: user?.id || null,
          status,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError || !order) throw orderError || new Error('فشل حفظ الطلب');

      // 2. Insert items — kind added to satisfy NOT NULL constraint
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          cart.items.map((item) => ({
            order_id: order.id,
            kind: item.productType,              // ← FIX: required by DB NOT NULL
            product_type: item.productType,
            product_name: item.productName,
            thumbnail_url: item.thumbnailUrl,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.totalPrice,
            details: item.details,
            calculations: item.calculations,
          }))
        );

      if (itemsError) throw itemsError;

      // 3. Clear local draft
      clearCart();

      return { success: true, orderId: order.id };
    } catch (err: any) {
      console.error('Save order error:', err);
      return { success: false, error: err.message || 'فشل حفظ الطلب' };
    }
  }, [cart, getCartTotals, clearCart]);

  /* ── Supabase: Load Saved Orders ── */
  const loadSavedOrders = useCallback(async (): Promise<SavedOrder[]> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, customer_phone, total_amount, status, created_at, order_items(count)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        orderNumber: row.order_number,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        totalAmount: row.total_amount,
        status: row.status,
        createdAt: row.created_at,
        itemCount: row.order_items?.[0]?.count || 0,
      }));
    } catch (err) {
      console.error('Load orders error:', err);
      return [];
    }
  }, []);

  /* ── Supabase: Get Order Details ── */
  const getOrderDetails = useCallback(async (orderId: string) => {
    try {
      const [{ data: order }, { data: items }] = await Promise.all([
        supabase.from('orders').select('*').eq('id', orderId).single(),
        supabase.from('order_items').select('*').eq('order_id', orderId),
      ]);
      return { order, items };
    } catch (err) {
      console.error('Get order details error:', err);
      return null;
    }
  }, []);

  return (
    <OrderCartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateCustomerInfo,
        updateDeliveryDate,
        updateDepositAmount,
        updateDiscount,
        updateSellerNotes,
        clearCart,
        getCartTotals,
        itemCount,
        saveOrder,
        loadSavedOrders,
        getOrderDetails,
      }}
    >
      {children}
    </OrderCartContext.Provider>
  );
}

export function useOrderCart() {
  const ctx = useContext(OrderCartContext);
  if (!ctx) throw new Error('useOrderCart must be used within OrderCartProvider');
  return ctx;
}