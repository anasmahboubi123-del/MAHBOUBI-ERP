"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { X, Printer, Download, MessageCircle, Loader2, Check, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

export type DocumentType = "devis" | "bon_de_commande" | "facture";
export type DocumentLanguage = "ar" | "fr" | "es" | "it" | "bilingual";

export interface PrintOptions {
  documentType: DocumentType;
  printVariant: "client" | "internal";
  language: DocumentLanguage;
  includeProductionDetails: boolean;
  includePrices: boolean;
  includeCosts: boolean;
  includeSignatures: boolean;
  includeQrCode: boolean;
  includeLocation: boolean;
  includeStamp: boolean;
}

export interface OrderItem {
  id: string;
  productType: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  thumbnailUrl?: string;
  details?: Record<string, any>;
  calculations?: Record<string, any>;
}

/* ═══════════════════════════════════════════════════════════════
   i18n — TRANSLATIONS
   ═══════════════════════════════════════════════════════════════ */

const TRANSLATIONS: Record<string, Record<DocumentLanguage, string>> = {
  order_number: { ar: "رقم الطلب", fr: "N° Commande", es: "N° Pedido", it: "N° Ordine", bilingual: "رقم الطلب / N° Commande" },
  date: { ar: "التاريخ", fr: "Date", es: "Fecha", it: "Data", bilingual: "التاريخ / Date" },
  client: { ar: "الزبون", fr: "Client", es: "Cliente", it: "Cliente", bilingual: "الزبون / Client" },
  phone: { ar: "الهاتف", fr: "Téléphone", es: "Teléfono", it: "Telefono", bilingual: "الهاتف / Téléphone" },
  city: { ar: "المدينة", fr: "Ville", es: "Ciudad", it: "Città", bilingual: "المدينة / Ville" },
  products: { ar: "المنتجات", fr: "Produits", es: "Productos", it: "Prodotti", bilingual: "المنتجات / Produits" },
  subtotal: { ar: "المجموع الفرعي", fr: "Sous-total", es: "Subtotal", it: "Subtotale", bilingual: "المجموع الفرعي / Sous-total" },
  discount: { ar: "الخصم", fr: "Remise", es: "Descuento", it: "Sconto", bilingual: "الخصم / Remise" },
  delivery: { ar: "التوصيل", fr: "Livraison", es: "Entrega", it: "Consegna", bilingual: "التوصيل / Livraison" },
  total: { ar: "الإجمالي", fr: "Total", es: "Total", it: "Totale", bilingual: "الإجمالي / Total" },
  deposit: { ar: "العربون", fr: "Acompte", es: "Depósito", it: "Deposito", bilingual: "العربون / Acompte" },
  remaining: { ar: "المتبقي", fr: "Reste", es: "Restante", it: "Rimanente", bilingual: "المتبقي / Reste" },
  conditions_title: { ar: "الشروط والأحكام", fr: "Conditions", es: "Condiciones", it: "Condizioni", bilingual: "الشروط / Conditions" },
  signature_customer: { ar: "توقيع الزبون", fr: "Signature Client", es: "Firma Cliente", it: "Firma Cliente", bilingual: "توقيع الزبون" },
  signature_seller: { ar: "توقيع البائع", fr: "Signature Vendeur", es: "Firma Vendedor", it: "Firma Venditore", bilingual: "توقيع البائع" },
  currency_symbol: { ar: "د.م", fr: "MAD", es: "MAD", it: "MAD", bilingual: "د.م" },
  location: { ar: "موقع المحل", fr: "Notre Adresse", es: "Nuestra Ubicación", it: "La Nostra Sede", bilingual: "موقع المحل / Notre Adresse" },
  notes: { ar: "ملاحظات", fr: "Notes", es: "Notas", it: "Note", bilingual: "ملاحظات / Notes" },
  agreedDeliveryDate: { ar: "موعد التسليم المتفق عليه", fr: "Date Livraison Convenue", es: "Fecha Entrega Acordada", it: "Data Consegna Concordata", bilingual: "موعد التسليم / Date Convenue" },
};

function t(lang: DocumentLanguage, key: string): string {
  return TRANSLATIONS[key]?.[lang] || TRANSLATIONS[key]?.["ar"] || key;
}

function docTitle(type: DocumentType, lang: DocumentLanguage): string {
  const titles: Record<DocumentType, Record<DocumentLanguage, string>> = {
    devis: { ar: "عرض سعر", fr: "Devis", es: "Presupuesto", it: "Preventivo", bilingual: "عرض سعر / Devis" },
    bon_de_commande: { ar: "بون دي كوموند", fr: "Bon de Commande", es: "Orden de Compra", it: "Ordine d'Acquisto", bilingual: "بون دي كوموند / Bon de Commande" },
    facture: { ar: "فاتورة", fr: "Facture", es: "Factura", it: "Fattura", bilingual: "فاتورة / Facture" },
  };
  return titles[type]?.[lang] || titles[type]?.["ar"] || type;
}

/* ═══════════════════════════════════════════════════════════════
   Date formatter — ensures Arabic display
   ═══════════════════════════════════════════════════════════════ */

function fmtDate(dateStr: string): string {
  if (!dateStr) return "";
  // If ISO date
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    try {
      return new Date(dateStr).toLocaleDateString("ar-MA", {
        year: "numeric", month: "long", day: "numeric"
      });
    } catch { return dateStr; }
  }
  // If already formatted or text like "5-7 أسابيع", return as-is
  return dateStr;
}

/* ═══════════════════════════════════════════════════════════════
   Product Type Names — translated
   ═══════════════════════════════════════════════════════════════ */

const PRODUCT_TYPE_NAMES: Record<string, Record<DocumentLanguage, string>> = {
  tapis: { ar: "زربية", fr: "Tapis", es: "Alfombra", it: "Tappeto", bilingual: "زربية / Tapis" },
  romani: { ar: "رومي", fr: "Romani", es: "Romani", it: "Romani", bilingual: "رومي / Romani" },
  salon: { ar: "صالون", fr: "Salon", es: "Salón", it: "Salotto", bilingual: "صالون / Salon" },
  wood: { ar: "عود", fr: "Bois", es: "Madera", it: "Legno", bilingual: "عود / Bois" },
  khamiya: { ar: "خامية", fr: "Khamiya", es: "Khamiya", it: "Khamiya", bilingual: "خامية / Khamiya" },
  foam: { ar: "اسفنج", fr: "Mousse", es: "Espuma", it: "Schiuma", bilingual: "اسفنج / Mousse" },
};

function getProductTypeName(type: string, lang: DocumentLanguage): string {
  const key = type?.toLowerCase()?.trim();
  return PRODUCT_TYPE_NAMES[key]?.[lang] || PRODUCT_TYPE_NAMES[key]?.["ar"] || type;
}

/* ═══════════════════════════════════════════════════════════════
   Detail Labels — translated by language
   ═══════════════════════════════════════════════════════════════ */

