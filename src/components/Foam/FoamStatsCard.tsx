"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { FoamOrder } from "@/types/foam-types";

interface FoamOrderWithProduct extends FoamOrder {
  foam_products?: { name: string } | null;
}

function getDaysLeft(deliveryDate: string | null | undefined): number {
  if (!deliveryDate) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(deliveryDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function FoamStatsCard() {
  const [foamOrders, setFoamOrders] = useState<FoamOrderWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("foam_orders")
        .select("*, foam_products(name)")
        .order("created_at", { ascending: false })
        .limit(100);
      setFoamOrders(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const totalSales = foamOrders.reduce((s, o) => s + (o.final_price || 0), 0);
    const pending = foamOrders.filter((o) => o.status === "pending").length;
    const inProduction = foamOrders.filter((o) => o.status === "in_production").length;
    const ready = foamOrders.filter((o) => o.status === "ready").length;
    const delivered = foamOrders.filter((o) => o.status === "delivered").length;
    const urgent = foamOrders.filter((o) => {
      const days = getDaysLeft(o.delivery_date);
      return o.status !== "delivered" && o.status !== "ready" && days <= 3 && days >= 0;
    });
    return { totalSales, pending, inProduction, ready, delivered, urgent };
  }, [foamOrders]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC] animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E4DC]">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-[#1B5E3B] flex items-center gap-2">
          <span>🧽</span> إحصائيات البونج
        </h3>
        <Link href="/admin/foam-orders" className="text-xs font-bold text-[#1B5E3B] hover:text-[#C9A84C] transition">
          عرض الكل ←
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <div className="bg-[#E8F5E9] rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">المبيعات</p>
          <p className="text-lg font-black text-[#1B5E3B]">{Math.round(stats.totalSales).toLocaleString()} DH</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">معلقة</p>
          <p className="text-lg font-black text-amber-700">{stats.pending}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">قيد الإنتاج</p>
          <p className="text-lg font-black text-blue-700">{stats.inProduction}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">جاهزة</p>
          <p className="text-lg font-black text-green-700">{stats.ready}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">مُسلّمة</p>
          <p className="text-lg font-black text-gray-700">{stats.delivered}</p>
        </div>
      </div>

      {stats.urgent.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-xs font-bold text-red-700 mb-2">⚠️ {stats.urgent.length} طلب بونج يحتاج متابعة عاجلة (≤ 3 أيام)</p>
          <div className="space-y-1">
            {stats.urgent.slice(0, 3).map((o) => (
              <div key={o.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                <span className="text-xs text-gray-700">{o.customer_name} — {o.foam_products?.name || "—"}</span>
                <span className="text-xs font-bold text-red-600">{getDaysLeft(o.delivery_date)} يوم</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}