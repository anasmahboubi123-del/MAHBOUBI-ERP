"use client";

import React, { createContext, useContext, useReducer, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getNextOrderNumber } from "@/features/order-center/services/orderCounter";
import type { Database } from '@/types/database.types';

/* ═══════════════════════════════════════════════════════════════
   TYPES — أنواع البيانات
   ═══════════════════════════════════════════════════════════════ */

export interface CartItem {
  id: string;
  productType: string;           // "salon" | "wood" | "tapis" | "foam" | "khamiya" | ...
  productName: string;
  thumbnailUrl?: string;
  unitPrice: number;
  totalPrice: number;
  quantity: number;
  details: Record<string, any>;      // technical_details — كل تفاصيل المنتج
  calculations: Record<string, any>;   // cost_breakdown — تفصيل التكاليف
}

export interface CartState {
  items: CartItem[];
  customerInfo: {
    name: string;
    phone: string;
    phone2?: string;
    email?: string;
    address?: string;
    city?: string;
  };
  deliveryDate: string;
  financials: {
    subtotal: number;
    discount: number;
    discountReason: string;
    total: number;
    deposit: number;
    remaining: number;
    paymentMethod: string;
    notes: string;
  };
  orderNotes: string;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QTY"; payload: { id: string; qty: number } }
  | { type: "UPDATE_NOTES"; payload: { id: string; notes: string } }
  | { type: "UPDATE_CUSTOMER"; payload: Partial<CartState["customerInfo"]> }
  | { type: "UPDATE_DELIVERY"; payload: string }
  | { type: "UPDATE_FINANCIALS"; payload: Partial<CartState["financials"]> }
  | { type: "UPDATE_ORDER_NOTES"; payload: string }
  | { type: "CLEAR" }
  | { type: "LOAD"; payload: CartState };

const initialState: CartState = {
  items: [],
  customerInfo: { name: "", phone: "" },
  deliveryDate: "",
  financials: {
    subtotal: 0, discount: 0, discountReason: "",
    total: 0, deposit: 0, remaining: 0,
    paymentMethod: "cash", notes: "",
  },
  orderNotes: "",
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const exists = state.items.find((i) => i.id === action.payload.id);
      if (exists) return state;
      return { ...state, items: [...state.items, action.payload] };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.id !== action.payload) };
    case "UPDATE_QTY": {
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.payload.id
            ? { ...i, quantity: action.payload.qty, totalPrice: i.unitPrice * action.payload.qty }
            : i
        ),
      };
    }
    case "UPDATE_NOTES": {
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.payload.id ? { ...i, details: { ...i.details, notes: action.payload.notes } } : i
        ),
      };
    }
    case "UPDATE_CUSTOMER":
      return { ...state, customerInfo: { ...state.customerInfo, ...action.payload } };
    case "UPDATE_DELIVERY":
      return { ...state, deliveryDate: action.payload };
    case "UPDATE_FINANCIALS":
      return { ...state, financials: { ...state.financials, ...action.payload } };
    case "UPDATE_ORDER_NOTES":
      return { ...state, orderNotes: action.payload };
    case "CLEAR":
      return initialState;
    case "LOAD":
      return action.payload;
    default:
      return state;
  }
}

/* ═══════════════════════════════════════════════════════════════
   CONTEXT — السياق
   ═══════════════════════════════════════════════════════════════ */

interface OrderCartContextValue {
  cart: CartState;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  updateItemNotes: (itemId: string, notes: string) => void;
  getCartTotals: () => {
    subtotal: number; discount: number; total: number;
    deposit: number; remaining: number; itemCount: number;
  };
  updateCustomerInfo: (info: Partial<CartState["customerInfo"]>) => void;
  updateDeliveryDate: (date: string) => void;
  updateFinancials: (f: Partial<CartState["financials"]>) => void;
  updateOrderNotes: (notes: string) => void;
  clearCart: () => void;
  saveOrder: (status: "draft" | "confirmed") => Promise<{ success: boolean; orderId?: string; error?: string }>;
  loadOrder: (orderId: string) => Promise<boolean>;
  searchCustomer: (query: string) => Promise<any[]>;
}

