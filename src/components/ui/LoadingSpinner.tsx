interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  text?: string
}

export default function LoadingSpinner({
  size = 'md',
  color = '#1B5E38',
  text = 'جاري التحميل...',
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: { spinner: 24, border: 2 },
    md: { spinner: 40, border: 3 },
    lg: { spinner: 64, border: 4 },
  }

  const { spinner, border } = sizeMap[size]

  return (
    <div className="flex flex-col items-center justify-center gap-3" dir="rtl">
      <div
        className="animate-spin rounded-full border-t-transparent"
        style={{
          width: spinner,
          height: spinner,
          borderWidth: border,
          borderColor: `${color}30`,
          borderTopColor: color,
        }}
      />
      {text && <span className="text-sm text-gray-500 font-medium">{text}</span>}
    </div>
  )
}