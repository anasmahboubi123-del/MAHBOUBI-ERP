"use client";

import { useEffect, useRef, useState } from "react";
import { X, Printer } from "lucide-react";
import { OrderItem, DocumentType, PrintOptions } from "../types";

const C = { green: "#1B5E38", gold: "#C9A84C", dark: "#0D1F17", cream: "#F5F0E8" };

interface PrintModalProps {
  orderItems: OrderItem[];
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerCity?: string;
  totalAmount: number;
  discountAmount?: number;
  depositAmount?: number;
  deliveryCost?: number;
  documentType: DocumentType;
  printOptions: PrintOptions;
  onClose: () => void;
}

// Simple service stubs — replace with your actual services
async function getBusinessProfile() {
  return {
    name: "Ameublement & Déco El Mahboubi",
    nameAr: "المحبوبي للأثاث والديكور",
    address: "بني ملال",
    city: "بني ملال",
    phone: "0667-74-70-91",
    email: "",
    ice: "",
    if: "",
    rc: "",
    logoUrl: null,
  };
}

async function getDocumentConditions(docType: DocumentType) {
  const conditions: Record<string, string[]> = {
    devis: [
      "عرض السعر صالح لمدة 15 يوماً من تاريخ الإصدار.",
      "الأسعار تشمل ضريبة القيمة المضافة.",
      "التسليم خلال 3-4 أسابيع من تأكيد الطلب.",
    ],
    bon_de_commande: [
      "لا يبدأ التصنيع إلا بعد دفع العربون.",
      "التسليم خلال 3-4 أسابيع من تأكيد الطلب.",
      "العميل مسؤول عن التأكد من القياسات.",
    ],
    facture: [
      "الدفع نقداً عند الاستلام.",
      "الفاتورة نهائية ولا تقبل الإرجاع.",
    ],
  };
  return { conditions: conditions[docType] || [] };
}

