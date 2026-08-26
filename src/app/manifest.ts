// ════════════════════════════════════════════════════════════════
// src/app/manifest.ts
// ملف PWA — يجعل الموقع يشتغل كـ "تطبيق" على الجوال
// ════════════════════════════════════════════════════════════════

import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'المحبوبي — ERP',
    short_name: 'المحبوبي',
    description: 'نظام إدارة محل الأثاث والتنجيد المحبوبي',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAF8',
    theme_color: '#1B5E3B',
    orientation: 'portrait',
    icons: [
      {
        src: '/images/logo-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/images/logo-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['business', 'productivity'],
    lang: 'ar',
    dir: 'rtl',
  }
}