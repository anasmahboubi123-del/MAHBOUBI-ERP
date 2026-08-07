// src/lib/supabase-seller.ts
// دوال Supabase الخاصة بواجهة البائع — El Mahboubi Salon ERP

import { supabase } from './supabase';
import { Product, Category, Notification, AlbumItem } from '@/types/seller.types';

// ─── الصور من Supabase Storage ───

/**
 * تُرجع الرابط العام الكامل لملف في Supabase Storage.
 * إذا كان المسار نسبياً (مثال: "romani/simple.jpg")، تُضيف دومين Supabase تلقائياً.
 * إذا كان المسار فارغاً أو null، تُرجع null.
 */
export function getPublicImageUrl(bucket: string, path: string | null | undefined): string | null {
  if (!path || path.trim() === '') return null;

  // إذا كان الرابط بالفعل مطلقاً، أرجعه كما هو
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // تنظيف المسار: إزالة / في البداية إن وجدت
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);

  // التحقق من أن الرابط الناتج يحتوي على بروتوكول
  const url = data?.publicUrl;
  if (!url) return null;

  // إذا كان الرابط الناتج لا يحتوي على بروتوكول، أضفه
  if (!url.startsWith('http')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
    }
    return null;
  }

  return url;
}

export async function uploadImageToStorage(
  bucket: string,
  file: File,
  fileName?: string
): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const name = fileName || `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(name, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    console.error('Upload error:', error);
    return null;
  }
  return name;
}

// ─── جلب المنتجات من الجداول الحقيقية ───

export async function fetchAllProducts(searchQuery?: string): Promise<Product[]> {
  const tables = [
    { table: 'fabrics', category: 'ثوب', nameField: 'name', priceField: 'price_per_meter', imageField: 'image_url', stockField: 'stock_meters' },
    { table: 'tapis', category: 'زرابي', nameField: 'name', priceField: 'price', imageField: 'image_url', stockField: 'stock' },
    { table: 'bois', category: 'خشب', nameField: 'name', priceField: 'price', imageField: 'image_url', stockField: 'stock' },
    { table: 'bounge', category: 'بونج', nameField: 'name', priceField: 'price_per_m3', imageField: 'image_url', stockField: 'stock_m3' },
    { table: 'khamiya', category: 'خامية', nameField: 'name', priceField: 'price_per_m2', imageField: 'image_url', stockField: 'stock_m2' },
    { table: 'extras', category: 'إكسسوارات', nameField: 'name', priceField: 'price', imageField: 'image_url', stockField: 'stock' },
    { table: 'formas', category: 'فورماجات', nameField: 'name', priceField: 'sewing_price', imageField: 'image_url', stockField: null },
    { table: 'rembourrage', category: 'لواط', nameField: 'name', priceField: 'price_per_cushion', imageField: null, stockField: 'stock' },
    { table: 'decor_cushions', category: 'مخاد ديكور', nameField: 'name', priceField: 'price', imageField: 'image_url', stockField: null },
    { table: 'stitch_styles', category: 'خياطة', nameField: 'name', priceField: 'price', imageField: 'image_url', stockField: null },
    { table: 'cushion_styles', category: 'مخاد', nameField: 'name', priceField: 'price', imageField: 'image_url', stockField: null },
  ];

  const allProducts: Product[] = [];

  for (const { table, category, nameField, priceField, imageField, stockField } of tables) {
    try {
      let query = supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike(nameField, `%${searchQuery}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.warn(`Error fetching ${table}:`, error.message);
        continue;
      }

      if (data) {
        const mapped = data.map((item: any) => ({
          id: `${table}_${item.id}`,
          name: item[nameField] || 'بدون اسم',
          price: Number(item[priceField]) || 0,
          category: category,
          description: item.description || item.wood_type || item.quality || item.density || null,
          image_url: imageField ? item[imageField] : null,
          stock: stockField ? Number(item[stockField]) || 0 : undefined,
          is_favorite: false,
          created_at: item.created_at || new Date().toISOString(),
        }));
        allProducts.push(...mapped);
      }
    } catch (err) {
      console.warn(`Failed to fetch ${table}:`, err);
    }
  }

  return allProducts;
}

export async function fetchProductsByCategory(categoryName: string, searchQuery?: string): Promise<Product[]> {
  const all = await fetchAllProducts(searchQuery);
  return all.filter((p) => p.category === categoryName);
}

// ─── الفئات من الجداول الفعلية ───

