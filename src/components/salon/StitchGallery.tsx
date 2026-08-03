"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { StitchStyle } from "./StitchStyleCard";

interface StitchGalleryProps {
  style: StitchStyle | null;
  open: boolean;
  onClose: () => void;
}

export default function StitchGallery({ style, open, onClose }: StitchGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!open || !style) return null;

  const images = style.gallery?.length
    ? style.gallery
    : style.image_url
      ? [style.image_url]
      : [];

  if (images.length === 0) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute left-3 top-3 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
          <p className="mt-4 text-gray-500 font-medium">لا توجد صور إضافية</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-4xl rounded-2xl bg-[#0D1F17] p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/40">
          <Image
            src={images[currentIndex]}
            alt={`${style.name} — ${currentIndex + 1}`}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 75vw"
          />
        </div>

        <div className="mt-4 flex items-center justify-between px-2">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="text-center">
            <p className="text-white font-bold text-lg">{style.name}</p>
            <p className="text-white/60 text-sm mt-1">
              {currentIndex + 1} / {images.length}
            </p>
            {style.description && (
              <p className="mt-2 text-white/50 text-sm max-w-md mx-auto">{style.description}</p>
            )}
          </div>

          <button
            onClick={() => setCurrentIndex((i) => Math.min(images.length - 1, i + 1))}
            disabled={currentIndex === images.length - 1}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex ? "w-6 bg-[#C9A84C]" : "w-2 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}