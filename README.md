# Salon Marocain ERP - نظام إدارة محل الصالونات المغربية

تطبيق ERP متكامل يعمل على الجهاز اللوحي، بثلاث واجهات محمية بأكواد: **البائع**، **الخياط**، **المدير**.

## التقنيات
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase (قاعدة البيانات + التخزين)
- Fabric.js (رسم الصالون 2D)
- Make.com (WhatsApp + Google Calendar)

## الإعداد
1. انسخ `.env.example` إلى `.env.local`
2. نفّذ `supabase-schema.sql` في محرر SQL الخاص بـ Supabase
3. أنشئ Buckets في Supabase Storage: `fabrics`, `stitch-styles`, `orders`, `catalogue`, `invoices` (Public)
4. ثبّت وشغّل:
```bash
npm install
npm run dev
```

## أكواد الدخول الافتراضية
| الواجهة | الكود |
|---------|-------|
| البائع | 1111 |
| الخياط | 2222 |
| المدير | 9999 |

يمكن تغييرها من جدول `settings` (المفاتيح: `pin_seller`, `pin_tailor`, `pin_admin`).

## المراحل
- **المرحلة 1 (الحالية):** واجهة البائع الكاملة (Wizard من 8 مراحل) + رسم 2D + الفاتورة
- **المرحلة 2:** واجهة المدير (الكتالوج + Dashboard)
- **المرحلة 3:** واجهة الخياط + نظام المراسلة
