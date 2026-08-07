"use client";

import React, { useRef } from 'react';
import { Printer } from 'lucide-react';
import { OrderDraft } from '@/lib/types';
import { useInvoiceTemplate } from './hooks/useInvoiceTemplate';

interface InvoiceTemplateProps {
  draft: OrderDraft;
  showDetails?: boolean;
}

function fmtDh(n: number): string {
  return n.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DH';
}

function fmtM(cm: number): string {
  return (cm / 100).toFixed(2) + 'm';
}

export default function InvoiceTemplate({ draft, showDetails = true }: InvoiceTemplateProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { template, loading } = useInvoiceTemplate();

  /* ─── حسابات المراحل ─── */

  // المرحلة 1: الثوب
  const fabric = draft.fabric;
  const seddars = draft.seddars || [];
  const seddarsFabricTotal = draft.seddarsFabricTotalOverride ?? seddars.reduce((sum, s) => sum + s.fabricConsumption, 0);
  const fabricCost = fabric ? (seddarsFabricTotal / 100) * fabric.price_per_meter : 0;

  // المرحلة 2: السدادر (عادية + فورمجة)
  const normalSeddars = seddars.filter(s => s.type !== "formaja");
  const formajaSeddars = seddars.filter(s => s.type === "formaja");

  // المرحلة 3: خياطة السدادر
  const stitches = draft.sedariStitches || [];
  const stitchTotal = draft.stage3TotalOverride ?? stitches.reduce((sum, s) => sum + s.finalPrice, 0);

  // المرحلة 4: المخاد
  const cushions = draft.cushionItems || [];
  const calcCushionTotal = (c: typeof cushions[0]) => {
    const stitch = c.count * c.stitchFinalPrice;
    const lwata = c.hasLwata ? c.count * c.lwataPrice : 0;
    return stitch + lwata;
  };
  const cushionsTotal = draft.stage4TotalOverride ?? cushions.reduce((sum, c) => sum + calcCushionTotal(c), 0);

  // المرحلة 5: الكيدور (بالقطعة فقط)
  const decor = draft.decorItems || [];
  const calcDecorTotal = (d: typeof decor[0]) => d.count * d.stitchFinalPrice;
  const decorTotal = draft.stage5TotalOverride ?? decor.reduce((sum, d) => sum + calcDecorTotal(d), 0);

  // المرحلة 6: الإضافات (لحايف + طابورية فقط)
  const extrasStage = draft.extrasStage;
  const lhayefTotal = extrasStage?.lhayef?.enabled
    ? (extrasStage.lhayef.totalOverride ?? (extrasStage.lhayef.lengthM * extrasStage.lhayef.pricePerMeter))
    : 0;
  const tabouriaTotal = extrasStage?.tabouria?.enabled
    ? (extrasStage.tabouria.totalOverride ?? (extrasStage.tabouria.count * extrasStage.tabouria.unitPrice))
    : 0;
  const extrasTotal = lhayefTotal + tabouriaTotal;

  // المجموع
  const computed = fabricCost + stitchTotal + cushionsTotal + decorTotal + extrasTotal;
  const total = draft.totalOverride ?? computed;
  const deposit = draft.deposit || 0;
  const remaining = total - deposit;

  /* ─── بناء سطور الفاتورة ─── */
  const lineItems: { desc: string; qty: string; unit: string; total: number }[] = [];

  // 1. الثوب
  if (fabric) {
    lineItems.push({
      desc: `🧵 الثوب — ${fabric.name}`,
      qty: fmtM(seddarsFabricTotal),
      unit: fmtDh(fabric.price_per_meter) + '/م',
      total: fabricCost,
    });
  }

  // 2. خياطة السدادر (كل سداري على حدة)
  stitches.forEach((s) => {
    const seddari = seddars.find(sd => sd.id === s.seddariId);
    const isFormaja = seddari?.type === "formaja";
    const sameType = seddars.filter(sd => sd.type === seddari?.type);
    const idx = sameType.findIndex(sd => sd.id === s.seddariId) + 1;
    const label = isFormaja ? `🌀 فورمجة ${idx}` : `سداري ${idx}`;
    lineItems.push({
      desc: `✂️ خياطة ${label} — ${s.styleName}`,
      qty: '1',
      unit: fmtDh(s.basePrice),
      total: s.finalPrice,
    });
  });

  // 3. المخاد
  cushions.forEach((c, idx) => {
    const itemTotal = calcCushionTotal(c);
    lineItems.push({
      desc: `🛏️ مخدة ${idx + 1} — ${c.stitchStyleName} (${c.size}سم × ${c.count})`,
      qty: String(c.count),
      unit: fmtDh(c.stitchFinalPrice),
      total: itemTotal,
    });
    if (c.hasLwata) {
      lineItems.push({
        desc: `   ↳ لواط — ${c.count} × ${c.lwataPrice} DH`,
        qty: String(c.count),
        unit: fmtDh(c.lwataPrice),
        total: c.count * c.lwataPrice,
      });
    }
  });

  // 4. الكيدور
  decor.forEach((d, idx) => {
    const itemTotal = calcDecorTotal(d);
    lineItems.push({
      desc: `🌀 كيدور ${idx + 1} — ${d.shapeName} × ${d.count} قطعة`,
      qty: String(d.count),
      unit: fmtDh(d.stitchFinalPrice) + '/قطعة',
      total: itemTotal,
    });
  });

  // 5. الإضافات
  if (extrasStage?.lhayef?.enabled) {
    lineItems.push({
      desc: `➕ اللحايف — ${extrasStage.lhayef.lengthM} متر`,
      qty: String(extrasStage.lhayef.lengthM),
      unit: fmtDh(extrasStage.lhayef.pricePerMeter) + '/م',
      total: lhayefTotal,
    });
  }
  if (extrasStage?.tabouria?.enabled) {
    lineItems.push({
      desc: `➕ الطابورية — ${extrasStage.tabouria.count} قطعة`,
      qty: String(extrasStage.tabouria.count),
      unit: fmtDh(extrasStage.tabouria.unitPrice) + '/قطعة',
      total: tabouriaTotal,
    });
  }

  const handlePrint = () => window.print();

  if (loading) {
    return <div className="text-center p-8 text-gray-400">جارٍ تحميل قالب الفاتورة...</div>;
  }

  return (
    <div className="space-y-4">
      {/* A4 Invoice */}
      <div
        ref={printRef}
        className="bg-[#FDFCF8] w-[210mm] min-h-[297mm] mx-auto shadow-2xl print:shadow-none print:w-full"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        <div className="p-12 print:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-5xl font-bold text-[#8B7355] tracking-wider mb-4">FACTURE</h1>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Fait le {new Date().toLocaleDateString('fr-FR')}</p>
                <p>{template.address}</p>
                <p dir="ltr">{template.phone}</p>
              </div>
            </div>
            <div className="text-center">
              {template.logoUrl ? (
                <img src={template.logoUrl} alt="Logo" className="w-24 h-24 object-contain mx-auto mb-2" />
              ) : (
                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-2 mx-auto" style={{ backgroundColor: template.accentColor }}>
                  <svg viewBox="0 0 100 100" className="w-16 h-16 text-white">
                    <rect x="15" y="50" width="70" height="30" rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path d="M20 50 L30 30 L70 30 L80 50" fill="none" stroke="currentColor" strokeWidth="3" />
                    <rect x="25" y="55" width="20" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
                    <rect x="55" y="55" width="20" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
              )}
              <p className="font-bold text-sm" style={{ color: template.accentColor }}>AMEUBLEMENT</p>
              <p className="font-bold text-sm" style={{ color: template.accentColor }}>ET DÉCO</p>
              <p className="font-bold text-lg" style={{ color: template.accentColor }}>{template.companyName}</p>
              <p className="text-xs text-[#C9A84C]">Un intérieur qui vous ressemble</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Facture n° {String(Date.now()).slice(-6)}</p>
            </div>
          </div>

          {/* Customer */}
          <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: `${template.accentColor}10` }}>
            <p className="font-bold mb-1" style={{ color: template.accentColor }}>الزبون:</p>
            <p className="text-gray-700">{draft.customer?.name || 'غير محدد'}</p>
            <p className="text-gray-500 text-sm" dir="ltr">{draft.customer?.phone}</p>
            {draft.customer?.deliveryDate && (
              <p className="text-gray-500 text-sm">تاريخ التسليم: {draft.customer.deliveryDate}</p>
            )}
            {draft.customer?.notes && (
              <p className="text-gray-500 text-sm mt-1">ملاحظات: {draft.customer.notes}</p>
            )}
          </div>

          {/* Table */}
          <table className="w-full mb-6">
            <thead>
              <tr style={{ borderBottom: `2px solid ${template.accentColor}` }}>
                <th className="text-right py-3 px-4 font-bold" style={{ color: template.accentColor }}>Description</th>
                <th className="text-center py-3 px-4 font-bold" style={{ color: template.accentColor }}>Prix Unitaire</th>
                <th className="text-center py-3 px-4 font-bold" style={{ color: template.accentColor }}>Quantité</th>
                <th className="text-left py-3 px-4 font-bold" style={{ color: template.accentColor }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {showDetails ? (
                lineItems.map((item, i) => (
                  <tr key={i} className="border-b border-[#E8E4DC]">
                    <td className="py-3 px-4 text-gray-700">{item.desc}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{item.unit}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{item.qty}</td>
                    <td className="py-3 px-4 text-left font-bold" style={{ color: template.accentColor }}>{fmtDh(item.total)}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-[#E8E4DC]">
                  <td className="py-3 px-4 text-gray-700">Prestation complète</td>
                  <td className="py-3 px-4 text-center text-gray-600">-</td>
                  <td className="py-3 px-4 text-center text-gray-600">1</td>
                  <td className="py-3 px-4 text-left font-bold" style={{ color: template.accentColor }}>{fmtDh(total)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80 space-y-2">
              {showDetails && draft.totalOverride !== null && (
                <div className="flex justify-between py-2 border-b border-[#E8E4DC]">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-bold">{fmtDh(computed)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 border-b-2" style={{ borderColor: template.accentColor }}>
                <span className="font-bold text-lg" style={{ color: template.accentColor }}>TOTAL</span>
                <span className="font-extrabold text-xl" style={{ color: template.accentColor }}>{fmtDh(total)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Acompte versé</span>
                <span className="font-bold text-green-600">{fmtDh(deposit)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Reste à payer</span>
                <span className="font-bold text-red-600">{fmtDh(remaining)}</span>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="border-t-2 pt-6 mt-8" style={{ borderColor: template.accentColor }}>
            <h3 className="font-bold mb-3" style={{ color: template.accentColor }}>CONDITIONS GÉNÉRALES DE VENTE :</h3>
            <div className="text-xs text-gray-600 space-y-2 leading-relaxed whitespace-pre-line">
              {template.terms}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-[#E8E4DC] text-xs text-gray-500 space-y-1">
            <p>EMAIL : {template.email}</p>
            <p>TIK TOK : {template.tiktok}</p>
            <p>INSTAGRAM : {template.instagram}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition"
          style={{ backgroundColor: template.accentColor }}
        >
          <Printer className="w-5 h-5" /> طباعة / PDF
        </button>
      </div>
    </div>
  );
}