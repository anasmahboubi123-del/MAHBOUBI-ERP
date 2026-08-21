"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrder } from "@/features/order-center/context/OrderContext";
import { buildKhamiyaCartItem } from "@/features/order-center/utils/buildKhamiyaCartItem";
import { supabase, updateRow } from "@/lib/supabase";
import { uploadImage } from "@/lib/supabase";
import type { Khamiya, StitchStyle } from "@/lib/supabase";
import {
  ShoppingCart,
  Ruler,
  Square,
  Scissors,
  Layers,
  Gem,
  Plus,
  Trash2,
} from "lucide-react";

/* ═══════════════════════════════════════
   الأنواع المحلية
   ═══════════════════════════════════════ */
interface AqiqShape {
  id: string;
  name: string;
  price_per_meter: number | null;
  image_url: string | null;
  active: boolean | null;
}

interface KhamiyaAddition {
  id: string;
  name: string;
  price: number | null;
  category: string | null;
  image_url: string | null;
  active: boolean | null;
}

interface CustomAddition {
  id: string;
  name: string;
  price: number;
  image?: string;
}

function fmtCurrency(n: number) {
  return `${n.toFixed(2)} درهم`;
}

function calcFabricMeters(width: number): number {
  if (width <= 0) return 0;
  return Math.ceil(width * 2 * 10) / 10;
}

/* ═══════════════════════════════════════
   Inline Edit Modal
   ═══════════════════════════════════════ */
