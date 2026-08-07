import { supabase } from "./supabase";
import { getPublicImageUrl } from "./supabase-seller";
import { RomaniModel, RomaniColor } from "@/types/romani.types";

export async function fetchRomaniModels(): Promise<RomaniModel[]> {
  const { data, error } = await supabase
    .from("romani_models")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching romani models:", error);
    throw error;
  }

  return data || [];
}

export async function fetchRomaniColors(): Promise<RomaniColor[]> {
  const { data, error } = await supabase
    .from("romani_colors")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching romani colors:", error);
    throw error;
  }

  return data || [];
}