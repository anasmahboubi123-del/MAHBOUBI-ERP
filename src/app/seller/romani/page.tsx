"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";

import ModelSelector from "@/components/seller/romani/ModelSelector";
import ColorSelector from "@/components/seller/romani/ColorSelector";
import SeddariCalculator from "@/components/seller/romani/SeddariCalculator";
import RomaniOrderSummary from "@/components/seller/romani/RomaniOrderSummary";

import { RomaniModel, RomaniColor, RomaniSeddari, RomaniStep } from "@/types/romani.types";
import { fetchRomaniModels, fetchRomaniColors } from "@/lib/supabase-romani";
// ← FIXED: use OrderCartContext instead of OrderContext
import { useOrderCart } from "@/contexts/OrderCartContext";
import { ProductResult } from "@/features/order-center/types";

/* ═══════════════════════════════════════
   Interfaces
   ═══════════════════════════════ */
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

/* ═══════════════════════════════════════
   Helpers
   ═══════════════════════════════════════ */
function buildRomaniCartItem(draft: RomaniDraft): ProductResult {
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
    id: "romani-" + Date.now(),
    productType: "romani",
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

function StepIndicator({ currentStep }: { currentStep: RomaniStep }) {
  const steps: { key: RomaniStep; label: string }[] = [
    { key: "model", label: "الشكل" },
    { key: "color", label: "اللون" },
    { key: "calculator", label: "الحساب" },
    { key: "summary", label: "الملخص" },
  ];
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        return (
          <Fragment key={step.key}>
            {index > 0 && (
              <ChevronRight
                className={`w-4 h-4 ${
                  isCompleted ? "text-[#1B5E3B]" : "text-gray-300"
                }`}
              />
            )}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                isActive
                  ? "bg-[#1B5E3B] text-white shadow-lg shadow-[#1B5E3B]/20"
                  : isCompleted
                  ? "bg-[#1B5E3B]/10 text-[#1B5E3B]"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  isActive
                    ? "bg-white text-[#1B5E3B]"
                    : isCompleted
                    ? "bg-[#1B5E3B] text-white"
                    : "bg-gray-300 text-white"
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              {step.label}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════
   Page Component
   ═══════════════════════════════════════ */
export default function RomaniSalonPage() {
  const router = useRouter();
  // ← FIXED: use useOrderCart instead of useOrder
  const { addToCart } = useOrderCart();

  const [step, setStep] = useState<RomaniStep>("model");
  const [models, setModels] = useState<RomaniModel[]>([]);
  const [colors, setColors] = useState<RomaniColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<RomaniModel | null>(null);
  const [selectedColor, setSelectedColor] = useState<RomaniColor | null>(null);
  const [seddars, setSeddars] = useState<RomaniSeddari[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [modelsData, colorsData] = await Promise.all([
          fetchRomaniModels(),
          fetchRomaniColors(),
        ]);
        setModels(modelsData);
        setColors(colorsData);
      } catch (err) {
        console.error("Error loading romani data:", err);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleModelSelect = useCallback(
    (model: RomaniModel, customPrice?: number) => {
      setSelectedModel(
        customPrice !== undefined ? { ...model, price_per_meter: customPrice } : model
      );
      setStep("color");
    },
    []
  );

  const handleColorSelect = useCallback((color: RomaniColor) => {
    setSelectedColor(color);
    setStep("calculator");
  }, []);

  const handleSeddarsChange = useCallback((newSeddars: RomaniSeddari[]) => {
    setSeddars(newSeddars);
  }, []);

  const handleAddToCart = useCallback(
    (notes: string) => {
      if (!selectedModel || !selectedColor || seddars.length === 0) {
        console.warn("[Romani] Missing data");
        return;
      }

      const cartItem = buildRomaniCartItem({
        selectedModel: {
          id: selectedModel.id,
          name: selectedModel.name,
          price_per_meter: selectedModel.price_per_meter,
          image_url: selectedModel.image_url,
        },
        selectedColor: {
          id: selectedColor.id,
          name: selectedColor.name,
          image_url: selectedColor.image_url,
        },
        seddars: seddars.map((s) => ({
          id: s.id,
          length_cm: s.length_cm,
          has_kotik: s.has_kotik,
          kotik_count: s.kotik_count,
          has_formaja: s.has_formaja,
          formaja_length_meters: s.formaja_length_meters,
          price_per_meter: s.price_per_meter,
          total_price: s.total_price,
        })),
        notes,
      });

      console.log("[Romani] Built item:", cartItem);
      addToCart(cartItem);
      router.push("/seller/order-center");
    },
    [selectedModel, selectedColor, seddars, addToCart, router]
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#1B5E3B] animate-spin mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-20">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">الصالون الرومي</h1>
        <p className="text-gray-500">
          اختر الشكل واللون واحسب السعر حسب طول السدادر
        </p>
      </div>

      <StepIndicator currentStep={step} />

      <AnimatePresence mode="wait">
        {step === "model" && (
          <motion.div
            key="model"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ModelSelector
              models={models}
              selectedModel={selectedModel}
              onSelect={handleModelSelect}
            />
          </motion.div>
        )}

        {step === "color" && (
          <motion.div
            key="color"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ColorSelector
              colors={colors}
              selectedColor={selectedColor}
              onSelect={handleColorSelect}
            />
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setStep("model")}
                className="px-6 py-2 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
              >
                رجوع لاختيار الشكل
              </button>
            </div>
          </motion.div>
        )}

        {step === "calculator" && selectedModel && (
          <motion.div
            key="calculator"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <SeddariCalculator
              pricePerMeter={selectedModel.price_per_meter}
              seddars={seddars}
              onSeddarsChange={handleSeddarsChange}
              onNext={() => setStep("summary")}
              onBack={() => setStep("color")}
            />
          </motion.div>
        )}

        {step === "summary" && selectedModel && selectedColor && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <RomaniOrderSummary
              model={selectedModel}
              color={selectedColor}
              seddars={seddars}
              onBack={() => setStep("calculator")}
              onAddToCart={handleAddToCart}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}