const DETAIL_LABELS: Record<string, Record<DocumentLanguage, string>> = {
  productName: { ar: "اسم المنتج", fr: "Produit", es: "Producto", it: "Prodotto", bilingual: "اسم المنتج / Produit" },
  productType: { ar: "نوع المنتج", fr: "Type", es: "Tipo", it: "Tipo", bilingual: "نوع المنتج / Type" },
  quantity: { ar: "الكمية", fr: "Quantité", es: "Cantidad", it: "Quantità", bilingual: "الكمية / Quantité" },
  unitPrice: { ar: "سعر الوحدة", fr: "Prix Unitaire", es: "Precio Unitario", it: "Prezzo Unitario", bilingual: "سعر الوحدة / Prix U." },
  totalPrice: { ar: "المجموع", fr: "Total", es: "Total", it: "Totale", bilingual: "المجموع / Total" },
  notes: { ar: "ملاحظات", fr: "Notes", es: "Notas", it: "Note", bilingual: "ملاحظات / Notes" },
  description: { ar: "الوصف", fr: "Description", es: "Descripción", it: "Descrizione", bilingual: "الوصف / Description" },
  length: { ar: "الطول", fr: "Longueur", es: "Longitud", it: "Lunghezza", bilingual: "الطول / Longueur" },
  width: { ar: "العرض", fr: "Largeur", es: "Ancho", it: "Larghezza", bilingual: "العرض / Largeur" },
  shape: { ar: "الشكل", fr: "Forme", es: "Forma", it: "Forma", bilingual: "الشكل / Forme" },
  color: { ar: "اللون", fr: "Couleur", es: "Color", it: "Colore", bilingual: "اللون / Couleur" },
  basePrice: { ar: "السعر الأساسي", fr: "Prix de Base", es: "Precio Base", it: "Prezzo Base", bilingual: "السعر الأساسي / Prix Base" },
  area: { ar: "المساحة", fr: "Surface", es: "Superficie", it: "Superficie", bilingual: "المساحة / Surface" },
  finalPrice: { ar: "السعر النهائي", fr: "Prix Final", es: "Precio Final", it: "Prezzo Finale", bilingual: "السعر النهائي / Prix Final" },
  finalArea: { ar: "المساحة النهائية", fr: "Surface Finale", es: "Superficie Final", it: "Superficie Finale", bilingual: "المساحة النهائية / Surface F." },
  rounding: { ar: "التقريب", fr: "Arrondi", es: "Redondeo", it: "Arrotondamento", bilingual: "التقريب / Arrondi" },
  material: { ar: "الخامة", fr: "Matière", es: "Material", it: "Materiale", bilingual: "الخامة / Matière" },
  fabric: { ar: "القماش", fr: "Tissu", es: "Tela", it: "Tessuto", bilingual: "القماش / Tissu" },
  backing: { ar: "الظهر", fr: "Dos", es: "Reverso", it: "Retro", bilingual: "الظهر / Dos" },
  edgeFinish: { ar: "تشطيب الحافة", fr: "Finition Bord", es: "Acabado Borde", it: "Finitura Bordo", bilingual: "تشطيب الحافة / Finition Bord" },
  pattern: { ar: "النقشة", fr: "Motif", es: "Diseño", it: "Motivo", bilingual: "النقشة / Motif" },
  model: { ar: "الموديل", fr: "Modèle", es: "Modelo", it: "Modello", bilingual: "الموديل / Modèle" },
  style: { ar: "الطراز", fr: "Style", es: "Estilo", it: "Stile", bilingual: "الطراز / Style" },
  fabricType: { ar: "نوع القماش", fr: "Type de Tissu", es: "Tipo de Tela", it: "Tipo Tessuto", bilingual: "نوع القماش / Type Tissu" },
  fabricColor: { ar: "لون القماش", fr: "Couleur Tissu", es: "Color Tela", it: "Colore Tessuto", bilingual: "لون القماش / Couleur Tissu" },
  dimensions: { ar: "المقاسات", fr: "Dimensions", es: "Dimensiones", it: "Dimensioni", bilingual: "المقاسات / Dimensions" },
  dimension: { ar: "المقاس", fr: "Dimension", es: "Dimensión", it: "Dimensione", bilingual: "المقاس / Dimension" },
  seats: { ar: "عدد المقاعد", fr: "Places", es: "Plazas", it: "Posti", bilingual: "عدد المقاعد / Places" },
  modules: { ar: "عدد الوحدات", fr: "Modules", es: "Módulos", it: "Moduli", bilingual: "عدد الوحدات / Modules" },
  corner: { ar: "الزاوية", fr: "Coin", es: "Esquina", it: "Angolo", bilingual: "الزاوية / Coin" },
  chaise: { ar: "الشيزلونج", fr: "Méridienne", es: "Chaise Longue", it: "Chaise Longue", bilingual: "الشيزلونج / Méridienne" },
  sleeper: { ar: "النوم", fr: "Couchage", es: "Cama", it: "Letto", bilingual: "النوم / Couchage" },
  storage: { ar: "التخزين", fr: "Rangement", es: "Almacenamiento", it: "Contenitore", bilingual: "التخزين / Rangement" },
  legs: { ar: "الأرجل", fr: "Pieds", es: "Patas", it: "Gambe", bilingual: "الأرجل / Pieds" },
  khamiyaType: { ar: "نوع الخامية", fr: "Type Khamiya", es: "Tipo Khamiya", it: "Tipo Khamiya", bilingual: "نوع الخامية / Type Khamiya" },
  height: { ar: "الارتفاع", fr: "Hauteur", es: "Altura", it: "Altezza", bilingual: "الارتفاع / Hauteur" },
  depth: { ar: "العمق", fr: "Profondeur", es: "Profundidad", it: "Profondità", bilingual: "العمق / Profondeur" },
  thickness: { ar: "السمك", fr: "Épaisseur", es: "Grosor", it: "Spessore", bilingual: "السمك / Épaisseur" },
  filling: { ar: "الحشوة", fr: "Remplissage", es: "Relleno", it: "Imbottitura", bilingual: "الحشوة / Remplissage" },
  cover: { ar: "الغطاء", fr: "Housse", es: "Funda", it: "Copertura", bilingual: "الغطاء / Housse" },
  woodType: { ar: "نوع الخشب", fr: "Type de Bois", es: "Tipo de Madera", it: "Tipo di Legno", bilingual: "نوع الخشب / Type Bois" },
  woodFinish: { ar: "التشطيب", fr: "Finition", es: "Acabado", it: "Finitura", bilingual: "التشطيب / Finition" },
  finish: { ar: "التشطيب", fr: "Finition", es: "Acabado", it: "Finitura", bilingual: "التشطيب / Finition" },
  polish: { ar: "البوليش", fr: "Polish", es: "Pulido", it: "Lucidatura", bilingual: "البوليش / Polish" },
  varnish: { ar: "الورنيش", fr: "Vernis", es: "Barniz", it: "Vernice", bilingual: "الورنيش / Vernis" },
  treatment: { ar: "المعالجة", fr: "Traitement", es: "Tratamiento", it: "Trattamento", bilingual: "المعالجة / Traitement" },
  discount: { ar: "الخصم", fr: "Remise", es: "Descuento", it: "Sconto", bilingual: "الخصم / Remise" },
  discountRate: { ar: "نسبة الخصم", fr: "Taux de Remise", es: "Tasa Descuento", it: "Tasso Sconto", bilingual: "نسبة الخصم / Taux" },
  discountAmount: { ar: "مبلغ الخصم", fr: "Montant Remise", es: "Monto Descuento", it: "Importo Sconto", bilingual: "مبلغ الخصم / Montant" },
  deposit: { ar: "العربون", fr: "Acompte", es: "Depósito", it: "Deposito", bilingual: "العربون / Acompte" },
  depositAmount: { ar: "مبلغ العربون", fr: "Montant Acompte", es: "Monto Depósito", it: "Importo Deposito", bilingual: "مبلغ العربون / Montant" },
  delivery: { ar: "التوصيل", fr: "Livraison", es: "Entrega", it: "Consegna", bilingual: "التوصيل / Livraison" },
  deliveryCost: { ar: "تكلفة التوصيل", fr: "Frais Livraison", es: "Costo Entrega", it: "Costo Consegna", bilingual: "تكلفة التوصيل / Frais" },
  remaining: { ar: "المتبقي", fr: "Reste", es: "Restante", it: "Rimanente", bilingual: "المتبقي / Reste" },
  remainingAmount: { ar: "المبلغ المتبقي", fr: "Montant Restant", es: "Monto Restante", it: "Importo Rimanente", bilingual: "المبلغ المتبقي / Montant Restant" },
  address: { ar: "العنوان", fr: "Adresse", es: "Dirección", it: "Indirizzo", bilingual: "العنوان / Adresse" },
  customerName: { ar: "اسم الزبون", fr: "Nom Client", es: "Nombre Cliente", it: "Nome Cliente", bilingual: "اسم الزبون / Nom Client" },
  deliveryDate: { ar: "موعد التسليم", fr: "Date Livraison", es: "Fecha Entrega", it: "Data Consegna", bilingual: "موعد التسليم / Date Livraison" },
  agreedDeliveryDate: { ar: "موعد التسليم المتفق عليه", fr: "Date Livraison Convenue", es: "Fecha Entrega Acordada", it: "Data Consegna Concordata", bilingual: "موعد التسليم المتفق عليه / Date Convenue" },
  originalLength: { ar: "الطول الأصلي", fr: "Longueur Originale", es: "Longitud Original", it: "Lunghezza Originale", bilingual: "الطول الأصلي / Long. Originale" },
  originalWidth: { ar: "العرض الأصلي", fr: "Largeur Originale", es: "Ancho Original", it: "Larghezza Originale", bilingual: "العرض الأصلي / Larg. Originale" },
  wastePercent: { ar: "نسبة الهدر", fr: "Taux de Perte", es: "Tasa de Desperdicio", it: "Tasso di Spreco", bilingual: "نسبة الهدر / Taux de Perte" },
  waste: { ar: "الهدر", fr: "Perte", es: "Desperdicio", it: "Spreco", bilingual: "الهدر / Perte" },

  // ─── Foam keys ───
  heightCm: { ar: "الارتفاع (سم)", fr: "Hauteur (cm)", es: "Altura (cm)", it: "Altezza (cm)", bilingual: "الارتفاع (سم) / Hauteur (cm)" },
  widthCm: { ar: "العرض (سم)", fr: "Largeur (cm)", es: "Ancho (cm)", it: "Larghezza (cm)", bilingual: "العرض (سم) / Largeur (cm)" },
  lengthCm: { ar: "الطول (سم)", fr: "Longueur (cm)", es: "Longitud (cm)", it: "Lunghezza (cm)", bilingual: "الطول (سم) / Longueur (cm)" },
  foamSeddars: { ar: "السدادر", fr: "Sedari", es: "Sedari", it: "Sedari", bilingual: "السدادر / Sedari" },
  squareCorners: { ar: "زوايا مربعة", fr: "Coins Carrés", es: "Esquinas Cuadradas", it: "Angoli Quadrati", bilingual: "زوايا مربعة / Coins Carrés" },
  triangleCorners: { ar: "زوايا مثلثة", fr: "Coins Triangulaires", es: "Esquinas Triangulares", it: "Angoli Triangolari", bilingual: "زوايا مثلثة / Coins Triangulaires" },
  product: { ar: "النوع", fr: "Type", es: "Tipo", it: "Tipo", bilingual: "النوع / Type" },
  pricePerMeter: { ar: "السعر للمتر", fr: "Prix/m", es: "Precio/m", it: "Prezzo/m", bilingual: "السعر للمتر / Prix/m" },
  defaultPricePerMeter: { ar: "السعر الافتراضي", fr: "Prix Défaut/m", es: "Precio Defecto/m", it: "Prezzo Default/m", bilingual: "السعر الافتراضي / Prix Défaut/m" },
  density: { ar: "الكثافة", fr: "Densité", es: "Densidad", it: "Densità", bilingual: "الكثافة / Densité" },
  square_corner_price: { ar: "سعر الزاوية المربعة", fr: "Prix Coin Carré", es: "Precio Esq. Cuadrada", it: "Prezzo Ang. Quad.", bilingual: "سعر الزاوية المربعة / Prix Coin Carré" },
  triangle_corner_price: { ar: "سعر الزاوية المثلثة", fr: "Prix Coin Triang.", es: "Precio Esq. Triang.", it: "Prezzo Ang. Triang.", bilingual: "سعر الزاوية المثلثة / Prix Coin Triang." },
  priceAdjustment: { ar: "تعديل السعر", fr: "Ajustement Prix", es: "Ajuste Precio", it: "Aggiustamento Prezzo", bilingual: "تعديل السعر / Ajustement Prix" },
  customPricePerMeter: { ar: "سعر مخصص للمتر", fr: "Prix Perso./m", es: "Precio Perso./m", it: "Prezzo Perso./m", bilingual: "سعر مخصص للمتر / Prix Perso./m" },

  // ─── Salon Moroccan keys ───
  seddari: { ar: "السدادر", fr: "Sedari", es: "Sedari", it: "Sedari", bilingual: "السدادر / Sedari" },
  seddars: { ar: "السدادر", fr: "Sedari", es: "Sedari", it: "Sedari", bilingual: "السدادر / Sedari" },
  stitch: { ar: "الخياطة", fr: "Couture", es: "Costura", it: "Cucitura", bilingual: "الخياطة / Couture" },
  stitchStyle: { ar: "نمط الخياطة", fr: "Style Couture", es: "Estilo Costura", it: "Stile Cucitura", bilingual: "نمط الخياطة / Style Couture" },
  cushions: { ar: "المخاد", fr: "Coussins", es: "Cojines", it: "Cuscini", bilingual: "المخاد / Coussins" },
  decor: { ar: "الكيدور", fr: "Décor", es: "Decoración", it: "Decorazione", bilingual: "الكيدور / Décor" },
  extras: { ar: "الإضافات", fr: "Extras", es: "Extras", it: "Extra", bilingual: "الإضافات / Extras" },
  consumptionMeters: { ar: "الاستهلاك (م)", fr: "Consommation (m)", es: "Consumo (m)", it: "Consumo (m)", bilingual: "الاستهلاك (م) / Consommation (m)" },
  fabricConsumptionCm: { ar: "استهلاك القماش (سم)", fr: "Conso. Tissu (cm)", es: "Consumo Tela (cm)", it: "Consumo Tessuto (cm)", bilingual: "استهلاك القماش (سم) / Conso. Tissu (cm)" },
  isFormaja: { ar: "فورمجة", fr: "Formaja", es: "Formaja", it: "Formaja", bilingual: "فورمجة / Formaja" },
  styleName: { ar: "نمط الخياطة", fr: "Style", es: "Estilo", it: "Stile", bilingual: "نمط الخياطة / Style" },
  size: { ar: "المقاس", fr: "Taille", es: "Tamaño", it: "Dimensione", bilingual: "المقاس / Taille" },
  hasLwata: { ar: "لواتة", fr: "Lwata", es: "Lwata", it: "Lwata", bilingual: "لواتة / Lwata" },
  lwataPrice: { ar: "سعر اللواتة", fr: "Prix Lwata", es: "Precio Lwata", it: "Prezzo Lwata", bilingual: "سعر اللواتة / Prix Lwata" },
  lhayef: { ar: "اللحايف", fr: "Lhayef", es: "Lhayef", it: "Lhayef", bilingual: "اللحايف / Lhayef" },
  tabouria: { ar: "الطابورية", fr: "Tabouria", es: "Tabouria", it: "Tabouria", bilingual: "الطابورية / Tabouria" },
  lengthM: { ar: "الطول (م)", fr: "Longueur (m)", es: "Longitud (m)", it: "Lunghezza (m)", bilingual: "الطول (م) / Longueur (m)" },

  // ─── Romani keys ───
  has_kotik: { ar: "كوتيك", fr: "Kotik", es: "Kotik", it: "Kotik", bilingual: "كوتيك / Kotik" },
  kotik_count: { ar: "عدد الكوتيك", fr: "Nbr Kotik", es: "Nbr Kotik", it: "Nbr Kotik", bilingual: "عدد الكوتيك / Nbr Kotik" },
  has_formaja: { ar: "فورمجة", fr: "Formaja", es: "Formaja", it: "Formaja", bilingual: "فورمجة / Formaja" },
  formaja_length_meters: { ar: "طول الفورمجة (م)", fr: "Long. Formaja (m)", es: "Long. Formaja (m)", it: "Long. Formaja (m)", bilingual: "طول الفورمجة (م) / Long. Formaja (m)" },
  isRomani: { ar: "صالون رومي", fr: "Salon Romani", es: "Salón Romani", it: "Salotto Romani", bilingual: "صالون رومي / Salon Romani" },

  // ─── Khamiya keys ───
  selectedKhamiya: { ar: "النوع", fr: "Type", es: "Tipo", it: "Tipo", bilingual: "النوع / Type" },
  selectedSewing: { ar: "الخياطة", fr: "Couture", es: "Costura", it: "Cucitura", bilingual: "الخياطة / Couture" },
  selectedAqiq: { ar: "العقيق", fr: "Aqiq", es: "Aqiq", it: "Aqiq", bilingual: "العقيق / Aqiq" },
  hasBackground: { ar: "خلفية", fr: "Fond", es: "Fondo", it: "Sfondo", bilingual: "خلفية / Fond" },
  selectedBackground: { ar: "نوع الخلفية", fr: "Type de Fond", es: "Tipo de Fondo", it: "Tipo di Sfondo", bilingual: "نوع الخلفية / Type de Fond" },
  customAdditions: { ar: "إضافات يدوية", fr: "Ajouts Manuels", es: "Añadidos Manuales", it: "Aggiunte Manuali", bilingual: "إضافات يدوية / Ajouts Manuels" },
  selectedCatalogAdditions: { ar: "إضافات الكتالوج", fr: "Ajouts Catalogue", es: "Añadidos Catálogo", it: "Aggiunte Catalogo", bilingual: "إضافات الكتالوج / Ajouts Catalogue" },
  catalogAdditions: { ar: "إضافات الكتالوج", fr: "Ajouts Catalogue", es: "Añadidos Catálogo", it: "Aggiunte Catalogo", bilingual: "إضافات الكتالوج / Ajouts Catalogue" },
  costEditReasons: { ar: "أسباب تعديل السعر", fr: "Raisons Ajustement", es: "Razones Ajuste", it: "Ragioni Aggiustamento", bilingual: "أسباب تعديل السعر / Raisons" },
  price_per_m2: { ar: "السعر للم²", fr: "Prix/m²", es: "Precio/m²", it: "Prezzo/m²", bilingual: "السعر للم² / Prix/m²" },
  price_per_meter: { ar: "السعر للمتر", fr: "Prix/m", es: "Precio/m", it: "Prezzo/m", bilingual: "السعر للمتر / Prix/m" },

  // ─── Wood keys ───
  woodItems: { ar: "قطع إضافية", fr: "Pièces Supp.", es: "Piezas Extra", it: "Pezzi Extra", bilingual: "قطع إضافية / Pièces Supp." },
  salonShape: { ar: "شكل الصالون", fr: "Forme Salon", es: "Forma Salón", it: "Forma Salotto", bilingual: "شكل الصالون / Forme Salon" },
  item_name: { ar: "اسم القطعة", fr: "Nom Pièce", es: "Nombre Pieza", it: "Nome Pezzo", bilingual: "اسم القطعة / Nom Pièce" },
  itemName: { ar: "اسم القطعة", fr: "Nom Pièce", es: "Nombre Pieza", it: "Nome Pezzo", bilingual: "اسم القطعة / Nom Pièce" },
  index: { ar: "رقم", fr: "N°", es: "N°", it: "N°", bilingual: "رقم / N°" },

  // ─── Calculation keys ───
  subtotal: { ar: "المجموع", fr: "Sous-total", es: "Subtotal", it: "Subtotale", bilingual: "المجموع / Sous-total" },
  materialCost: { ar: "تكلفة الخامة", fr: "Coût Matière", es: "Coste Material", it: "Costo Materiale", bilingual: "تكلفة الخامة / Coût Matière" },
  formageCost: { ar: "تكلفة الفورمجة", fr: "Coût Formage", es: "Coste Formaje", it: "Costo Formaggio", bilingual: "تكلفة الفورمجة / Coût Formage" },
  seddariTotal: { ar: "مجموع السدادر", fr: "Total Sedari", es: "Total Sedari", it: "Totale Sedari", bilingual: "مجموع السدادر / Total Sedari" },
  itemsTotal: { ar: "مجموع القطع", fr: "Total Pièces", es: "Total Piezas", it: "Totale Pezzi", bilingual: "مجموع القطع / Total Pièces" },
  stageTotals: { ar: "إجماليات المراحل", fr: "Totaux Étapes", es: "Totales Etapas", it: "Totali Fasi", bilingual: "إجماليات المراحل / Totaux Étapes" },
  fabricCost: { ar: "تكلفة الثوب", fr: "Coût Tissu", es: "Coste Tela", it: "Costo Tessuto", bilingual: "تكلفة الثوب / Coût Tissu" },
  stitchTotal: { ar: "مجموع الخياطة", fr: "Total Couture", es: "Total Costura", it: "Totale Cucitura", bilingual: "مجموع الخياطة / Total Couture" },
  cushionsTotal: { ar: "مجموع المخاد", fr: "Total Coussins", es: "Total Cojines", it: "Totale Cuscini", bilingual: "مجموع المخاد / Total Coussins" },
  decorTotal: { ar: "مجموع الكيدور", fr: "Total Décor", es: "Total Decoración", it: "Totale Decorazione", bilingual: "مجموع الكيدور / Total Décor" },
  extrasTotal: { ar: "مجموع الإضافات", fr: "Total Extras", es: "Total Extras", it: "Totale Extra", bilingual: "مجموع الإضافات / Total Extras" },
  totalLengthMeters: { ar: "إجمالي الطول (م)", fr: "Longueur Totale (m)", es: "Longitud Total (m)", it: "Lunghezza Totale (m)", bilingual: "إجمالي الطول (م) / Longueur Totale (m)" },
  totalKotikMeters: { ar: "إجمالي الكوتيك (م)", fr: "Total Kotik (m)", es: "Total Kotik (m)", it: "Totale Kotik (m)", bilingual: "إجمالي الكوتيك (م) / Total Kotik (m)" },
  totalFormajaMeters: { ar: "إجمالي الفورمجة (م)", fr: "Total Formaja (m)", es: "Total Formaja (m)", it: "Totale Formaja (m)", bilingual: "إجمالي الفورمجة (م) / Total Formaja (m)" },
  totalMeters: { ar: "إجمالي الأمتار", fr: "Total Mètres", es: "Total Metros", it: "Totale Metri", bilingual: "إجمالي الأمتار / Total Mètres" },
  seddarsCount: { ar: "عدد السدادر", fr: "Nbr Sedari", es: "Nbr Sedari", it: "Nbr Sedari", bilingual: "عدد السدادر / Nbr Sedari" },
  priceOverride: { ar: "تعديل السعر", fr: "Ajustement Prix", es: "Ajuste Precio", it: "Aggiustamento Prezzo", bilingual: "تعديل السعر / Ajustement Prix" },
  value: { ar: "القيمة", fr: "Valeur", es: "Valor", it: "Valore", bilingual: "القيمة / Valeur" },
  reason: { ar: "السبب", fr: "Raison", es: "Razón", it: "Ragione", bilingual: "السبب / Raison" },
  enabled: { ar: "مفعل", fr: "Activé", es: "Activado", it: "Attivato", bilingual: "مفعل / Activé" },
  areaSqm: { ar: "المساحة (م²)", fr: "Surface (m²)", es: "Superficie (m²)", it: "Superficie (m²)", bilingual: "المساحة (م²) / Surface (m²)" },
  cutMarginCm: { ar: "هامش القص (سم)", fr: "Marge Coupe (cm)", es: "Margen Corte (cm)", it: "Margine Taglio (cm)", bilingual: "هامش القص (سم) / Marge Coupe (cm)" },
};

