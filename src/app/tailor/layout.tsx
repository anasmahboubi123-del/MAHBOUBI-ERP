'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PinLock from '@/components/ui/PinLock'

function setTailorCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'auth_tailor=1; path=/; max-age=28800; SameSite=Lax'
  }
}

export default function TailorLayout({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const isAuth = sessionStorage.getItem('auth_tailor') === '1'
    if (isAuth) setTailorCookie() // ← أضف الكوكي عند استعادة الجلسة
    setOk(isAuth)
    setReady(true)
  }, [])

  if (!ready) return null
  if (!ok)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PinLock role="tailor" onSuccess={() => { setTailorCookie(); setOk(true); }} />
      </div>
    )

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-40 flex items-center gap-3 bg-white px-4 py-3 shadow">
        <Link href="/" className="text-xl">🏠</Link>
        <Link href="/tailor" className="font-bold text-brand-700">🧵 واجهة الخياط</Link>
      </nav>
      <div className="mx-auto max-w-5xl p-4">{children}</div>
    </div>
  )
}