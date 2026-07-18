'use client';
import Button from './Button';

/** نظام مراحل مع شريط تقدم وأزرار تنقل */
export default function StepWizard({
  steps,
  current,
  onBack,
  onNext,
  nextDisabled,
  nextLabel = 'التالي ←',
  children
}: {
  steps: string[];
  current: number;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  children: React.ReactNode;
}) {
  const pct = ((current + 1) / steps.length) * 100;
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col p-4">
      <div className="mb-2 flex items-center justify-between text-sm font-semibold text-gray-500">
        <span>المرحلة {current + 1} من {steps.length}</span>
        <span className="text-brand-700 text-lg">{steps[current]}</span>
      </div>
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex-1">{children}</div>
      <div className="mt-6 flex justify-between gap-4 pb-4">
        <Button variant="secondary" onClick={onBack} disabled={current === 0}>→ رجوع</Button>
        <Button onClick={onNext} disabled={nextDisabled}>{nextLabel}</Button>
      </div>
    </div>
  );
}
