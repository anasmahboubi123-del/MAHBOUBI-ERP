/**
 * قاموس ترجمة المستندات فقط (Devis / BC / Facture)
 * لا يترجم واجهة المستخدم — فقط ما يُطبع على الورقة
 */

export type DocumentLanguage = 'ar' | 'fr' | 'es' | 'it' | 'bilingual';

interface LangDict {
  devis: string;
  bon_de_commande: string;
  facture: string;
  client: string;
  phone: string;
  city: string;
  address: string;
  date: string;
  order_number: string;
  product: string;
  products: string;
  description: string;
  quantity: string;
  unit_price: string;
  total_price: string;
  total: string;
  subtotal: string;
  discount: string;
  delivery: string;
  deposit: string;
  remaining: string;
  conditions: string;
  conditions_title: string;
  signature_customer: string;
  signature_seller: string;
  stamp: string;
  qr_verify: string;
  page: string;
  of: string;
  fabric: string;
  stitch: string;
  cushions: string;
  decor_cushions: string;
  extras: string;
  shape: string;
  length: string;
  width: string;
  height: string;
  seddars: string;
  corners: string;
  square: string;
  triangle: string;
  area: string;
  currency: string;
  currency_symbol: string;
  yes: string;
  no: string;
  note: string;
  notes: string;
  thanks: string;
}

const ar: LangDict = {
  devis: 'عرض سعر',
  bon_de_commande: 'بون دي كوموند',
  facture: 'فاتورة',
  client: 'الزبون',
  phone: 'الهاتف',
  city: 'المدينة',
  address: 'العنوان',
  date: 'التاريخ',
  order_number: 'رقم الطلب',
  product: 'المنتج',
  products: 'المنتجات',
  description: 'الوصف',
  quantity: 'الكمية',
  unit_price: 'الثمن',
  total_price: 'الإجمالي',
  total: 'المجموع',
  subtotal: 'المجموع الفرعي',
  discount: 'الخصم',
  delivery: 'التوصيل',
  deposit: 'العربون',
  remaining: 'المتبقي',
  conditions: 'الشروط والأحكام',
  conditions_title: 'الشروط والأحكام:',
  signature_customer: 'توقيع الزبون',
  signature_seller: 'توقيع البائع',
  stamp: 'ختم المحل',
  qr_verify: 'امسح للتحقق من الطلب',
  page: 'صفحة',
  of: 'من',
  fabric: 'الثوب',
  stitch: 'الخياطة',
  cushions: 'المخاد',
  decor_cushions: 'مخاد الديكور',
  extras: 'الإضافات',
  shape: 'الشكل',
  length: 'الطول',
  width: 'العرض',
  height: 'الارتفاع',
  seddars: 'السدادر',
  corners: 'الفورمجة',
  square: 'مربعة',
  triangle: 'مثلثة',
  area: 'المساحة',
  currency: 'درهم',
  currency_symbol: 'د.م',
  yes: 'نعم',
  no: 'لا',
  note: 'ملاحظة',
  notes: 'ملاحظات',
  thanks: 'شكراً لثقتكم',
};

const fr: LangDict = {
  devis: 'Devis',
  bon_de_commande: 'Bon de commande',
  facture: 'Facture',
  client: 'Client',
  phone: 'Téléphone',
  city: 'Ville',
  address: 'Adresse',
  date: 'Date',
  order_number: 'N° de commande',
  product: 'Produit',
  products: 'Produits',
  description: 'Description',
  quantity: 'Quantité',
  unit_price: 'Prix unitaire',
  total_price: 'Prix total',
  total: 'Total',
  subtotal: 'Sous-total',
  discount: 'Remise',
  delivery: 'Livraison',
  deposit: 'Acompte',
  remaining: 'Reste',
  conditions: 'Conditions générales',
  conditions_title: 'Conditions générales de vente :',
  signature_customer: 'Signature du client',
  signature_seller: 'Signature du vendeur',
  stamp: 'Cachet',
  qr_verify: 'Scannez pour vérifier',
  page: 'Page',
  of: 'sur',
  fabric: 'Tissu',
  stitch: 'Couture',
  cushions: 'Coussins',
  decor_cushions: 'Coussins déco',
  extras: 'Accessoires',
  shape: 'Forme',
  length: 'Longueur',
  width: 'Largeur',
  height: 'Hauteur',
  seddars: 'Seddars',
  corners: 'Formage',
  square: 'Carré',
  triangle: 'Triangle',
  area: 'Surface',
  currency: 'Dirham',
  currency_symbol: 'DH',
  yes: 'Oui',
  no: 'Non',
  note: 'Note',
  notes: 'Notes',
  thanks: 'Merci de votre confiance',
};

