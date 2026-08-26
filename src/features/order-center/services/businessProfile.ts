// src/features/order-center/services/businessProfile.ts
import { supabase } from '@/lib/supabase';

export interface BusinessProfile {
  id?: string;
  company_name: string;
  commercial_name?: string;
  address?: string;
  city?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  ice?: string;
  if_?: string;
  rc?: string;
  patente?: string;
  logo_url?: string;
  stamp_url?: string;
  signature_url?: string;
  bank_name?: string;
  rib?: string;
  iban?: string;
  swift?: string;
  // Colors fallback (not in DB yet — add later if needed)
  primary_color?: string;
  secondary_color?: string;
}

const FALLBACK: BusinessProfile = {
  company_name: 'Ameublement et déco Elmahboubi',
  commercial_name: 'المحبوبي للأثاث والديكور',
  address: 'شارع الحنصالي قرب قيسارية السعادة 217 بني ملال',
  city: 'Beni Mellal',
  phone: '06 67 74 70 91',
  mobile: '06 67 74 70 91',
  email: 'ameublement_deco_elmahboubi@gmail.com',
  instagram: 'ameublement_deco_elmahboubi',
  whatsapp: '212667747091',
  primary_color: '#1B5E38',
  secondary_color: '#C9A84C',
};

export async function loadBusinessProfile(): Promise<BusinessProfile> {
  try {
    const { data, error } = await supabase
      .from('business_profile')
      .select('*')
      .maybeSingle();
    if (error || !data) return FALLBACK;
    const profile = data as Partial<BusinessProfile>;
    return {
      ...FALLBACK,
      ...profile,
      // Ensure colors always have a value
      primary_color: profile.primary_color || FALLBACK.primary_color,
      secondary_color: profile.secondary_color || FALLBACK.secondary_color,
    };
  } catch {
    return FALLBACK;
  }
}

export function getPublicUrl(path: string | undefined): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
  return data?.publicUrl || null;
}

// Helper to get display name
export function getDisplayName(profile: BusinessProfile): string {
  return profile.commercial_name || profile.company_name || 'المحبوبي';
}

// Helper to get city from address if city is empty
export function getCity(profile: BusinessProfile): string {
  if (profile.city) return profile.city;
  // Extract city from address if possible
  if (profile.address?.includes('بني ملال')) return 'Beni Mellal';
  return 'Beni Mellal';
}