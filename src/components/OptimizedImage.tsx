// ════════════════════════════════════════════════════════════════
// src/components/OptimizedImage.tsx
// بديل لـ <img> يدعم next/image + fallback + lazy loading
// ════════════════════════════════════════════════════════════════

'use client'

import { useState } from 'react'
import Image from 'next/image'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  priority?: boolean
  fallbackSrc?: string
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill,
  className = '',
  priority = false,
  fallbackSrc = '/images/placeholder.jpg',
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [error, setError] = useState(false)

  const handleError = () => {
    if (!error) {
      setImgSrc(fallbackSrc)
      setError(true)
    }
  }

  // إذا كان الرابط من Supabase → استخدم next/image
  const isExternal = src.startsWith('http')

  if (isExternal) {
    return (
      <Image
        src={imgSrc}
        alt={alt}
        width={width || 400}
        height={height || 300}
        fill={fill}
        className={className}
        priority={priority}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
      />
    )
  }

  // محلي → img عادي (أو يمكن استخدام next/image أيضاً)
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      onError={handleError}
    />
  )
}