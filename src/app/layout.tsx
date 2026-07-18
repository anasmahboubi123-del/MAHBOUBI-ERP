import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Salon Marocain ERP',
  description: 'نظام إدارة محل الصالونات المغربية'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
