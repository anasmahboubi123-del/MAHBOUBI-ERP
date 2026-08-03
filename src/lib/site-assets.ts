import { supabase } from './supabase';

const SUPABASE_STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`
  : '';

export function getSiteAssetUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${SUPABASE_STORAGE_URL}/${path}`;
}

/* ─── الثوابت الحالية (تبقى كما هي) ─── */
export const ROLE_ASSETS = {
  logo:    { path: 'site-assets/logo.jpg', fallbackIcon: '🛋️' },
  seller:  { path: 'site-assets/roles/seller.png', fallbackIcon: '🧾' },
  tailor:  { path: 'site-assets/roles/tailor.png', fallbackIcon: '🪡' },
  admin:   { path: 'site-assets/roles/admin.png', fallbackIcon: '👔' },
} as const;

export const CATEGORY_ASSETS = {
  bois:    { path: 'site-assets/categories/bois.jpg',    name: 'عود الخشب', flowType: 'simple' },
  bonj:    { path: 'site-assets/categories/bonj.jpg',    name: 'البونج', flowType: 'simple' },
  khamiya: { path: 'site-assets/categories/khamiya.jpg', name: 'الخامية', flowType: 'simple' },
  salon:   { path: 'site-assets/categories/salon.jpg',   name: 'الصالون المغربي', flowType: 'salon_detailed' },
  tapis:   { path: 'site-assets/categories/tapis.jpg',   name: 'الزرابي', flowType: 'simple' },
} as const;

export const BACKGROUND_ASSETS = {
  home:  'site-assets/backgrounds/home-bg.jpg',
  login: 'site-assets/backgrounds/login-bg.jpg',
} as const;

/* ─── Service مستقل للصور الديناميكية ─── */
export class SiteAssetsService {
  /** شعار المحل */
  getLogo(): string {
    return getSiteAssetUrl(ROLE_ASSETS.logo.path);
  }

  /** أول صورة خلفية من backgrounds/admin — ديناميكي تماماً */
  async getAdminBackground(): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from('site-assets')
        .list('backgrounds/admin', { limit: 50 });

      if (error || !data || data.length === 0) return null;

      const imageFile = data.find((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '');
      });

      if (!imageFile) return null;

      return getSiteAssetUrl(`site-assets/backgrounds/admin/${imageFile.name}`);
    } catch {
      return null;
    }
  }

  /** قائمة كل خلفيات المدير */
  async listAdminBackgrounds(): Promise<string[]> {
    try {
      const { data, error } = await supabase.storage
        .from('site-assets')
        .list('backgrounds/admin', { limit: 50 });

      if (error || !data) return [];

      return data
        .filter((f) => {
          const ext = f.name.split('.').pop()?.toLowerCase();
          return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '');
        })
        .map((f) => getSiteAssetUrl(`site-assets/backgrounds/admin/${f.name}`));
    } catch {
      return [];
    }
  }

  /** تحميل مسبق لصورة واحدة */
  preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load: ${url}`));
      img.src = url;
    });
  }

  /** تحميل مسبق لمجموعة صور */
  async preloadImages(urls: string[]): Promise<void> {
    await Promise.all(urls.map((url) => this.preloadImage(url).catch(() => {})));
  }
}

export const siteAssets = new SiteAssetsService();