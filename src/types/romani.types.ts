export interface RomaniModel {
  id: string;
  name: string;
  code: string;
  image_url: string | null;
  price_per_meter: number;
  active: boolean;
  created_at: string;
}

export interface RomaniColor {
  id: string;
  name: string;
  image_url: string | null;
  active: boolean;
  created_at: string;
}

export interface RomaniSeddari {
  id: string;
  length_cm: number;
  has_kotik: boolean;
  kotik_count: number;
  has_formaja: boolean;
  formaja_length_meters: number;
  price_per_meter: number;
  total_price: number;
}

export interface RomaniOrderPayload {
  model_id: string;
  model_name: string;
  model_image: string | null;
  model_price_per_meter: number;
  color_id: string;
  color_name: string;
  color_image: string | null;
  seddars: RomaniSeddari[];
  total_length_meters: number;
  total_kotik_meters: number;
  total_formaja_meters: number;
  total_meters: number;
  total_price: number;
  notes?: string;
}

export type RomaniStep = "model" | "color" | "calculator" | "summary";