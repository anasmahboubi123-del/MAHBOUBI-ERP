"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function BackButton() {
  return (
    <Link
      href="/seller"
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-amber-200 text-amber-800 hover:bg-amber-50 transition"
    >
      <ArrowRight className="w-4 h-4" />
      <span>الرئيسية</span>
    </Link>
  );
}