async function getDocumentBackground(docType: DocumentType) {
  return null;
}

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
}: PrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [business, setBusiness] = useState<any>(null);
  const [conditions, setConditions] = useState<string[]>([]);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [b, c, bg] = await Promise.all([
        getBusinessProfile(),
        getDocumentConditions(documentType),
        getDocumentBackground(documentType),
      ]);
      setBusiness(b);
      setConditions(c?.conditions || []);
      setBgUrl(bg);
      setLoading(false);
    }
    load();
  }, [documentType]);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${documentType === "devis" ? "عرض سعر" : documentType === "bon_de_commande" ? "بون دي كوموند" : "فاتورة"} — ${orderNumber}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1a1a1a;
            margin: 0;
            padding: 0;
          }
          .page {
            width: 210mm;
            min-height: 277mm;
            padding: 15mm;
            margin: 0 auto;
            background: white;
            position: relative;
          }
          .page-bg {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            opacity: 0.08;
            background-size: cover;
            background-position: center;
            z-index: 0;
            pointer-events: none;
          }
          .content { position: relative; z-index: 1; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 6px 10px; text-align: right; border-bottom: 1px solid #e5e5e5; }
          th { background: #f8f8f8; font-weight: 700; }
          .text-left { text-align: left; }
          .text-center { text-align: center; }
          .font-bold { font-weight: 700; }
          .text-sm { font-size: 10pt; }
          .text-xs { font-size: 9pt; }
          .text-green { color: #1B5E38; }
          .text-gold { color: #C9A84C; }
          .border-t { border-top: 2px solid #1B5E38; }
          .bg-light { background: #f8f8f8; }
          .rounded { border-radius: 6px; }
          .p-2 { padding: 8px; }
          .mb-2 { margin-bottom: 8px; }
          .mb-3 { margin-bottom: 12px; }
          .mt-3 { margin-top: 12px; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .items-center { align-items: center; }
          .gap-2 { gap: 8px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          @media print {
            .no-print { display: none !important; }
            body { background: white; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          ${bgUrl ? `<div class="page-bg" style="background-image: url('${bgUrl}')"></div>` : ""}
          <div class="content">
            ${content.innerHTML}
          </div>
        </div>
        <script>window.onload = () => { setTimeout(() => { window.print(); }, 300); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const remaining = Math.max(0, totalAmount - depositAmount);
  const subtotal = totalAmount + (discountAmount || 0) - (deliveryCost || 0);

  const docTitle =
    documentType === "devis"
      ? "عرض سعر"
      : documentType === "bon_de_commande"
      ? "بون دي كوموند"
      : "فاتورة";

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold" style={{ color: C.dark }}>
            {docTitle} — {orderNumber}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg text-white font-bold flex items-center gap-2"
              style={{ background: C.green }}
            >
              <Printer className="w-4 h-4" />
              طباعة
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          <div
            ref={printRef}
            className="bg-white mx-auto shadow-lg"
            style={{ width: "210mm", minHeight: "277mm", padding: "15mm" }}
          >
            <DocumentHeader business={business} />

            <div className="flex justify-between items-start mb-6 mt-4">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: C.green }}>
                  {docTitle}
                </h1>
                <p className="text-sm text-gray-500">رقم: {orderNumber}</p>
                <p className="text-sm text-gray-500">
                  التاريخ: {new Date().toLocaleDateString("ar-MA")}
                </p>
              </div>
              <div className="text-left">
                <p className="font-bold">{customerName}</p>
                {customerPhone && <p className="text-sm text-gray-500">{customerPhone}</p>}
                {customerCity && <p className="text-sm text-gray-500">{customerCity}</p>}
              </div>
            </div>

            <div className="space-y-6">
              {orderItems.map((item, idx) => (
                <ProductPrintSection
                  key={item.orderItemId || item.id}
                  item={item}
                  index={idx + 1}
                  showPrices={printOptions.includePrices}
                  showDetails={printOptions.includeProductionDetails}
                  language={printOptions.language}
                />
              ))}
            </div>

            <div className="mt-6 border-t-2 pt-4" style={{ borderColor: C.green }}>
              <div className="space-y-2 max-w-xs mr-auto">
                {printOptions.includePrices && (
                  <>
                    <div className="flex justify-between">
                      <span>المجموع الفرعي</span>
                      <span className="font-bold">{subtotal.toFixed(2)} د.م</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>الخصم</span>
                        <span className="font-bold">-{discountAmount.toFixed(2)} د.م</span>
                      </div>
                    )}
                    {deliveryCost > 0 && (
                      <div className="flex justify-between">
                        <span>التوصيل</span>
                        <span className="font-bold">{deliveryCost.toFixed(2)} د.م</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>الإجمالي</span>
                      <span style={{ color: C.gold }}>{totalAmount.toFixed(2)} د.م</span>
                    </div>
                    {depositAmount > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>العربون</span>
                          <span>{depositAmount.toFixed(2)} د.م</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold">
                          <span>المتبقي</span>
                          <span>{remaining.toFixed(2)} د.م</span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {conditions.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm">
                <p className="font-bold mb-2">الشروط والأحكام:</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  {conditions.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ol>
              </div>
            )}

            {printOptions.includeSignatures && (
              <div className="mt-8 grid grid-cols-2 gap-8 text-center">
                <div className="border-t pt-4">
                  <p className="font-bold">توقيع الزبون</p>
                  <p className="text-xs text-gray-400 mt-8">........................</p>
                </div>
                <div className="border-t pt-4">
                  <p className="font-bold">توقيع البائع</p>
                  <p className="text-xs text-gray-400 mt-8">........................</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentHeader({ business }: { business: any }) {
  if (!business) return null;
  return (
    <div className="flex justify-between items-start border-b-2 pb-4" style={{ borderColor: C.green }}>
      <div>
        {business.logoUrl && (
          <img src={business.logoUrl} alt="logo" className="h-16 mb-2 object-contain" />
        )}
        <h2 className="text-xl font-bold" style={{ color: C.dark }}>
          {business.nameAr || business.name}
        </h2>
        <p className="text-sm text-gray-500">{business.address}</p>
        <p className="text-sm text-gray-500">{business.city} — {business.phone}</p>
      </div>
      <div className="text-left text-sm text-gray-500">
        {business.ice && <p>ICE: {business.ice}</p>}
        {business.if && <p>IF: {business.if}</p>}
        {business.rc && <p>RC: {business.rc}</p>}
      </div>
    </div>
  );
}

function ProductPrintSection({ item, index, showPrices, showDetails, language }: any) {
  switch (item.productType) {
    case "salon": return <SalonPrintSection item={item} index={index} showPrices={showPrices} showDetails={showDetails} />;
    case "khamiya": return <KhamiyaPrintSection item={item} index={index} showPrices={showPrices} showDetails={showDetails} />;
    case "wood": return <WoodPrintSection item={item} index={index} showPrices={showPrices} showDetails={showDetails} />;
    case "foam": return <FoamPrintSection item={item} index={index} showPrices={showPrices} showDetails={showDetails} />;
    case "tapis": return <TapisPrintSection item={item} index={index} showPrices={showPrices} showDetails={showDetails} />;
    default: return <GenericPrintSection item={item} index={index} showPrices={showPrices} />;
  }
}

function SalonPrintSection({ item, index, showPrices }: any) {
  const d = item.details || {};
  return (
    <div className="border rounded-lg overflow-hidden mb-4">
      <div className="p-3 font-bold text-white flex justify-between" style={{ background: C.green }}>
        <span>#{index} صالون مغربي — {d.fabric?.name || ""}</span>
        {showPrices && <span>{item.totalPrice?.toFixed(2)} د.م</span>}
      </div>
      <div className="p-4 space-y-2 text-sm">
        {d.fabric && (
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">القماش</span>
            <span className="font-medium">{d.fabric.name}</span>
          </div>
        )}
        {Array.isArray(d.seddari) && d.seddari.map((s: any, i: number) => (
          <div key={i} className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">سداري {i + 1}</span>
            <span className="font-medium">{s.lengthCm}×{s.widthCm} سم — ارتفاع {s.heightCm} سم</span>
          </div>
        ))}
        {d.stitch && (
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">الخياطة</span>
            <span className="font-medium">{d.stitch.type}</span>
          </div>
        )}
        {d.cushions && (
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">المخدات</span>
            <span className="font-medium">{d.cushions.count} مخدة</span>
          </div>
        )}
        {d.decor && (
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">الديكور</span>
            <span className="font-medium">{d.decor.type}</span>
          </div>
        )}
        {Array.isArray(d.extras) && d.extras.map((ex: any, i: number) => (
          <div key={i} className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">{ex.name}</span>
            {showPrices && <span className="font-medium">{ex.price?.toFixed(2)} د.م</span>}
          </div>
        ))}
        {d.formage && (
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">الفورماج</span>
            <span className="font-medium">{d.formage.corners} زاوية</span>
          </div>
        )}
      </div>
    </div>
  );
}

function KhamiyaPrintSection({ item, index, showPrices }: any) {
  const d = item.details || {};
  return (
    <div className="border rounded-lg overflow-hidden mb-4">
      <div className="p-3 font-bold text-white flex justify-between" style={{ background: C.green }}>
        <span>#{index} خامية صالون — {d.fabric?.name || ""}</span>
        {showPrices && <span>{item.totalPrice?.toFixed(2)} د.م</span>}
      </div>
      <div className="p-4 space-y-2 text-sm">
        {d.fabric && (
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">نوع القماش</span>
            <span className="font-medium">{d.fabric.name}</span>
          </div>
        )}
        {d.dimensions && (
          <>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">الطول</span>
              <span className="font-medium">{d.dimensions.lengthCm} سم</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">العرض</span>
              <span className="font-medium">{d.dimensions.widthCm} سم</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">المساحة</span>
              <span className="font-medium">{d.dimensions.areaSqm} م²</span>
            </div>
          </>
        )}
        {d.khamiyaShape && (
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">الشكل</span>
            <span className="font-medium">{d.khamiyaShape === "solid_piece" ? "قطعة واحدة" : "قص من الوسط"}</span>
          </div>
        )}
        {d.stitch && (
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">الخياطة</span>
            <span className="font-medium">{d.stitch.type}</span>
          </div>
        )}
        {d.aqiq && (
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">العقيق</span>
            <span className="font-medium">{d.aqiq.name}</span>
          </div>
        )}
        {d.background && (
          <>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">خلفية</span>
              <span className="font-medium">{d.background.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">أبعاد الخلفية</span>
              <span className="font-medium">{d.background.width}×{d.background.height} م</span>
            </div>
          </>
        )}
        {Array.isArray(d.customAdditions) && d.customAdditions.map((a: any, i: number) => (
          <div key={i} className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">{a.name}</span>
            {showPrices && <span className="font-medium">{a.price?.toFixed(2)} د.م</span>}
          </div>
        ))}
        {Array.isArray(d.catalogAdditions) && d.catalogAdditions.map((a: any, i: number) => (
          <div key={i} className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">{a.name}</span>
            {showPrices && <span className="font-medium">{a.price?.toFixed(2)} د.م</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function WoodPrintSection({ item, index, showPrices }: any) {
  const d = item.details || {};
  return (
    <div className="border rounded-lg overflow-hidden mb-4">
      <div className="p-3 font-bold text-white flex justify-between" style={{ background: C.green }}>
        <span>#{index} عود — {d.model?.name || ""}</span>
        {showPrices && <span>{item.totalPrice?.toFixed(2)} د.م</span>}
      </div>
      <div className="p-4 space-y-2 text-sm">
        {d.model && (
          <>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">الموديل</span>
              <span className="font-medium">{d.model.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">الكود</span>
              <span className="font-medium">{d.model.code}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">نوع الخشب</span>
              <span className="font-medium">{d.model.woodType}</span>
            </div>
          </>
        )}
        {d.salonShape && (
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">شكل الصالون</span>
            <span className="font-medium">{d.salonShape}</span>
          </div>
        )}
        {Array.isArray(d.seddars) && d.seddars.map((s: any, i: number) => (
          <div key={i} className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">سداري {s.index}</span>
            <span className="font-medium">{s.lengthCm} سم</span>
          </div>
        ))}
        {Array.isArray(d.woodItems) && d.woodItems.map((w: any, i: number) => (
          <div key={i} className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">{w.name}</span>
            <span className="font-medium">×{w.quantity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FoamPrintSection({ item, index, showPrices }: any) {
  const d = item.details || {};
  return (
    <div className="border rounded-lg overflow-hidden mb-4">
      <div className="p-3 font-bold text-white flex justify-between" style={{ background: C.green }}>
        <span>#{index} بونج — {d.product?.name || ""}</span>
        {showPrices && <span>{item.totalPrice?.toFixed(2)} د.م</span>}
      </div>
      <div className="p-4 space-y-2 text-sm">
        {d.product && (
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">المنتج</span>
            <span className="font-medium">{d.product.name}</span>
          </div>
        )}
        {d.heightCm && (
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">الارتفاع</span>
            <span className="font-medium">{d.heightCm} سم</span>
          </div>
        )}
        {d.widthCm && (
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">العرض</span>
            <span className="font-medium">{d.widthCm} سم</span>
          </div>
        )}
        {Array.isArray(d.foamSeddars) && d.foamSeddars.map((len: number, i: number) => (
          <div key={i} className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">سداري {i + 1}</span>
            <span className="font-medium">{len} م</span>
          </div>
        ))}
        {(d.squareCorners > 0 || d.triangleCorners > 0) && (
          <div className="py-1 border-b border-gray-100">
            <span className="text-gray-600 block mb-1">الفورماج:</span>
            {d.squareCorners > 0 && <span className="font-medium ml-4">مربعة: {d.squareCorners}</span>}
            {d.triangleCorners > 0 && <span className="font-medium ml-4">مثلثة: {d.triangleCorners}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function TapisPrintSection({ item, index, showPrices }: any) {
  const d = item.details || {};
  return (
    <div className="border rounded-lg overflow-hidden mb-4">
      <div className="p-3 font-bold text-white flex justify-between" style={{ background: C.green }}>
        <span>#{index} زربية — {d.material?.name || ""}</span>
        {showPrices && <span>{item.totalPrice?.toFixed(2)} د.م</span>}
      </div>
      <div className="p-4 space-y-2 text-sm">
        {d.material && (
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">النوع</span>
            <span className="font-medium">{d.material.name}</span>
          </div>
        )}
        {d.dimensions && (
          <>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">الطول الأصلي</span>
              <span className="font-medium">{d.dimensions.lengthCm} سم</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">العرض الأصلي</span>
              <span className="font-medium">{d.dimensions.widthCm} سم</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-600">المساحة النهائية</span>
              <span className="font-medium">{d.dimensions.areaSqm} م²</span>
            </div>
          </>
        )}
        {d.cutMarginCm !== undefined && (
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">هامش القص</span>
            <span className="font-medium">{d.cutMarginCm} سم</span>
          </div>
        )}
        {d.wastePercent !== undefined && (
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">هدر القص</span>
            <span className="font-medium">{d.wastePercent}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function GenericPrintSection({ item, index, showPrices }: any) {
  return (
    <div className="border rounded-lg overflow-hidden mb-4">
      <div className="p-3 font-bold text-white flex justify-between" style={{ background: C.green }}>
        <span>#{index} {item.productName}</span>
        {showPrices && <span>{item.totalPrice?.toFixed(2)} د.م</span>}
      </div>
      <div className="p-4 text-sm text-gray-500">
        تفاصيل المنتج غير متوفرة للعرض
      </div>
    </div>
  );
}