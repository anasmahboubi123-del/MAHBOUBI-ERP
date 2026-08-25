import { v4 as uuidv4 } from "uuid";
import type { CartItem } from "@/contexts/OrderCartContext";

interface BuildWoodCartItemParams {
  selectedModel: {
    id: string;
    name: string;
    code: string;
    wood_type: string;
    image_url?: string;
    seddari_price_per_meter: number;
  };
  seddars: Array<{
    index: number;
    length: number; // بالمتر
    price: number;
  }>;
  items: Array<{
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  salonShape: string;
  notes?: string;
  priceModified: boolean;
  finalPrice?: number;
  discountAmount: number;
  discountReason: string;
}

export function buildWoodCartItem(params: BuildWoodCartItemParams): CartItem {
  const seddariTotal = params.seddars.reduce((s, x) => s + x.price, 0);
  const itemsTotal = params.items.reduce((s, x) => s + x.total_price, 0);
  const subtotal = seddariTotal + itemsTotal;
  const finalTotal = params.finalPrice ?? subtotal;

  return {
    id: uuidv4(),
    productType: "wood",
    productName: params.selectedModel.name,
    thumbnailUrl: params.selectedModel.image_url,
    quantity: 1,
    unitPrice: finalTotal,
    totalPrice: finalTotal,

    details: {
      model: {
        name: params.selectedModel.name,
        woodType: params.selectedModel.wood_type,
      },
      salonShape: params.salonShape,
      seddars: params.seddars.map((s) => ({
        index: s.index,
        lengthCm: Math.round(s.length * 100),
        widthCm: 70,
        heightCm: 30,
        price: s.price,
      })),
      woodItems: params.items.map((i) => ({
        name: i.item_name,
        type: "extra",
        quantity: i.quantity,
        unitPrice: i.unit_price,
        totalPrice: i.total_price,
      })),
      notes: params.notes,
    },

    calculations: {
      seddariTotal,
      itemsTotal,
      subtotal,
      discount: params.discountAmount,
      finalTotal,
    },
  };
}