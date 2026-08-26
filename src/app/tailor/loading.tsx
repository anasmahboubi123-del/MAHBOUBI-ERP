import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function TailorLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
      <LoadingSpinner size="md" text="جاري تحميل واجهة الخياط..." />
    </div>
  )
}