"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  CartState,
  OrderItem,
  Customer,
  Delivery,
  CartFinancial,
  CartNotes,
  ProductResult,
} from "../types";

import { supabase } from "@/lib/supabaseClient";
import { getNextOrderNumber } from "@/features/order-center/services/orderCounter";

/* ─── helpers ─── */
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const emptyCustomer: Customer = {
  name: "",
  phone: "",
  phone2: "",
  email: "",
  address: "",
  city: "",
  customerType: "individual",
};

const emptyDelivery: Partial<Delivery> = {
  method: "pickup",
  expectedDate: "",
  status: "pending",
  cost: 0,
};

const emptyFinancial: CartFinancial = {
  discountAmount: 0,
  discountInput: "",
  depositAmount: 0,
  depositInput: "",
  deliveryCost: 0,
};

const emptyNotes: CartNotes = {
  customer: "",
  internal: "",
  production: "",
};

const emptyCart: CartState = {
  items: [],
  customer: { ...emptyCustomer },
  delivery: { ...emptyDelivery },
  financial: { ...emptyFinancial },
  notes: { ...emptyNotes },
};

/* ─── Context ─── */
interface OrderContextValue {
  cart: CartState;
  cartTotals: {
    subtotal: number;
    discount: number;
    delivery: number;
    total: number;
    deposit: number;
    remaining: number;
  };
  addToCart: (product: ProductResult) => void;
  removeFromCart: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  updateItemNotes: (id: string, notes: string) => void;
  clearCart: () => void;
  updateCustomer: (patch: Partial<Customer>) => void;
  updateDelivery: (patch: Partial<Delivery>) => void;
  applyDiscount: (amount: number, reason?: string) => void;
  applyDeposit: (amount: number) => void;
  updateDeliveryCost: (cost: number) => void;
  updateNotes: (key: keyof CartNotes, value: string) => void;
  searchCustomer: (phone: string) => Promise<any[]>;
  createOrder: (status: "draft" | "confirmed") => Promise<{ id: string; orderNumber: string } | null>;
  isSubmitting: boolean;
}

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>({ ...emptyCart });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountReason, setDiscountReason] = useState("");

  /* ─── totals ─── */
  const subtotal = cart.items.reduce((s: number, it: OrderItem) => s + (Number(it.totalPrice) || 0), 0);
  const discount = Number(cart.financial.discountAmount) || 0;
  const delivery = Number(cart.financial.deliveryCost) || 0;
  const total = Math.max(0, subtotal - discount + delivery);
  const deposit = Number(cart.financial.depositAmount) || 0;
  const remaining = Math.max(0, total - deposit);

  const cartTotals = { subtotal, discount, delivery, total, deposit, remaining };

  /* ─── cart actions ─── */
  const addToCart = useCallback((product: ProductResult) => {
    const item: OrderItem = {
      ...product,
      orderItemId: uid(),
      addedAt: new Date().toISOString(),
    };
    setCart((prev: CartState) => ({ ...prev, items: [...prev.items, item] }));
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev: CartState) => ({ ...prev, items: prev.items.filter((i: OrderItem) => i.orderItemId !== id) }));
  }, []);

  /* ✅ NEW: update quantity & recalculate totalPrice */
  const updateItemQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev: CartState) => ({
      ...prev,
      items: prev.items.map((i: OrderItem) =>
        i.orderItemId === id
          ? { ...i, quantity, totalPrice: Number(i.unitPrice) * quantity }
          : i
      ),
    }));
  }, []);

  /* ✅ NEW: update line notes */
  const updateItemNotes = useCallback((id: string, notes: string) => {
    setCart((prev: CartState) => ({
      ...prev,
      items: prev.items.map((i: OrderItem) =>
        i.orderItemId === id ? { ...i, lineNotes: notes } : i
      ),
    }));
  }, []);

  const clearCart = useCallback(() => {
    setCart({ ...emptyCart });
    setDiscountReason("");
  }, []);

  /* ─── customer ─── */
  const updateCustomer = useCallback((patch: Partial<Customer>) => {
    setCart((prev: CartState) => ({
      ...prev,
      customer: { ...prev.customer, ...patch },
    }));
  }, []);

  /* ─── delivery ─── */
  const updateDelivery = useCallback((patch: Partial<Delivery>) => {
    setCart((prev: CartState) => ({
      ...prev,
      delivery: { ...prev.delivery, ...patch } as Partial<Delivery>,
    }));
  }, []);

  /* ─── financial ─── */
  const applyDiscount = useCallback((amount: number, reason?: string) => {
    setCart((prev: CartState) => ({
      ...prev,
      financial: { ...prev.financial, discountAmount: Number(amount) || 0, discountInput: String(amount) },
    }));
    if (reason) setDiscountReason(reason);
  }, []);

  const applyDeposit = useCallback((amount: number) => {
    setCart((prev: CartState) => ({
      ...prev,
      financial: { ...prev.financial, depositAmount: Number(amount) || 0, depositInput: String(amount) },
    }));
  }, []);

  const updateDeliveryCost = useCallback((cost: number) => {
    setCart((prev: CartState) => ({
      ...prev,
      financial: { ...prev.financial, deliveryCost: Number(cost) || 0 },
    }));
  }, []);

  /* ─── notes ─── */
  const updateNotes = useCallback((key: keyof CartNotes, value: string) => {
    setCart((prev: CartState) => ({
      ...prev,
      notes: { ...prev.notes, [key]: value },
    }));
  }, []);

  /* ─── search customer ─── */
  const searchCustomer = useCallback(async (phone: string) => {
    if (phone.length < 4) return [];
    const { data } = await supabase
      .from("customers")
      .select("*")
      .ilike("phone", `%${phone}%`)
      .limit(5);
    return data || [];
  }, []);

  /* ─── create order ─── */
  const createOrder = useCallback(
    async (status: "draft" | "confirmed") => {
      if (!cart.customer.name || !cart.customer.phone) {
        alert("يرجى إدخال اسم الزبون ورقم الهاتف");
        return null;
      }
      if (!cart.delivery.expectedDate) {
        alert("يرجى تحديد موعد التسليم المتوقع");
        return null;
      }
      if (cart.items.length === 0) {
        alert("السلة فارغة");
        return null;
      }

      setIsSubmitting(true);

      try {
        const orderNumber = await getNextOrderNumber();

        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert({
            order_number: orderNumber,
            customer_name: cart.customer.name,
            customer_phone: cart.customer.phone,
            customer_email: cart.customer.email || null,
            customer_address: cart.customer.address || null,
            customer_city: cart.customer.city || null,
            status,
            subtotal: Number(subtotal) || 0,
            total_amount: Number(total) || 0,
            discount_amount: Number(discount) || 0,
            discount_reason: discountReason || null,
            delivery_cost: Number(delivery) || 0,
            deposit_amount: Number(deposit) || 0,
            remaining_amount: Number(remaining) || 0,
            delivery_date: cart.delivery.expectedDate || null,
            delivery_expected_date: cart.delivery.expectedDate || null,
            delivery_method: cart.delivery.method || "pickup",
            workflow_status: status === "draft" ? "new" : "new",
            product_type: cart.items[0]?.productType || null,
            is_archived: false,
            delay_count: 0,
            delivery_address: cart.delivery.address || null,
            customer_notes: cart.notes.customer || null,
            internal_notes: cart.notes.internal || null,
            production_notes: cart.notes.production || null,
          } as any)
          .select()
          .single();

        const order = orderData as { id: string } | null;
        if (orderError || !order) throw orderError;

        const itemsPayload = cart.items.map((item: OrderItem) => ({
          order_id: order.id,
          kind: item.productType || "product",
          label: item.productName || "منتج",
          product_type: item.productType,
          product_name: item.productName,
          quantity: Math.round(Number(item.quantity) || 0),
          unit_price: Number(item.unitPrice) || 0,
          total_price: Number(item.totalPrice) || 0,
          details: item.details || {},
          calculations: item.calculations || {},
          production_details: item.productionDetails || item.details || {},
          payload: { technical_details: item.details || {}, calculations: item.calculations || {} },
          line_notes: item.lineNotes || null,
          line_discount: Number(item.lineDiscount) || 0,
          thumbnail_url: item.thumbnailUrl || null,
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(itemsPayload as never[]);

        if (itemsError) throw itemsError;

        return { id: order.id, orderNumber };
      } catch (err: any) {
        console.error("Create order error:", err);
        alert("فشل حفظ الطلب: " + (err.message || "خطأ غير معروف"));
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [cart, subtotal, discount, discountReason, delivery, deposit, total, remaining]
  );

  return (
    <OrderContext.Provider
      value={{
        cart,
        cartTotals,
        addToCart,
        removeFromCart,
        updateItemQuantity,
        updateItemNotes,
        clearCart,
        updateCustomer,
        updateDelivery,
        applyDiscount,
        applyDeposit,
        updateDeliveryCost,
        updateNotes,
        searchCustomer,
        createOrder,
        isSubmitting,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be inside OrderProvider");
  return ctx;
}