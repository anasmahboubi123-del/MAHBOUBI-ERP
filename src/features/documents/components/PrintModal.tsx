"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Printer, X, Phone, Download, FileText, Check,
  Tag, Info, Ruler, Box, Scissors, Palette, Layers, QrCode, Stamp,
} from "lucide-react";
import type { DocumentType } from "@/features/order-center/types";
import { getDocumentConditions } from "@/features/order-center/services/documentConditions";
import { getDocumentBackgroundUrl } from "@/features/order-center/services/documentBackgrounds";
import {
  loadBusinessProfile,
  getPublicUrl,
  getDisplayName,
  type BusinessProfile,
} from "@/features/order-center/services/businessProfile";

// Re-exported so `import type { DocumentType } from ".../PrintModal"` (as used
// in page.tsx) keeps working, while the actual definition stays single-source
// in @/features/order-center/types — no more duplicate/conflicting DocumentType.
export type { DocumentType };

const C = { green: "#1B5E38", gold: "#C9A84C", dark: "#0D1F17", cream: "#F5F0E8" };

/* ═══════════════════════════════════════════════════════════
   Internal Types
   ═══════════════════════════════════════════════════════════ */
export interface OrderItem {
  id: string;
  orderItemId: string;
  productType: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  details?: Record<string, any>;
  calculations?: Record<string, any>;
  thumbnailUrl?: string;
  addedAt?: string;
}

export interface PrintOptions {
  documentType: DocumentType;
  printVariant: string;
  language: "ar" | "fr" | "bilingual";
  includeProductionDetails: boolean;
  includePrices: boolean;
  includeCosts: boolean;
  includeSignatures: boolean;
  includeQrCode: boolean;
  includeStamp: boolean;
}

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
}

/* ═══════════════════════════════════════════════════════════
   PrintModal
   ═══════════════════════════════════════════════════════════ */
