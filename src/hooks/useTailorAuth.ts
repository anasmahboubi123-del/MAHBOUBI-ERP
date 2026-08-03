'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TailorSession {
  tailor_id: string;
  full_name: string;
  pin_code: string;
  timestamp: number;
}

const SESSION_KEY = 'tailor_session';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 ساعات

export function useTailorAuth(requireAuth = true) {
  const [session, setSession] = useState<TailorSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as TailorSession;
        const now = Date.now();
        if (now - parsed.timestamp < SESSION_DURATION) {
          setSession(parsed);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && requireAuth && !session) {
      router.push('/tailor');
    }
  }, [loading, session, requireAuth, router]);

  const login = (tailorId: string, fullName: string, pinCode: string) => {
    const s: TailorSession = {
      tailor_id: tailorId,
      full_name: fullName,
      pin_code: pinCode,
      timestamp: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    router.push('/tailor');
  };

  return { session, loading, login, logout };
}