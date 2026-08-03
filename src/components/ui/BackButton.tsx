'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

interface BackButtonProps {
  label?: string;
  onClick?: () => void;
  className?: string;
}

export default function BackButton({ 
  label = 'العودة للرئيسية', 
  onClick,
  className = '' 
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push('/');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center gap-2 px-4 py-2.5 
        bg-white/80 backdrop-blur-sm border border-amber-200 
        rounded-xl text-amber-900 font-medium text-sm
        hover:bg-amber-50 hover:border-amber-300 
        active:scale-95 transition-all duration-200
        shadow-sm hover:shadow-md
        ${className}
      `}
    >
      <ArrowRight className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}