// src/features/order-center/services/documentConditions.ts
import { supabase } from "@/lib/supabaseClient";

export type DocType = "devis" | "bon_de_commande" | "facture" | "work_order";

const FALLBACK_CONDITIONS: Record<DocType, string[]> = {
  devis: [
    "عرض السعر صالح لمدة 15 يومًا من تاريخ الإصدار.",
    "الأسعار قابلة للتغيير بعد انتهاء مدة صلاحية العرض.",
    "لا يبدأ التصنيع إلا بعد تأكيد الطلب ودفع العربون.",
    "عرض السعر لا يعتبر فاتورة نهائية.",
    "أي تعديل في المقاسات قد يؤدي إلى تغيير السعر.",
  ],
  bon_de_commande: [
    "دفع العربون إلزامي لبدء التصنيع.",
    "العربون غير قابل للاسترجاع بعد بدء التصنيع.",
    "مدة التصنيع القصوى 90 يومًا.",
    "يجب دفع المبلغ المتبقي قبل الاستلام.",
    "يُنصح العميل بفحص المنتج عند الاستلام.",
  ],
  facture: [
    "الفاتورة تُثبت عملية البيع النهائية.",
    "شكراً لثقتكم في Ameublement & Déco El Mahboubi.",
    "يمكن إعادة طباعة الفاتورة في أي وقت.",
  ],
  work_order: [
    "أمر شغل داخلي — للورشة فقط.",
    "يُراجع المدير التقني جميع المواصفات قبل الإنتاج.",
  ],
};

export async function getDocumentConditions(docType: string): Promise<string[]> {
  const key = (docType as DocType) in FALLBACK_CONDITIONS ? (docType as DocType) : "devis";
  try {
    const { data, error } = await supabase
      .from("document_conditions")
      .select("conditions")
      .eq("doc_type", docType)
      .maybeSingle();
    if (error || !data) return FALLBACK_CONDITIONS[key];
    return data.conditions || FALLBACK_CONDITIONS[key];
  } catch {
    return FALLBACK_CONDITIONS[key];
  }
}