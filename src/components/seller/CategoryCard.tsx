// src/components/seller/CategoryCard.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Category } from '@/types/seller.types';
import { getPublicImageUrl } from '@/lib/supabase-seller';
import { Skeleton } from './SkeletonLoaders';

interface CategoryCardProps {
  category: Category;
  index: number;
  onClick: (category: Category) => void;
}

const categoryIcons: Record<string, string> = {
  tissu: '🧵',
  zarbia: '🧶',
  bois: '🪵',
  bounge: '🧽',
  khamiya: '🏠',
  accessories: '✨',
  formas: '🔷',
  decor: '🪞',
  stitch: '🪡',
  cushion: '🛋️',
};

export default function CategoryCard({ category, index, onClick }: CategoryCardProps) {
  const imageUrl = getPublicImageUrl('catalogue', category.image_url);
  const icon = categoryIcons[category.slug] || '🛋️';

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      whileHover={{ y: -6, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick(category)}
      className="group relative overflow-hidden rounded-[20px] bg-white shadow-sm hover:shadow-xl transition-all duration-500 text-right flex flex-col"
    >
      {/* Image */}
      <div className="relative h-44 sm:h-52 overflow-hidden bg-[#F5F0E8]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, 20vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {icon}
          </div>
        )}
        {/* Dark bottom overlay */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1B5E3B]/90 to-transparent" />
      </div>

      {/* Content overlay at bottom */}
      <div className="absolute bottom-0 inset-x-0 p-4 text-center">
        <h3 className="font-bold text-white text-sm sm:text-base">{category.name}</h3>
        <p className="text-white/70 text-xs mt-0.5">{category.product_count} منتج</p>
      </div>
    </motion.button>
  );
}

export function CategoryCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-[20px] bg-white shadow-sm overflow-hidden"
    >
      <Skeleton className="h-44 sm:h-52 w-full" />
    </motion.div>
  );
}