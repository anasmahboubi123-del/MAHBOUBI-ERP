"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Plus, Trash2, Edit3, X, Check, Loader2, Ruler, DollarSign,
  CornerDownRight, ChevronDown, ChevronUp, Package,
} from "lucide-react";
import Image from "next/image";

/* ─── Types ─── */
type FieldType = "text" | "number" | "select" | "image" | "boolean";

interface FieldDef {
  key: string;
  label: string;
  type?: FieldType;
  options?: string[];
}

interface CatalogueTab {
  key: string;
  label: string;
  table: string;
  bucket: string;
  fields: FieldDef[];
  fetcher: () => Promise<any[]>;
  isFoam?: boolean; // ← خاص بالبونج
}

/* ─── Fetchers ─── */
async function fetchFabrics() {
  const { data, error } = await supabase.from("fabrics").select("*").order("name");
  if (error) throw error;
  return (data || []).map((row) => ({ ...row, image_url: row.image_url || null }));
}

async function fetchTapis() {
  const { data, error } = await supabase.from("tapis").select("*").order("name");
  if (error) throw error;
  return (data || []).map((row) => ({ ...row, image_url: row.image_url || null }));
}

async function fetchBois() {
  const { data, error } = await supabase.from("bois").select("*").order("name");
  if (error) throw error;
  return (data || []).map((row) => ({ ...row, image_url: row.image_url || null }));
}

async function fetchAccessories() {
  const { data, error } = await supabase.from("accessories").select("*").order("name");
  if (error) throw error;
  return (data || []).map((row) => ({ ...row, image_url: row.image_url || null }));
}

async function fetchAqiqShapes() {
  const { data, error } = await supabase.from("aqiq_shapes").select("*").order("name");
  if (error) throw error;
  return (data || []).map((row) => ({ ...row, image_url: row.image_url || null }));
}

async function fetchRembourrage() {
  const { data, error } = await supabase.from("rembourrage").select("*").order("name");
  if (error) throw error;
  return data || [];
}

// ✅ البونج: جلب المنتجات + الارتفاعات
async function fetchFoamProducts() {
  const { data: products, error } = await supabase
    .from("foam_products")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;

  const result = [];
  for (const product of products || []) {
    const { data: heights } = await supabase
      .from("foam_product_heights")
      .select("*")
      .eq("product_id", product.id)
      .eq("is_active", true)
      .order("height_cm");
    result.push({ ...product, heights: heights || [] });
  }
  return result;
}

async function fetchSeddariStitches() {
  const { data, error } = await supabase
    .from("stitch_styles")
    .select("*")
    .eq("target", "seddari")
    .order("name");
  if (error) throw error;
  return (data || []).map((row) => ({ ...row, image_url: row.image_url || null }));
}

async function fetchCushionStitches() {
  const { data, error } = await supabase
    .from("stitch_styles")
    .select("*")
    .eq("target", "cushion")
    .order("name");
  if (error) throw error;
  return (data || []).map((row) => ({ ...row, image_url: row.image_url || null }));
}

async function fetchDecorStitches() {
  const { data, error } = await supabase
    .from("stitch_styles")
    .select("*")
    .eq("target", "decor")
    .order("name");
  if (error) throw error;
  return (data || []).map((row) => ({ ...row, image_url: row.image_url || null }));
}

async function fetchDecorShapes() {
  const { data, error } = await supabase
    .from("decor_cushion_shapes")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data || []).map((row) => ({ ...row, image_url: row.image_url || null }));
}

async function fetchRomaniModels() {
  const { data, error } = await supabase.from("romani_models").select("*").order("name");
  if (error) throw error;
  return (data || []).map((row) => ({ ...row, image_url: row.image_url || null }));
}

async function fetchRomaniColors() {
  const { data, error } = await supabase.from("romani_colors").select("*").order("name");
  if (error) throw error;
  return (data || []).map((row) => ({ ...row, image_url: row.image_url || null }));
}

async function fetchKhamiya() {
  const { data, error } = await supabase.from("khamiya").select("*").order("name");
  if (error) throw error;
  return (data || []).map((row) => ({ ...row, image_url: row.image_url || null }));
}

const HEIGHTS = [30, 50, 70];

