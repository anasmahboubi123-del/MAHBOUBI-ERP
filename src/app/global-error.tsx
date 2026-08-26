'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html dir="rtl">
      <body
        className="min-h-screen flex items-center justify-center p-4"
        style={{ fontFamily: 'Cairo, sans-serif', background: '#FAFAF8' }}
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-red-100">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">خطأ في النظام</h2>
          <p className="text-gray-500 text-sm mb-2">
            {error.message || 'حدث خطأ غير متوقع'}
          </p>
          {error.digest && (
            <p className="text-xs text-gray-400 mb-6">كود الخطأ: {error.digest}</p>
          )}
          <button
            onClick={reset}
            className="w-full py-3 bg-[#1B5E38] text-white rounded-xl font-bold hover:bg-[#2D7A4E] transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  )
}