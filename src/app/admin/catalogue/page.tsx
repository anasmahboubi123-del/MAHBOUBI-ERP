"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Edit3, X, Check, Loader2, ChevronLeft } from "lucide-react";
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

// ─── Foam Products Fetcher
async function fetchFoamProducts() {
  const { data, error } = await supabase.from("foam_products").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data || []) as any[];
}

// ─── Aqiq Shape Fetcher
async function fetchAqiqShapesFn() {
  return fetchAqiqShapes();
}

const tabs: CatalogueTab[] = [
  {
    key: "fabrics",
    label: "🧵 الأقمشة",
    table: "fabrics",
    bucket: "catalogue",
    fields: [
      { key: "image_url", label: "الصورة", type: "image" },
      { key: "name", label: "الاسم" },
      { key: "type", label: "النوع", type: "select", options: ["velours", "cuir", "tissu", "autre"] },
      { key: "price_per_meter", label: "السعر/متر", type: "number" },
      { key: "cost_per_meter", label: "التكلفة/متر", type: "number" },
      { key: "stock_meters", label: "المخزون (متر)", type: "number" },
      { key: "min_stock_alert", label: "تنبيه الحد الأدنى", type: "number" },
      { key: "supplier", label: "المورد" },
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
      { key: "type", label: "النوع", type: "select", options: ["laine", "synthetique", "mixte", "autre"] },
      { key: "price_per_meter", label: "السعر/متر", type: "number" },
      { key: "cost_per_meter", label: "التكلفة/متر", type: "number" },
      { key: "stock_meters", label: "المخزون (متر)", type: "number" },
      { key: "min_stock_alert", label: "تنبيه الحد الأدنى", type: "number" },
      { key: "supplier", label: "المورد" },
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
      { key: "type", label: "النوع", type: "select", options: ["pin", "chene", "hetre", "autre"] },
      { key: "price_per_meter", label: "السعر/متر", type: "number" },
      { key: "cost_per_meter", label: "التكلفة/متر", type: "number" },
      { key: "stock_meters", label: "المخزون (متر)", type: "number" },
      { key: "min_stock_alert", label: "تنبيه الحد الأدنى", type: "number" },
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
      { key: "price", label: "السعر", type: "number" },
      { key: "cost", label: "التكلفة", type: "number" },
      { key: "stock", label: "المخزون", type: "number" },
      { key: "min_stock_alert", label: "تنبيه الحد الأدنى", type: "number" },
      { key: "supplier", label: "المورد" },
    ],
    fetcher: fetchAqiqShapesFn,
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
  {
    key: "foam_products",
    label: "🧽 البونج",
    table: "foam_products",
    bucket: "catalogue",
    fields: [
      { key: "image_url", label: "الصورة", type: "image" },
      { key: "name", label: "الاسم" },
      { key: "price_per_meter", label: "السعر/متر", type: "number" },
      { key: "formage_price_square", label: "فورمجة مربع", type: "number" },
      { key: "formage_price_triangle", label: "فورمجة مثلث", type: "number" },
      { key: "default_width_cm", label: "العرض الافتراضي (سم)", type: "number" },
      { key: "is_active", label: "نشط", type: "select", options: ["true", "false"] },
    ],
    fetcher: fetchFoamProducts,
  },
];

/* ─── Helpers ─── */
function formatFieldValue(value: any, field: FieldDef): string {
  if (value === null || value === undefined) return "—";
  if (field.type === "number") {
    const n = Number(value);
    return isNaN(n) ? "—" : n.toLocaleString("fr-MA");
  }
  if (field.type === "boolean" || field.type === "select") {
    if (value === true || value === "true") return "✅ نعم";
    if (value === false || value === "false") return "❌ لا";
    return String(value);
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

/* ─── Main Page ─── */
export default function CataloguePage() {
  const [activeTab, setActiveTab] = useState<string>(tabs[0].key);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
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
      const payload: Record<string, any> = {};
      currentTab.fields.forEach((field) => {
        if (field.key === "image_url") {
          payload[field.key] = formData[field.key] || null;
        } else if (field.type === "number") {
          payload[field.key] = formData[field.key] !== undefined ? Number(formData[field.key]) : null;
        } else if (field.type === "boolean") {
          payload[field.key] = formData[field.key] === true || formData[field.key] === "true";
        } else {
          payload[field.key] = formData[field.key] || null;
        }
      });

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
    } catch (err) {
      console.error("فشل الحفظ:", err);
      alert("فشل الحفظ، تحقق من البيانات");
    } finally {
      setSaving(false);
    }
  };

  /* Delete */
  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    try {
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
    setShowForm(true);
  };

  /* Open Add Form */
  const openAdd = () => {
    setEditingId(null);
    const initial: Record<string, any> = {};
    currentTab.fields.forEach((field) => {
      initial[field.key] = field.type === "number" ? 0 : field.type === "boolean" ? false : "";
    });
    setFormData(initial);
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
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[#E8E4DC] max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#E8E4DC] p-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-[#1B5E3B]">
                {editingId ? "✏️ تعديل" : "➕ إضافة جديد"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({});
                }}
                className="w-10 h-10 bg-[#F5F0E8] rounded-xl flex items-center justify-center text-gray-500 hover:bg-[#E8E4DC] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {currentTab.fields.map((field) => (
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
                          [field.key]:
                            field.options?.[0] === "true" || field.options?.[0] === "false"
                              ? e.target.value === "true"
                              : e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-[#F5F0E8] border border-[#E8E4DC] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C9A84C]"
                    >
                      <option value="">— اختر —</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt === "true"
                            ? "✅ نعم"
                            : opt === "false"
                            ? "❌ لا"
                            : opt}
                        </option>
                      ))}
                    </select>
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
              ))}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({});
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