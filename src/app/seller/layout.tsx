"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrderProvider, useOrder } from "@/features/order-center/context/OrderContext";
import { ShoppingCart, ClipboardList, Package, Home, Store, Calculator, X } from "lucide-react";

const C = { green: "#1B5E38", gold: "#C9A84C", dark: "#0D1F17", cream: "#FAFAF8" };

function SellerLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const orderCtx = useOrder() as any;
  const itemCount = orderCtx.itemCount || orderCtx.orders?.length || 0;

  const [calcOpen, setCalcOpen] = useState(false);
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<string | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);

  const nav = [
    { href: "/seller", label: "الرئيسية", icon: Home },
    { href: "/seller/order-center", label: "السلة", icon: ShoppingCart, badge: itemCount },
  ];

  const handleNum = (n: string) => {
    if (fresh) {
      setDisplay(n);
      setFresh(false);
    } else {
      setDisplay((d) => (d === "0" ? n : d + n));
    }
  };

  const handleOp = (operation: string) => {
    setPrev(display);
    setOp(operation);
    setFresh(true);
  };

  const handleEq = () => {
    if (!prev || !op) return;
    const a = parseFloat(prev);
    const b = parseFloat(display);
    let res = 0;
    switch (op) {
      case "+": res = a + b; break;
      case "-": res = a - b; break;
      case "*": res = a * b; break;
      case "/": res = b !== 0 ? a / b : 0; break;
    }
    setDisplay(String(Number(res.toFixed(6))));
    setPrev(null);
    setOp(null);
    setFresh(true);
  };

  const clear = () => {
    setDisplay("0");
    setPrev(null);
    setOp(null);
    setFresh(true);
  };

  const calcBtn = (label: string, onClick: () => void, className = "") => (
    <button
      key={label}
      onClick={onClick}
      className={`h-12 rounded-lg text-lg font-bold transition active:scale-95 ${className}`}
    >
      {label}
    </button>
  );

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

            {/* ── Calculator Icon ── */}
            <button
              onClick={() => setCalcOpen((v) => !v)}
              className={`relative flex items-center justify-center p-2 rounded-lg transition ${
                calcOpen ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
              } ${calcOpen ? "scale-110" : "scale-100"}`}
              style={calcOpen ? { background: C.green } : undefined}
              title="الآلة الحاسبة"
            >
              <Calculator className="w-5 h-5" />
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* ── Calculator Drawer ── */}
      {calcOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-28">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCalcOpen(false)} />
          <div
            className="relative w-full max-w-xs p-4 rounded-2xl shadow-2xl border"
            style={{ background: C.dark, borderColor: C.gold + "40" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-bold text-sm" style={{ color: C.gold }}>آلة حاسبة</span>
              <button onClick={() => setCalcOpen(false)} className="text-gray-400 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Display */}
            <div
              className="mb-3 px-4 py-3 rounded-xl text-right text-2xl font-mono font-bold text-white overflow-hidden"
              style={{ background: C.green + "30", direction: "ltr" }}
            >
              {display}
            </div>

            {/* Keys */}
            <div className="grid grid-cols-4 gap-2">
              {calcBtn("C", clear, "col-span-2 bg-red-500/80 hover:bg-red-500 text-white")}
              {calcBtn("⌫", () => setDisplay((d) => d.length > 1 ? d.slice(0, -1) : "0"), "bg-gray-700 hover:bg-gray-600 text-white")}
              {calcBtn("÷", () => handleOp("/"), "bg-amber-600 hover:bg-amber-500 text-white")}

              {["7", "8", "9"].map((n) => calcBtn(n, () => handleNum(n), "bg-white/10 hover:bg-white/20 text-white"))}
              {calcBtn("×", () => handleOp("*"), "bg-amber-600 hover:bg-amber-500 text-white")}

              {["4", "5", "6"].map((n) => calcBtn(n, () => handleNum(n), "bg-white/10 hover:bg-white/20 text-white"))}
              {calcBtn("−", () => handleOp("-"), "bg-amber-600 hover:bg-amber-500 text-white")}

              {["1", "2", "3"].map((n) => calcBtn(n, () => handleNum(n), "bg-white/10 hover:bg-white/20 text-white"))}
              {calcBtn("+", () => handleOp("+"), "bg-amber-600 hover:bg-amber-500 text-white")}

              {calcBtn("0", () => handleNum("0"), "col-span-2 bg-white/10 hover:bg-white/20 text-white")}
              {calcBtn(".", () => handleNum("."), "bg-white/10 hover:bg-white/20 text-white")}
              {calcBtn("=", handleEq, "bg-green-600 hover:bg-green-500 text-white")}
            </div>
          </div>
        </div>
      )}
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