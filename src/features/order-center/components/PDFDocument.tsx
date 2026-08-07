"use client";

import React from "react";
import {
  Document, Page, Text, View, Image, StyleSheet, Font,
} from "@react-pdf/renderer";
import type { OrderItem, DocumentLanguage, PrintOptions } from "../types";
import { docTitle, t } from "../i18n/documents";

// ─── Arabic Font ───
Font.register({
  family: "Amiri",
  src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Regular.ttf",
});
Font.register({
  family: "AmiriBold",
  src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Bold.ttf",
});

// ─── Colors ───
const C = {
  green: "#1B5E38",
  gold: "#C9A84C",
  dark: "#0D1F17",
  text: "#374151",
  textLight: "#6B7280",
  red: "#DC2626",
};

// ─── Props ───
interface Props {
  orderItems: OrderItem[];
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerCity?: string;
  totalAmount: number;
  discountAmount?: number;
  depositAmount?: number;
  deliveryCost?: number;
  documentType: "devis" | "bon_de_commande" | "facture";
  printOptions: PrintOptions;
  conditions?: string[];
  bgBase64: string;
}

// ─── A4 dimensions in points ───
const PAGE_W = 595;
const PAGE_H = 842;

// Safe writing area (calculated from letterhead image)
const SAFE_TOP = 92;      // below logo + top decorations
const SAFE_BOTTOM = 58;   // above footer
const SAFE_LEFT = 42;
const SAFE_RIGHT = 42;

// ─── Styles ───
const styles = StyleSheet.create({
  page: {
    position: "relative",
    width: PAGE_W,
    height: PAGE_H,
    fontFamily: "Amiri",
    fontSize: 10,
    color: C.dark,
  },
  // Background that repeats on every page
  bgWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    width: PAGE_W,
    height: PAGE_H,
    zIndex: 0,
  },
  bgImage: {
    width: PAGE_W,
    height: PAGE_H,
  },
  // Content sits inside the safe area
  content: {
    position: "absolute",
    top: SAFE_TOP,
    left: SAFE_LEFT,
    right: SAFE_RIGHT,
    bottom: SAFE_BOTTOM,
    zIndex: 1,
  },
  // ── Doc Title (top-right) ──
  docHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  docTitle: {
    fontSize: 20,
    fontFamily: "AmiriBold",
    color: C.green,
    textAlign: "right",
  },
  docMeta: {
    fontSize: 9,
    color: C.textLight,
    fontFamily: "Amiri",
    textAlign: "right",
    marginTop: 2,
  },
  // ── Customer ──
  section: {
    marginBottom: 6,
    padding: 7,
    backgroundColor: "rgba(245, 240, 232, 0.60)",
    borderRadius: 3,
    borderRightWidth: 2,
    borderRightColor: C.gold,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "AmiriBold",
    color: C.green,
    marginBottom: 3,
    textAlign: "right",
  },
  rowRTL: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  label: {
    color: C.textLight,
    fontSize: 9,
    fontFamily: "Amiri",
    textAlign: "right",
  },
  value: {
    fontFamily: "AmiriBold",
    fontSize: 10,
    textAlign: "right",
  },
  // ── Products ──
  productCard: {
    marginBottom: 5,
    padding: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 3,
    backgroundColor: "rgba(249, 250, 251, 0.70)",
  },
  productHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  productIndex: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: C.green,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },
  productIndexText: {
    color: "#fff",
    fontSize: 8,
    fontFamily: "AmiriBold",
  },
  productName: {
    fontSize: 11,
    fontFamily: "AmiriBold",
    color: C.dark,
    textAlign: "right",
  },
  productType: {
    fontSize: 8,
    color: C.textLight,
    fontFamily: "Amiri",
    marginRight: 4,
    textAlign: "right",
  },
  productTotal: {
    fontSize: 11,
    fontFamily: "AmiriBold",
    color: C.gold,
    textAlign: "left",
  },
  // ── Details ──
  detailRow: {
    flexDirection: "row-reverse",
    marginBottom: 1,
    fontSize: 9,
  },
  detailLabel: {
    color: C.textLight,
    width: 75,
    fontFamily: "Amiri",
    textAlign: "right",
    marginLeft: 4,
  },
  detailValue: {
    fontFamily: "AmiriBold",
    textAlign: "right",
    flex: 1,
  },
  detailBlockTitle: {
    fontSize: 9,
    fontFamily: "AmiriBold",
    color: C.green,
    marginBottom: 1,
    marginTop: 2,
    textAlign: "right",
  },
  detailBlockItem: {
    fontSize: 8,
    color: C.text,
    fontFamily: "Amiri",
    textAlign: "right",
  },
  // ── Totals ──
  totalsBox: {
    marginTop: 5,
    padding: 7,
    backgroundColor: "rgba(245, 240, 232, 0.70)",
    borderRadius: 3,
    borderWidth: 1,
    borderColor: C.gold + "45",
  },
  totalRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  grandTotal: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: C.gold + "45",
  },
  grandTotalText: {
    fontSize: 12,
    fontFamily: "AmiriBold",
    color: C.green,
    textAlign: "right",
  },
  // ── Conditions ──
  conditions: {
    marginTop: 6,
    padding: 5,
    backgroundColor: "rgba(249, 250, 251, 0.60)",
    borderRadius: 3,
  },
  conditionItem: {
    fontSize: 8,
    color: C.text,
    marginBottom: 1,
    lineHeight: 1.4,
    fontFamily: "Amiri",
    textAlign: "right",
  },
  // ── Signatures ──
  signatures: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 4,
  },
  signatureBox: {
    width: "42%",
    alignItems: "center",
  },
  signatureLine: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: C.text,
    marginTop: 18,
    marginBottom: 2,
  },
  signatureLabel: {
    fontSize: 9,
    fontFamily: "AmiriBold",
    color: C.textLight,
    textAlign: "center",
  },
  // ── QR ──
  qrCode: {
    width: 45,
    height: 45,
    position: "absolute",
    bottom: SAFE_BOTTOM + 5,
    left: SAFE_LEFT,
  },
});

