"use client";

import { supabase } from "@/lib/supabaseClient";
import type { DocumentType, DocumentLanguage } from "../types";

export type DocType = "devis" | "bon_de_commande" | "facture" | "work_order";

// ✅ UPDATED: New fallback conditions from user
const FALLBACK_CONDITIONS: Record<string, string[]> = {
  devis: [
    "1. عرض السعر صالح لمدة 15 يوماً.",
    "2. الأسعار قابلة للتغيير بعد انتهاء مدة صلاحية العرض.",
    "3. عرض السعر لا يعتبر فاتورة ولا أمر شراء.",
    "4. لا يبدأ التصنيع إلا بعد تأكيد الطلب ودفع العربون.",
    "5. الأسعار تشمل فقط المنتجات والخدمات المذكورة في عرض السعر.",
    "6. أي تعديل في المقاسات أو الخيارات قد يؤدي إلى تغيير السعر.",
    "7. لا يتم حجز المواد أو موعد الإنتاج بمجرد إصدار عرض السعر.",
  ],
  bon_de_commande: [
    "1. دفع العربون إلزامي لبدء التصنيع.",
    "2. العربون غير قابل للاسترجاع بعد بدء التصنيع.",
    "3. يبدأ العمل فقط بعد استلام العربون.",
    "4. لا يمكن تعديل المقاسات أو نوع الثوب أو نوع البونج أو نوع الخشب أو التشطيبات بعد بدء التصنيع.",
    "5. مدة التصنيع القصوى 90 يوماً.",
    "6. تاريخ التسليم هو تاريخ تقديري وقد يتغير في الحالات الاستثنائية.",
    "7. يجب دفع المبلغ المتبقي بالكامل قبل الاستلام أو التسليم.",
    "8. يجب على العميل فحص المنتج عند الاستلام.",
    "9. في حالة القوة القاهرة قد يتم تمديد مدة الإنجاز مع إشعار العميل.",
  ],
  facture: [
    "1. الفاتورة تُثبت عملية البيع النهائية.",
    "2. يجب دفع المبلغ المتبقي قبل التسليم إذا لم يكن مدفوعاً.",
    "3. للاستفسار أو خدمة ما بعد البيع يمكن التواصل عبر معلومات الاتصال الموجودة في الفاتورة.",
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

    if (typeof raw === "string") {
      return raw.split("\n").filter(Boolean);
    }

    if (Array.isArray(raw)) return raw;

    return FALLBACK_CONDITIONS[key];
  } catch {
    return FALLBACK_CONDITIONS[key];
  }
}

/** يجلب كل الشروط دفعة واحدة (لصفحة الإعدادات) */
export async function getAllDocumentConditions(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase
      .from("document_conditions")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return {
        devis_conditions: FALLBACK_CONDITIONS.devis.join("\n"),
        bc_conditions: FALLBACK_CONDITIONS.bon_de_commande.join("\n"),
        facture_conditions: FALLBACK_CONDITIONS.facture.join("\n"),
      };
    }

    return {
      devis_conditions: data.devis_conditions || FALLBACK_CONDITIONS.devis.join("\n"),
      bc_conditions: data.bc_conditions || FALLBACK_CONDITIONS.bon_de_commande.join("\n"),
      facture_conditions: data.facture_conditions || FALLBACK_CONDITIONS.facture.join("\n"),
    };
  } catch {
    return {
      devis_conditions: FALLBACK_CONDITIONS.devis.join("\n"),
      bc_conditions: FALLBACK_CONDITIONS.bon_de_commande.join("\n"),
      facture_conditions: FALLBACK_CONDITIONS.facture.join("\n"),
    };
  }
}

/** يحفظ الشروط في Supabase */
export async function saveDocumentConditions(conditions: {
  devis_conditions?: string;
  bc_conditions?: string;
  facture_conditions?: string;
}): Promise<void> {
  const { error } = await supabase
    .from("document_conditions")
    .upsert(
      {
        ...conditions,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (error) throw error;
}