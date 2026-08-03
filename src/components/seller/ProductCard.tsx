// src/components/seller/ProductCard.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, MoreHorizontal, Plus, X } from 'lucide-react';
import Image from 'next/image';
import { Product } from '@/types/seller.types';
import { getPublicImageUrl } from '@/lib/supabase-seller';
import { Skeleton } from './SkeletonLoaders';

interface ProductCardProps {
  product: Product;
  index: number;
  onFavoriteToggle: (productId: string, isFavorite: boolean) => void;
  onQuickView: (product: Product) => void;
  onAddToOrder: (product: Product) => void;
}

export default function ProductCard({
  product,
  index,
  onFavoriteToggle,
  onQuickView,
  onAddToOrder,
}: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const imageUrl = getPublicImageUrl('catalogue', product.image_url);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.4 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative bg-white rounded-[20px] shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden"
      >
        {/* Image Container */}
        <div className="relative h-52 sm:h-56 overflow-hidden bg-gray-50">
          {!imageLoaded && <Skeleton className="absolute inset-0" />}

          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className={`object-cover transition-all duration-700 ${
                isHovered ? 'scale-110' : 'scale-100'
              } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#F5ECD7] to-[#e8dcc0] flex items-center justify-center">
              <span className="text-5xl">🛋️</span>
            </div>
          )}

          {/* Overlay Actions */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/20 flex items-center justify-center gap-2"
              >
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowQuickView(true)}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <Eye className="w-4 h-4 text-gray-700" />
                </motion.button>
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ delay: 0.05 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onAddToOrder(product)}
                  className="w-10 h-10 bg-[#4A6741] rounded-full flex items-center justify-center shadow-lg"
                >
                  <Plus className="w-4 h-4 text-white" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(product.id, !!product.is_favorite);
            }}
            className="absolute top-3 left-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                product.is_favorite ? 'fill-red-500 text-red-500' : 'text-gray-400'
              }`}
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-3">
            <p className="text-lg font-bold text-[#4A6741]">
              {product.price.toLocaleString('ar-MA')}
              <span className="text-xs font-normal text-gray-400 mr-1">د.م</span>
            </p>
            {product.stock !== undefined && (
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                product.stock > 10 
                  ? 'bg-green-50 text-green-600' 
                  : product.stock > 0 
                    ? 'bg-amber-50 text-amber-600' 
                    : 'bg-red-50 text-red-600'
              }`}>
                {product.stock > 0 ? `${product.stock} متوفر` : 'نفذ'}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {showQuickView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowQuickView(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[24px] shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="relative h-64">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#F5ECD7] to-[#e8dcc0] flex items-center justify-center">
                    <span className="text-6xl">🛋️</span>
                  </div>
                )}
                <button
                  onClick={() => setShowQuickView(false)}
                  className="absolute top-3 left-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{product.category}</p>
                {product.description && (
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">{product.description}</p>
                )}
                <div className="flex items-center justify-between mt-6">
                  <p className="text-2xl font-bold text-[#4A6741]">
                    {product.price.toLocaleString('ar-MA')} د.م
                  </p>
                  <button
                    onClick={() => {
                      onAddToOrder(product);
                      setShowQuickView(false);
                    }}
                    className="px-6 py-2.5 bg-[#4A6741] text-white rounded-xl font-medium hover:bg-[#3d5635] transition-colors"
                  >
                    إضافة للطلب
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}