const es: LangDict = {
  devis: 'Presupuesto',
  bon_de_commande: 'Orden de compra',
  facture: 'Factura',
  client: 'Cliente',
  phone: 'Teléfono',
  city: 'Ciudad',
  address: 'Dirección',
  date: 'Fecha',
  order_number: 'N° de pedido',
  product: 'Producto',
  products: 'Productos',
  description: 'Descripción',
  quantity: 'Cantidad',
  unit_price: 'Precio unitario',
  total_price: 'Precio total',
  total: 'Total',
  subtotal: 'Subtotal',
  discount: 'Descuento',
  delivery: 'Entrega',
  deposit: 'Depósito',
  remaining: 'Restante',
  conditions: 'Condiciones generales',
  conditions_title: 'Condiciones generales de venta:',
  signature_customer: 'Firma del cliente',
  signature_seller: 'Firma del vendedor',
  stamp: 'Sello',
  qr_verify: 'Escanee para verificar',
  page: 'Página',
  of: 'de',
  fabric: 'Tela',
  stitch: 'Costura',
  cushions: 'Cojines',
  decor_cushions: 'Cojines decorativos',
  extras: 'Extras',
  shape: 'Forma',
  length: 'Longitud',
  width: 'Ancho',
  height: 'Altura',
  seddars: 'Seddars',
  corners: 'Esquinas',
  square: 'Cuadrado',
  triangle: 'Triángulo',
  area: 'Área',
  currency: 'Dirham',
  currency_symbol: 'MAD',
  yes: 'Sí',
  no: 'No',
  note: 'Nota',
  notes: 'Notas',
  thanks: 'Gracias por su confianza',
};

const it: LangDict = {
  devis: 'Preventivo',
  bon_de_commande: "Ordine d\'acquisto",
  facture: 'Fattura',
  client: 'Cliente',
  phone: 'Telefono',
  city: 'Città',
  address: 'Indirizzo',
  date: 'Data',
  order_number: 'N° ordine',
  product: 'Prodotto',
  products: 'Prodotti',
  description: 'Descrizione',
  quantity: 'Quantità',
  unit_price: 'Prezzo unitario',
  total_price: 'Prezzo totale',
  total: 'Totale',
  subtotal: 'Subtotale',
  discount: 'Sconto',
  delivery: 'Consegna',
  deposit: 'Anticipo',
  remaining: 'Restante',
  conditions: 'Condizioni generali',
  conditions_title: 'Condizioni generali di vendita:',
  signature_customer: 'Firma del cliente',
  signature_seller: 'Firma del venditore',
  stamp: 'Timbro',
  qr_verify: 'Scansiona per verificare',
  page: 'Pagina',
  of: 'di',
  fabric: 'Tessuto',
  stitch: 'Cucitura',
  cushions: 'Cuscini',
  decor_cushions: 'Cuscini decorativi',
  extras: 'Extra',
  shape: 'Forma',
  length: 'Lunghezza',
  width: 'Larghezza',
  height: 'Altezza',
  seddars: 'Seddars',
  corners: 'Formaggio',
  square: 'Quadrato',
  triangle: 'Triangolo',
  area: 'Superficie',
  currency: 'Dirham',
  currency_symbol: 'DH',
  yes: 'Sì',
  no: 'No',
  note: 'Nota',
  notes: 'Note',
  thanks: 'Grazie per la fiducia',
};

export const docI18n: Record<DocumentLanguage, LangDict> = { ar, fr, es, it, bilingual: ar };

/** Helper: يعطي النص حسب اللغة. إذا كانت ثنائية يعطي ar/fr معاً */
export function t(lang: DocumentLanguage, key: keyof LangDict): string {
  if (lang === 'bilingual') {
    const arText = ar[key];
    const frText = fr[key];
    return `${arText} / ${frText}`;
  }
  return docI18n[lang][key] || ar[key];
}

/** Helper: اسم المستند حسب النوع واللغة */
export function docTitle(type: 'devis' | 'bon_de_commande' | 'facture', lang: DocumentLanguage): string {
  if (lang === 'bilingual') {
    const map: Record<string, string> = {
      devis: 'Devis — عرض سعر',
      bon_de_commande: 'Bon de commande — بون دي كوموند',
      facture: 'Facture — فاتورة',
    };
    return map[type];
  }
  const key = type as keyof LangDict;
  return t(lang, key);
}