function getDetailLabel(key: string, lang: DocumentLanguage): string {
  return DETAIL_LABELS[key]?.[lang] || DETAIL_LABELS[key]?.["ar"] || key;
}

/* ═══════════════════════════════════════════════════════════════
   Value translations
   ═══════════════════════════════════════════════════════════════ */

const VALUE_TRANSLATIONS: Record<string, Record<DocumentLanguage, string>> = {
  none: { ar: "بدون", fr: "Aucun", es: "Ninguno", it: "Nessuno", bilingual: "بدون / Aucun" },
  round: { ar: "دائري", fr: "Rond", es: "Redondo", it: "Rotondo", bilingual: "دائري / Rond" },
  rectangle: { ar: "مستطيل", fr: "Rectangulaire", es: "Rectangular", it: "Rettangolare", bilingual: "مستطيل / Rectangulaire" },
  square: { ar: "مربع", fr: "Carré", es: "Cuadrado", it: "Quadrato", bilingual: "مربع / Carré" },
  oval: { ar: "بيضاوي", fr: "Ovale", es: "Ovalado", it: "Ovale", bilingual: "بيضاوي / Ovale" },
  custom: { ar: "حسب الطلب", fr: "Sur Mesure", es: "A Medida", it: "Su Misura", bilingual: "حسب الطلب / Sur Mesure" },
  pending: { ar: "معلق", fr: "En Attente", es: "Pendiente", it: "In Sospeso", bilingual: "معلق / En Attente" },
  confirmed: { ar: "مؤكد", fr: "Confirmé", es: "Confirmado", it: "Confermato", bilingual: "مؤكد / Confirmé" },
  delivered: { ar: "مسلّم", fr: "Livré", es: "Entregado", it: "Consegnato", bilingual: "مسلّم / Livré" },
  cancelled: { ar: "ملغى", fr: "Annulé", es: "Cancelado", it: "Annullato", bilingual: "ملغى / Annulé" },
  yes: { ar: "نعم", fr: "Oui", es: "Sí", it: "Sì", bilingual: "نعم / Oui" },
  no: { ar: "لا", fr: "Non", es: "No", it: "No", bilingual: "لا / Non" },
  true: { ar: "نعم", fr: "Oui", es: "Sí", it: "Sì", bilingual: "نعم / Oui" },
  false: { ar: "لا", fr: "Non", es: "No", it: "No", bilingual: "لا / Non" },
  cash: { ar: "نقدي", fr: "Espèces", es: "Efectivo", it: "Contanti", bilingual: "نقدي / Espèces" },
  card: { ar: "بطاقة بنكية", fr: "Carte Bancaire", es: "Tarjeta", it: "Carta", bilingual: "بطاقة بنكية / Carte" },
  transfer: { ar: "حوالة بنكية", fr: "Virement", es: "Transferencia", it: "Bonifico", bilingual: "حوالة بنكية / Virement" },
  cheque: { ar: "شيك", fr: "Chèque", es: "Cheque", it: "Assegno", bilingual: "شيك / Chèque" },
};

