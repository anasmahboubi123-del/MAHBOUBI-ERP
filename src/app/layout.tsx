import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap', // ← NEW: يحسّن سرعة التحميل الأولى
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1B5E3B',
}

export const metadata: Metadata = {
  title: 'المحبوبي — نظام إدارة الورشة',
  description: 'نظام إدارة محل الأثاث والتنجيد المحبوبي',
  manifest: '/manifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'المحبوبي',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body
        className="antialiased"
        style={{ fontFamily: 'var(--font-cairo), Cairo, sans-serif' }}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}