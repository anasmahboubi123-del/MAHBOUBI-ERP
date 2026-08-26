'use client';

import { X, Triangle, ArrowLeftRight, Box } from 'lucide-react';

type JunctionType = 'formaja' | 'insert' | 'wooden_box' | 'none';
type JunctionDirection = 'into_next' | 'from_next';

interface CornerMenuProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: JunctionType, direction?: JunctionDirection) => void;
  current?: JunctionType;
  currentDirection?: JunctionDirection;
}

const options: {
  type: JunctionType;
  direction?: JunctionDirection;
  label: string;
  icon: React.ReactNode;
  desc: string;
}[] = [
  {
    type: 'formaja',
    label: 'فورمجة',
    icon: <Triangle className="h-5 w-5" />,
    desc: 'مثلث يربط السدادر (+250سم ثوب + 50DH خياطة)',
  },
  {
    type: 'insert',
    direction: 'into_next',
    label: 'تداخل — يدخل في التالي',
    icon: <ArrowLeftRight className="h-5 w-5" />,
    desc: 'هذا السداري يمتد ليدخل في السداري الموالي',
  },
  {
    type: 'insert',
    direction: 'from_next',
    label: 'تداخل — يدخل فيه السابق',
    icon: <ArrowLeftRight className="h-5 w-5 rotate-180" />,
    desc: 'السداري السابق يمتد ليدخل في هذا السداري',
  },
  {
    type: 'wooden_box',
    label: 'صندوق خشبي',
    icon: <Box className="h-5 w-5" />,
    desc: 'مربع خشبي فاصل بين السدادر',
  },
  {
    type: 'none',
    label: 'بدون ربط',
    icon: <X className="h-5 w-5" />,
    desc: 'لا يوجد ربط — السداري منفصل',
  },
];

export default function CornerMenu({ open, onClose, onSelect, current, currentDirection }: CornerMenuProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-center text-lg font-bold text-[#0D1F17]">
          اختر طريقة الربط
        </h3>

        <div className="space-y-2.5">
          {options.map((opt) => {
            const isSelected = current === opt.type &&
              (opt.type !== 'insert' || currentDirection === opt.direction);

            return (
              <button
                key={`${opt.type}-${opt.direction ?? 'none'}`}
                onClick={() => onSelect(opt.type, opt.direction)}
                className={`
                  flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-right transition
                  ${isSelected
                    ? 'border-[#1B5E3B] bg-[#F5F0E8]'
                    : 'border-gray-100 bg-white hover:border-[#1B5E3B]/30 hover:bg-gray-50'
                  }
                `}
              >
                <div className={`
                  flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                  ${isSelected ? 'bg-[#1B5E3B] text-white' : 'bg-gray-100 text-gray-600'}
                `}>
                  {opt.icon}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#0D1F17]">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{opt.desc}</p>
                </div>
                {isSelected && (
                  <div className="h-5 w-5 rounded-full bg-[#1B5E3B] flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}