function translateValue(val: string, lang: DocumentLanguage): string {
  const key = val?.toLowerCase()?.trim();
  return VALUE_TRANSLATIONS[key]?.[lang] || VALUE_TRANSLATIONS[key]?.["ar"] || val;
}

/* ═══════════════════════════════════════════════════════════════
   Conditions — translated
   ═══════════════════════════════════════════════════════════════ */

const CONDITIONS_TRANSLATED: Record<string, Record<DocumentType, string[]>> = {
  ar: {
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
  },
  fr: {
    devis: [
      "1. Le devis est valable 15 jours.",
      "2. Les prix peuvent changer après expiration du devis.",
      "3. Le devis n'est ni facture ni bon de commande.",
      "4. La fabrication ne commence qu'après confirmation et acompte.",
      "5. Les prix incluent uniquement les produits et services mentionnés.",
      "6. Toute modification des dimensions ou options peut changer le prix.",
      "7. Les matériaux et dates de production ne sont pas réservés sur simple devis.",
    ],
    bon_de_commande: [
      "1. L'acompte est obligatoire pour démarrer la fabrication.",
      "2. L'acompte n'est pas remboursable après début de fabrication.",
      "3. Le travail commence uniquement après réception de l'acompte.",
      "4. Aucune modification des dimensions, tissus, mousse, bois ou finitions après début.",
      "5. Délai de fabrication maximum 90 jours.",
      "6. La date de livraison est indicative et peut varier en cas de force majeure.",
      "7. Le solde doit être réglé intégralement avant livraison.",
      "8. Le client doit inspecter le produit lors de la livraison.",
      "9. En cas de force majeure, le délai peut être prolongé avec notification.",
    ],
    facture: [
      "1. La facture atteste de la vente définitive.",
      "2. Le solde doit être réglé avant livraison s'il ne l'est pas déjà.",
      "3. Pour toute question ou service après-vente, contactez-nous via les coordonnées sur la facture.",
    ],
  },
  es: {
    devis: [
      "1. El presupuesto es válido por 15 días.",
      "2. Los precios pueden cambiar después de la expiración.",
      "3. El presupuesto no es factura ni orden de compra.",
      "4. La fabricación no comienza hasta confirmación y depósito.",
      "5. Los precios incluyen solo productos y servicios mencionados.",
      "6. Cualquier modificación de dimensiones u opciones puede cambiar el precio.",
      "7. Los materiales y fechas de producción no se reservan con solo presupuesto.",
    ],
    bon_de_commande: [
      "1. El depósito es obligatorio para iniciar la fabricación.",
      "2. El depósito no es reembolsable después de iniciar la fabricación.",
      "3. El trabajo comienza solo después de recibir el depósito.",
      "4. No se pueden modificar dimensiones, telas, espuma, madera o acabados después de iniciar.",
      "5. Plazo de fabricación máximo 90 días.",
      "6. La fecha de entrega es indicativa y puede variar en circunstancias excepcionales.",
      "7. El saldo debe pagarse íntegramente antes de la entrega.",
      "8. El cliente debe inspeccionar el producto al recibirlo.",
      "9. En caso de fuerza mayor, el plazo puede extenderse con notificación.",
    ],
    facture: [
      "1. La factura acredita la venta definitiva.",
      "2. El saldo debe pagarse antes de la entrega si no se ha pagado.",
      "3. Para consultas o servicio post-venta, contáctenos mediante los datos de la factura.",
    ],
  },
  it: {
    devis: [
      "1. Il preventivo è valido 15 giorni.",
      "2. I prezzi possono cambiare dopo la scadenza.",
      "3. Il preventivo non è fattura né ordine d'acquisto.",
      "4. La produzione inizia solo dopo conferma e deposito.",
      "5. I prezzi includono solo prodotti e servizi menzionati.",
      "6. Qualsiasi modifica di dimensioni o opzioni può cambiare il prezzo.",
      "7. Materiali e date di produzione non sono riservati con solo preventivo.",
    ],
    bon_de_commande: [
      "1. Il deposito è obbligatorio per avviare la produzione.",
      "2. Il deposito non è rimborsabile dopo l'inizio della produzione.",
      "3. Il lavoro inizia solo dopo ricezione del deposito.",
      "4. Nessuna modifica di dimensioni, tessuti, schiuma, legno o finiture dopo l'inizio.",
      "5. Tempo di produzione massimo 90 giorni.",
      "6. La data di consegna è indicativa e può variare in circostanze eccezionali.",
      "7. Il saldo deve essere pagato integralmente prima della consegna.",
      "8. Il cliente deve ispezionare il prodotto al momento della consegna.",
      "9. In caso di forza maggiore, il termine può essere prorogato con notifica.",
    ],
    facture: [
      "1. La fattura attesta la vendita definitiva.",
      "2. Il saldo deve essere pagato prima della consegna se non già pagato.",
      "3. Per qualsiasi domanda o assistenza post-vendita, contattaci tramite i dati in fattura.",
    ],
  },
  bilingual: {
    devis: [
      "1. عرض السعر صالح 15 يوماً / Devis valable 15 jours.",
      "2. الأسعار قابلة للتغيير / Les prix peuvent changer.",
      "3. ليس فاتورة / N'est pas facture.",
      "4. التصنيع بعد العربون / Fabrication après acompte.",
      "5. فقط المذكور / Uniquement ce qui est mentionné.",
      "6. التعديل يغيّر السعر / Modification = changement de prix.",
      "7. لا حجز / Pas de réservation.",
    ],
    bon_de_commande: [
      "1. العربون إلزامي / Acompte obligatoire.",
      "2. غير مسترجع / Non remboursable.",
      "3. العمل بعد الاستلام / Travail après réception.",
      "4. لا تعديل بعد البدء / Pas de modification après début.",
      "5. 90 يوماً كحد أقصى / 90 jours max.",
      "6. تاريخ تقديري / Date indicative.",
      "7. دفع المتبقي / Payer le solde.",
      "8. فحص عند الاستلام / Inspection à la livraison.",
      "9. القوة القاهرة / Force majeure.",
    ],
    facture: [
      "1. بيع نهائي / Vente définitive.",
      "2. دفع المتبقي / Payer le solde.",
      "3. للاستفسار / Pour questions.",
    ],
  },
};

