"use client";

import React, { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { X, Printer, Download, MessageCircle, Loader2, Check, FileText } from "lucide-react";
import type { OrderItem, DocumentType, PrintOptions, DocumentLanguage } from "../../../features/order-center/types";
import { docTitle, t } from "../../../features/order-center/i18n/documents";
import { supabase } from "@/lib/supabaseClient";

interface PrintModalProps {
  orderItems: OrderItem[];
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerCity?: string;
  totalAmount: number;
  discountAmount?: number;
  depositAmount?: number;
  deliveryCost?: number;
  documentType: DocumentType;
  printOptions: PrintOptions;
  onClose: () => void;
  agreedDeliveryDate?: string;
  onAgreedDeliveryDateChange?: (date: string) => void;
  sellerNotes?: string;
  onSellerNotesChange?: (notes: string) => void;
}

const C = { green: "#1B5E38", gold: "#C9A84C", dark: "#0D1F17", cream: "#F5F0E8", text: "#374151" };

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
};

export default function PrintModal({
  orderItems,
  orderNumber,
  customerName,
  customerPhone,
  customerCity,
  totalAmount,
  discountAmount = 0,
  depositAmount = 0,
  deliveryCost = 0,
  documentType,
  printOptions,
  onClose,
  agreedDeliveryDate = "",
  onAgreedDeliveryDateChange,
  sellerNotes = "",
  onSellerNotesChange,
}: PrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [bgBase64, setBgBase64] = useState<string>("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    try {
      const res = await fetch("/letterhead.png");
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => setBgBase64(reader.result as string);
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error("Failed to load background:", e);
    }
    await loadConditionsFromDB();
  }

  async function loadConditionsFromDB() {
    try {
      const { data, error } = await supabase
        .from("document_conditions")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        setConditions(FALLBACK_CONDITIONS[documentType] || FALLBACK_CONDITIONS.devis);
        return;
      }

      let raw: string | null = null;
      if (documentType === "devis") raw = data.devis_conditions;
      else if (documentType === "bon_de_commande") raw = data.bc_conditions;
      else if (documentType === "facture") raw = data.facture_conditions;

      if (!raw) {
        setConditions(FALLBACK_CONDITIONS[documentType] || FALLBACK_CONDITIONS.devis);
        return;
      }

      if (typeof raw === "string") {
        setConditions(raw.split("\n").filter(Boolean));
      } else if (Array.isArray(raw)) {
        setConditions(raw);
      } else {
        setConditions(FALLBACK_CONDITIONS[documentType] || FALLBACK_CONDITIONS.devis);
      }
    } catch (e) {
      console.error("Failed to load conditions from DB:", e);
      setConditions(FALLBACK_CONDITIONS[documentType] || FALLBACK_CONDITIONS.devis);
    }
  }

  const displayConditions = React.useMemo(() => {
    if (documentType === "bon_de_commande" && agreedDeliveryDate) {
      return conditions.map((c) => c.replace("{{deliveryDate}}", agreedDeliveryDate));
    }
    return conditions;
  }, [conditions, documentType, agreedDeliveryDate]);

  async function generatePdfBlob(): Promise<Blob | null> {
    if (!printRef.current) return null;
    setLoading(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        windowWidth: 794,
        windowHeight: 1123,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const w = pdf.internal.pageSize.getWidth();
      const h = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, "PNG", 0, 0, w, h);
      return pdf.output("blob");
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }

  const handleDownload = async () => {
    const blob = pdfBlob || await generatePdfBlob();
    if (!blob) return;
    setPdfBlob(blob);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docTitle(documentType, printOptions.language).replace(/\s/g, "_")}_${orderNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    setDone("تم التحميل");
    setTimeout(() => setDone(null), 2000);
  };

  const handlePrint = async () => {
    const blob = pdfBlob || await generatePdfBlob();
    if (!blob) return;
    setPdfBlob(blob);
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.addEventListener("load", () => {
        printWindow.print();
      });
    }
    setDone("تم فتح الطباعة");
    setTimeout(() => setDone(null), 2000);
  };

  const handleWhatsApp = async () => {
    const blob = pdfBlob || await generatePdfBlob();
    if (!blob) return;
    setPdfBlob(blob);
    const phone = customerPhone.replace(/\D/g, "");
    if (!phone) {
      alert("الزبون ليس لديه رقم هاتف");
      return;
    }
    const title = docTitle(documentType, printOptions.language);
    const msg = encodeURIComponent(
      `مرحباً ${customerName}،\n` +
      `إليك ${title} رقم ${orderNumber}\n` +
      (agreedDeliveryDate ? `📅 موعد التسليم المتفق عليه: ${agreedDeliveryDate}\n` : "") +
      (sellerNotes ? `📝 ملاحظة: ${sellerNotes}\n` : "") +
      `المجموع: ${actualTotal} ${t(printOptions.language, "currency_symbol")}\n` +
      `تم إرفاق الملف PDF.`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s/g, "_")}_${orderNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    setDone("تم فتح واتساب وتحميل الملف");
    setTimeout(() => setDone(null), 3000);
  };

  const itemsSubtotal = orderItems.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);
  const actualTotal = totalAmount || itemsSubtotal;
  const actualDiscount = discountAmount || 0;
  const actualDelivery = deliveryCost || 0;
  const actualDeposit = depositAmount || 0;
  const actualRemaining = Math.max(0, actualTotal - actualDeposit);
  const title = docTitle(documentType, printOptions.language);
  const today = new Date().toLocaleDateString("ar-MA", { year: "numeric", month: "long", day: "numeric" });
  const lang = printOptions.language;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold" style={{ color: C.dark }}>{title}</h2>
            <p className="text-sm text-gray-500">#{orderNumber} — {customerName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {done && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700 text-sm font-bold">
              <Check className="w-4 h-4" /> {done}
            </div>
          )}

          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <label className="flex items-center gap-2 text-sm font-bold text-amber-800 mb-2">
              <span>📅</span> موعد التسليم المتفق عليه
            </label>
            <input
              type="text"
              value={agreedDeliveryDate}
              onChange={(e) => onAgreedDeliveryDateChange?.(e.target.value)}
              placeholder="مثال: 20/08/2026 أو 5-7 أسابيع"
              className="w-full p-3 rounded-lg border-2 border-amber-200 text-right font-bold text-amber-900 bg-white focus:border-amber-500 focus:outline-none transition-colors text-sm"
            />
            <p className="text-xs text-amber-600 mt-1">سيظهر في بون دي كوماند ويُرسل للزبون</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <label className="flex items-center gap-2 text-sm font-bold text-blue-800 mb-2">
              <span>📝</span> ملاحظات خاصة (تظهر في المستند)
            </label>
            <textarea
              value={sellerNotes}
              onChange={(e) => onSellerNotesChange?.(e.target.value)}
              placeholder="مثال: القماش غير متوفر حالياً، سنتصل بك..."
              rows={3}
              className="w-full p-3 rounded-lg border-2 border-blue-200 text-right font-bold text-blue-900 bg-white focus:border-blue-500 focus:outline-none transition-colors text-sm resize-none"
            />
            <p className="text-xs text-blue-600 mt-1">تظهر في أسفل بيانات الزبون في PDF</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>الشروط المحملة: {displayConditions.length} بند</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button onClick={handlePrint} disabled={loading}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-xl font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: C.green }}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
              طباعة المستند
            </button>
            <button onClick={handleDownload} disabled={loading}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-xl font-bold border-2 transition hover:bg-gray-50 disabled:opacity-50"
              style={{ borderColor: C.gold, color: C.gold }}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              تحميل PDF
            </button>
            <button onClick={handleWhatsApp} disabled={loading || !customerPhone}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-xl font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "#25D366" }}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
              إرسال عبر واتساب
            </button>
            {!customerPhone && <p className="text-xs text-red-500 text-center">الزبون ليس لديه رقم هاتف</p>}
          </div>
        </div>

        <div className="px-5 pb-4 text-center flex-shrink-0">
          <p className="text-xs text-gray-400">{orderItems.length} منتجات | المجموع: {actualTotal} {t(lang, "currency_symbol")}</p>
        </div>
      </div>

      {bgBase64 && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={printRef} dir="rtl"
            style={{
              width: "210mm", minHeight: "297mm", fontFamily: "'Cairo','Amiri',sans-serif",
              fontSize: "10px", color: C.dark,
              background: `url(${bgBase64}) no-repeat center top`, backgroundSize: "210mm 297mm",
              padding: "85px 38px 52px 38px", boxSizing: "border-box",
            }}>

            <div style={{ textAlign: "right", marginBottom: "8px" }}>
              <h1 style={{ fontSize: "20px", fontWeight: 700, color: C.green, margin: 0 }}>{title}</h1>
              <p style={{ fontSize: "9px", color: "#6B7280", margin: "2px 0 0 0" }}>
                {t(lang, "order_number")}: {orderNumber} | {t(lang, "date")}: {today}
              </p>
            </div>

            <div style={{ marginBottom: "6px", padding: "6px", background: "rgba(245,240,232,0.6)", borderRadius: "3px", borderRight: `2px solid ${C.gold}` }}>
              <h3 style={{ fontSize: "11px", fontWeight: 700, color: C.green, margin: "0 0 4px 0" }}>{t(lang, "client")}</h3>
              <Row label={t(lang, "client")} value={customerName} />
              <Row label={t(lang, "phone")} value={customerPhone} />
              {customerCity && <Row label={t(lang, "city")} value={customerCity} />}
              {agreedDeliveryDate && <Row label="📅 موعد التسليم" value={agreedDeliveryDate} valueColor={C.gold} />}
              {sellerNotes && (
                <div style={{ marginTop: "4px", padding: "4px", background: "rgba(59,130,246,0.1)", borderRadius: "3px", borderRight: "2px solid #3B82F6" }}>
                  <span style={{ fontSize: "8px", color: "#3B82F6", fontWeight: 700 }}>ملاحظات: </span>
                  <span style={{ fontSize: "9px", color: C.dark }}>{sellerNotes}</span>
                </div>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: "11px", fontWeight: 700, color: C.green, margin: "0 0 4px 0" }}>{t(lang, "products")} ({orderItems.length})</h3>
              {orderItems.map((item, idx) => (
                <div key={item.id} style={{ marginBottom: "4px", padding: "4px", border: "1px solid #E5E7EB", borderRadius: "3px", background: "rgba(249,250,251,0.7)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px", paddingBottom: "2px", borderBottom: "1px solid #E5E7EB" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: C.green, color: "#fff", fontSize: "8px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{idx + 1}</span>
                      <span style={{ fontWeight: 700, fontSize: "11px" }}>{item.productName}</span>
                      <span style={{ fontSize: "8px", color: "#6B7280" }}>({item.productType})</span>
                    </div>
                    {printOptions.includePrices && (
                      <span style={{ fontWeight: 700, fontSize: "11px", color: C.gold }}>{item.totalPrice} {t(lang, "currency_symbol")}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {printOptions.includePrices && (
              <div style={{ marginTop: "5px", padding: "6px", background: "rgba(245,240,232,0.7)", borderRadius: "3px", border: `1px solid ${C.gold}45` }}>
                <h3 style={{ fontSize: "11px", fontWeight: 700, color: C.green, margin: "0 0 4px 0" }}>{t(lang, "total")}</h3>
                <Row label={t(lang, "subtotal")} value={`${itemsSubtotal} ${t(lang, "currency_symbol")}`} />
                {actualDiscount > 0 && <Row label={t(lang, "discount")} value={`-${actualDiscount} ${t(lang, "currency_symbol")}`} valueColor="#DC2626" />}
                {actualDelivery > 0 && <Row label={t(lang, "delivery")} value={`+${actualDelivery} ${t(lang, "currency_symbol")}`} />}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px", paddingTop: "3px", borderTop: `1px solid ${C.gold}45` }}>
                  <span style={{ fontWeight: 700, fontSize: "13px", color: C.green }}>{t(lang, "total")}</span>
                  <span style={{ fontWeight: 700, fontSize: "13px", color: C.green }}>{actualTotal} {t(lang, "currency_symbol")}</span>
                </div>
                {actualDeposit > 0 && (
                  <>
                    <Row label={t(lang, "deposit")} value={`${actualDeposit} ${t(lang, "currency_symbol")}`} />
                    <Row label={t(lang, "remaining")} value={`${actualRemaining} ${t(lang, "currency_symbol")}`} valueColor={C.gold} />
                  </>
                )}
              </div>
            )}

            {displayConditions.length > 0 && (
              <div style={{ marginTop: "5px", padding: "5px", background: "rgba(249,250,251,0.6)", borderRadius: "3px" }}>
                <h3 style={{ fontSize: "10px", fontWeight: 700, color: C.green, margin: "0 0 3px 0" }}>{t(lang, "conditions_title")}</h3>
                {displayConditions.map((c, i) => (
                  <p key={i} style={{ fontSize: "8px", color: C.text, margin: "0 0 1px 0", lineHeight: 1.4 }}>{c}</p>
                ))}
              </div>
            )}

            {printOptions.includeSignatures && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", paddingTop: "4px" }}>
                <SigBox label={t(lang, "signature_customer")} name={customerName} />
                <SigBox label={t(lang, "signature_seller")} name="Ameublement et Déco El Mahboubi" />
              </div>
            )}

            {printOptions.includeQrCode && (
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=0&data=${encodeURIComponent(`${title} #${orderNumber}`)}`}
                alt="" style={{ position: "absolute", bottom: "60px", left: "38px", width: "40px", height: "40px" }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1px" }}>
      <span style={{ color: "#6B7280", fontSize: "9px" }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: "10px", color: valueColor || C.dark }}>{value}</span>
    </div>
  );
}

function SigBox({ label, name }: { label: string; name: string }) {
  return (
    <div style={{ width: "42%", textAlign: "center" }}>
      <p style={{ fontSize: "9px", fontWeight: 700, color: "#6B7280", margin: 0 }}>{label}</p>
      <div style={{ borderBottom: "1px solid #374151", marginTop: "18px", marginBottom: "2px" }} />
      <p style={{ fontSize: "8px", color: "#6B7280", margin: 0 }}>{name}</p>
    </div>
  );
}