function InlineEditModal({
  open,
  title,
  initialValue,
  showReason,
  onSave,
  onCancel,
}: {
  open: boolean;
  title: string;
  initialValue: string;
  showReason?: boolean;
  onSave: (value: string, reason: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(initialValue);
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (open) {
      setVal(initialValue);
      setReason("");
    }
  }, [open, initialValue]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">✏️ {title}</h3>
        <input
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSave(val, reason)}
          placeholder="القيمة الجديدة"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-left text-lg font-bold outline-none focus:border-amber-600 mb-3"
          autoFocus
        />
        {showReason && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="سبب التعديل..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-amber-600 resize-none mb-3"
            rows={2}
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
          >
            إلغاء
          </button>
          <button
            onClick={() => onSave(val, reason)}
            className="flex-1 px-4 py-2.5 bg-amber-700 text-white rounded-xl font-bold text-sm hover:bg-amber-800 transition"
          >
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   بوابة كود المدير
   ═══════════════════════════════════════ */
function ManagerGate({
  open,
  title,
  onSuccess,
  onCancel,
}: {
  open: boolean;
  title: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  if (!open) return null;
  const check = () => {
    if (code === "9999") {
      setCode("");
      setErr(false);
      onSuccess();
    } else {
      setErr(true);
      setTimeout(() => setErr(false), 1500);
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-1">🔐 {title}</h3>
        <p className="text-sm text-gray-500 mb-4">أدخل كود المدير</p>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && check()}
          placeholder="••••"
          className={`w-full px-4 py-3 border-2 rounded-xl text-center text-xl font-bold tracking-[0.3em] outline-none transition ${
            err ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-amber-600"
          }`}
        />
        {err && (
          <p className="text-red-500 text-sm mt-2 text-center font-semibold">
            ❌ كود خاطئ
          </p>
        )}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => {
              setCode("");
              setErr(false);
              onCancel();
            }}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
          >
            إلغاء
          </button>
          <button
            onClick={check}
            className="flex-1 px-4 py-2.5 bg-amber-700 text-white rounded-xl font-bold text-sm hover:bg-amber-800 transition"
          >
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   ✅ معاينة الخامية الجديدة — بدل SVG الفاشل
   ═══════════════════════════════════════ */
function KhamiyaPreview({
  width,
  height,
  shape,
  hasBackground,
  step,
  selectedProductName,
  selectedKhamiyaImage,
}: {
  width: number;
  height: number;
  shape: "solid_piece" | "cut_middle";
  hasBackground: boolean;
  step: number;
  selectedProductName?: string;
  selectedKhamiyaImage?: string | null;
}) {
  const stepLabels: Record<number, string> = {
    1: "معاينة المنتج",
    2: "الأبعاد",
    3: "شكل القص",
    4: "تفاصيل الخياطة",
    5: "الفورمجة",
    6: "طبقة الخلفية",
    7: "الإضافات",
    8: "المراجعة النهائية",
  };

  const shapeLabel =
    shape === "solid_piece" ? "قطعة واحدة صلبة" : "قص من الوسط (قطعتان)";
  const bgLabel = hasBackground ? "مع طبقة خلفية" : "بدون طبقة خلفية";

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E8E0D4] shadow-sm">
      <h3 className="text-[#5D4037] font-bold text-lg mb-4 text-center">
        {stepLabels[step] || "معاينة الخامية"}
      </h3>

      <div className="space-y-4">
        {/* صورة المنتج أو placeholder */}
        <div className="flex justify-center">
          {selectedKhamiyaImage ? (
            <div className="relative w-full max-w-[280px] aspect-[4/3] rounded-xl overflow-hidden border-2 border-[#E8E0D4] shadow-sm">
              <img
                src={selectedKhamiyaImage}
                alt={selectedProductName || "الخامية"}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full max-w-[280px] aspect-[4/3] rounded-xl bg-[#F5F0E8] border-2 border-dashed border-[#D4C4A8] flex flex-col items-center justify-center gap-2">
              <div className="w-16 h-16 rounded-full bg-[#E8DCC4] flex items-center justify-center">
                <Layers className="w-8 h-8 text-[#8B6914]" />
              </div>
              <p className="text-sm text-[#8B6914] font-medium">
                {selectedProductName || "اختر خامية"}
              </p>
            </div>
          )}
        </div>

        {/* بطاقة الأبعاد */}
        <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#E8E0D4]">
          <div className="flex items-center gap-2 mb-3">
            <Ruler className="w-4 h-4 text-[#8B6914]" />
            <span className="text-sm font-bold text-[#5D4037]">الأبعاد</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 border border-[#E8E0D4] text-center">
              <p className="text-xs text-gray-500 mb-1">العرض</p>
              <p className="text-lg font-bold text-[#5D4037]">
                {width.toFixed(2)}{" "}
                <span className="text-xs font-normal">م</span>
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-[#E8E0D4] text-center">
              <p className="text-xs text-gray-500 mb-1">الارتفاع</p>
              <p className="text-lg font-bold text-[#5D4037]">
                {height.toFixed(2)}{" "}
                <span className="text-xs font-normal">م</span>
              </p>
            </div>
          </div>
          {/* شريط بصري للأبعاد */}
          <div className="mt-3 relative h-8 bg-[#E8DCC4] rounded-lg overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-[#C5A059] rounded-lg transition-all"
              style={{ width: `${Math.min((width / 5) * 100, 100)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-[#5D4037]">
                {width.toFixed(2)} م
              </span>
            </div>
          </div>
        </div>

        {/* تفاصيل إضافية */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-[#FAF8F5] rounded-lg border border-[#E8E0D4]">
            <Scissors className="w-4 h-4 text-[#8B6914]" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">شكل القص</p>
              <p className="text-sm font-bold text-[#5D4037]">{shapeLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#FAF8F5] rounded-lg border border-[#E8E0D4]">
            <Layers className="w-4 h-4 text-[#8B6914]" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">الطبقة الخلفية</p>
              <p className="text-sm font-bold text-[#5D4037]">{bgLabel}</p>
            </div>
          </div>
          {selectedProductName && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <Gem className="w-4 h-4 text-amber-700" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">المنتج المختار</p>
                <p className="text-sm font-bold text-amber-800">
                  {selectedProductName}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   لوحة التكلفة
   ═══════════════════════════════════════ */
function CostPanel({
  fabricCost,
  sewingCost,
  aqiqCost,
  bgCost,
  customAdditionsCost,
  catalogAdditionsCost,
  grandTotal,
  fabricMeters,
  bgFabricMeters,
  selectedKhamiyaName,
  selectedSewingName,
  selectedAqiqName,
  hasBackground,
  selectedBgName,
  onEditItem,
  editReasons,
}: {
  fabricCost: number;
  sewingCost: number;
  aqiqCost: number;
  bgCost: number;
  customAdditionsCost: number;
  catalogAdditionsCost: number;
  grandTotal: number;
  fabricMeters: number;
  bgFabricMeters: number;
  selectedKhamiyaName: string;
  selectedSewingName: string;
  selectedAqiqName: string;
  hasBackground: boolean;
  selectedBgName: string;
  onEditItem: (key: string, label: string, currentValue: number) => void;
  editReasons: Record<string, string>;
}) {
  const items = [
    {
      key: "fabric",
      label: `القماش — ${selectedKhamiyaName}`,
      value: fabricCost,
      sub: `${fabricMeters.toFixed(1)} متر`,
      show: true,
    },
    {
      key: "sewing",
      label: `الخياطة — ${selectedSewingName}`,
      value: sewingCost,
      show: true,
    },
    {
      key: "aqiq",
      label: `العقيق — ${selectedAqiqName}`,
      value: aqiqCost,
      show: true,
    },
    {
      key: "bg",
      label: `طبقة الخلفية — ${selectedBgName}`,
      value: bgCost,
      sub: `${bgFabricMeters.toFixed(1)} متر`,
      show: hasBackground,
    },
    {
      key: "custom",
      label: "إضافات مخصصة",
      value: customAdditionsCost,
      show: customAdditionsCost > 0,
    },
    {
      key: "catalog",
      label: "إضافات من الكتالوج",
      value: catalogAdditionsCost,
      show: catalogAdditionsCost > 0,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-amber-100 overflow-hidden">
      <div className="bg-amber-900 px-6 py-4">
        <h2 className="text-white font-bold text-xl">تفاصيل التكلفة</h2>
      </div>
      <div className="p-6 space-y-3">
        {items.map((item, idx) => {
          if (!item.show) return null;
          return (
            <div
              key={idx}
              className="flex items-start justify-between p-4 rounded-xl bg-gray-50 border border-gray-100"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900">{item.label}</span>
                  <button
                    onClick={() => onEditItem(item.key, item.label, item.value)}
                    className="text-amber-700 hover:text-amber-900 text-xs bg-amber-100 px-2 py-1 rounded-lg transition"
                    title="تعديل"
                  >
                    ✏️ تعديل
                  </button>
                </div>
                {item.sub && (
                  <span className="text-xs text-gray-500">{item.sub}</span>
                )}
                {editReasons[item.key] && (
                  <span className="text-xs text-red-500 block mt-1">
                    📝 {editReasons[item.key]}
                  </span>
                )}
              </div>
              <span className="font-bold text-lg text-amber-800 whitespace-nowrap mr-2">
                {fmtCurrency(item.value)}
              </span>
            </div>
          );
        })}
        <div className="border-t-2 border-dashed border-amber-300 my-4" />
        <div className="bg-amber-900 rounded-xl p-5 text-center">
          <p className="text-amber-200 text-sm mb-1">المجموع الإجمالي</p>
          <p className="text-white text-4xl font-bold">
            {fmtCurrency(grandTotal)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   الصفحة الرئيسية
   ═══════════════════════════════════════ */
export default function KhamiyaPage() {
  const router = useRouter();
  const { addToCart } = useOrder();
  const [step, setStep] = useState(1);

  // Supabase data
  const [khamiyaProducts, setKhamiyaProducts] = useState<Khamiya[]>([]);
  const [sewingTypes, setSewingTypes] = useState<StitchStyle[]>([]);
  const [aqiqShapes, setAqiqShapes] = useState<AqiqShape[]>([]);
  const [catalogAdditions, setCatalogAdditions] = useState<KhamiyaAddition[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state
  const [selectedKhamiya, setSelectedKhamiya] = useState<Khamiya | null>(null);
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(2.5);
  const [fabricMeters, setFabricMeters] = useState(4);
  const [shape, setShape] = useState<"solid_piece" | "cut_middle">(
    "solid_piece"
  );
  const [selectedSewing, setSelectedSewing] = useState<StitchStyle | null>(
    null
  );
  const [sewingTotalPrice, setSewingTotalPrice] = useState(0);
  const [selectedAqiq, setSelectedAqiq] = useState<AqiqShape | null>(null);
  const [hasBackground, setHasBackground] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState<Khamiya | null>(
    null
  );
  const [bgWidth, setBgWidth] = useState(2);
  const [bgHeight, setBgHeight] = useState(2.5);
  const [bgFabricMeters, setBgFabricMeters] = useState(4);
  const [customAdditions, setCustomAdditions] = useState<CustomAddition[]>([]);
  const [selectedCatalogAdditions, setSelectedCatalogAdditions] = useState<
    string[]
  >([]);
  const [managerOverride, setManagerOverride] = useState<number | null>(null);

  // Cost overrides & reasons
  const [costOverrides, setCostOverrides] = useState<Record<string, number>>(
    {}
  );
  const [costEditReasons, setCostEditReasons] = useState<
    Record<string, string>
  >({});

  // Manager gate
  const [gateOpen, setGateOpen] = useState(false);
  const [gateTitle, setGateTitle] = useState("");
  const [pendingOverride, setPendingOverride] = useState<any>(null);
  const [pendingTotalOverride, setPendingTotalOverride] = useState(false);

  // Inline edit modal
  const [inlineEditOpen, setInlineEditOpen] = useState(false);
  const [inlineEditTitle, setInlineEditTitle] = useState("");
  const [inlineEditValue, setInlineEditValue] = useState("");
  const [inlineEditShowReason, setInlineEditShowReason] = useState(false);
  const [inlineEditCallback, setInlineEditCallback] = useState<
    (val: string, reason: string) => void
  >(() => () => {});

  // Custom addition form
  const [newAddName, setNewAddName] = useState("");
  const [newAddPrice, setNewAddPrice] = useState("");
  const [newAddImage, setNewAddImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch data
  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const [
          { data: kh, error: khErr },
          { data: st, error: stErr },
          { data: aq, error: aqErr },
          { data: ad, error: adErr },
        ] = await Promise.all([
          supabase.from("khamiya").select("*"),
          supabase
            .from("stitch_styles")
            .select("*")
            .eq("target", "khamiya"),
          supabase.from("aqiq_shapes").select("*"),
          supabase.from("khamiya_additions").select("*"),
        ]);
        let finalSt = st;
        if (stErr) {
          const { data: stFallback } = await supabase
            .from("stitch_styles")
            .select("*");
          finalSt = stFallback;
        }
        if (khErr || aqErr || adErr) console.error({ khErr, aqErr, adErr });
        if (!kh && !finalSt && !aq && !ad) {
          setLoadError("❌ لا يمكن الاتصال بـ Supabase.");
          setLoading(false);
          return;
        }
        setKhamiyaProducts((kh || []) as Khamiya[]);
        setSewingTypes((finalSt || []) as StitchStyle[]);
        setAqiqShapes((aq || []) as AqiqShape[]);
        setCatalogAdditions((ad || []) as KhamiyaAddition[]);
      } catch (e: any) {
        setLoadError(`❌ خطأ غير متوقع: ${e?.message || "فشل الاتصال"}`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    setFabricMeters(calcFabricMeters(width));
  }, [width]);
  useEffect(() => {
    setBgFabricMeters(calcFabricMeters(bgWidth));
  }, [bgWidth]);

  // Calculations with overrides
  const fabricCost = useMemo(
    () =>
      costOverrides.fabric ??
      (selectedKhamiya?.price_per_m2 || 0) * fabricMeters,
    [costOverrides.fabric, selectedKhamiya, fabricMeters]
  );
  const sewingCost = useMemo(
    () => costOverrides.sewing ?? sewingTotalPrice,
    [costOverrides.sewing, sewingTotalPrice]
  );
  const aqiqCost = useMemo(
    () =>
      costOverrides.aqiq ??
      (selectedAqiq?.price_per_meter || 0) * (width * 2),
    [costOverrides.aqiq, selectedAqiq, width]
  );
  const bgCost = useMemo(
    () =>
      costOverrides.bg ??
      (hasBackground && selectedBackground
        ? (selectedBackground.price_per_m2 || 0) * bgFabricMeters
        : 0),
    [costOverrides.bg, hasBackground, selectedBackground, bgFabricMeters]
  );
  const customAdditionsCost = useMemo(
    () => costOverrides.custom ?? customAdditions.reduce((s, a) => s + a.price, 0),
    [costOverrides.custom, customAdditions]
  );
  const catalogAdditionsCost = useMemo(
    () =>
      costOverrides.catalog ??
      selectedCatalogAdditions.reduce((sum, id) => {
        const item = catalogAdditions.find((a) => a.id === id);
        return sum + (item?.price || 0);
      }, 0),
    [costOverrides.catalog, selectedCatalogAdditions, catalogAdditions]
  );
  const rawTotal =
    fabricCost +
    sewingCost +
    aqiqCost +
    bgCost +
    customAdditionsCost +
    catalogAdditionsCost;
  const grandTotal = managerOverride ?? rawTotal;

  // Inline edit helpers
  const openInlineEdit = (
    title: string,
    value: string,
    showReason: boolean,
    onSave: (val: string, reason: string) => void
  ) => {
    setInlineEditTitle(title);
    setInlineEditValue(value);
    setInlineEditShowReason(showReason);
    setInlineEditCallback(() => onSave);
    setInlineEditOpen(true);
  };

  const openGate = (title: string, override: any) => {
    setGateTitle(title);
    setPendingOverride(override);
    setGateOpen(true);
  };
  const handleGateSuccess = async () => {
    if (!pendingOverride) return;
    try {
      await updateRow(pendingOverride.table, pendingOverride.id, {
        [pendingOverride.field]: pendingOverride.newValue,
      });
      pendingOverride.onSuccess?.();
    } catch (e) {
      alert("فشل تحديث السعر");
    }
    setPendingOverride(null);
    setGateOpen(false);
  };
  const handleTotalOverrideGate = () => {
    setGateTitle("تعديل المجموع النهائي");
    setPendingTotalOverride(true);
    setGateOpen(true);
  };
  const applyTotalOverride = () => {
    setManagerOverride(rawTotal);
    setPendingTotalOverride(false);
    setGateOpen(false);
  };

  const handleCostEdit = (key: string, label: string, currentValue: number) => {
    openInlineEdit(
      `تعديل ${label}`,
      String(currentValue),
      true,
      (val, reason) => {
        const newVal = parseFloat(val);
        if (!isNaN(newVal)) {
          setCostOverrides((prev) => ({ ...prev, [key]: newVal }));
          if (reason.trim())
            setCostEditReasons((prev) => ({ ...prev, [key]: reason }));
        }
        setInlineEditOpen(false);
      }
    );
  };

  const handleCustomImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const url = await uploadImage("khamiya-additions", file);
    if (url) setNewAddImage(url);
    setUploadingImage(false);
  };

  const addCustomAddition = () => {
    if (!newAddName || !newAddPrice) return;
    const addition: CustomAddition = {
      id: Date.now().toString(),
      name: newAddName,
      price: parseFloat(newAddPrice),
      image: newAddImage || undefined,
    };
    setCustomAdditions((prev) => [...prev, addition]);
    setNewAddName("");
    setNewAddPrice("");
    setNewAddImage("");
  };

  const handleAddToCart = () => {
    if (!selectedKhamiya || !selectedSewing) return;

    const cartItem = buildKhamiyaCartItem({
      selectedKhamiya: {
        id: selectedKhamiya.id,
        name: selectedKhamiya.name,
        price_per_m2: selectedKhamiya.price_per_m2 ?? 0,
        image_url: selectedKhamiya.image_url ?? undefined,
      },
      width,
      height,
      fabricMeters,
      shape,
      selectedSewing: {
        id: selectedSewing.id,
        name: selectedSewing.name,
        price_per_meter:
          (selectedSewing as any).price_per_meter ??
          (selectedSewing as any).price ??
          0,
      },
      sewingTotalPrice,
      selectedAqiq: selectedAqiq
        ? {
            id: selectedAqiq.id,
            name: selectedAqiq.name,
            price_per_meter: selectedAqiq.price_per_meter ?? 0,
            image_url: selectedAqiq.image_url ?? undefined,
          }
        : null,
      hasBackground,
      selectedBackground: selectedBackground
        ? {
            id: selectedBackground.id,
            name: selectedBackground.name,
            price_per_m2: selectedBackground.price_per_m2 ?? 0,
            image_url: selectedBackground.image_url ?? undefined,
          }
        : null,
      bgWidth,
      bgHeight,
      bgFabricMeters,
      customAdditions,
      selectedCatalogAdditions,
      catalogAdditions: catalogAdditions.map((a) => ({
        ...a,
        price: a.price ?? 0,
      })),
      managerOverride,
      costEditReasons,
      notes: "",
    });

    addToCart(cartItem);
    resetFlow();
    router.push("/seller/order-center");
  };

  const resetFlow = () => {
    setStep(1);
    setSelectedKhamiya(null);
    setWidth(2);
    setHeight(2.5);
    setFabricMeters(4);
    setShape("solid_piece");
    setSelectedSewing(null);
    setSewingTotalPrice(0);
    setSelectedAqiq(null);
    setHasBackground(false);
    setSelectedBackground(null);
    setBgWidth(2);
    setBgHeight(2.5);
    setBgFabricMeters(4);
    setCustomAdditions([]);
    setSelectedCatalogAdditions([]);
    setManagerOverride(null);
    setCostOverrides({});
    setCostEditReasons({});
  };

  if (loading)
    return (
      <div
        className="min-h-screen bg-amber-50 flex items-center justify-center"
        dir="rtl"
      >
        <div className="text-amber-800 font-bold animate-pulse">
          جاري تحميل البيانات...
        </div>
      </div>
    );

  if (loadError)
    return (
      <div
        className="min-h-screen bg-amber-50 flex items-center justify-center p-4"
        dir="rtl"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-red-200">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-700 mb-2">
            فشل تحميل البيانات
          </h2>
          <p className="text-gray-600 text-sm whitespace-pre-line mb-6">
            {loadError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-amber-700 text-white rounded-xl font-bold hover:bg-amber-800"
          >
            🔄 إعادة المحاولة
          </button>
        </div>
      </div>
    );

  const totalSteps = 8;
  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedKhamiya !== null;
      case 2:
        return width > 0 && height > 0;
      case 3:
        return true;
      case 4:
        return selectedSewing !== null && sewingTotalPrice >= 0;
      case 5:
        return true;
      case 6:
        return (
          !hasBackground ||
          (hasBackground && selectedBackground !== null && bgWidth > 0)
        );
      case 7:
        return true;
      case 8:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 pb-20" dir="rtl">
      {/* Header */}
      <div className="bg-amber-900 text-white px-6 py-4 sticky top-0 z-40 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-amber-800 rounded-lg hover:bg-amber-700 text-sm"
          >
            رجوع
          </button>
          <h1 className="text-xl font-bold">إعداد خامية جديدة</h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10 rounded-full" />
            <div
              className="absolute top-1/2 left-0 h-1 bg-amber-600 -z-10 rounded-full transition-all"
              style={{
                width: `${((step - 1) / (totalSteps - 1)) * 100}%`,
              }}
            />
            {Array.from({ length: totalSteps }).map((_, i) => {
              const s = i + 1;
              return (
                <div
                  key={s}
                  className={`flex flex-col items-center gap-1 ${
                    step >= s ? "text-amber-600" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      step === s
                        ? "bg-amber-600 text-white ring-4 ring-amber-200 scale-110"
                        : step > s
                        ? "bg-amber-600 text-white"
                        : "bg-white text-gray-400 border-2 border-gray-200"
                    }`}
                  >
                    {s}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Form */}
          <div className="space-y-6">
            {/* ═══ STEP 1: اختيار الثوب ═══ */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-amber-900">
                  اختيار الثوب
                </h2>
                <p className="text-sm text-gray-500">
                  اختر خامية من الكتالوج. يمكن تعديل السعر بكود المدير.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {khamiyaProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className={`relative p-4 rounded-xl border-2 transition-all text-right ${
                        selectedKhamiya?.id === prod.id
                          ? "border-amber-600 bg-amber-50 ring-2 ring-amber-200"
                          : "border-gray-200 bg-white hover:border-amber-300"
                      }`}
                    >
                      <button
                        onClick={() => setSelectedKhamiya(prod)}
                        className="w-full text-right"
                      >
                        {prod.image_url ? (
                          <img
                            src={prod.image_url}
                            alt=""
                            className="w-full h-28 object-cover rounded-lg mb-3"
                          />
                        ) : (
                          <div className="w-full h-28 bg-amber-100 rounded-lg mb-3 flex items-center justify-center text-amber-300 text-3xl">
                            📷
                          </div>
                        )}
                        <p className="font-bold text-base">{prod.name}</p>
                        <p className="text-xs text-gray-500">{prod.quality}</p>
                        <p className="text-sm text-amber-700 font-semibold mt-1">
                          {fmtCurrency(prod.price_per_m2 || 0)} /م²
                        </p>
                      </button>
                    </div>
                  ))}
                </div>
                {khamiyaProducts.length === 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-700 font-bold">
                      لا توجد خاميات مسجلة
                    </p>
                    <p className="text-red-500 text-sm mt-1">
                      أضف خامية من باب المدير → الكتالوج → الخامية
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ STEP 2: الأبعاد ═══ */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-amber-900">الأبعاد</h2>
                <p className="text-sm text-gray-500">
                  الخامية المختارة:{" "}
                  <strong className="text-amber-800">
                    {selectedKhamiya?.name}
                  </strong>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-amber-900 font-semibold mb-2">
                      عرض الخامية (متر)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      value={width}
                      onChange={(e) =>
                        setWidth(parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 outline-none focus:ring-2 focus:ring-amber-200 text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-900 font-semibold mb-2">
                      ارتفاع الخامية (متر)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      value={height}
                      onChange={(e) =>
                        setHeight(parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 outline-none focus:ring-2 focus:ring-amber-200 text-left"
                    />
                  </div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <label className="text-amber-900 font-semibold">
                    كمية القماش المطلوبة (متر)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={fabricMeters}
                    onChange={(e) =>
                      setFabricMeters(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-4 py-3 rounded-xl border border-amber-200 outline-none focus:ring-2 focus:ring-amber-200 text-left mt-2"
                  />
                  <p className="text-xs text-amber-700 mt-1">
                    الحساب التلقائي: العرض × 2 = {calcFabricMeters(width)} متر
                  </p>
                </div>
              </div>
            )}

            {/* ═══ STEP 3: شكل القص ═══ */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-amber-900">شكل القص</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setShape("solid_piece")}
                    className={`p-6 rounded-2xl border-2 transition-all text-right ${
                      shape === "solid_piece"
                        ? "border-amber-600 bg-amber-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Square className="w-6 h-6 text-amber-700" />
                      <h3 className="font-bold text-lg">قطعة واحدة صلبة</h3>
                    </div>
                    <p className="text-gray-600 text-sm">بدون قص في الوسط</p>
                  </button>
                  <button
                    onClick={() => setShape("cut_middle")}
                    className={`p-6 rounded-2xl border-2 transition-all text-right ${
                      shape === "cut_middle"
                        ? "border-amber-600 bg-amber-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Scissors className="w-6 h-6 text-amber-700" />
                      <h3 className="font-bold text-lg">قص من الوسط</h3>
                    </div>
                    <p className="text-gray-600 text-sm">قطعتان منفصلتان</p>
                  </button>
                </div>
              </div>
            )}

            {/* ═══ STEP 4: الخياطة ═══ */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-amber-900">الخياطة</h2>
                {sewingTypes.length === 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                    ⚠️ لا توجد أنواع خياطة مسجلة للخامية في الكتالوج.
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sewingTypes.map((s) => (
                    <div
                      key={s.id}
                      className={`relative p-4 rounded-xl border-2 transition-all text-right ${
                        selectedSewing?.id === s.id
                          ? "border-amber-600 bg-amber-50 ring-2 ring-amber-200"
                          : "border-gray-200 bg-white hover:border-amber-300"
                      }`}
                    >
                      <button
                        onClick={() => setSelectedSewing(s)}
                        className="w-full text-right"
                      >
                        {s.image_url ? (
                          <img
                            src={s.image_url}
                            alt=""
                            className="w-full h-20 object-cover rounded-lg mb-2"
                          />
                        ) : (
                          <div className="w-full h-20 bg-amber-100 rounded-lg mb-2 flex items-center justify-center text-amber-300 text-2xl">
                            🪡
                          </div>
                        )}
                        <p className="font-bold text-sm">{s.name}</p>
                        <p className="text-xs text-amber-700">
                          {fmtCurrency((s as any).price || 0)}
                        </p>
                      </button>
                    </div>
                  ))}
                </div>
                {selectedSewing && (
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <label className="block font-semibold mb-2">
                      ثمن الخياطة الإجمالي (درهم)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={sewingTotalPrice}
                      onChange={(e) =>
                        setSewingTotalPrice(parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 outline-none focus:ring-2 focus:ring-amber-200 text-left text-lg font-bold"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      أدخل المبلغ الإجمالي للخياطة كما اتفقت مع الزبون
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ STEP 5: العقيق (اختياري) ═══ */}
            {step === 5 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-amber-900">
                  العقيق (اختياري)
                </h2>
                <button
                  onClick={() => setSelectedAqiq(null)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-right ${
                    selectedAqiq === null
                      ? "border-amber-600 bg-amber-50 ring-2 ring-amber-200"
                      : "border-gray-200 bg-white hover:border-amber-300"
                  }`}
                >
                  <h3 className="font-bold text-lg">🚫 بدون عقيق</h3>
                  <p className="text-gray-600 text-sm">تخطي إضافة العقيق</p>
                </button>
                {aqiqShapes.length === 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                    ⚠️ لا توجد أشكال عقيق مسجلة.
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aqiqShapes.map((shapeItem) => (
                    <button
                      key={shapeItem.id}
                      onClick={() => setSelectedAqiq(shapeItem)}
                      className={`relative p-4 rounded-xl border-2 transition-all text-right ${
                        selectedAqiq?.id === shapeItem.id
                          ? "border-amber-600 bg-amber-50 ring-2 ring-amber-200"
                          : "border-gray-200 bg-white hover:border-amber-300"
                      }`}
                    >
                      {shapeItem.image_url ? (
                        <img
                          src={shapeItem.image_url}
                          alt=""
                          className="w-full h-20 object-cover rounded-lg mb-2"
                        />
                      ) : (
                        <div className="w-full h-20 bg-amber-100 rounded-lg mb-2 flex items-center justify-center text-amber-300 text-2xl">
                          💎
                        </div>
                      )}
                      <p className="font-bold text-sm">{shapeItem.name}</p>
                      <p className="text-xs text-amber-700">
                        {fmtCurrency(shapeItem.price_per_meter || 0)} /متر
                      </p>
                      {selectedAqiq?.id === shapeItem.id && (
                        <div className="mt-2 p-2 bg-amber-100 rounded-lg text-xs text-amber-800">
                          الحساب:{" "}
                          {fmtCurrency(shapeItem.price_per_meter || 0)} × (
                          {width} × 2) ={" "}
                          {fmtCurrency(
                            (shapeItem.price_per_meter || 0) * width * 2
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ STEP 6: طبقة الخلفية ═══ */}
            {step === 6 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-amber-900">
                  طبقة الخلفية
                </h2>
                <div className="bg-white rounded-xl p-6 border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">
                        إضافة طبقة خلفية؟
                      </h3>
                      <p className="text-gray-600 text-sm">
                        ثوب إضافي يأتي تحت الطبقة العلوية
                      </p>
                    </div>
                    <button
                      onClick={() => setHasBackground(!hasBackground)}
                      className={`relative w-14 h-8 rounded-full transition-all ${
                        hasBackground ? "bg-amber-600" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                          hasBackground ? "left-7" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                  {hasBackground && (
                    <div className="mt-4 space-y-4">
                      <p className="text-sm text-gray-600">اختر الثوب:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {khamiyaProducts.map((prod) => (
                          <div
                            key={prod.id}
                            className={`relative p-3 rounded-xl border-2 transition-all text-right ${
                              selectedBackground?.id === prod.id
                                ? "border-amber-600 bg-amber-50"
                                : "border-gray-200 bg-white hover:border-amber-300"
                            }`}
                          >
                            <button
                              onClick={() => setSelectedBackground(prod)}
                              className="w-full text-right"
                            >
                              {prod.image_url ? (
                                <img
                                  src={prod.image_url}
                                  alt=""
                                  className="w-full h-16 object-cover rounded-lg mb-2"
                                />
                              ) : (
                                <div className="w-full h-16 bg-amber-100 rounded-lg mb-2" />
                              )}
                              <p className="font-bold text-sm">{prod.name}</p>
                              <p className="text-xs text-amber-700">
                                {fmtCurrency(prod.price_per_m2 || 0)} /م²
                              </p>
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-amber-900 font-semibold mb-2 text-sm">
                            عرض الطبقة (متر)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={bgWidth}
                            onChange={(e) =>
                              setBgWidth(parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-4 py-3 rounded-xl border border-amber-200 outline-none text-left"
                          />
                        </div>
                        <div>
                          <label className="block text-amber-900 font-semibold mb-2 text-sm">
                            ارتفاع الطبقة (متر)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={bgHeight}
                            onChange={(e) =>
                              setBgHeight(parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-4 py-3 rounded-xl border border-amber-200 outline-none text-left"
                          />
                        </div>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                        <label className="text-amber-900 font-semibold text-sm">
                          كمية القماش (متر)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={bgFabricMeters}
                          onChange={(e) =>
                            setBgFabricMeters(parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-4 py-3 rounded-xl border border-amber-200 outline-none text-left mt-2"
                        />
                        <p className="text-xs text-amber-700 mt-1">
                          الحساب التلقائي: العرض × 2 ={" "}
                          {calcFabricMeters(bgWidth)} متر
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══ STEP 7: الإضافات ═══ */}
            {step === 7 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-amber-900">الإضافات</h2>
                <div className="bg-white rounded-xl p-6 border">
                  <h3 className="font-bold mb-3">إضافة مخصصة جديدة</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="اسم الإضافة"
                      value={newAddName}
                      onChange={(e) => setNewAddName(e.target.value)}
                      className="px-4 py-3 rounded-xl border border-amber-200 outline-none"
                    />
                    <input
                      type="number"
                      placeholder="السعر"
                      value={newAddPrice}
                      onChange={(e) => setNewAddPrice(e.target.value)}
                      className="px-4 py-3 rounded-xl border border-amber-200 outline-none text-left"
                    />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    {newAddImage ? (
                      <img
                        src={newAddImage}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover border"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xl">
                        📷
                      </div>
                    )}
                    <label
                      className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer border transition ${
                        uploadingImage
                          ? "bg-gray-100 text-gray-400"
                          : "bg-amber-50 text-amber-700 hover:bg-amber-700 hover:text-white border-amber-200"
                      }`}
                    >
                      {uploadingImage ? "⏳ رفع..." : "📁 رفع صورة"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCustomImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                  <button
                    onClick={addCustomAddition}
                    disabled={!newAddName || !newAddPrice}
                    className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة
                  </button>
                </div>
                {customAdditions.length > 0 && (
                  <div className="space-y-2">
                    {customAdditions.map((a) => (
                      <div
                        key={a.id}
                        className="flex justify-between p-4 bg-amber-50 rounded-xl border border-amber-200"
                      >
                        <div className="flex items-center gap-3">
                          {a.image && (
                            <img
                              src={a.image}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-bold">{a.name}</p>
                            <p className="text-amber-700 font-semibold">
                              {fmtCurrency(a.price)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setCustomAdditions((prev) =>
                              prev.filter((x) => x.id !== a.id)
                            )
                          }
                          className="text-red-500 hover:text-red-700 font-bold px-3"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {catalogAdditions.length > 0 && (
                  <div>
                    <h3 className="font-bold mb-3">إضافات من الكتالوج</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {catalogAdditions.map((item) => {
                        const isSelected =
                          selectedCatalogAdditions.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            onClick={() =>
                              setSelectedCatalogAdditions((prev) =>
                                isSelected
                                  ? prev.filter((id) => id !== item.id)
                                  : [...prev, item.id]
                              )
                            }
                            className={`p-4 rounded-xl border-2 transition-all text-right ${
                              isSelected
                                ? "border-amber-600 bg-amber-50"
                                : "border-gray-200 bg-white hover:border-amber-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-sm">
                                  {item.name}
                                </p>
                                <p className="text-xs text-amber-700">
                                  {fmtCurrency(item.price || 0)}
                                </p>
                                <span className="text-[10px] text-gray-400">
                                  {item.category}
                                </span>
                              </div>
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                  isSelected
                                    ? "bg-amber-600 border-amber-600 text-white"
                                    : "border-gray-300"
                                }`}
                              >
                                {isSelected && "✓"}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ STEP 8: الملخص ═══ */}
            {step === 8 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-amber-900">الملخص</h2>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">
                        تعديل المجموع النهائي
                      </p>
                      <p className="text-xs text-gray-500">
                        يتطلب كود المدير
                      </p>
                    </div>
                    <button
                      onClick={handleTotalOverrideGate}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200"
                    >
                      ✏️ تعديل
                    </button>
                  </div>
                  {managerOverride !== null && (
                    <p className="mt-2 text-sm text-amber-700 font-semibold">
                      المجموع المعدل: {fmtCurrency(managerOverride)}
                    </p>
                  )}
                </div>
                <div className="bg-amber-900 rounded-2xl p-6 text-white text-center">
                  <p className="text-amber-200 text-sm mb-1">المجموع الكلي</p>
                  <p className="text-4xl font-bold">
                    {fmtCurrency(grandTotal)}
                  </p>
                  <p className="text-xs text-amber-300 mt-2">
                    القماش: {fmtCurrency(fabricCost)} | خياطة:{" "}
                    {fmtCurrency(sewingCost)} | عقيق:{" "}
                    {fmtCurrency(aqiqCost)}
                    {hasBackground && ` | خلفية: ${fmtCurrency(bgCost)}`}
                    {customAdditionsCost > 0 &&
                      ` | إضافات: ${fmtCurrency(customAdditionsCost)}`}
                    {catalogAdditionsCost > 0 &&
                      ` | كتالوج: ${fmtCurrency(catalogAdditionsCost)}`}
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="px-6 py-3 rounded-xl border border-gray-300 font-bold hover:bg-gray-50 disabled:opacity-30 transition"
              >
                السابق
              </button>
              {step < totalSteps ? (
                <button
                  onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
                  disabled={!canProceed()}
                  className="px-6 py-3 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 disabled:opacity-50 transition"
                >
                  التالي
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={!canProceed()}
                  className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 transition flex items-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  🛒 أضف للسلة
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Preview + Cost */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <KhamiyaPreview
              width={width}
              height={height}
              shape={shape}
              hasBackground={hasBackground}
              step={step}
              selectedProductName={selectedKhamiya?.name}
              selectedKhamiyaImage={selectedKhamiya?.image_url}
            />
            <CostPanel
              fabricCost={fabricCost}
              sewingCost={sewingCost}
              aqiqCost={aqiqCost}
              bgCost={bgCost}
              customAdditionsCost={customAdditionsCost}
              catalogAdditionsCost={catalogAdditionsCost}
              grandTotal={grandTotal}
              fabricMeters={fabricMeters}
              bgFabricMeters={bgFabricMeters}
              selectedKhamiyaName={selectedKhamiya?.name || "—"}
              selectedSewingName={selectedSewing?.name || "—"}
              selectedAqiqName={selectedAqiq?.name || "—"}
              hasBackground={hasBackground}
              selectedBgName={selectedBackground?.name || "—"}
              onEditItem={handleCostEdit}
              editReasons={costEditReasons}
            />
          </div>
        </div>
      </div>

      {/* Inline Edit Modal */}
      <InlineEditModal
        open={inlineEditOpen}
        title={inlineEditTitle}
        initialValue={inlineEditValue}
        showReason={inlineEditShowReason}
        onSave={(val, reason) => inlineEditCallback(val, reason)}
        onCancel={() => setInlineEditOpen(false)}
      />

      {/* Manager Gate Modal */}
      <ManagerGate
        open={gateOpen}
        title={gateTitle}
        onSuccess={
          pendingTotalOverride ? applyTotalOverride : handleGateSuccess
        }
        onCancel={() => {
          setGateOpen(false);
          setPendingOverride(null);
          setPendingTotalOverride(false);
        }}
      />
    </div>
  );
}