function PrintModal(props: PrintModalProps) {
  const {
    orderItems, orderNumber, customerName, customerPhone, customerCity,
    totalAmount, discountAmount = 0, depositAmount = 0, deliveryCost = 0,
    documentType, printOptions, onClose,
  } = props;

  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoError, setLogoError] = useState(false);
  const [bgUrl, setBgUrl] = useState<string>("");
  const [bgError, setBgError] = useState(false);
  const [stampUrl, setStampUrl] = useState<string>("");
  const [stampError, setStampError] = useState(false);
  const [conditions, setConditions] = useState<string[]>([]);
  const [showConditions, setShowConditions] = useState(true);
  const [showSignatures, setShowSignatures] = useState(printOptions.includeSignatures ?? true);
  const [showPrices, setShowPrices] = useState(printOptions.includePrices ?? true);
  const [showDetails, setShowDetails] = useState(printOptions.includeProductionDetails ?? true);
  const [showQrCode, setShowQrCode] = useState(printOptions.includeQrCode ?? false);
  const [showStamp, setShowStamp] = useState(printOptions.includeStamp ?? false);
  const [lang, setLang] = useState<"ar" | "fr" | "bilingual">(printOptions.language || "ar");
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  /* ── Load business profile (logo/stamp/address live here now), the
     per-document-type background, and the conditions list ── */
  useEffect(() => {
    let cancelled = false;

    async function loadAssets() {
      setLogoError(false);
      setBgError(false);
      setStampError(false);

      const [biz, bg, conds] = await Promise.all([
        loadBusinessProfile(),
        getDocumentBackgroundUrl(documentType),
        getDocumentConditions(documentType),
      ]);

      if (cancelled) return;

      setProfile(biz);

      const logo = getPublicUrl(biz.logo_url);
      if (logo) setLogoUrl(logo); else setLogoError(true);

      const stamp = getPublicUrl(biz.stamp_url);
      if (stamp) setStampUrl(stamp); else setStampError(true);

      if (bg) setBgUrl(bg); else setBgError(true);

      setConditions(conds);
    }

    loadAssets();
    return () => { cancelled = true; };
  }, [documentType]);

  /* ── Helpers ── */
  const docTitle: Record<DocumentType, string> = {
    devis: lang === "fr" ? "DEVIS" : lang === "bilingual" ? "DEVIS — عرض سعر" : "عرض سعر",
    bon_de_commande: lang === "fr" ? "BON DE COMMANDE" : lang === "bilingual" ? "BON DE COMMANDE — أمر شراء" : "بون دي كوموند",
    facture: lang === "fr" ? "FACTURE" : lang === "bilingual" ? "FACTURE — فاتورة" : "فاتورة",
  };

  const t = (ar: string, fr: string) => {
    if (lang === "ar") return ar;
    if (lang === "fr") return fr;
    return `${ar} / ${fr}`;
  };

  const formatDate = () => new Date().toLocaleDateString(lang === "fr" ? "fr-FR" : "ar-MA", {
    year: "numeric", month: "long", day: "numeric",
  });

  const businessName = profile ? getDisplayName(profile) : t("المحبوبي للأثاث والديكور", "El Mahboubi");

  /* ── FIX: Calculate subtotal from items, not from potentially zero total ── */
  const itemsSubtotal = orderItems.reduce((sum, it) => sum + (it.totalPrice || 0), 0);
  const actualTotal = totalAmount || itemsSubtotal;
  const actualDiscount = discountAmount || 0;
  const actualDelivery = deliveryCost || 0;
  const actualDeposit = depositAmount || 0;
  const actualRemaining = Math.max(0, actualTotal - actualDeposit);

  /* ── Print / PDF — both render at A4 via the permanent @page rule below,
     so "طباعة" and "PDF" no longer produce different page sizes ── */
  const handlePrint = () => window.print();

  const handleExportPDF = () => {
    setIsExporting(true);
    window.print();
    setTimeout(() => setIsExporting(false), 800);
  };

  const handleWhatsApp = () => {
    const phone = customerPhone?.replace(/\s/g, "").replace(/^0/, "212");
    const msg = `${t("مرحباً", "Bonjour")} ${customerName}،\n\n` +
      `${t("طلبك رقم", "Votre commande N°")} *${orderNumber}*\n` +
      `${t("المبلغ الإجمالي", "Montant total")}: *${actualTotal.toLocaleString()} ${t("د.م", "DH")}*\n\n` +
      `${t("شكراً لثقتكم", "Merci de votre confiance")} 🪑`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  /* QR code payload — currently encodes order info as plain text so it works
     with no extra setup. Swap `qrData` for a real order-tracking URL once
     you have a public order-view page. Uses the free api.qrserver.com
     endpoint so no new npm dependency is required; swap for a local library
     like `qrcode.react` if you'd rather not hit an external API at print
     time / need it to work offline. */
  const qrData = encodeURIComponent(
    `${docTitle[documentType]} #${orderNumber} — ${customerName} — ${actualTotal.toLocaleString()} DH`
  );
  const qrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=0&data=${qrData}`;

  /* ── Product Renderer ── */
  const renderProduct = (item: OrderItem, idx: number) => {
    const d = item.details || {};
    const hasDetails = Object.keys(d).length > 0;

    return (
      <div key={item.orderItemId} className="product-section mb-4">
        {/* Header */}
        <div className="product-header flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="product-index">{idx + 1}</span>
            <span className="product-name">{item.productName || t("منتج", "Produit")}</span>
            <span className="product-type">({item.productType})</span>
          </div>
          {showPrices && (
            <span className="product-total">{(item.totalPrice || 0).toLocaleString()} {t("د.م", "DH")}</span>
          )}
        </div>

        {/* Details */}
        {showDetails && hasDetails && (
          <div className="product-details">
            {/* FOAM */}
            {item.productType === "foam" && <>
              {d.product?.name && <DetailRow icon={<Box className="w-3 h-3" />} label={t("المنتج", "Produit")} value={d.product.name} />}
              {d.height_cm && <DetailRow icon={<Ruler className="w-3 h-3" />} label={t("الارتفاع", "Hauteur")} value={`${d.height_cm} ${t("سم", "cm")}`} />}
              {d.width_cm && <DetailRow icon={<Ruler className="w-3 h-3" />} label={t("العرض", "Largeur")} value={`${d.width_cm} ${t("سم", "cm")}`} />}
              {d.seddars && Array.isArray(d.seddars) && d.seddars.length > 0 && (
                <div className="seddars-section">
                  <p className="section-label">{t("السدادر", "Seddars")}:</p>
                  {d.seddars.map((s: any, i: number) => (
                    <div key={i} className="seddari-row">
                      <span>#{s.index} — {t("الطول", "Long.")}: {s.length_m}m</span>
                      {showPrices && s.price ? <span>{s.price.toLocaleString()} {t("د.م", "DH")}</span> : null}
                    </div>
                  ))}
                </div>
              )}
              {d.corners?.has_corners === true && (
                <div className="corners-section">
                  <p className="section-label">{t("الفورمجة", "Formage")}: ✅</p>
                  {d.corners.square?.qty > 0 && <DetailRow label={t("مربعة", "Carré")} value={`× ${d.corners.square.qty} = ${(d.corners.square.total || 0).toLocaleString()} ${t("د.م", "DH")}`} />}
                  {d.corners.triangle?.qty > 0 && <DetailRow label={t("مثلثة", "Triangle")} value={`× ${d.corners.triangle.qty} = ${(d.corners.triangle.total || 0).toLocaleString()} ${t("د.م", "DH")}`} />}
                </div>
              )}
              {d.corners?.has_corners === false && <p className="text-gray-400 text-xs">{t("الفورمجة: لا", "Formage: Non")} ❌</p>}
              {d.price_adjustment && (
                <div className="price-adjustment">
                  <p>{t("تعديل السعر", "Ajustement")}: {d.price_adjustment.type === "discount" ? "-" : "+"}{d.price_adjustment.value} {t("د.م", "DH")}</p>
                  {d.price_adjustment.reason && <p className="text-xs text-gray-500">{d.price_adjustment.reason}</p>}
                </div>
              )}
            </>}

            {/* WOOD */}
            {item.productType === "wood" && <>
              {d.model?.name && <DetailRow icon={<Box className="w-3 h-3" />} label={t("الموديل", "Modèle")} value={`${d.model.name} (${d.model.code || ""})`} />}
              {d.model?.wood_type && <DetailRow icon={<Palette className="w-3 h-3" />} label={t("نوع الخشب", "Bois")} value={d.model.wood_type} />}
              {d.salonShape && <DetailRow icon={<Layers className="w-3 h-3" />} label={t("الشكل", "Forme")} value={d.salonShape} />}
              {d.seddars && Array.isArray(d.seddars) && d.seddars.length > 0 && (
                <div className="seddars-section">
                  <p className="section-label">{t("السدادر", "Seddars")}:</p>
                  {d.seddars.map((s: any, i: number) => (
                    <div key={i} className="seddari-row">
                      <span>#{s.index} — {s.length_cm}×{s.width_cm}×{s.height_cm} {t("سم", "cm")}</span>
                      {s.junction_type && s.junction_type !== "none" && <span className="text-xs text-amber-600">({s.junction_type})</span>}
                      {showPrices && s.price ? <span>{s.price.toLocaleString()} {t("د.م", "DH")}</span> : null}
                    </div>
                  ))}
                </div>
              )}
              {d.extras && Object.entries(d.extras).filter(([_, v]: [string, any]) => v?.qty > 0).length > 0 && (
                <div className="extras-section">
                  <p className="section-label">{t("الإضافات", "Accessoires")}:</p>
                  {Object.entries(d.extras).filter(([_, v]: [string, any]) => v?.qty > 0).map(([k, v]: [string, any]) => (
                    <DetailRow key={k} label={v.item_name || k} value={`× ${v.qty} = ${(v.total || 0).toLocaleString()} ${t("د.م", "DH")}`} />
                  ))}
                </div>
              )}
            </>}

            {/* SALON */}
            {item.productType === "salon" && <>
              {d.fabric?.name && <DetailRow icon={<Palette className="w-3 h-3" />} label={t("الثوب", "Tissu")} value={`${d.fabric.name} (${d.fabric.price_per_meter || 0} ${t("د.م/م", "DH/m")})`} />}
              {d.seddars && Array.isArray(d.seddars) && d.seddars.length > 0 && (
                <div className="seddars-section">
                  <p className="section-label">{t("السدادر", "Seddars")}:</p>
                  {d.seddars.map((s: any, i: number) => (
                    <div key={i} className="seddari-row">
                      <span>#{s.index} — {s.length_cm}×{s.width_cm}×{s.height_cm} {t("سم", "cm")}</span>
                      {s.junction && s.junction !== "none" && <span className="text-xs">({s.junction})</span>}
                      {showPrices && s.fabric_meters ? <span>{s.fabric_meters}m = {((s.fabric_meters || 0) * (d.fabric?.price_per_meter || 0)).toLocaleString()} {t("د.م", "DH")}</span> : null}
                    </div>
                  ))}
                </div>
              )}
              {d.stitches && Array.isArray(d.stitches) && d.stitches.length > 0 && (
                <div className="stitch-section">
                  <p className="section-label">{t("الخياطة", "Couture")}:</p>
                  {d.stitches.map((s: any, i: number) => (
                    <DetailRow key={i} label={`${t("سداري", "Seddari")} #${s.seddari_index}`} value={`${s.style_name} = ${(s.price || 0).toLocaleString()} ${t("د.م", "DH")}`} />
                  ))}
                  {showPrices && d.stitch_total > 0 && <p className="text-right font-bold text-sm">{t("مجموع الخياطة", "Total couture")}: {d.stitch_total.toLocaleString()} {t("د.م", "DH")}</p>}
                </div>
              )}
              {d.cushions?.enabled === true && (
                <div className="cushions-section">
                  <p className="section-label">{t("المخاد", "Coussins")}: ✅</p>
                  <DetailRow label={t("العدد", "Qté")} value={`${d.cushions.total_count || 0} ${t("مخدة", "coussins")}`} />
                  <DetailRow label={t("الحجم", "Taille")} value={`${d.cushions.size_cm || 0} ${t("سم", "cm")}`} />
                  {showPrices && d.cushions.total ? <DetailRow label={t("السعر", "Prix")} value={`${d.cushions.total.toLocaleString()} ${t("د.م", "DH")}`} /> : null}
                </div>
              )}
              {d.cushions?.enabled === false && <p className="text-gray-400 text-xs">{t("المخاد: لا", "Coussins: Non")} ❌</p>}
              {d.decor_cushions?.enabled === true && (
                <div className="decor-section">
                  <p className="section-label">{t("مخاد الديكور", "Coussins déco")}: ✅</p>
                  {d.decor_cushions.items?.map((it: any, i: number) => (
                    <DetailRow key={i} label={`${it.shape_name} × ${it.count}`} value={`${(it.total || 0).toLocaleString()} ${t("د.م", "DH")}`} />
                  ))}
                </div>
              )}
              {d.decor_cushions?.enabled === false && <p className="text-gray-400 text-xs">{t("مخاد الديكور: لا", "Coussins déco: Non")} ❌</p>}
              {d.extras?.lhayef?.enabled === true && <DetailRow icon={<Scissors className="w-3 h-3" />} label={t("اللحايف", "Franges")} value={`${d.extras.lhayef.length_m || 0}m × ${d.extras.lhayef.price_per_meter || 0} = ${(d.extras.lhayef.total || 0).toLocaleString()} ${t("د.م", "DH")}`} />}
              {d.extras?.tabouria?.enabled === true && <DetailRow icon={<Box className="w-3 h-3" />} label={t("الطابورية", "Tabouret")} value={`${(d.extras.tabouria.total || 0).toLocaleString()} ${t("د.م", "DH")}`} />}
              {d.extras?.custom_items && Array.isArray(d.extras.custom_items) && d.extras.custom_items.length > 0 && (
                <div className="custom-items">
                  <p className="section-label">{t("عناصر مخصصة", "Perso.")}:</p>
                  {d.extras.custom_items.map((ci: any, i: number) => (
                    <DetailRow key={i} label={ci.name} value={`${(ci.price || 0).toLocaleString()} ${t("د.م", "DH")}`} />
                  ))}
                </div>
              )}
            </>}

            {/* KHAMIYA */}
            {item.productType === "khamiya" && <>
              {d.fabric?.name && <DetailRow icon={<Palette className="w-3 h-3" />} label={t("الثوب", "Tissu")} value={d.fabric.name} />}
              {d.shape && <DetailRow icon={<Layers className="w-3 h-3" />} label={t("القص", "Découpe")} value={d.shape === "solid_piece" ? t("قطعة واحدة", "Pièce unique") : d.shape} />}
              {d.fabric?.width_m && d.fabric?.height_m && <DetailRow icon={<Ruler className="w-3 h-3" />} label={t("الأبعاد", "Dim.")} value={`${d.fabric.width_m}m × ${d.fabric.height_m}m`} />}
              {showPrices && d.fabric?.fabric_meters && d.fabric?.price_per_m2 && <DetailRow label={t("الثوب", "Tissu")} value={`${d.fabric.fabric_meters}m × ${d.fabric.price_per_m2} = ${((d.fabric.fabric_meters || 0) * (d.fabric.price_per_m2 || 0)).toLocaleString()} ${t("د.م", "DH")}`} />}
              {d.sewing?.style_name && <DetailRow icon={<Scissors className="w-3 h-3" />} label={t("الخياطة", "Couture")} value={`${d.sewing.style_name} = ${(d.sewing.total_price || 0).toLocaleString()} ${t("د.م", "DH")}`} />}
              {d.aqiq && <DetailRow icon={<Info className="w-3 h-3" />} label={t("العقيق", "Aqiq")} value={`${d.aqiq.shape_name} = ${(d.aqiq.total || 0).toLocaleString()} ${t("د.م", "DH")}`} />}
              {d.background?.enabled === true && <DetailRow icon={<Layers className="w-3 h-3" />} label={t("الخلفية", "Fond")} value={`${d.background.fabric_name} = ${(d.background.total || 0).toLocaleString()} ${t("د.م", "DH")}`} />}
              {d.background?.enabled === false && <p className="text-gray-400 text-xs">{t("الخلفية: لا", "Fond: Non")} ❌</p>}
              {d.additions?.custom && Array.isArray(d.additions.custom) && d.additions.custom.length > 0 && (
                <div className="additions">
                  <p className="section-label">{t("إضافات", "Ajouts")}:</p>
                  {d.additions.custom.map((a: any, i: number) => (
                    <DetailRow key={i} label={a.name} value={`${(a.price || 0).toLocaleString()} ${t("د.م", "DH")}`} />
                  ))}
                </div>
              )}
            </>}

            {/* TAPIS */}
            {item.productType === "tapis" && <>
              {d.calculations?.original_length_m && d.calculations?.original_width_m && <DetailRow icon={<Ruler className="w-3 h-3" />} label={t("القياسات", "Dim.")} value={`${d.calculations.original_length_m}m × ${d.calculations.original_width_m}m`} />}
              {d.calculations?.cut_margin_cm && <DetailRow label={t("هامش القص", "Marge")} value={`+${d.calculations.cut_margin_cm} ${t("سم", "cm")}`} />}
              {d.calculations?.waste_percent && <DetailRow label={t("نسبة الهدر", "Perte")} value={`${d.calculations.waste_percent}%`} />}
              {d.calculations?.final_area_m2 && <DetailRow label={t("المساحة", "Surface")} value={`${d.calculations.final_area_m2} m²`} />}
              {showPrices && d.unit_price && d.calculations?.final_area_m2 && <DetailRow label={t("السعر", "Prix")} value={`${d.calculations.final_area_m2} × ${d.unit_price} = ${(d.total_price || 0).toLocaleString()} ${t("د.م", "DH")}`} />}
            </>}

            {/* FALLBACK: show raw details if no specific renderer matched */}
            {!["foam", "wood", "salon", "khamiya", "tapis"].includes(item.productType) && (
              <div className="fallback-details">
                <p className="section-label">{t("التفاصيل", "Détails")}:</p>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto" style={{ maxHeight: "150px" }}>
                  {JSON.stringify(d, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* If details empty, show a note */}
        {showDetails && !hasDetails && (
          <p className="text-xs text-gray-400 mt-2">{t("لا توجد تفاصيل", "Aucun détail")}</p>
        )}
      </div>
    );
  };

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: "#1a1a1a" }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: C.dark, borderColor: C.gold + "30" }}>
        <div className="flex items-center gap-4">
          <h2 className="text-white font-bold text-lg">{docTitle[documentType]} — #{orderNumber}</h2>
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: C.gold + "20", color: C.gold }}>{formatDate()}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/10 rounded-lg overflow-hidden">
            {(["ar", "fr", "bilingual"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} className={`px-3 py-1.5 text-xs font-bold transition ${lang === l ? "text-white" : "text-gray-400 hover:text-white"}`} style={lang === l ? { background: C.green } : {}}>
                {l === "ar" ? "عربي" : l === "fr" ? "FR" : "AR+FR"}
              </button>
            ))}
          </div>
          <button onClick={handleWhatsApp} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition">
            <Phone className="w-4 h-4" /> WhatsApp
          </button>
          <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50">
            <Download className="w-4 h-4" /> PDF
          </button>
          <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-white transition hover:opacity-90" style={{ background: C.green }}>
            <Printer className="w-4 h-4" /> {t("طباعة", "Imprimer")}
          </button>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"><X className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Settings Bar */}
      <div className="flex items-center gap-4 px-4 py-2 border-b flex-wrap" style={{ background: "#222", borderColor: "#333" }}>
        <ToggleBtn active={showPrices} onClick={() => setShowPrices(!showPrices)} icon={<Tag className="w-3.5 h-3.5" />} label={t("الأسعار", "Prix")} />
        <ToggleBtn active={showDetails} onClick={() => setShowDetails(!showDetails)} icon={<Info className="w-3.5 h-3.5" />} label={t("التفاصيل", "Détails")} />
        <ToggleBtn active={showConditions} onClick={() => setShowConditions(!showConditions)} icon={<FileText className="w-3.5 h-3.5" />} label={t("الشروط", "Conditions")} />
        <ToggleBtn active={showSignatures} onClick={() => setShowSignatures(!showSignatures)} icon={<Check className="w-3.5 h-3.5" />} label={t("التوقيعات", "Signatures")} />
        <ToggleBtn active={showQrCode} onClick={() => setShowQrCode(!showQrCode)} icon={<QrCode className="w-3.5 h-3.5" />} label={t("QR", "QR")} />
        <ToggleBtn active={showStamp} onClick={() => setShowStamp(!showStamp)} icon={<Stamp className="w-3.5 h-3.5" />} label={t("الختم", "Cachet")} />
      </div>

      {/* Document Preview */}
      <div className="flex-1 overflow-auto p-8 flex justify-center" style={{ background: "#2a2a2a" }}>
        <div ref={printRef} className="document-page" style={{ width: "210mm", minHeight: "297mm", background: "#fff", position: "relative", boxShadow: "0 0 20px rgba(0,0,0,0.3)" }}>
          {/* Background Image */}
          {bgUrl && !bgError && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${bgUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: 0.08,
              }}
            />
          )}

          <div className="relative p-10" style={{ fontFamily: "'Segoe UI', 'Tahoma', sans-serif" }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b-2" style={{ borderColor: C.green }}>
              <div className="flex-1">
                {/* Logo */}
                {logoUrl && !logoError ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-16 object-contain mb-2"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="h-16 w-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs border border-gray-200 mb-2">
                    <span>{businessName}</span>
                  </div>
                )}
                <h1 className="text-lg font-bold" style={{ color: C.dark }}>{businessName}</h1>
                <p className="text-xs text-gray-500">{profile?.address || ""}</p>
                <p className="text-xs text-gray-500">{profile?.phone || ""}</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold" style={{ color: C.green }}>{docTitle[documentType]}</h2>
                <p className="text-xs text-gray-500">{t("رقم", "N°")}: <span className="font-bold">{orderNumber}</span></p>
                <p className="text-xs text-gray-500">{t("التاريخ", "Date")}: {formatDate()}</p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-6 p-4 rounded-lg" style={{ background: C.cream }}>
              <h3 className="font-bold text-xs mb-2 uppercase tracking-wide" style={{ color: C.green }}>{t("بيانات الزبون", "Client")}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500 text-xs">{t("الاسم", "Nom")}:</span> <span className="font-bold">{customerName}</span></div>
                <div><span className="text-gray-500 text-xs">{t("الهاتف", "Tél")}:</span> <span className="font-bold">{customerPhone}</span></div>
                {customerCity && <div><span className="text-gray-500 text-xs">{t("المدينة", "Ville")}:</span> <span className="font-bold">{customerCity}</span></div>}
              </div>
            </div>

            {/* Products */}
            <div className="mb-6">
              <h3 className="font-bold text-xs mb-3 pb-1 border-b uppercase tracking-wide" style={{ color: C.green, borderColor: C.gold }}>
                {t("المنتجات", "Produits")} ({orderItems.length})
              </h3>
              <div className="space-y-4">{orderItems.map((item, idx) => renderProduct(item, idx))}</div>
            </div>

            {/* Financial Summary */}
            {showPrices && (
              <div className="mb-6 p-4 rounded-lg border" style={{ background: C.cream, borderColor: C.gold + "40" }}>
                <h3 className="font-bold text-xs mb-3 uppercase tracking-wide" style={{ color: C.green }}>{t("الملخص المالي", "Récapitulatif")}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-xs">{t("المجموع الفرعي", "Sous-total")}</span>
                    <span className="font-medium">{itemsSubtotal.toLocaleString()} {t("د.م", "DH")}</span>
                  </div>
                  {actualDiscount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span className="text-xs">{t("الخصم", "Remise")}</span>
                      <span className="font-medium">-{actualDiscount.toLocaleString()} {t("د.م", "DH")}</span>
                    </div>
                  )}
                  {actualDelivery > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-xs">{t("التوصيل", "Livraison")}</span>
                      <span className="font-medium">+{actualDelivery.toLocaleString()} {t("د.م", "DH")}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-2 border-t" style={{ color: C.green, borderColor: C.gold + "30" }}>
                    <span>{t("الإجمالي", "Total")}</span>
                    <span>{actualTotal.toLocaleString()} {t("د.م", "DH")}</span>
                  </div>
                  {actualDeposit > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span className="text-xs">{t("العربون", "Acompte")}</span>
                      <span className="font-medium">{actualDeposit.toLocaleString()} {t("د.م", "DH")}</span>
                    </div>
                  )}
                  {actualDeposit > 0 && (
                    <div className="flex justify-between font-bold text-amber-700">
                      <span className="text-xs">{t("المتبقي", "Reste")}</span>
                      <span>{actualRemaining.toLocaleString()} {t("د.م", "DH")}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Conditions */}
            {showConditions && conditions.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-xs mb-2 uppercase tracking-wide" style={{ color: C.green }}>{t("الشروط والأحكام", "Conditions")}</h3>
                <ol className="text-xs text-gray-600 space-y-1 mr-4">{conditions.map((c, i) => <li key={i} className="list-decimal">{c}</li>)}</ol>
              </div>
            )}

            {/* Signatures + Stamp + QR */}
            {(showSignatures || showQrCode || showStamp) && (
              <div className="mt-8 pt-4 border-t" style={{ borderColor: "#ddd" }}>
                {showSignatures && (
                  <div className="grid grid-cols-2 gap-8">
                    <div className="text-center">
                      <p className="text-xs font-bold mb-8 uppercase">{t("توقيع الزبون", "Signature client")}</p>
                      <div className="border-t border-gray-400 pt-2 mx-4"><p className="text-xs text-gray-400">{customerName}</p></div>
                    </div>
                    <div className="text-center relative">
                      <p className="text-xs font-bold mb-8 uppercase">{t("توقيع البائع", "Signature vendeur")}</p>
                      <div className="border-t border-gray-400 pt-2 mx-4"><p className="text-xs text-gray-400">{businessName}</p></div>
                      {showStamp && (
                        <div className="absolute" style={{ top: "-14px", left: "16px", transform: "rotate(-8deg)", opacity: 0.85 }}>
                          {stampUrl && !stampError ? (
                            <img
                              src={stampUrl}
                              alt={t("ختم", "Cachet")}
                              className="w-20 h-20 object-contain"
                              onError={() => setStampError(true)}
                            />
                          ) : (
                            <div
                              className="w-20 h-20 rounded-full border-2 flex items-center justify-center text-[10px] text-center px-1"
                              style={{ borderColor: C.green, color: C.green }}
                            >
                              {t("ختم المحل", "Cachet")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Stamp on its own when signatures are hidden but stamp is on */}
                {!showSignatures && showStamp && (
                  <div className="flex justify-end mb-4">
                    {stampUrl && !stampError ? (
                      <img
                        src={stampUrl}
                        alt={t("ختم", "Cachet")}
                        className="w-20 h-20 object-contain"
                        style={{ transform: "rotate(-8deg)", opacity: 0.85 }}
                        onError={() => setStampError(true)}
                      />
                    ) : (
                      <div
                        className="w-20 h-20 rounded-full border-2 flex items-center justify-center text-[10px] text-center px-1"
                        style={{ borderColor: C.green, color: C.green, transform: "rotate(-8deg)", opacity: 0.85 }}
                      >
                        {t("ختم المحل", "Cachet")}
                      </div>
                    )}
                  </div>
                )}

                {showQrCode && (
                  <div className="flex flex-col items-center mt-6">
                    <img src={qrCodeSrc} alt="QR" className="w-[90px] h-[90px]" />
                    <p className="text-[10px] text-gray-400 mt-1">{t("امسح للتحقق من الطلب", "Scannez pour vérifier")}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          body * { visibility: hidden !important; }
          .document-page, .document-page * { visibility: visible !important; }
          .document-page {
            position: absolute !important; left: 0 !important; top: 0 !important;
            width: 210mm !important; min-height: 297mm !important;
            margin: 0 !important; padding: 0 !important;
            box-shadow: none !important; background: white !important;
          }
          .document-page .relative { padding: 15mm !important; }
        }
        .product-section { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; background: #fafafa; }
        .product-header { border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
        .product-index { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: ${C.green}; color: white; font-size: 11px; font-weight: bold; margin-left: 8px; }
        .product-name { font-weight: bold; color: ${C.dark}; font-size: 14px; }
        .product-type { color: #9ca3af; font-size: 11px; margin-right: 4px; }
        .product-total { font-weight: bold; color: ${C.gold}; font-size: 14px; }
        .product-details { margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e5e7eb; }
        .detail-row { display: flex; align-items: center; gap: 6px; padding: 3px 0; font-size: 12px; color: #4b5563; }
        .detail-row .label { color: #9ca3af; min-width: 80px; }
        .detail-row .value { font-weight: 500; }
        .section-label { font-size: 11px; font-weight: bold; color: ${C.green}; margin: 6px 0 4px; }
        .seddari-row { display: flex; justify-content: space-between; padding: 2px 8px; font-size: 12px; color: #4b5563; }
        .price-adjustment { margin-top: 6px; padding: 6px; background: #fef3c7; border-radius: 4px; font-size: 12px; color: #92400e; }
        .corners-section, .cushions-section, .decor-section, .extras-section, .additions, .custom-items, .stitch-section, .fallback-details { margin-top: 6px; padding: 6px; background: #f0fdf4; border-radius: 4px; }
        .fallback-details pre { background: #f3f4f6; padding: 8px; border-radius: 4px; font-size: 10px; direction: ltr; text-align: left; }
      `}</style>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */
function ToggleBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${active ? "text-white" : "text-gray-400 hover:text-white"}`} style={active ? { background: C.green } : { background: "#333" }}>
      {icon} {label}
    </button>
  );
}

function DetailRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="detail-row">
      {icon && <span style={{ color: C.gold }}>{icon}</span>}
      <span className="label">{label}:</span>
      <span className="value">{value}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ✅ FIX: Named export for compatibility
   ═══════════════════════════════════════════ */
export { PrintModal };
export default PrintModal;