const tabs: CatalogueTab[] = [
  {
    key: "fabrics",
    label: "🧵 الأقمشة",
    table: "fabrics",
    bucket: "catalogue",
    fields: [
      { key: "image_url", label: "الصورة", type: "image" },
      { key: "name", label: "الاسم" },
      { key: "color", label: "اللون" },
      { key: "price_per_meter", label: "السعر/متر", type: "number" },
      { key: "active", label: "نشط", type: "boolean" },
    ],
    fetcher: fetchFabrics,
  },
  {
    key: "tapis",
    label: "🧶 الزرابي",
    table: "tapis",
    bucket: "catalogue",
    fields: [
      { key: "image_url", label: "الصورة", type: "image" },
      { key: "name", label: "الاسم" },
      { key: "description", label: "الوصف" },
      { key: "price_per_m2", label: "السعر/م²", type: "number" },
      { key: "stock_m2", label: "المخزون (م²)", type: "number" },
      { key: "is_active", label: "نشط", type: "boolean" },
    ],
    fetcher: fetchTapis,
  },
  {
    key: "bois",
    label: "🪵 الخشب",
    table: "bois",
    bucket: "catalogue",
    fields: [
      { key: "image_url", label: "الصورة", type: "image" },
      { key: "name", label: "الاسم" },
      { key: "wood_type", label: "نوع الخشب", type: "select", options: ["solid", "mdf", "plywood", "particle"] },
      { key: "price", label: "السعر", type: "number" },
      { key: "cost_price", label: "التكلفة", type: "number" },
      { key: "stock", label: "المخزون", type: "number" },
      { key: "supplier", label: "المورد" },
    ],
    fetcher: fetchBois,
  },
  {
    key: "accessories",
    label: "🔩 الإكسسوارات",
    table: "accessories",
    bucket: "catalogue",
    fields: [
      { key: "image_url", label: "الصورة", type: "image" },
      { key: "name", label: "الاسم" },
      { key: "type", label: "النوع", type: "select", options: ["pied", "accoudoir", "mecanisme", "autre"] },
      { key: "price_per_unit", label: "السعر/وحدة", type: "number" },
      { key: "cost_per_unit", label: "التكلفة/وحدة", type: "number" },
      { key: "stock_units", label: "المخزون", type: "number" },
      { key: "min_stock_alert", label: "تنبيه الحد الأدنى", type: "number" },
      { key: "supplier", label: "المورد" },
    ],
    fetcher: fetchAccessories,
  },
  {
    key: "aqiq_shapes",
    label: "🔷 أشكال العقيق",
    table: "aqiq_shapes",
    bucket: "catalogue",
    fields: [
      { key: "image_url", label: "الصورة", type: "image" },
      { key: "name", label: "الاسم" },
      { key: "price_per_meter", label: "السعر/متر", type: "number" },
      { key: "active", label: "نشط", type: "boolean" },
    ],
    fetcher: fetchAqiqShapes,
  },
  {
    key: "rembourrage",
    label: "🪶 اللواط",
    table: "rembourrage",
    bucket: "catalogue",
    fields: [
      { key: "name", label: "الاسم" },
      { key: "type", label: "النوع", type: "select", options: ["normal", "silicone", "feather", "sponge"] },
      { key: "price_per_cushion", label: "السعر/مخدة", type: "number" },
      { key: "cost_per_cushion", label: "التكلفة/مخدة", type: "number" },
      { key: "stock", label: "المخزون", type: "number" },
    ],
    fetcher: fetchRembourrage,
  },
  // ✅ البونج — معالجة خاصة
  {
    key: "foam_products",
    label: "🧽 البونج",
    table: "foam_products",
    bucket: "catalogue",
    isFoam: true,
    fields: [
      { key: "image_url", label: "الصورة", type: "image" },
      { key: "name", label: "الاسم" },
      { key: "description", label: "الوصف" },
      { key: "default_width_cm", label: "العرض الافتراضي (سم)", type: "number" },
      { key: "is_active", label: "نشط", type: "boolean" },
    ],
    fetcher: fetchFoamProducts,
  },
  {
    key: "seddari_stitches",
    label: "✂️ خياطة السدادر",
    table: "stitch_styles",
    bucket: "catalogue",
    fields: [
      { key: "image_url", label: "الصورة", type: "image" },
      { key: "name", label: "اسم الشكل" },
      { key: "price", label: "السعر (DH)", type: "number" },
      { key: "description", label: "الوصف" },
      { key: "active", label: "نشط", type: "boolean" },
    ],
    fetcher: fetchSeddariStitches,
  },
  {
    key: "cushion_stitches",
    label: "🛏️ خياطة المخاد",
    table: "stitch_styles",
    bucket: "catalogue",
    fields: [
      { key: "image_url", label: "الصورة", type: "image" },
      { key: "name", label: "اسم الشكل" },
      { key: "price", label: "السعر (DH)", type: "number" },
      { key: "description", label: "الوصف" },
      { key: "active", label: "نشط", type: "boolean" },
    ],
    fetcher: fetchCushionStitches,
  },
  {
    key: "decor_stitches",
    label: "🌀 خياطة الكيدور",
    table: "stitch_styles",
    bucket: "catalogue",
    fields: [
      { key: "image_url", label: "الصورة", type: "image" },
      { key: "name", label: "اسم الشكل" },
      { key: "price", label: "السعر (DH)", type: "number" },
      { key: "description", label: "الوصف" },
      { key: "active", label: "نشط", type: "boolean" },
    ],
    fetcher: fetchDecorStitches,
  },
  {
    key: "decor_shapes",
    label: "🌀 أشكال الكيدور",
    table: "decor_cushion_shapes",
    bucket: "catalogue",
    fields: [
      { key: "image_url", label: "الصورة", type: "image" },
      { key: "name", label: "اسم الشكل" },
      { key: "active", label: "نشط", type: "boolean" },
    ],
    fetcher: fetchDecorShapes,
  },
  {
    key: "romani_models",
    label: "🛋️ أشكال الرومي",
    table: "romani_models",
    bucket: "catalogue",
    fields: [
      { key: "image_url", label: "الصورة", type: "image" },
      { key: "name", label: "اسم الشكل" },
      { key: "code", label: "الرمز" },
      { key: "price_per_meter", label: "السعر/متر", type: "number" },
      { key: "active", label: "نشط", type: "boolean" },
    ],
    fetcher: fetchRomaniModels,
  },
  {
    key: "romani_colors",
    label: "🎨 ألوان الرومي",
    table: "romani_colors",
    bucket: "catalogue",
    fields: [
      { key: "image_url", label: "الصورة", type: "image" },
      { key: "name", label: "اسم اللون" },
      { key: "active", label: "نشط", type: "boolean" },
    ],
    fetcher: fetchRomaniColors,
  },
  {
    key: "khamiya",
    label: "🏛️ الخامية",
    table: "khamiya",
    bucket: "catalogue",
    fields: [
      { key: "image_url", label: "الصورة", type: "image" },
      { key: "name", label: "الاسم" },
      { key: "quality", label: "الجودة", type: "select", options: ["standard", "premium", "luxury"] },
      { key: "price_per_m2", label: "السعر/م²", type: "number" },
      { key: "cost_per_m2", label: "التكلفة/م²", type: "number" },
      { key: "stock_m2", label: "المخزون (م²)", type: "number" },
      { key: "supplier", label: "المورد" },
      { key: "active", label: "نشط", type: "boolean" },
    ],
    fetcher: fetchKhamiya,
  },
];

