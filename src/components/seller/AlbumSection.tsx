// src/components/seller/AlbumSection.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { AlbumItem } from '@/types/seller.types';
import { getPublicImageUrl } from '@/lib/supabase-seller';
import { Skeleton } from './SkeletonLoaders';

interface AlbumSectionProps {
  items: AlbumItem[];
  loading?: boolean;
}

export default function AlbumSection({ items, loading }: AlbumSectionProps) {
  const [selectedImage, setSelectedImage] = useState<AlbumItem | null>(null);

  if (loading) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-[#C9A84C]" />
          <h2 className="text-lg font-bold text-gray-900">ألبوم الأعمال</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-[16px] overflow-hidden">
              <Skeleton className="h-48 w-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-[#C9A84C]" />
          <h2 className="text-lg font-bold text-gray-900">ألبوم الأعمال</h2>
        </div>
        <div className="bg-white rounded-[20px] shadow-sm p-8 text-center">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">لا توجد صور في الألبوم</p>
          <p className="text-gray-300 text-xs mt-1">سيتم إضافتها من لوحة المدير</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="w-5 h-5 text-[#C9A84C]" />
        <h2 className="text-lg font-bold text-gray-900">ألبوم الأعمال</h2>
        <span className="px-2 py-0.5 bg-[#1B5E3B]/10 text-[#1B5E3B] text-[11px] font-bold rounded-full">
          {items.length}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {items.map((item, index) => {
          const imageUrl = getPublicImageUrl('seller-album', item.image_url);

          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedImage(item)}
              className="group relative overflow-hidden rounded-[16px] bg-white shadow-sm hover:shadow-lg transition-all duration-500 text-right"
            >
              <div className="relative h-48 overflow-hidden bg-[#F5F0E8]">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, 20vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    🛋️
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
              </div>

              <div className="absolute bottom-0 inset-x-0 p-3">
                <h4 className="font-bold text-white text-xs truncate">{item.title}</h4>
                <p className="text-[#C9A84C] text-xs font-semibold mt-0.5">
                  {item.price.toLocaleString('ar-MA')} د.م
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="relative max-w-lg w-full"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {getPublicImageUrl('seller-album', selectedImage.image_url) && (
              <Image
                src={getPublicImageUrl('seller-album', selectedImage.image_url)}
                alt={selectedImage.title}
                width={600}
                height={400}
                className="w-full rounded-2xl"
              />
            )}
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl">
              <h3 className="font-bold text-white">{selectedImage.title}</h3>
              <p className="text-[#C9A84C] font-semibold">
                {selectedImage.price.toLocaleString('ar-MA')} د.م
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}