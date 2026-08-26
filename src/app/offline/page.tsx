// ════════════════════════════════════════════════════════════════
// src/app/offline/page.tsx
// صفحة تظهر عندما يكون المستخدم غير متصل
// ════════════════════════════════════════════════════════════════

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      dir="rtl"
      style={{ fontFamily: 'Cairo, sans-serif', background: '#FAFAF8' }}
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">أنت غير متصل</h1>
        <p className="text-gray-500 mb-6">
          يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-[#1B5E3B] text-white rounded-xl font-bold hover:bg-[#2D7A4E] transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  )
}