function getConditions(lang: DocumentLanguage, type: DocumentType): string[] {
  return CONDITIONS_TRANSLATED[lang]?.[type] || CONDITIONS_TRANSLATED["ar"][type];
}

/* ═══════════════════════════════════════════════════════════════
   Detail formatting helpers
   ═══════════════════════════════════════════════════════════════ */

const IGNORED_KEYS = new Set([
  "id", "orderId", "order_id", "createdAt", "created_at", "updatedAt", "updated_at",
  "productId", "product_id", "userId", "user_id", "thumbnailUrl", "image", "photo",
  "cartItemId", "sessionId", "metadata", "_raw", "__v", "index", "orderItemId",
]);

function fmtValue(key: string, val: unknown, lang: DocumentLanguage): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "boolean") return val ? translateValue("yes", lang) : translateValue("no", lang);
  if (typeof val === "number") {
    if (/price|cost|amount|deposit|discount|total|remaining|subtotal/i.test(key)) {
      return `${val.toLocaleString("ar-MA")} ${t(lang, "currency_symbol")}`;
    }
    if (/area|مساحة/i.test(key)) return `${val.toLocaleString("ar-MA")} م²`;
    if (/length|width|height|depth|thickness|طول|عرض|ارتفاع|عمق|سمك/i.test(key)) return `${val.toLocaleString("ar-MA")} م`;
    if (/margin|cm|هامش/i.test(key)) return `${val.toLocaleString("ar-MA")} سم`;
    if (/percent|waste|هدر|نسبة/i.test(key)) return `${val}%`;
    return val.toLocaleString("ar-MA");
  }
  if (typeof val === "string") {
    const v = val.trim();
    if (v === "none" || v === "" || v === "null" || v === "undefined") return null;
    const translated = translateValue(v, lang);
    if (translated !== v) return translated;
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
      try { return new Date(v).toLocaleDateString("ar-MA", { year: "numeric", month: "long", day: "numeric" }); } catch {}
    }
    return v;
  }
  if (Array.isArray(val)) {
    const mapped = val.map((x) => fmtValue(key, x, lang)).filter(Boolean);
    return mapped.length ? mapped.join("، ") : null;
  }
  if (typeof val === "object") {
    const entries = Object.entries(val as Record<string, unknown>)
      .filter(([k]) => !IGNORED_KEYS.has(k))
      .map(([k, v]) => {
        const fv = fmtValue(k, v, lang);
        return fv ? `${getDetailLabel(k, lang)}: ${fv}` : null;
      })
      .filter(Boolean);
    return entries.length ? entries.join(" | ") : null;
  }
  return String(val);
}

