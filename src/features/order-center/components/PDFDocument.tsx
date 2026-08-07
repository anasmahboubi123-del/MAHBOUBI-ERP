"use client";

import React from "react";
import {
  Document, Page, Text, View, Image, StyleSheet, Font,
} from "@react-pdf/renderer";
import type { OrderItem, DocumentLanguage, PrintOptions } from "../types";
import { docTitle, t } from "../i18n/documents";

Font.register({
  family: "Amiri",
  src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Regular.ttf",
});
Font.register({
  family: "AmiriBold",
  src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Bold.ttf",
});

const C = {
  green: "#1B5E38",
  gold: "#C9A84C",
  dark: "#0D1F17",
  text: "#374151",
  textLight: "#6B7280",
  red: "#DC2626",
};

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
  conditions?: string[]; // ✅ NEW: loaded from DB
  bgBase64: string;
}

const PAGE_W = 595;
const PAGE_H = 842;
const SAFE_TOP = 92;
const SAFE_BOTTOM = 58;
const SAFE_LEFT = 42;
const SAFE_RIGHT = 42;

const styles = StyleSheet.create({
  page: {
    position: "relative",
    width: PAGE_W,
    height: PAGE_H,
    fontFamily: "Amiri",
    fontSize: 10,
    color: C.dark,
  },
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
  content: {
    position: "absolute",
    top: SAFE_TOP,
    left: SAFE_LEFT,
    right: SAFE_RIGHT,
    bottom: SAFE_BOTTOM,
    zIndex: 1,
  },
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
  qrCode: {
    width: 45,
    height: 45,
    position: "absolute",
    bottom: SAFE_BOTTOM + 5,
    left: SAFE_LEFT,
  },
});

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
  conditions = [], // ✅ from DB
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.bgWrap}>
          <Image src={bgBase64} style={styles.bgImage} />
        </View>

        <View style={styles.content}>
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
              </View>
            ))}
          </View>

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

          {/* ✅ Conditions from DB */}
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

          {printOptions.includeQrCode && (
            <Image src={qrSrc} style={styles.qrCode} />
          )}
        </View>
      </Page>
    </Document>
  );
}