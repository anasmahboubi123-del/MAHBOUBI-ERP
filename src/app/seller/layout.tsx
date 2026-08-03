"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrderProvider, useOrder } from "@/features/order-center/context/OrderContext";
import { ShoppingCart, ClipboardList, Package, Home, Store } from "lucide-react";

const C = { green: "#1B5E38", gold: "#C9A84C", dark: "#0D1F17", cream: "#FAFAF8" };

function SellerLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { itemCount } = useOrder();

  const nav = [
    { href: "/seller", label: "الرئيسية", icon: Home },
    { href: "/seller/order-center", label: "السلة", icon: ShoppingCart, badge: itemCount },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.cream }}>
      {/* ── Top Navigation ── */}
      <header className="sticky top-0 z-40 border-b shadow-sm" style={{ background: C.dark, borderColor: C.gold + "30" }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/seller" className="flex items-center gap-2">
            <Store className="w-6 h-6" style={{ color: C.gold }} />
            <span className="text-white font-bold text-lg hidden sm:block">المحبوبي</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {nav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition ${
                    isActive ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                  style={isActive ? { background: C.green } : undefined}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                  {item.badge ? (
                    <span className="absolute -top-1 -left-1 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold text-white bg-red-500">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrderProvider>
      <SellerLayoutInner>{children}</SellerLayoutInner>
    </OrderProvider>
  );
}