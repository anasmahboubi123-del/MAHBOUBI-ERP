'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { getSetting } from '@/lib/supabase'

const FALLBACK: Record<string, string> = { seller: '1111', tailor: '2222', admin: '9999' }
const LABELS: Record<string, string> = { seller: 'البائع', tailor: 'الخياط', admin: 'المدير' }

function setAuthCookie(role: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `auth_${role}=1; path=/; max-age=${8 * 60 * 60}; SameSite=Lax`
  }
}

export default function PinLock({
  role,
  onSuccess,
  onCancel
}: {
  role: 'seller' | 'tailor' | 'admin'
  onSuccess: () => void
  onCancel?: () => void
}) {
  const [pin, setPin] = useState('')
  const [checking, setChecking] = useState(false)

  async function submit(value: string) {
    setChecking(true)
    const rawExpected = await getSetting(`pin_${role}`, FALLBACK[role])
    const expected = String(rawExpected).replace(/^"|"$/g, '').trim()
    setChecking(false)

    if (value === expected) {
      sessionStorage.setItem(`auth_${role}`, '1')
      setAuthCookie(role) // ← أضف الكوكي
      onSuccess()
    } else {
      toast.error('الكود غير صحيح')
      setPin('')
    }
  }

  function press(d: string) {
    if (checking) return
    if (d === 'C') return setPin('')
    if (d === '⌫') return setPin((p) => p.slice(0, -1))
    const next = (pin + d).slice(0, 4)
    setPin(next)
    if (next.length === 4) submit(next)
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫']

  return (
    <div className="flex flex-col items-center gap-4 p-4 min-h-screen justify-center bg-gray-50" dir="rtl">
      <h2 className="text-xl font-bold text-gray-800">كود دخول {LABELS[role]}</h2>
      <div className="flex gap-3" dir="ltr">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-4 w-4 rounded-full border-2 transition-all ${pin.length > i ? 'bg-rose-500 border-rose-500' : 'border-gray-300 bg-transparent'}`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3" dir="ltr">
        {keys.map((k) => (
          <button key={k} onClick={() => press(k)} className="h-16 w-16 rounded-full bg-white text-2xl font-bold shadow hover:bg-rose-100 active:scale-95 transition-all text-gray-700">
            {k}
          </button>
        ))}
      </div>
      {onCancel && <button onClick={onCancel} className="text-gray-500 underline mt-2">إلغاء</button>}
    </div>
  )
}