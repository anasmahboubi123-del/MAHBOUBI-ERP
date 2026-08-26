import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function RootLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#FAFAF8' }}
    >
      <LoadingSpinner size="lg" text="جاري تحميل النظام..." />
    </div>
  )
}