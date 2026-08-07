import { supabase } from "@/lib/supabaseClient";
import type { DocumentLanguage } from "../i18n/documents";

export type DocType = "devis" | "bon_de_commande" | "facture" | "work_order";

const FALLBACK_CONDITIONS: Record<string, string[]> = {
  devis: [
    "1. عرض السعر صالح لمدة 15 يوماً.",
    "2. لا يبدأ التصنيع إلا بعد دفع العربون.",
    "3. التسليم خلال 3-4 أسابيع من تأكيد الطلب.",
  ],
  bon_de_commande: [
    "1. دفع العربون إلزامي لبدء التصنيع.",
    "2. العربون غير قابل للاسترجاع بعد بدء العمل.",
    "3. مدة التصنيع القصوى 90 يوماً.",
  ],
  facture: [
    "1. الفاتورة تُثبت عملية البيع النهائية.",
    "2. الضمان 6 أشهر على الخياطة.",
  ],
  work_order: [
    "1. أمر شغل داخلي — للورشة فقط.",
    "2. يُراجع المدير التقني جميع المواصفات قبل الإنتاج.",
  ],
};

/** يجلب الشروط من Supabase حسب نوع المستند واللغة */
export async function getDocumentConditions(
  docType: DocType,
  lang: DocumentLanguage = "ar"
): Promise<string[]> {
  const key = docType in FALLBACK_CONDITIONS ? docType : "devis";

  try {
    // تحديد العمود حسب اللغة
    let column: string;
    if (lang === "fr") {
      column = `${docType}_conditions_fr`;
    } else if (lang === "es") {
      column = `${docType}_conditions_es`;
    } else if (lang === "it") {
      column = `${docType}_conditions_it`;
    } else {
      column = `${docType}_conditions`;
    }

    const { data, error } = await supabase
      .from("document_conditions")
      .select(column)
      .limit(1)
      .maybeSingle();

    if (error || !data) return FALLBACK_CONDITIONS[key];

    const raw = (data as any)[column];
    if (!raw) return FALLBACK_CONDITIONS[key];

    // إذا كان نصاً (مفصول بـ \n)
    if (typeof raw === "string") {
      return raw.split("\n").filter(Boolean);
    }

    // إذا كان مصفوفة
    if (Array.isArray(raw)) return raw;

    return FALLBACK_CONDITIONS[key];
  } catch {
    return FALLBACK_CONDITIONS[key];
  }
}