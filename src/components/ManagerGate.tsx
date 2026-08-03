'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { siteAssets } from '@/lib/site-assets';

const SESSION_KEY = 'admin_auth_session';
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 دقيقة

/* ─── Export helper for logout (قبل الكومبوننت) ─── */
export function clearAdminSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

/* ─── Ripple Button ─── */
function KeyButton({
  label,
  onClick,
  children,
}: {
  label?: string;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
    onClick();
  };

  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.06 }}
      onClick={handleClick}
      className="relative aspect-square w-full rounded-full bg-white/15 border border-white/25 text-white text-2xl font-bold flex items-center justify-center shadow-lg overflow-hidden transition-colors hover:bg-white/25 active:bg-white/30 backdrop-blur-sm"
    >
      {children || label}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full bg-white/30 animate-ping pointer-events-none"
          style={{
            left: r.x,
            top: r.y,
            width: 10,
            height: 10,
            transform: 'translate(-50%, -50%)',
            animationDuration: '0.6s',
          }}
        />
      ))}
    </motion.button>
  );
}

/* ─── Main Gate ─── */
export default function ManagerGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [logoUrl] = useState(() => siteAssets.getLogo());

  /* التحقق من الجلسة عند التحميل */
  useEffect(() => {
    if (typeof window === 'undefined') {
      setChecking(false);
      return;
    }

    const sessionRaw = sessionStorage.getItem(SESSION_KEY);
    if (sessionRaw) {
      try {
        const { timestamp } = JSON.parse(sessionRaw);
        if (Date.now() - timestamp < SESSION_DURATION_MS) {
          setIsAuthenticated(true);
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
    setChecking(false);

    // تحميل الخلفية ديناميكياً من Supabase
    siteAssets.getAdminBackground().then((url) => {
      if (url) {
        siteAssets.preloadImage(url).catch(() => {});
        setBgUrl(url);
      }
    });
  }, []);

  /* التحقق من PIN عبر Supabase */
  const verifyPin = useCallback(async () => {
    if (pin.length !== 4) return;

    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'pin_admin')
        .single();

      if (error) throw error;

      const adminPin = String(data?.value ?? '9999').replace(/^"|"$/g, '').trim();

      if (pin === adminPin) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ timestamp: Date.now() }));
        setIsAuthenticated(true);
        setErrorMsg('');
      } else {
        setShake(true);
        setErrorMsg('رمز المدير غير صحيح');
        setPin('');
        setTimeout(() => setShake(false), 500);
      }
    } catch {
      setShake(true);
      setErrorMsg('خطأ في الاتصال بقاعدة البيانات');
      setPin('');
      setTimeout(() => setShake(false), 500);
    }
  }, [pin]);

  /* عند اكتمال 4 أرقام — تحقق تلقائي */
  useEffect(() => {
    if (pin.length === 4) {
      verifyPin();
    }
  }, [pin, verifyPin]);

  const handleKey = useCallback(
    (key: string) => {
      setErrorMsg('');
      if (key === 'clear') {
        setPin('');
      } else if (key === 'backspace') {
        setPin((p) => p.slice(0, -1));
      } else if (pin.length < 4) {
        setPin((p) => p + key);
      }
    },
    [pin.length]
  );

  /* لوحة المفاتيح الرقمية */
  const keys = [
    { k: '1' }, { k: '2' }, { k: '3' },
    { k: '4' }, { k: '5' }, { k: '6' },
    { k: '7' }, { k: '8' }, { k: '9' },
    { k: 'clear', icon: 'مسح' }, { k: '0' }, { k: 'backspace', icon: '⌫' },
  ];

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1F17]">
        <div className="text-[#C9A84C] font-bold animate-pulse">جاري التحقق...</div>
      </div>
    );
  }

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" dir="rtl">
      {/* ── Background ── */}
      <AnimatePresence>
        {bgUrl ? (
          <motion.div
            key="bg-img"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bgUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute inset-0 backdrop-blur-[6px]" />
          </motion.div>
        ) : (
          <motion.div
            key="bg-gradient"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-br from-[#4A6741] via-[#2D4A3E] to-[#0D1F17]"
          />
        )}
      </AnimatePresence>

      {/* ── Glass Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        <div className="bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-white/20 p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-20 h-20 mb-3 relative"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="El Mahboubi"
                className="w-full h-full object-contain drop-shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </motion.div>
            <h2 className="text-[#C9A84C] text-xs tracking-[0.25em] font-bold text-center">
              AMEUBLEMENT ET DÉCO
            </h2>
            <h1 className="text-white text-xl font-bold mt-1 tracking-wide">EL MAHBOUBI</h1>
          </div>

          <p className="text-white/90 text-center text-lg font-semibold mb-1">مرحبًا بك</p>
          <p className="text-white/50 text-center text-sm mb-8">أدخل رمز المدير</p>

          {/* PIN Dots */}
          <motion.div
            animate={shake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex justify-center gap-4 mb-6"
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  i < pin.length
                    ? 'bg-[#C9A84C] border-[#C9A84C] shadow-[0_0_10px_rgba(201,168,76,0.5)]'
                    : 'border-white/30 bg-transparent'
                }`}
              />
            ))}
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {errorMsg && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-300 text-xs text-center mb-4 font-bold"
              >
                {errorMsg}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {keys.map((item, idx) => (
              <motion.div
                key={item.k}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.04 }}
              >
                <KeyButton
                  label={item.icon || item.k}
                  onClick={() => handleKey(item.k)}
                >
                  {item.icon ? (
                    <span className="text-sm font-bold">{item.icon}</span>
                  ) : (
                    item.k
                  )}
                </KeyButton>
              </motion.div>
            ))}
          </div>

          {/* Footer hint */}
          <p className="text-white/20 text-[10px] text-center mt-6">
            الجلسة تنتهي تلقائيًا بعد 30 دقيقة أو عند إغلاق التبويب
          </p>
        </div>
      </motion.div>
    </div>
  );
}