export async function fetchCategories(): Promise<Category[]> {
  const categoryMap: Record<string, { name: string; slug: string; count: number }> = {};

  const tables = [
    { table: 'fabrics', name: 'ثوب', slug: 'tissu' },
    { table: 'tapis', name: 'زرابي', slug: 'zarbia' },
    { table: 'bois', name: 'خشب', slug: 'bois' },
    { table: 'bounge', name: 'بونج', slug: 'bounge' },
    { table: 'khamiya', name: 'خامية', slug: 'khamiya' },
    { table: 'extras', name: 'إكسسوارات', slug: 'accessories' },
    { table: 'formas', name: 'فورماجات', slug: 'formas' },
    { table: 'decor_cushions', name: 'مخاد ديكور', slug: 'decor' },
    { table: 'stitch_styles', name: 'خياطة', slug: 'stitch' },
    { table: 'cushion_styles', name: 'مخاد', slug: 'cushion' },
  ];

  for (const { table, name, slug } of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error && count !== null && count > 0) {
        categoryMap[slug] = { name, slug, count };
      }
    } catch {
      // ignore
    }
  }

  return Object.values(categoryMap).map((c, i) => ({
    id: c.slug,
    name: c.name,
    slug: c.slug,
    image_url: null,
    product_count: c.count,
    flow_type: c.slug === 'salon' ? 'salon_detailed' : 'simple',
    display_order: i + 1,
  }));
}

// ─── ألبوم البائع ───

export async function deleteAlbumItem(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('seller_album').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ─── المفضلة ───

export async function toggleFavorite(productId: string, isFavorite: boolean): Promise<boolean> {
  return true;
}

// ─── الإشعارات ───

export async function fetchNotifications(): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
}

// ─── Realtime ───

export function subscribeToNotifications(callback: (payload: any) => void) {
  return supabase
    .channel('seller-notifications')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications' },
      callback
    )
    .subscribe();
}

export function subscribeToOrders(callback: (payload: any) => void) {
  return supabase
    .channel('seller-orders')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      callback
    )
    .subscribe();
}

// ─── إنشاء طلبية ───

export async function createOrder(orderData: {
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  total_amount: number;
  deposit_amount: number;
  delivery_date?: string;
  notes?: string;
  seller_id: string;
  status?: string;
}) {
  const { data, error } = await supabase
    .from('orders')
    .insert([{ ...orderData, status: orderData.status || 'جديد' }])
    .select()
    .single();

  if (error) {
    console.error('Error creating order:', error);
    return null;
  }
  return data;
}

export async function createOrderItems(orderId: string, items: any[]) {
  const { error } = await supabase
    .from('order_items')
    .insert(items.map((item) => ({ ...item, order_id: orderId })));

  if (error) {
    console.error('Error creating order items:', error);
    return false;
  }
  return true;
}

// ─── أقسام الألبوم (إضافة جديدة) ───
export const ALBUM_CATEGORIES = [
  { id: "khamiya", name: "الخاميات", icon: "🏠" },
  { id: "salon", name: "الصالون المغربي", icon: "🛋️" },
  { id: "tapis", name: "الزرابي", icon: "🧶" },
  { id: "bois", name: "العود", icon: "🪵" },
  { id: "bonj", name: "البونج", icon: "🧽" },
  { id: "romani", name: "الصالون الرومي", icon: "🏛️" },
] as const;

export type AlbumCategory = (typeof ALBUM_CATEGORIES)[number]["id"];

// ─── رفع صورة الألبوم (إضافة جديدة) ───
export async function uploadAlbumImage(
  file: File,
  category: AlbumCategory
): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const fileName = `${category}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const uploadedName = await uploadImageToStorage('album-images', file, fileName);
  if (!uploadedName) return null;
  return getPublicImageUrl('album-images', uploadedName);
}

// ─── حذف صورة من Storage (إضافة جديدة) ───
export async function deleteAlbumImage(imageUrl: string): Promise<boolean> {
  try {
    const path = imageUrl.split('/album-images/')[1];
    if (!path) return false;
    const { error } = await supabase.storage.from('album-images').remove([path]);
    return !error;
  } catch {
    return false;
  }
}

// ─── جلب ألبوم البائع (محدّث — إضافة category اختياري) ───
export async function fetchAlbumItems(category?: AlbumCategory): Promise<AlbumItem[]> {
  try {
    let query = supabase
      .from('seller_album')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Error fetching album:', error.message);
      return [];
    }
    return (data || []) as AlbumItem[];
  } catch {
    return [];
  }
}

// ─── إضافة عنصر للألبوم (محدّث — يدعم category) ───
export async function addAlbumItem(item: Omit<AlbumItem, 'id' | 'created_at'>): Promise<AlbumItem | null> {
  try {
    const { data, error } = await supabase
      .from('seller_album')
      .insert([{ ...item, created_at: new Date().toISOString() }])
      .select()
      .single();

    if (error) {
      console.error('Error adding album item:', error);
      return null;
    }
    return data as AlbumItem;
  } catch {
    return null;
  }
}