function getReadableDetails(
  details: Record<string, any> | undefined,
  lang: DocumentLanguage,
  productType?: string
): { label: string; value: string }[] {
  if (!details || typeof details !== "object") return [];
  const rows: { label: string; value: string; priority: number }[] = [];

  const add = (key: string, value: string, priority: number) => {
    rows.push({ label: getDetailLabel(key, lang), value, priority });
  };

  const fmtP = (n: number) => `${n.toLocaleString("fr-MA")} د.م`;

  const getName = (obj: any): string | null => {
    if (!obj || typeof obj !== "object") return null;
    return obj.name || null;
  };

  const fmtObj = (obj: any, priceKey?: string): string | null => {
    if (!obj || typeof obj !== "object") return null;
    const name = obj.name;
    if (!name) return null;
    const price = priceKey ? obj[priceKey] : (obj.price_per_m2 || obj.price_per_meter || obj.pricePerSqm || obj.pricePerMeter);
    if (price) return `${name} — ${fmtP(price)}`;
    return name;
  };

  // ═══════════════════════════════════════════════════════════════
  // PRODUCT-SPECIFIC HANDLING
  // ═══════════════════════════════════════════════════════════════

  // ─── KHAMIYA ───
  if (details.selectedKhamiya) {
    const v = fmtObj(details.selectedKhamiya, "price_per_m2");
    if (v) add("selectedKhamiya", v, 1);
  }
  if (details.selectedSewing) {
    const v = fmtObj(details.selectedSewing, "price_per_meter");
    if (v) add("selectedSewing", v, 2);
  }
  if (details.selectedAqiq) {
    const v = fmtObj(details.selectedAqiq, "price_per_meter");
    if (v) add("selectedAqiq", v, 3);
  }
  if (details.hasBackground === true && details.selectedBackground) {
    const v = fmtObj(details.selectedBackground, "price_per_m2");
    add("hasBackground", v ? `${translateValue("yes", lang)} (${v})` : translateValue("yes", lang), 4);
  } else if (details.hasBackground === false) {
    add("hasBackground", translateValue("no", lang), 4);
  }
  if (Array.isArray(details.customAdditions) && details.customAdditions.length > 0) {
    const names = details.customAdditions
      .filter((c: any) => c && c.name)
      .map((c: any) => `${c.name}${c.price ? ` (${fmtP(c.price)})` : ""}`)
      .join(" + ");
    if (names) add("customAdditions", names, 5);
  }
  if (Array.isArray(details.catalogAdditions) && details.catalogAdditions.length > 0 && Array.isArray(details.selectedCatalogAdditions)) {
    const names = details.catalogAdditions
      .filter((c: any) => c && details.selectedCatalogAdditions.includes(String(c.id)))
      .map((c: any) => `${c.name}${c.price ? ` (${fmtP(c.price)})` : ""}`)
      .join(" + ");
    if (names) add("catalogAdditions", names, 6);
  }
  if (details.costEditReasons && typeof details.costEditReasons === "object") {
    const reasons = Object.entries(details.costEditReasons)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | ");
    if (reasons) add("costEditReasons", reasons, 7);
  }

  // ─── TAPIS ───
  if (details.material) {
    const mat = details.material;
    const name = mat.name;
    const price = mat.pricePerSqm || mat.price_per_m2;
    if (name) add("material", price ? `${name} — ${fmtP(price)}` : name, 1);
  }
  if (details.dimensions) {
    const d = details.dimensions;
    const parts: string[] = [];
    if (d.lengthCm) parts.push(`${d.lengthCm} سم`);
    if (d.widthCm) parts.push(`${d.widthCm} سم`);
    if (d.areaSqm) parts.push(`${d.areaSqm} م²`);
    if (parts.length) add("dimensions", parts.join(" × "), 2);
  }
  if (details.cutMarginCm) add("cutMarginCm", `${details.cutMarginCm} سم`, 3);
  if (details.wastePercent) add("wastePercent", `${details.wastePercent}%`, 4);
  if (details.rounding) add("rounding", translateValue(details.rounding, lang), 5);

  // ─── ROMANI ───
  if (details.model) {
    const name = details.model.name;
    const price = details.model.price_per_meter;
    if (name) add("model", price ? `${name} — ${fmtP(price)}` : name, 1);
  }
  if (details.color) {
    const name = getName(details.color);
    if (name) add("color", name, 2);
  }
  if (Array.isArray(details.seddars) && details.seddars.length > 0) {
    const parts = details.seddars.map((s: any) => {
      const len = s.length_cm ? `${(s.length_cm / 100).toFixed(2)}م` : "";
      const extras: string[] = [];
      if (s.has_kotik && s.kotik_count) extras.push(`كوتيك ${s.kotik_count}`);
      if (s.has_formaja && s.formaja_length_meters) extras.push(`فورمجة ${s.formaja_length_meters}م`);
      return len + (extras.length ? ` (${extras.join(" + ")})` : "");
    }).filter(Boolean);
    if (parts.length) add("seddars", parts.join(" + "), 3);
  }

  // ─── WOOD ───
  if (details.model) {
    const wt = details.model.woodType || details.model.wood_type;
    const name = details.model.name;
    if (name) add("model", wt ? `${name} — ${wt}` : name, 1);
  }
  if (details.salonShape) add("salonShape", String(details.salonShape), 2);
  if (Array.isArray(details.seddars) && details.seddars.length > 0) {
    const parts = details.seddars
      .map((s: any) => (s.lengthCm ? `${(s.lengthCm / 100).toFixed(2)}م` : ""))
      .filter(Boolean);
    if (parts.length) add("seddars", parts.join(" + "), 3);
  }
  if (Array.isArray(details.woodItems) && details.woodItems.length > 0) {
    const names = details.woodItems
      .filter((i: any) => i && i.name)
      .map((i: any) => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}${i.totalPrice ? ` (${fmtP(i.totalPrice)})` : ""}`)
      .join(" + ");
    if (names) add("woodItems", names, 4);
  }

  // ─── FOAM ───
  if (details.product) {
    const p = details.product;
    const name = p.name;
    const density = p.density;
    const price = p.pricePerMeter || p.price_per_meter;
    let v = name || "";
    if (density) v += ` — كثافة ${density}`;
    if (price) v += ` — ${fmtP(price)}`;
    if (v) add("product", v, 1);
  }
  if (details.heightCm) add("heightCm", `${details.heightCm} سم`, 2);
  if (details.widthCm) add("widthCm", `${details.widthCm} سم`, 3);
  if (Array.isArray(details.foamSeddars) && details.foamSeddars.length > 0) {
    const sum = details.foamSeddars.reduce((s: number, v: number) => s + (v || 0), 0);
    add("foamSeddars", `${details.foamSeddars.map((v: number) => `${v}م`).join(" + ")} = ${sum.toFixed(2)}م`, 4);
  }
  if (details.squareCorners > 0) add("squareCorners", String(details.squareCorners), 5);
  if (details.triangleCorners > 0) add("triangleCorners", String(details.triangleCorners), 6);

  // ─── SALON MOROCCAN ───
  if (details.fabric) {
    const f = details.fabric;
    const name = f.name;
    const price = f.pricePerMeter;
    const cons = f.consumptionMeters;
    const parts = [name, price ? fmtP(price) : "", cons ? `${cons}م` : ""].filter(Boolean);
    if (parts.length) add("fabric", parts.join(" — "), 1);
  }
  if (Array.isArray(details.seddari) && details.seddari.length > 0) {
    const parts = details.seddari.map((s: any) => {
      const dims = [s.length, s.width, s.height].filter(Boolean).map((v: number) => `${v}سم`).join("×");
      const type = s.isFormaja ? translateValue("formaja", lang) : translateValue("normal", lang);
      return `${dims} (${type})`;
    }).filter(Boolean);
    if (parts.length) add("seddari", parts.join(" + "), 2);
  }
  if (Array.isArray(details.stitch) && details.stitch.length > 0) {
    const names = details.stitch
      .filter((s: any) => s && s.styleName)
      .map((s: any) => `${s.styleName}${s.finalPrice ? ` (${fmtP(s.finalPrice)})` : ""}`)
      .join(" + ");
    if (names) add("stitch", names, 3);
  }
  if (Array.isArray(details.cushions) && details.cushions.length > 0) {
    const names = details.cushions
      .filter((c: any) => c)
      .map((c: any) => {
        const parts: string[] = [];
        if (c.size) parts.push(`مقاس ${c.size}`);
        if (c.count) parts.push(`${c.count} مخدة`);
        if (c.stitchStyle) parts.push(c.stitchStyle);
        if (c.hasLwata) parts.push("لواتة");
        if (c.total) parts.push(fmtP(c.total));
        return parts.join(" — ");
      })
      .join(" | ");
    if (names) add("cushions", names, 4);
  }
  if (Array.isArray(details.decor) && details.decor.length > 0) {
    const names = details.decor
      .filter((d: any) => d)
      .map((d: any) => {
        const parts: string[] = [];
        if (d.shape) parts.push(d.shape);
        if (d.count) parts.push(`${d.count} كيدور`);
        if (d.stitchStyle) parts.push(d.stitchStyle);
        if (d.total) parts.push(fmtP(d.total));
        return parts.join(" — ");
      })
      .join(" | ");
    if (names) add("decor", names, 5);
  }
  if (Array.isArray(details.extras) && details.extras.length > 0) {
    const names = details.extras
      .filter((e: any) => e)
      .map((e: any) => {
        const parts: string[] = [e.name || ""];
        if (e.lengthM) parts.push(`${e.lengthM}م`);
        if (e.count) parts.push(`${e.count} قطعة`);
        if (e.total) parts.push(fmtP(e.total));
        return parts.filter(Boolean).join(" — ");
      })
      .join(" | ");
    if (names) add("extras", names, 6);
  }

  // ─── GENERIC FALLBACK ───
  const handledKeys = new Set([
    "selectedKhamiya", "selectedSewing", "selectedAqiq", "hasBackground", "selectedBackground",
    "customAdditions", "catalogAdditions", "selectedCatalogAdditions", "costEditReasons",
    "material", "dimensions", "cutMarginCm", "wastePercent", "rounding",
    "model", "color", "seddars", "woodItems", "salonShape",
    "product", "heightCm", "widthCm", "foamSeddars", "squareCorners", "triangleCorners",
    "fabric", "seddari", "stitch", "cushions", "decor", "extras"
  ]);

  for (const [key, rawVal] of Object.entries(details)) {
    if (handledKeys.has(key)) continue;
    if (IGNORED_KEYS.has(key)) continue;
    if (rawVal === null || rawVal === undefined) continue;
    if (typeof rawVal === "object" && !Array.isArray(rawVal)) continue;
    const formatted = fmtValue(key, rawVal, lang);
    if (!formatted) continue;
    add(key, formatted, 999);
  }

  // Notes always last
  if (details.notes) {
    add("notes", details.notes, 1000);
  }

  rows.sort((a, b) => a.priority - b.priority || a.label.localeCompare(b.label, "ar"));
  return rows.map(({ label, value }) => ({ label, value }));
}

/* ═══════════════════════════════════════════════════════════════
   Dynamic font sizes
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   Dynamic font sizes
   ═══════════════════════════════════════════════════════════════ */

function computeFontSizes(orderItems: OrderItem[], conditionsCount: number, hasSignatures: boolean) {
  let detailCount = 0;
  for (const item of orderItems) {
    detailCount += getReadableDetails(item.details, "ar").length;
  }
  const weight = orderItems.length + Math.ceil(detailCount / 3) + (conditionsCount > 0 ? 1 : 0) + (hasSignatures ? 1 : 0);

  if (weight <= 3) {
    return {
      title: 28, section: 15, productName: 14, productType: 11, detail: 11,
      totalLabel: 13, totalValue: 18, conditionsTitle: 12, conditionsItem: 10,
      rowLabel: 11, rowValue: 12, sigLabel: 11, sigName: 10, headerMeta: 11,
      paddingTop: "42mm", paddingBottom: "28mm", paddingSide: "18mm",
      itemSpacing: "6px", sectionSpacing: "10px", sigHeight: "40px",
    };
  }
  if (weight <= 7) {
    return {
      title: 24, section: 13, productName: 12, productType: 10, detail: 10,
      totalLabel: 12, totalValue: 15, conditionsTitle: 11, conditionsItem: 9,
      rowLabel: 10, rowValue: 11, sigLabel: 10, sigName: 9, headerMeta: 10,
      paddingTop: "40mm", paddingBottom: "26mm", paddingSide: "16mm",
      itemSpacing: "5px", sectionSpacing: "8px", sigHeight: "35px",
    };
  }
  return {
    title: 20, section: 12, productName: 11, productType: 9, detail: 9,
    totalLabel: 11, totalValue: 13, conditionsTitle: 10, conditionsItem: 8,
    rowLabel: 9, rowValue: 10, sigLabel: 9, sigName: 8, headerMeta: 9,
    paddingTop: "38mm", paddingBottom: "24mm", paddingSide: "14mm",
    itemSpacing: "4px", sectionSpacing: "6px", sigHeight: "30px",
  };
}

/* ═══════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════ */

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
const MAPS_URL = "https://maps.app.goo.gl/Ndi6dYtDKZAspaRP7?g_st=ic";

export default function PrintModal({
  orderItems, orderNumber, customerName, customerPhone, customerCity,
  totalAmount, discountAmount = 0, depositAmount = 0, deliveryCost = 0,
  documentType, printOptions, onClose,
  agreedDeliveryDate = "", onAgreedDeliveryDateChange, sellerNotes = "", onSellerNotesChange,
}: PrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [bgBase64, setBgBase64] = useState<string>("");
  const [stampBase64, setStampBase64] = useState<string>("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const lang = printOptions.language;

  useEffect(() => { loadAssets(); }, []);

  async function loadAssets() {
    try {
      const [bgRes, stampRes] = await Promise.all([
        fetch("/letterhead.png"),
        fetch("/stamp.png"),
      ]);
      const [bgBlob, stampBlob] = await Promise.all([bgRes.blob(), stampRes.blob()]);
      const [bgReader, stampReader] = [new FileReader(), new FileReader()];
      bgReader.onloadend = () => setBgBase64(bgReader.result as string);
      stampReader.onloadend = () => setStampBase64(stampReader.result as string);
      bgReader.readAsDataURL(bgBlob);
      stampReader.readAsDataURL(stampBlob);
    } catch (e) { console.error("Failed to load assets:", e); }
    setConditions(getConditions(lang, documentType));
  }

  async function generatePdfBlob(): Promise<Blob | null> {
    if (!printRef.current) return null;
    setLoading(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2, useCORS: true, allowTaint: true, backgroundColor: null, logging: false,
        windowWidth: 794, windowHeight: 1123,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const w = pdf.internal.pageSize.getWidth();
      const h = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, "PNG", 0, 0, w, h);
      return pdf.output("blob");
    } catch (err) { console.error(err); return null; }
    finally { setLoading(false); }
  }

  const handleDownload = async () => {
    const blob = pdfBlob || await generatePdfBlob();
    if (!blob) return;
    setPdfBlob(blob);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docTitle(documentType, lang).replace(/\s/g, "_")}_${orderNumber}.pdf`;
    a.click(); URL.revokeObjectURL(url);
    setDone("تم التحميل"); setTimeout(() => setDone(null), 2000);
  };

  const handlePrint = async () => {
    const blob = pdfBlob || await generatePdfBlob();
    if (!blob) return;
    setPdfBlob(blob);
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");
    if (printWindow) printWindow.addEventListener("load", () => printWindow.print());
    setDone("تم فتح الطباعة"); setTimeout(() => setDone(null), 2000);
  };

  const handleWhatsApp = async () => {
    const blob = pdfBlob || await generatePdfBlob();
    if (!blob) return;
    setPdfBlob(blob);
    const phone = customerPhone.replace(/\D/g, "");
    if (!phone) { alert("الزبون ليس لديه رقم هاتف"); return; }
    const title = docTitle(documentType, lang);
    const msg = encodeURIComponent(
      `مرحباً ${customerName}،\nإليك ${title} رقم ${orderNumber}\n` +
      (agreedDeliveryDate ? `📅 موعد التسليم: ${agreedDeliveryDate}\n` : "") +
      (sellerNotes ? `📝 ملاحظة: ${sellerNotes}\n` : "") +
      `المجموع: ${actualTotal} ${t(lang, "currency_symbol")}\nتم إرفاق الملف PDF.`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${title.replace(/\s/g, "_")}_${orderNumber}.pdf`; a.click();
    URL.revokeObjectURL(url);
    setDone("تم فتح واتساب وتحميل الملف"); setTimeout(() => setDone(null), 3000);
  };

  const itemsSubtotal = orderItems.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);
  const actualTotal = totalAmount || itemsSubtotal;
  const actualDiscount = discountAmount || 0;
  const actualDelivery = deliveryCost || 0;
  const actualDeposit = depositAmount || 0;
  const actualRemaining = Math.max(0, actualTotal - actualDeposit);
  const title = docTitle(documentType, lang);
  const today = new Date().toLocaleDateString("ar-MA", { year: "numeric", month: "long", day: "numeric" });
  const displayDeliveryDate = fmtDate(agreedDeliveryDate);

  const fs = useMemo(() =>
    computeFontSizes(orderItems, conditions.length, printOptions.includeSignatures),
    [orderItems, conditions.length, printOptions.includeSignatures]
  );

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
            <input type="text" value={agreedDeliveryDate}
              onChange={(e) => onAgreedDeliveryDateChange?.(e.target.value)}
              placeholder="مثال: 20/08/2026 أو 5-7 أسابيع"
              className="w-full p-3 rounded-lg border-2 border-amber-200 text-right font-bold text-amber-900 bg-white focus:border-amber-500 focus:outline-none transition-colors text-sm" />
            <p className="text-xs text-amber-600 mt-1">سيظهر في بون دي كوماند ويُرسل للزبون</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <label className="flex items-center gap-2 text-sm font-bold text-blue-800 mb-2">
              <span>📝</span> ملاحظات خاصة (تظهر في المستند)
            </label>
            <textarea value={sellerNotes}
              onChange={(e) => onSellerNotesChange?.(e.target.value)}
              placeholder="مثال: القماش غير متوفر حالياً..." rows={3}
              className="w-full p-3 rounded-lg border-2 border-blue-200 text-right font-bold text-blue-900 bg-white focus:border-blue-500 focus:outline-none transition-colors text-sm resize-none" />
            <p className="text-xs text-blue-600 mt-1">تظهر في أسفل بيانات الزبون في PDF</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>الشروط المحملة: {conditions.length} بند</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button onClick={handlePrint} disabled={loading}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-xl font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: C.green }}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />} طباعة المستند
            </button>
            <button onClick={handleDownload} disabled={loading}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-xl font-bold border-2 transition hover:bg-gray-50 disabled:opacity-50"
              style={{ borderColor: C.gold, color: C.gold }}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} تحميل PDF
            </button>
            <button onClick={handleWhatsApp} disabled={loading || !customerPhone}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-xl font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "#25D366" }}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />} إرسال عبر واتساب
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
              padding: `${fs.paddingTop} ${fs.paddingSide} ${fs.paddingBottom} ${fs.paddingSide}`,
              boxSizing: "border-box", position: "relative",
            }}>

            {/* Header */}
            <div style={{ textAlign: "right", marginBottom: fs.sectionSpacing }}>
              <h1 style={{ fontSize: `${fs.title}px`, fontWeight: 700, color: C.green, margin: 0 }}>{title}</h1>
              <p style={{ fontSize: `${fs.headerMeta}px`, color: "#6B7280", margin: "3px 0 0 0" }}>
                {t(lang, "order_number")}: {orderNumber} | {t(lang, "date")}: {today}
              </p>
            </div>

            {/* Client info */}
            <div style={{ marginBottom: fs.sectionSpacing }}>
              <h3 style={{ fontSize: `${fs.section}px`, fontWeight: 700, color: C.green, margin: `0 0 6px 0`, borderBottom: `1.5px solid ${C.gold}60`, paddingBottom: "3px" }}>
                {t(lang, "client")}
              </h3>
              <PdfRow label={t(lang, "client")} value={customerName} fs={fs} />
              <PdfRow label={t(lang, "phone")} value={customerPhone} fs={fs} />
              {customerCity && <PdfRow label={t(lang, "city")} value={customerCity} fs={fs} />}
              {displayDeliveryDate && <PdfRow label={t(lang, "agreedDeliveryDate")} value={displayDeliveryDate} fs={fs} valueColor={C.gold} />}
              {sellerNotes && (
                <div style={{ marginTop: "5px", padding: "5px", background: "rgba(59,130,246,0.08)", borderRadius: "4px", borderRight: `2px solid #3B82F6` }}>
                  <span style={{ fontSize: `${fs.rowLabel}px`, color: "#3B82F6", fontWeight: 700 }}>{t(lang, "notes")}: </span>
                  <span style={{ fontSize: `${fs.rowValue}px`, color: C.dark }}>{sellerNotes}</span>
                </div>
              )}
            </div>

            {/* Products */}
            <div style={{ marginBottom: fs.sectionSpacing }}>
              <h3 style={{ fontSize: `${fs.section}px`, fontWeight: 700, color: C.green, margin: `0 0 6px 0`, borderBottom: `1.5px solid ${C.gold}60`, paddingBottom: "3px" }}>
                {t(lang, "products")} ({orderItems.length})
              </h3>
              {orderItems.map((item) => {
                const readableDetails = getReadableDetails(item.details, lang);
                const useGrid = readableDetails.length > 4;
                const typeName = getProductTypeName(item.productType, lang);
                return (
                  <div key={item.id}
                    style={{
                      marginBottom: fs.itemSpacing,
                      padding: "5px 8px 5px 5px",
                      borderRight: `2.5px solid ${C.gold}`,
                      borderRadius: "0 4px 4px 0",
                      background: "rgba(255,255,255,0.55)",
                    }}>
                    {/* Product header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: readableDetails.length ? "4px" : "0" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                        <span style={{ fontWeight: 700, fontSize: `${fs.productName}px`, color: C.dark }}>{item.productName}</span>
                        <span style={{ fontSize: `${fs.productType}px`, color: "#6B7280" }}>({typeName})</span>
                      </div>
                      {printOptions.includePrices && (
                        <span style={{ fontWeight: 700, fontSize: `${fs.productName}px`, color: C.gold }}>
                          {item.totalPrice} {t(lang, "currency_symbol")}
                        </span>
                      )}
                    </div>
                    {/* Details */}
                    {printOptions.includeProductionDetails && readableDetails.length > 0 && (
                      <div style={{
                        fontSize: `${fs.detail}px`, color: "#4B5563",
                        display: useGrid ? "grid" : "flex",
                        gridTemplateColumns: useGrid ? "1fr 1fr" : undefined,
                        flexWrap: useGrid ? undefined : "wrap",
                        gap: useGrid ? "2px 10px" : "3px 10px",
                        marginTop: "3px",
                        paddingTop: "3px",
                        borderTop: "1px dashed #D1D5DB",
                      }}>
                        {readableDetails.map((d, i) => (
                          <span key={i} style={{ display: "flex", alignItems: "center", gap: "3px", lineHeight: 1.5 }}>
                            <span style={{ color: C.green, fontWeight: 700 }}>{d.label}:</span>
                            <span style={{ color: C.dark }}>{d.value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Financials */}
            {printOptions.includePrices && (
              <div style={{ marginBottom: fs.sectionSpacing, padding: "6px", background: "rgba(245,240,232,0.65)", borderRadius: "4px", border: `1px solid ${C.gold}50` }}>
                <h3 style={{ fontSize: `${fs.section}px`, fontWeight: 700, color: C.green, margin: `0 0 5px 0`, borderBottom: `1.5px solid ${C.gold}60`, paddingBottom: "3px" }}>
                  {t(lang, "total")}
                </h3>
                <PdfRow label={t(lang, "subtotal")} value={`${itemsSubtotal} ${t(lang, "currency_symbol")}`} fs={fs} />
                {actualDiscount > 0 && <PdfRow label={t(lang, "discount")} value={`-${actualDiscount} ${t(lang, "currency_symbol")}`} fs={fs} valueColor="#DC2626" />}
                {actualDelivery > 0 && <PdfRow label={t(lang, "delivery")} value={`+${actualDelivery} ${t(lang, "currency_symbol")}`} fs={fs} />}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", paddingTop: "4px", borderTop: `1.5px solid ${C.gold}60` }}>
                  <span style={{ fontWeight: 700, fontSize: `${fs.totalLabel}px`, color: C.green }}>{t(lang, "total")}</span>
                  <span style={{ fontWeight: 700, fontSize: `${fs.totalValue}px`, color: C.green }}>{actualTotal} {t(lang, "currency_symbol")}</span>
                </div>
                {actualDeposit > 0 && (
                  <>
                    <PdfRow label={t(lang, "deposit")} value={`${actualDeposit} ${t(lang, "currency_symbol")}`} fs={fs} />
                    <PdfRow label={t(lang, "remaining")} value={`${actualRemaining} ${t(lang, "currency_symbol")}`} fs={fs} valueColor={C.gold} />
                  </>
                )}
              </div>
            )}

            {/* Conditions */}
            {conditions.length > 0 && (
              <div style={{ marginBottom: fs.sectionSpacing }}>
                <h3 style={{ fontSize: `${fs.section}px`, fontWeight: 700, color: C.green, margin: `0 0 5px 0`, borderBottom: `1.5px solid ${C.gold}60`, paddingBottom: "3px" }}>
                  {t(lang, "conditions_title")}
                </h3>
                {conditions.map((c, i) => (
                  <p key={i} style={{
                    fontSize: `${fs.conditionsItem}px`, color: C.text,
                    margin: "0 0 3px 0", lineHeight: 1.55,
                    paddingRight: "8px", borderRight: `1.5px solid ${C.gold}40`,
                  }}>{c}</p>
                ))}
              </div>
            )}

            {/* Signatures */}
            {printOptions.includeSignatures && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", paddingTop: "6px" }}>
                <PdfSigBox label={t(lang, "signature_customer")} name={customerName} fs={fs} />
                <PdfSigBox label={t(lang, "signature_seller")} name="Ameublement et Déco El Mahboubi" fs={fs} />
              </div>
            )}

            {/* Stamp */}
            {printOptions.includeStamp && stampBase64 && (
              <img src={stampBase64} alt=""
                style={{ position: "absolute", bottom: "50px", right: "30px", width: "80px", height: "80px", opacity: 0.95, borderRadius: "4px", background: "rgba(255,255,255,0.2)", padding: "3px" }} />
            )}

            {/* QR Code with border and label */}
            {printOptions.includeQrCode && (
              <div style={{ position: "absolute", top: "8mm", left: "8mm", zIndex: 10 }}>
                <div style={{
                  border: "2.5px solid #C9A84C",
                  borderRadius: "8px",
                  padding: "6px",
                  background: "#FFFFFF",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent("https://maps.app.goo.gl/Ndi6dYtDKZAspaRP7?g_st=ic")}`}
                    alt="QR"
                    style={{ width: "80px", height: "80px", display: "block" }}
                  />
                </div>
                <div style={{ fontSize: "9px", color: "#555555", marginTop: "4px", textAlign: "center", fontWeight: 600 }}>
                  {t(lang, "location")}
                </div>
              </div>
            )}

            {printOptions.includeLocation && (
              <div style={{ position: "absolute", top: "8mm", right: "8mm", zIndex: 10, textAlign: "center" }}>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.9)",
                  border: "1.5px solid #D1D5DB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}>
                  <img
                    src="https://maps.app.goo.gl/Ndi6dYtDKZAspaRP7?g_st=ic"
                    alt=""
                    style={{ width: "38px", height: "38px", display: "block" }}
                  />
                </div>
                <p style={{ fontSize: "7px", color: C.green, marginTop: "2px", fontWeight: 700 }}>
                  {t(lang, "location")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PDF sub-components
   ═══════════════════════════════════════════════════════════════ */

function PdfRow({ label, value, fs, valueColor }: { label: string; value: string; fs: any; valueColor?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
      <span style={{ color: "#6B7280", fontSize: `${fs.rowLabel}px` }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: `${fs.rowValue}px`, color: valueColor || C.dark }}>{value}</span>
    </div>
  );
}

function PdfSigBox({ label, name, fs }: { label: string; name: string; fs: any }) {
  return (
    <div style={{ width: "42%", textAlign: "center" }}>
      <p style={{ fontSize: `${fs.sigLabel}px`, fontWeight: 700, color: "#6B7280", margin: 0 }}>{label}</p>
      <div style={{ borderBottom: "1.5px solid #374151", marginTop: fs.sigHeight, marginBottom: "3px" }} />
      <p style={{ fontSize: `${fs.sigName}px`, color: "#6B7280", margin: 0 }}>{name}</p>
    </div>
  );
}