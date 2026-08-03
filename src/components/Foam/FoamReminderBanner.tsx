"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { FoamOrder } from "@/types/foam-types";

interface FoamOrderWithProduct extends FoamOrder {
  foam_products?: { name: string } | null;
  suppliers?: { name: string } | null;
}

function getDaysLeft(d: string | null | undefined): number {
  if (!d) return 999;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  return Math.ceil((x.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
}

export default function FoamReminderBanner() {
  const [foamOrders, setFoamOrders] = useState<FoamOrderWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("foam_orders")
        .select("*, foam_products(name), suppliers(name)")
        .order("delivery_date", { ascending: true })
        .limit(50);
      setFoamOrders(data || []);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("foam_reminders")
      .on("postgres_changes", { event: "*", schema: "public", table: "foam_orders" }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const reminders = useMemo(() => {
    return foamOrders.filter((o) => {
      const days = getDaysLeft(o.delivery_date);
      return o.status !== "delivered" && o.status !== "ready" && days <= 3 && days >= 0;
    });
  }, [foamOrders]);

  if (loading || reminders.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🧽</span>
        <h3 className="text-sm font-bold text-orange-800">تذكيرات البونج — متابعة عاجلة ({reminders.length})</h3>
      </div>
      <div className="space-y-2">
        {reminders.map((o) => {
          const days = getDaysLeft(o.delivery_date);
          return (
            <div key={o.id} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1B5E3B] truncate">{o.customer_name} — FOAM-{o.order_number}</p>
                <p className="text-xs text-gray-500">{o.foam_products?.name || "—"} | المورد: {o.suppliers?.name || "—"} | تسليم: {o.delivery_date}</p>
              </div>
              <div className="flex items-center gap-3 mr-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${days <= 1 ? "bg-red-100 text-red-700" : days <= 2 ? "bg-amber-100 text-amber-700" : "bg-orange-100 text-orange-700"}`}>
                  {days === 0 ? "اليوم!" : `${days} أيام`}
                </span>
                <Link href={`/admin/foam-orders/${o.id}`} className="px-3 py-1.5 bg-[#1B5E3B] text-white rounded-lg text-xs font-bold hover:bg-[#C9A84C] transition">فتح</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}