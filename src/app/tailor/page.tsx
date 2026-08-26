"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getTailors } from "@/lib/supabase-tailors";
import { useTailorAuth } from "@/hooks/useTailorAuth";
import { Scissors, LogIn } from "lucide-react";

export default function TailorLoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useTailorAuth(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) return;
    setLoading(true);
    setError("");

    try {
      const tailors = await getTailors();
      const tailor = tailors.find((t) => t.pin_code === pin && t.is_active);
      if (!tailor) {
        setError("كود PIN غير صحيح أو الخياط غير نشط");
        setLoading(false);
        return;
      }
      login(tailor.id, tailor.full_name, pin);
      router.push("/tailor/dashboard");
    } catch (err) {
      setError("حدث خطأ في الاتصال بقاعدة البيانات");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-[#E5E7EB]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1B5E38] rounded-2xl mx-auto flex items-center justify-center mb-4">
            <Scissors size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">تسجيل دخول الخياط</h1>
          <p className="text-sm text-[#6B7280] mt-2">أدخل كود PIN المكون من 4 أرقام</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="w-full text-center text-3xl tracking-[1em] py-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAF8] text-[#1A1A1A] focus:ring-2 focus:ring-[#1B5E38] outline-none transition-all"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm text-center py-2 px-4 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || pin.length !== 4}
            className="w-full py-3.5 bg-[#1B5E38] text-white rounded-xl font-bold hover:bg-[#2D7A4E] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">جاري التحقق...</span>
            ) : (
              <>
                <LogIn size={18} />
                دخول
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-[#9CA3AF]">
            الجلسة تستمر لمدة 8 ساعات
          </p>
        </div>
      </div>
    </div>
  );
}