const OrderCartContext = createContext<OrderCartContextValue | null>(null);

export function OrderCartProvider({ children }: { children: React.ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, initialState);

  const addToCart = useCallback((item: CartItem) => {
    dispatch({ type: "ADD_ITEM", payload: item });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: itemId });
  }, []);

  const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QTY", payload: { id: itemId, qty: quantity } });
  }, []);

  const updateItemNotes = useCallback((itemId: string, notes: string) => {
    dispatch({ type: "UPDATE_NOTES", payload: { id: itemId, notes } });
  }, []);

  const getCartTotals = useCallback(() => {
    const subtotal = cart.items.reduce((sum, i) => sum + (Number(i.totalPrice) || 0), 0);
    const discount = cart.financials.discount || 0;
    const total = Math.max(0, subtotal - discount);
    const deposit = cart.financials.deposit || 0;
    const remaining = Math.max(0, total - deposit);
    return { subtotal, discount, total, deposit, remaining, itemCount: cart.items.length };
  }, [cart.items, cart.financials.discount, cart.financials.deposit]);

  const updateCustomerInfo = useCallback((info: Partial<CartState["customerInfo"]>) => {
    dispatch({ type: "UPDATE_CUSTOMER", payload: info });
  }, []);

  const updateDeliveryDate = useCallback((date: string) => {
    dispatch({ type: "UPDATE_DELIVERY", payload: date });
  }, []);

  const updateFinancials = useCallback((f: Partial<CartState["financials"]>) => {
    dispatch({ type: "UPDATE_FINANCIALS", payload: f });
  }, []);

  const updateOrderNotes = useCallback((notes: string) => {
    dispatch({ type: "UPDATE_ORDER_NOTES", payload: notes });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  /* ─── البحث عن الزبائن ─── */
  const searchCustomer = useCallback(async (query: string): Promise<any[]> => {
    if (!query || query.length < 2) return [];
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, phone2, email, address, city")
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(10);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("searchCustomer error:", e);
      return [];
    }
  }, []);

  /* ═══════════════════════════════════════════════════════════════
     SAVE ORDER — حفظ الطلب في جدولين
     ═══════════════════════════════════════════════════════════════ */
  const saveOrder = useCallback(
    async (status: "draft" | "confirmed"): Promise<{ success: boolean; orderId?: string; error?: string }> => {
      try {
        const totals = getCartTotals();

        // ─── توليد رقم الطلب التسلسلي ───
        const orderNumber = await getNextOrderNumber();

        // ─── 1. حفظ رأس الطلب في "orders" ───
        const orderPayload: Record<string, any> = {
          order_number: orderNumber,
          customer_name: cart.customerInfo.name || "زبون",
          customer_phone: cart.customerInfo.phone || "",
          customer_phone2: cart.customerInfo.phone2 || null,
          customer_email: cart.customerInfo.email || null,
          customer_address: cart.customerInfo.address || null,
          customer_city: cart.customerInfo.city || null,
          delivery_expected_date: cart.deliveryDate || null,
          subtotal: Number(totals.subtotal) || 0,
          discount: Number(totals.discount) || 0,
          discount_reason: cart.financials.discountReason || null,
          total: Number(totals.total) || 0,
          deposit: Number(totals.deposit) || 0,
          remaining: Number(totals.remaining) || 0,
          payment_method: cart.financials.paymentMethod || "cash",
          status,
          notes: cart.financials.notes || null,
          order_notes: cart.orderNotes || null,
        };

        console.log("[saveOrder] Order payload:", orderPayload);

        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert(orderPayload as any)
          .select("id")
          .single();

        if (orderError) {
          console.error("[saveOrder] orders insert error:", orderError);
          return {
            success: false,
            error: `فشل حفظ رأس الطلب: ${orderError.message} (كود: ${orderError.code})`,
          };
        }

        const orderId = (orderData as { id?: string } | null)?.id;
        if (!orderId) {
          return { success: false, error: "لم يُرجع Supabase معرف الطلب بعد الحفظ" };
        }

        console.log("[saveOrder] Order created:", orderId);

        // ─── 2. حفظ المنتجات في "order_items" ───
        if (cart.items.length > 0) {
          const orderItems = cart.items.map((item) => ({
            order_id: orderId,
            kind: item.productType || "salon",
            label: item.productName || "منتج",
            product_type: item.productType || "salon",
            product_name: item.productName || "منتج",
            thumbnail_url: item.thumbnailUrl || null,
            quantity: Number(item.quantity) || 1,
            unit_price: Number(item.unitPrice) || 0,
            total_price: Number(item.totalPrice) || 0,
            technical_details: item.details || {},
            cost_breakdown: item.calculations || {},
            item_notes: item.details?.notes || null,
          }));

          console.log("[saveOrder] Items payload:", orderItems);

          const { error: itemsError } = await supabase
            .from("order_items")
            .insert(orderItems as any);

          if (itemsError) {
            console.error("[saveOrder] order_items insert error:", itemsError);
            // حذف الطلب إذا فشلت المنتجات
            await supabase.from("orders").delete().eq("id", orderId);
            return {
              success: false,
              error: `فشل حفظ المنتجات: ${itemsError.message} (كود: ${itemsError.code})`,
            };
          }
        }

        // مسح السلة بعد النجاح
        dispatch({ type: "CLEAR" });
        console.log("[saveOrder] Success! OrderId:", orderId);
        return { success: true, orderId };
      } catch (e: any) {
        console.error("[saveOrder] Unhandled error:", e);
        return {
          success: false,
          error: e?.message || e?.error_description || "خطأ غير معروف في حفظ الطلب",
        };
      }
    },
    [cart, getCartTotals]
  );

  /* ─── تحميل طلب موجود ─── */
  const loadOrder = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      const { data: rawOrder, error: orderError } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId)
        .single();
      const order = rawOrder as any;

      if (orderError || !order) throw orderError;

      const items = ((order as any).order_items || []).map((item: any) => ({
        id: item.id,
        productType: item.kind || item.product_type || "salon",
        productName: item.product_name || item.label || "منتج",
        thumbnailUrl: item.thumbnail_url,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        details: item.technical_details || {},
        calculations: item.cost_breakdown || {},
      }));

      dispatch({
        type: "LOAD",
        payload: {
          items,
          customerInfo: {
            name: order.customer_name || "",
            phone: order.customer_phone || "",
            phone2: (order as any).customer_phone2 || "",
            email: order.customer_email || "",
            address: order.customer_address || "",
            city: order.customer_city || "",
          },
          deliveryDate: order.delivery_expected_date || "",
          financials: {
            subtotal: order.subtotal || 0,
            discount: order.discount || 0,
            discountReason: order.discount_reason || "",
            total: order.total || 0,
            deposit: order.deposit || 0,
            remaining: order.remaining || 0,
            paymentMethod: order.payment_method || "cash",
            notes: order.notes || "",
          },
          orderNotes: order.order_notes || "",
        },
      });
      return true;
    } catch (e) {
      console.error("loadOrder error:", e);
      return false;
    }
  }, []);

  return (
    <OrderCartContext.Provider
      value={{
        cart, addToCart, removeFromCart, updateItemQuantity, updateItemNotes,
        getCartTotals, updateCustomerInfo, updateDeliveryDate, updateFinancials,
        updateOrderNotes, clearCart, saveOrder, loadOrder, searchCustomer,
      }}
    >
      {children}
    </OrderCartContext.Provider>
  );
}

export function useOrderCart() {
  const ctx = useContext(OrderCartContext);
  if (!ctx) throw new Error("useOrderCart must be used within OrderCartProvider");
  return ctx;
}