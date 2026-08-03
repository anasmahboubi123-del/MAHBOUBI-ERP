// src/components/seller/WorkCarousel.tsx
'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, MapPin, Calendar } from 'lucide-react';
import Image from 'next/image';
import { Work, WorkStatus } from '@/types/seller.types';
import { getPublicImageUrl } from '@/lib/supabase-seller';
import { Skeleton } from './SkeletonLoaders';

interface WorkCarouselProps {
  works: Work[];
  onWorkClick: (work: Work) => void;
  loading?: boolean;
}

const statusConfig: Record<WorkStatus, { label: string; color: string; bg: string }> = {
  'جديد': { label: 'جديد', color: 'text-blue-600', bg: 'bg-blue-50' },
  'قيد_التنفيذ': { label: 'قيد التنفيذ', color: 'text-amber-600', bg: 'bg-amber-50' },
  'بانتظار_التسبيق': { label: 'بانتظار التسبيق', color: 'text-purple-600', bg: 'bg-purple-50' },
  'قيد_الخياطة': { label: 'قيد الخياطة', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  'جاهز_للتسليم': { label: 'جاهز للتسليم', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'مكتمل': { label: 'مكتمل', color: 'text-green-600', bg: 'bg-green-50' },
  'ملغي': { label: 'ملغي', color: 'text-red-600', bg: 'bg-red-50' },
};

export default function WorkCarousel({ works, onWorkClick, loading }: WorkCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (loading) {
    return (
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-72">
              <div className="rounded-[20px] bg-white shadow-sm overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (works.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-[20px] shadow-sm">
        <p className="text-gray-400 text-sm">لا توجد أعمال لهذا اليوم</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Scroll Buttons */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
      >
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {works.map((work, index) => {
          const status = statusConfig[work.status] || statusConfig['جديد'];
          const imageUrl = getPublicImageUrl('orders', work.image_url);

          return (
            <motion.button
              key={work.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onWorkClick(work)}
              className="flex-shrink-0 w-72 bg-white rounded-[20px] shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden text-right"
            >
              {/* Image */}
              <div className="relative h-40 overflow-hidden">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={work.customer_name}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-110"
                    sizes="288px"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#F5ECD7] to-[#e8dcc0] flex items-center justify-center">
                    <span className="text-4xl">🛋️</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${status.bg} ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h4 className="font-bold text-gray-900 text-sm mb-2">{work.customer_name}</h4>
                <div className="flex items-center gap-3 text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-xs">{work.city}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-xs">
                      {new Date(work.created_at).toLocaleDateString('ar-MA', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                {work.total_amount && (
                  <p className="mt-2 text-sm font-bold text-[#4A6741]">
                    {work.total_amount.toLocaleString('ar-MA')} د.م
                  </p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}