// ─── Component ───
export function PDFDocument({
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
  conditions = [],
  bgBase64,
}: Props) {
  const lang = printOptions.language;

  const itemsSubtotal = orderItems.reduce((s, it) => s + (it.totalPrice || 0), 0);
  const actualTotal = totalAmount || itemsSubtotal;
  const actualDiscount = discountAmount || 0;
  const actualDelivery = deliveryCost || 0;
  const actualDeposit = depositAmount || 0;
  const actualRemaining = Math.max(0, actualTotal - actualDeposit);

  const title = docTitle(documentType, lang);
  const today = new Date().toLocaleDateString(
    lang === "fr" ? "fr-FR" : lang === "es" ? "es-ES" : lang === "it" ? "it-IT" : "ar-MA",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const qrData = encodeURIComponent(`${title} #${orderNumber} — ${customerName}`);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=0&data=${qrData}`;

  // ─── Render Product Details ───
  const renderProductDetails = (item: OrderItem) => {
    const d = item.details || {};
    const rows: React.ReactNode[] = [];

    // FOAM
    if (item.productType === "foam") {
      if (d.product?.name) rows.push(<Detail key="p" label={t(lang, "fabric")} value={d.product.name} />);
      if (d.height_cm) rows.push(<Detail key="h" label={t(lang, "height")} value={`${d.height_cm} cm`} />);
      if (d.width_cm) rows.push(<Detail key="w" label={t(lang, "width")} value={`${d.width_cm} cm`} />);
      if (d.seddars?.length > 0) {
        rows.push(
          <View key="seddars" style={{ marginTop: 2 }}>
            <Text style={styles.detailBlockTitle}>{t(lang, "seddars")}:</Text>
            {d.seddars.map((s: any, i: number) => (
              <Text key={i} style={styles.detailBlockItem}>
                #{s.index} — {t(lang, "length")}: {s.length_m}m
                {printOptions.includePrices && s.price ? ` = ${s.price} ${t(lang, "currency_symbol")}` : ""}
              </Text>
            ))}
          </View>
        );
      }
      if (d.corners?.has_corners) {
        rows.push(
          <View key="corners" style={{ marginTop: 2 }}>
            <Text style={styles.detailBlockTitle}>{t(lang, "corners")}: ✅</Text>
            {d.corners.square?.qty > 0 && (
              <Text style={styles.detailBlockItem}>
                {t(lang, "square")} × {d.corners.square.qty} = {d.corners.square.total} {t(lang, "currency_symbol")}
              </Text>
            )}
            {d.corners.triangle?.qty > 0 && (
              <Text style={styles.detailBlockItem}>
                {t(lang, "triangle")} × {d.corners.triangle.qty} = {d.corners.triangle.total} {t(lang, "currency_symbol")}
              </Text>
            )}
          </View>
        );
      }
    }

    // WOOD
    if (item.productType === "wood") {
      if (d.model?.name) rows.push(<Detail key="m" label={t(lang, "fabric")} value={`${d.model.name} (${d.model.code || ""})`} />);
      if (d.model?.wood_type) rows.push(<Detail key="wt" label={t(lang, "fabric")} value={d.model.wood_type} />);
      if (d.salonShape) rows.push(<Detail key="sh" label={t(lang, "shape")} value={d.salonShape} />);
      if (d.seddars?.length > 0) {
        rows.push(
          <View key="seddars" style={{ marginTop: 2 }}>
            <Text style={styles.detailBlockTitle}>{t(lang, "seddars")}:</Text>
            {d.seddars.map((s: any, i: number) => (
              <Text key={i} style={styles.detailBlockItem}>
                #{s.index} — {s.length_cm}×{s.width_cm}×{s.height_cm} cm
                {s.junction_type && s.junction_type !== "none" ? ` (${s.junction_type})` : ""}
                {printOptions.includePrices && s.price ? ` = ${s.price} ${t(lang, "currency_symbol")}` : ""}
              </Text>
            ))}
          </View>
        );
      }
      if (d.extras) {
        const activeExtras = Object.entries(d.extras).filter(([_, v]: [string, any]) => v?.qty > 0);
        if (activeExtras.length > 0) {
          rows.push(
            <View key="extras" style={{ marginTop: 2 }}>
              <Text style={styles.detailBlockTitle}>{t(lang, "extras")}:</Text>
              {activeExtras.map(([k, v]: [string, any]) => (
                <Text key={k} style={styles.detailBlockItem}>
                  {v.item_name || k} × {v.qty} = {v.total} {t(lang, "currency_symbol")}
                </Text>
              ))}
            </View>
          );
        }
      }
    }

    // SALON
    if (item.productType === "salon") {
      if (d.fabric?.name) rows.push(<Detail key="f" label={t(lang, "fabric")} value={d.fabric.name} />);
      if (d.seddars?.length > 0) {
        rows.push(
          <View key="seddars" style={{ marginTop: 2 }}>
            <Text style={styles.detailBlockTitle}>{t(lang, "seddars")}:</Text>
            {d.seddars.map((s: any, i: number) => (
              <Text key={i} style={styles.detailBlockItem}>
                #{s.index} — {s.length_cm}×{s.width_cm}×{s.height_cm} cm
                {s.junction && s.junction !== "none" ? ` (${s.junction})` : ""}
                {printOptions.includePrices && s.fabric_meters ? ` = ${s.fabric_meters}m` : ""}
              </Text>
            ))}
          </View>
        );
      }
      if (d.stitches?.length > 0) {
        rows.push(
          <View key="stitch" style={{ marginTop: 2 }}>
            <Text style={styles.detailBlockTitle}>{t(lang, "stitch")}:</Text>
            {d.stitches.map((s: any, i: number) => (
              <Text key={i} style={styles.detailBlockItem}>
                {t(lang, "seddars")} #{s.seddari_index}: {s.style_name} = {s.price} {t(lang, "currency_symbol")}
              </Text>
            ))}
          </View>
        );
      }
      if (d.cushions?.enabled) {
        rows.push(
          <View key="cushions" style={{ marginTop: 2 }}>
            <Text style={styles.detailBlockTitle}>{t(lang, "cushions")}: ✅</Text>
            <Text style={styles.detailBlockItem}>
              {t(lang, "quantity")}: {d.cushions.total_count} | {t(lang, "height")}: {d.cushions.size_cm} cm
              {printOptions.includePrices ? ` = ${d.cushions.total} ${t(lang, "currency_symbol")}` : ""}
            </Text>
          </View>
        );
      }
      if (d.decor_cushions?.enabled) {
        rows.push(
          <View key="decor" style={{ marginTop: 2 }}>
            <Text style={styles.detailBlockTitle}>{t(lang, "decor_cushions")}: ✅</Text>
            {d.decor_cushions.items?.map((it: any, i: number) => (
              <Text key={i} style={styles.detailBlockItem}>
                {it.shape_name} × {it.count} = {it.total} {t(lang, "currency_symbol")}
              </Text>
            ))}
          </View>
        );
      }
      if (d.extras?.lhayef?.enabled) {
        rows.push(<Detail key="lh" label={t(lang, "extras")} value={`${d.extras.lhayef.length_m}m = ${d.extras.lhayef.total} ${t(lang, "currency_symbol")}`} />);
      }
    }

    // KHAMIYA
    if (item.productType === "khamiya") {
      if (d.fabric?.name) rows.push(<Detail key="f" label={t(lang, "fabric")} value={d.fabric.name} />);
      if (d.shape) rows.push(<Detail key="sh" label={t(lang, "shape")} value={d.shape === "solid_piece" ? "قطعة واحدة" : d.shape} />);
      if (d.fabric?.width_m && d.fabric?.height_m) {
        rows.push(<Detail key="dim" label={t(lang, "width")} value={`${d.fabric.width_m}m × ${d.fabric.height_m}m`} />);
      }
      if (d.sewing?.style_name) {
        rows.push(<Detail key="sw" label={t(lang, "stitch")} value={`${d.sewing.style_name} = ${d.sewing.total_price} ${t(lang, "currency_symbol")}`} />);
      }
      if (d.aqiq) {
        rows.push(<Detail key="aq" label={t(lang, "fabric")} value={`${d.aqiq.shape_name} = ${d.aqiq.total} ${t(lang, "currency_symbol")}`} />);
      }
      if (d.background?.enabled) {
        rows.push(<Detail key="bg" label={t(lang, "fabric")} value={`${d.background.fabric_name} = ${d.background.total} ${t(lang, "currency_symbol")}`} />);
      }
    }

    // TAPIS
    if (item.productType === "tapis") {
      if (d.calculations?.original_length_m && d.calculations?.original_width_m) {
        rows.push(<Detail key="dim" label={t(lang, "length")} value={`${d.calculations.original_length_m}m × ${d.calculations.original_width_m}m`} />);
      }
      if (d.calculations?.final_area_m2) {
        rows.push(<Detail key="area" label={t(lang, "area")} value={`${d.calculations.final_area_m2} m²`} />);
      }
      if (printOptions.includePrices && d.unit_price && d.calculations?.final_area_m2) {
        rows.push(<Detail key="price" label={t(lang, "total_price")} value={`${d.calculations.final_area_m2} × ${d.unit_price} = ${item.totalPrice} ${t(lang, "currency_symbol")}`} />);
      }
    }

    return <View>{rows}</View>;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Background — repeats on every page via wrap */}
        <View style={styles.bgWrap}>
          <Image src={bgBase64} style={styles.bgImage} />
        </View>

        {/* Content Layer — inside safe area */}
        <View style={styles.content}>
          {/* Doc Title + Meta */}
          <View style={styles.docHeader}>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.docTitle}>{title}</Text>
              <Text style={styles.docMeta}>
                {t(lang, "order_number")}: {orderNumber}
              </Text>
              <Text style={styles.docMeta}>
                {t(lang, "date")}: {today}
              </Text>
            </View>
          </View>

          {/* Customer Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t(lang, "client")}</Text>
            <View style={styles.rowRTL}>
              <Text style={styles.label}>{t(lang, "client")}</Text>
              <Text style={styles.value}>{customerName}</Text>
            </View>
            <View style={styles.rowRTL}>
              <Text style={styles.label}>{t(lang, "phone")}</Text>
              <Text style={styles.value}>{customerPhone}</Text>
            </View>
            {customerCity && (
              <View style={styles.rowRTL}>
                <Text style={styles.label}>{t(lang, "city")}</Text>
                <Text style={styles.value}>{customerCity}</Text>
              </View>
            )}
          </View>

          {/* Products */}
          <View>
            <Text style={styles.sectionTitle}>
              {t(lang, "products")} ({orderItems.length})
            </Text>
            {orderItems.map((item, idx) => (
              <View key={item.id} style={styles.productCard}>
                <View style={styles.productHeader}>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center" }}>
                    <View style={styles.productIndex}>
                      <Text style={styles.productIndexText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.productName}>{item.productName}</Text>
                    <Text style={styles.productType}>({item.productType})</Text>
                  </View>
                  {printOptions.includePrices && (
                    <Text style={styles.productTotal}>
                      {item.totalPrice} {t(lang, "currency_symbol")}
                    </Text>
                  )}
                </View>
                {printOptions.includeProductionDetails && renderProductDetails(item)}
              </View>
            ))}
          </View>

          {/* Financial Summary */}
          {printOptions.includePrices && (
            <View style={styles.totalsBox}>
              <Text style={[styles.sectionTitle, { marginBottom: 3 }]}>
                {t(lang, "total")}
              </Text>
              <View style={styles.totalRow}>
                <Text style={styles.label}>{t(lang, "subtotal")}</Text>
                <Text style={styles.value}>
                  {itemsSubtotal} {t(lang, "currency_symbol")}
                </Text>
              </View>
              {actualDiscount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={[styles.label, { color: C.red }]}>{t(lang, "discount")}</Text>
                  <Text style={[styles.value, { color: C.red }]}>
                    -{actualDiscount} {t(lang, "currency_symbol")}
                  </Text>
                </View>
              )}
              {actualDelivery > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.label}>{t(lang, "delivery")}</Text>
                  <Text style={styles.value}>
                    +{actualDelivery} {t(lang, "currency_symbol")}
                  </Text>
                </View>
              )}
              <View style={styles.grandTotal}>
                <Text style={styles.grandTotalText}>{t(lang, "total")}</Text>
                <Text style={styles.grandTotalText}>
                  {actualTotal} {t(lang, "currency_symbol")}
                </Text>
              </View>
              {actualDeposit > 0 && (
                <>
                  <View style={styles.totalRow}>
                    <Text style={styles.label}>{t(lang, "deposit")}</Text>
                    <Text style={styles.value}>
                      {actualDeposit} {t(lang, "currency_symbol")}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={[styles.label, { color: C.gold }]}>{t(lang, "remaining")}</Text>
                    <Text style={[styles.value, { color: C.gold }]}>
                      {actualRemaining} {t(lang, "currency_symbol")}
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Conditions */}
          {conditions.length > 0 && (
            <View style={styles.conditions}>
              <Text style={[styles.sectionTitle, { marginBottom: 2 }]}>
                {t(lang, "conditions_title")}
              </Text>
              {conditions.map((c, i) => (
                <Text key={i} style={styles.conditionItem}>
                  • {c}
                </Text>
              ))}
            </View>
          )}

          {/* Signatures */}
          {printOptions.includeSignatures && (
            <View style={styles.signatures}>
              <View style={styles.signatureBox}>
                <Text style={styles.signatureLabel}>{t(lang, "signature_customer")}</Text>
                <View style={styles.signatureLine} />
                <Text style={{ fontSize: 8, color: C.textLight, fontFamily: "Amiri", textAlign: "center" }}>
                  {customerName}
                </Text>
              </View>
              <View style={styles.signatureBox}>
                <Text style={styles.signatureLabel}>{t(lang, "signature_seller")}</Text>
                <View style={styles.signatureLine} />
                <Text style={{ fontSize: 8, color: C.textLight, fontFamily: "Amiri", textAlign: "center" }}>
                  Ameublement et Déco El Mahboubi
                </Text>
              </View>
            </View>
          )}

          {/* QR Code */}
          {printOptions.includeQrCode && (
            <Image src={qrSrc} style={styles.qrCode} />
          )}
        </View>
      </Page>
    </Document>
  );
}

// ─── Detail Row Helper ───
function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}