/* ─── Helpers ─── */
function formatFieldValue(value: any, field: FieldDef): string {
  if (value === null || value === undefined) return "—";
  if (field.type === "number") {
    const n = Number(value);
    return isNaN(n) ? "—" : n.toLocaleString("fr-MA");
  }
  if (field.type === "boolean") {
    return value === true ? "✅ نعم" : "❌ لا";
  }
  return String(value);
}

/* ─── Components ─── */
function ImageCell({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
        لا صورة
      </div>
    );
  }
  return (
    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 relative">
      <Image
        src={url}
        alt={alt}
        fill
        className="object-cover"
        sizes="64px"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}

// ✅ مكون عرض أسعار البونج
function FoamPricesTable({ heights }: { heights: any[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-3 bg-[#F5F0E8] rounded-xl overflow-hidden border border-[#E8E4DC]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold text-[#1B5E3B] hover:bg-[#E8E4DC] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Ruler className="w-4 h-4" />
          الأسعار حسب الارتفاع ({heights.length} ارتفاع)
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="px-4 pb-3">
          <div className="grid grid-cols-4 gap-2 text-xs font-bold text-[#6B7B6E] mb-1 px-2">
            <span>الارتفاع</span>
            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3"/> سعر المتر</span>
            <span className="flex items-center gap-1"><CornerDownRight className="w-3 h-3"/> مربعة</span>
            <span className="flex items-center gap-1"><CornerDownRight className="w-3 h-3"/> مثلثة</span>
          </div>
          {heights.map((h: any) => (
            <div key={h.height_cm} className="grid grid-cols-4 gap-2 text-sm py-1.5 px-2 border-t border-[#E8E4DC]">
              <span className="font-bold text-[#C9A84C]">{h.height_cm} سم</span>
              <span>{h.price_per_meter} درهم</span>
              <span>{h.square_corner_price || 0} درهم</span>
              <span>{h.triangle_corner_price || 0} درهم</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function CataloguePage() {
  const [activeTab, setActiveTab] = useState<string>(tabs[0].key);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [foamHeights, setFoamHeights] = useState<Record<number, any>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentTab = tabs.find((t) => t.key === activeTab)!;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await currentTab.fetcher();
      setItems(data);
    } catch (err) {
      console.error("فشل تحميل الكتالوج:", err);
    } finally {
      setLoading(false);
    }
  }, [currentTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* Image Upload */
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${currentTab.bucket}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(currentTab.bucket)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(currentTab.bucket)
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, image_url: urlData.publicUrl }));
    } catch (err) {
      console.error("فشل رفع الصورة:", err);
      alert("فشل رفع الصورة");
    } finally {
      setUploadingImage(false);
    }
  };

  /* Save */
  const handleSave = async () => {
    setSaving(true);
    try {
      // ✅ إذا كان البونج — معالجة خاصة
      if (currentTab.isFoam) {
        await saveFoamProduct();
        return;
      }

      const payload: Record<string, any> = {};

      currentTab.fields.forEach((field) => {
        const val = formData[field.key];

        if (field.key === "image_url") {
          payload[field.key] = val || null;
        } else if (field.type === "number") {
          payload[field.key] = (val !== undefined && val !== "" && val !== null && !isNaN(Number(val)))
            ? Number(val)
            : null;
        } else if (field.type === "boolean") {
          payload[field.key] = val === true || val === "true";
        } else {
          payload[field.key] = val !== undefined && val !== "" ? val : null;
        }
      });

      if (currentTab.table === "stitch_styles" && !editingId) {
        if (currentTab.key === "seddari_stitches") payload.target = "seddari";
        else if (currentTab.key === "cushion_stitches") payload.target = "cushion";
        else if (currentTab.key === "decor_stitches") payload.target = "decor";
      }

      if (!editingId) {
        payload.created_at = new Date().toISOString();
      }

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key];
      });

      console.log("Payload:", payload);

      if (editingId) {
        const { error } = await supabase
          .from(currentTab.table)
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(currentTab.table).insert(payload);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({});
      loadData();
    } catch (err: any) {
      console.error("فشل الحفظ:", err);
      alert(err?.message || err?.error?.message || "فشل الحفظ، تحقق من البيانات");
    } finally {
      setSaving(false);
    }
  };

  // ✅ حفظ منتج البونج (منتج + 3 ارتفاعات)
  const saveFoamProduct = async () => {
    try {
      const productPayload = {
        name: formData.name?.trim() || null,
        description: formData.description?.trim() || null,
        image_url: formData.image_url || null,
        default_width_cm: Number(formData.default_width_cm) || 70,
        is_active: formData.is_active === true || formData.is_active === "true",
      };

      let productId = editingId;

      if (editingId) {
        const { error } = await supabase
          .from("foam_products")
          .update(productPayload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("foam_products")
          .insert(productPayload)
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
      }

      // حفظ الارتفاعات
      for (const h of HEIGHTS) {
        const heightData = foamHeights[h] || {};
        const heightPayload = {
          product_id: productId,
          height_cm: h,
          price_per_meter: Number(heightData.price_per_meter) || 0,
          square_corner_price: Number(heightData.square_corner_price) || 0,
          triangle_corner_price: Number(heightData.triangle_corner_price) || 0,
          is_active: true,
        };

        // التحقق من وجود السجل
        const { data: existing } = await supabase
          .from("foam_product_heights")
          .select("id")
          .eq("product_id", productId)
          .eq("height_cm", h)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("foam_product_heights")
            .update(heightPayload)
            .eq("id", existing.id);
        } else {
          await supabase.from("foam_product_heights").insert(heightPayload);
        }
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({});
      setFoamHeights({});
      loadData();
    } catch (err: any) {
      console.error("فشل حفظ البونج:", err);
      alert(err?.message || "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  /* Delete */
  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    try {
      // ✅ إذا كان البونج — احذف الارتفاعات أيضاً
      if (currentTab.isFoam) {
        await supabase.from("foam_product_heights").delete().eq("product_id", id);
      }
      const { error } = await supabase.from(currentTab.table).delete().eq("id", id);
      if (error) throw error;
      loadData();
    } catch (err) {
      console.error("فشل الحذف:", err);
      alert("فشل الحذف");
    }
  };

  /* Filter */
  const filtered = items.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return currentTab.fields.some((field) => {
      const val = item[field.key];
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(q);
    });
  });

  /* Open Edit Form */
  const openEdit = (item: any) => {
    setEditingId(item.id);
    const initial: Record<string, any> = {};
    currentTab.fields.forEach((field) => {
      initial[field.key] = item[field.key] ?? "";
    });
    setFormData(initial);

    // ✅ إذا كان البونج — حمّل الارتفاعات
    if (currentTab.isFoam && item.heights) {
      const heightsMap: Record<number, any> = {};
      item.heights.forEach((h: any) => {
        heightsMap[h.height_cm] = {
          price_per_meter: String(h.price_per_meter ?? ""),
          square_corner_price: String(h.square_corner_price ?? ""),
          triangle_corner_price: String(h.triangle_corner_price ?? ""),
        };
      });
      setFoamHeights(heightsMap);
    }

    setShowForm(true);
  };

  /* Open Add Form */
  const openAdd = () => {
    setEditingId(null);
    const initial: Record<string, any> = {};
    currentTab.fields.forEach((field) => {
      if (field.type === "number") initial[field.key] = 0;
      else if (field.type === "boolean") initial[field.key] = false;
      else initial[field.key] = "";
    });
    setFormData(initial);

    // ✅ إعداد الارتفاعات الافتراضية للبونج
    if (currentTab.isFoam) {
      const defaultHeights: Record<number, any> = {};
      HEIGHTS.forEach((h) => {
        defaultHeights[h] = {
          price_per_meter: "",
          square_corner_price: "",
          triangle_corner_price: "",
        };
      });
      setFoamHeights(defaultHeights);
    } else {
      setFoamHeights({});
    }

    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-[#F0EDE8]" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E4DC] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1B5E3B] rounded-xl flex items-center justify-center text-white text-lg">
                📚
              </div>
              <h1 className="text-xl font-bold text-[#1B5E3B]">إدارة الكتالوج</h1>
            </div>
            <Link
              href="/admin"
              className="text-sm text-[#6B7B6E] hover:text-[#1B5E3B] transition"
            >
              ← رجوع للوحة
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSearch("");
                  setShowForm(false);
                }}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-[#1B5E3B] text-white shadow-md"
                    : "bg-white text-[#6B7B6E] border border-[#E8E4DC] hover:bg-[#F5F0E8]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="🔍 البحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-[#E8E4DC] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C9A84C] placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={openAdd}
            className="px-6 py-3 bg-[#1B5E3B] text-white rounded-xl text-sm font-bold hover:bg-[#14502d] transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            إضافة جديد
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#1B5E3B] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-4">📭</p>
            <p>لا توجد عناصر في هذا القسم</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E4DC] hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  {currentTab.fields.some((f) => f.key === "image_url") && (
                    <ImageCell
                      url={item.image_url}
                      alt={item.name || "صورة"}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#1B5E3B] text-lg mb-2 truncate">
                      {item.name || "—"}
                    </h3>
                    <div className="space-y-1.5">
                      {currentTab.fields
                        .filter((f) => f.key !== "image_url" && f.key !== "name")
                        .map((field) => (
                          <div key={field.key} className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">{field.label}</span>
                            <span className="font-medium text-gray-800">
                              {formatFieldValue(item[field.key], field)}
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* ✅ عرض أسعار البونج */}
                    {currentTab.isFoam && item.heights && item.heights.length > 0 && (
                      <FoamPricesTable heights={item.heights} />
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-[#E8E4DC]">
                  <button
                    onClick={() => openEdit(item)}
                    className="flex-1 py-2 bg-[#F5F0E8] text-[#1B5E3B] rounded-xl text-xs font-bold hover:bg-[#E8E4DC] transition flex items-center justify-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 transition flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`bg-white rounded-2xl w-full shadow-2xl border border-[#E8E4DC] max-h-[90vh] overflow-y-auto ${
            currentTab.isFoam ? 'max-w-2xl' : 'max-w-lg'
          }`}>
            <div className="sticky top-0 bg-white border-b border-[#E8E4DC] p-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-[#1B5E3B]">
                {editingId ? "✏️ تعديل" : "➕ إضافة جديد"}
                {currentTab.isFoam && " — بونج"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({});
                  setFoamHeights({});
                }}
                className="w-10 h-10 bg-[#F5F0E8] rounded-xl flex items-center justify-center text-gray-500 hover:bg-[#E8E4DC] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* ✅ حقول البونج + الارتفاعات */}
              {currentTab.isFoam ? (
                <FoamFormFields
                  formData={formData}
                  setFormData={setFormData}
                  foamHeights={foamHeights}
                  setFoamHeights={setFoamHeights}
                  uploadingImage={uploadingImage}
                  handleImageUpload={handleImageUpload}
                  currentTab={currentTab}
                />
              ) : (
                /* الحقول العادية */
                currentTab.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {field.label}
                    </label>

                    {field.type === "image" ? (
                      <div className="space-y-2">
                        {formData[field.key] && (
                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 relative">
                            <Image
                              src={formData[field.key]}
                              alt="معاينة"
                              fill
                              className="object-cover"
                              sizes="96px"
                            />
                          </div>
                        )}
                        <label className="flex items-center justify-center w-full px-4 py-3 bg-[#F5F0E8] border-2 border-dashed border-[#E8E4DC] rounded-xl cursor-pointer hover:bg-[#E8E4DC] transition">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file);
                            }}
                          />
                          {uploadingImage ? (
                            <Loader2 className="w-5 h-5 text-[#1B5E3B] animate-spin" />
                          ) : (
                            <span className="text-sm text-[#6B7B6E] font-medium">
                              📷 اختر صورة
                            </span>
                          )}
                        </label>
                      </div>
                    ) : field.type === "select" ? (
                      <select
                        value={String(formData[field.key] ?? "")}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 bg-[#F5F0E8] border border-[#E8E4DC] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C9A84C]"
                      >
                        <option value="">— اختر —</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "boolean" ? (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData[field.key] === true || formData[field.key] === "true"}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [field.key]: e.target.checked,
                            }))
                          }
                          className="w-5 h-5 accent-[#1B5E3B] rounded"
                        />
                        <span className="text-sm text-gray-600">
                          {formData[field.key] === true || formData[field.key] === "true" ? "✅ نعم" : "❌ لا"}
                        </span>
                      </label>
                    ) : field.type === "number" ? (
                      <input
                        type="number"
                        step="0.01"
                        value={formData[field.key] ?? ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 bg-[#F5F0E8] border border-[#E8E4DC] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C9A84C]"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData[field.key] ?? ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 bg-[#F5F0E8] border border-[#E8E4DC] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C9A84C]"
                      />
                    )}
                  </div>
                ))
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({});
                    setFoamHeights({});
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-[#1B5E3B] text-white rounded-xl text-sm font-bold hover:bg-[#14502d] transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editingId ? "تحديث" : "إضافة"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ مكون حقول البونج (منتج + جدول 3 ارتفاعات)
function FoamFormFields({
  formData,
  setFormData,
  foamHeights,
  setFoamHeights,
  uploadingImage,
  handleImageUpload,
  currentTab,
}: {
  formData: Record<string, any>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  foamHeights: Record<number, any>;
  setFoamHeights: React.Dispatch<React.SetStateAction<Record<number, any>>>;
  uploadingImage: boolean;
  handleImageUpload: (file: File) => void;
  currentTab: CatalogueTab;
}) {
  const updateHeight = (heightCm: number, field: string, value: string) => {
    setFoamHeights((prev) => ({
      ...prev,
      [heightCm]: {
        ...prev[heightCm],
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">الصورة</label>
          <div className="space-y-2">
            {formData.image_url && (
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 relative">
                <Image
                  src={formData.image_url}
                  alt="معاينة"
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            )}
            <label className="flex items-center justify-center w-full px-4 py-3 bg-[#F5F0E8] border-2 border-dashed border-[#E8E4DC] rounded-xl cursor-pointer hover:bg-[#E8E4DC] transition">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
              {uploadingImage ? (
                <Loader2 className="w-5 h-5 text-[#1B5E3B] animate-spin" />
              ) : (
                <span className="text-sm text-[#6B7B6E] font-medium">📷 اختر صورة</span>
              )}
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المنتج *</label>
          <input
            type="text"
            value={formData.name ?? ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="مثال: بونج عادي"
            className="w-full px-4 py-2.5 bg-[#F5F0E8] border border-[#E8E4DC] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C9A84C]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">العرض الافتراضي (سم)</label>
          <input
            type="number"
            value={formData.default_width_cm ?? 70}
            onChange={(e) => setFormData((prev) => ({ ...prev, default_width_cm: e.target.value }))}
            className="w-full px-4 py-2.5 bg-[#F5F0E8] border border-[#E8E4DC] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C9A84C]"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">الوصف</label>
          <input
            type="text"
            value={formData.description ?? ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="وصف مختصر..."
            className="w-full px-4 py-2.5 bg-[#F5F0E8] border border-[#E8E4DC] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C9A84C]"
          />
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active === true || formData.is_active === "true"}
              onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
              className="w-5 h-5 accent-[#1B5E3B] rounded"
            />
            <span className="text-sm text-gray-600">منتج نشط</span>
          </label>
        </div>
      </div>

      {/* Prices Table */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-[#1B5E3B] flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          الأسعار حسب الارتفاع
        </h3>

        <div className="bg-[#F5F0E8] rounded-xl border border-[#E8E4DC] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-4 gap-3 p-3 bg-[#1B5E3B]/10 text-xs font-bold text-[#1B5E3B]">
            <div className="flex items-center gap-1"><Ruler className="w-3 h-3"/> الارتفاع</div>
            <div className="flex items-center gap-1"><DollarSign className="w-3 h-3"/> سعر المتر</div>
            <div className="flex items-center gap-1"><CornerDownRight className="w-3 h-3"/> فورمجة مربعة</div>
            <div className="flex items-center gap-1"><CornerDownRight className="w-3 h-3"/> فورمجة مثلثة</div>
          </div>

          {/* Rows */}
          {HEIGHTS.map((h) => (
            <div key={h} className="grid grid-cols-4 gap-3 p-3 border-t border-[#E8E4DC] items-center">
              <div className="font-bold text-[#C9A84C] text-lg">{h} سم</div>
              <input
                type="number"
                step="0.01"
                value={foamHeights[h]?.price_per_meter ?? ""}
                onChange={(e) => updateHeight(h, "price_per_meter", e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-white border border-[#E8E4DC] rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C9A84C] text-center"
              />
              <input
                type="number"
                step="0.01"
                value={foamHeights[h]?.square_corner_price ?? ""}
                onChange={(e) => updateHeight(h, "square_corner_price", e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-white border border-[#E8E4DC] rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C9A84C] text-center"
              />
              <input
                type="number"
                step="0.01"
                value={foamHeights[h]?.triangle_corner_price ?? ""}
                onChange={(e) => updateHeight(h, "triangle_corner_price", e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-white border border-[#E8E4DC] rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C9A84C] text-center"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}