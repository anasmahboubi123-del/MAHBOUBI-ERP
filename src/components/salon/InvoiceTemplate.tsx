'use client';

import React, { useRef } from 'react';
import { Printer, Download } from 'lucide-react';
import { OrderDraft } from '@/lib/types';
import { seddariFabricCm, DEFAULTS, fmtDh, fmtM } from '@/lib/calculations';
import { CustomAddition } from './StageSummary';
import { useInvoiceTemplate } from './hooks/useInvoiceTemplate';

interface InvoiceTemplateProps {
  draft: OrderDraft;
  customItems?: CustomAddition[];
  showDetails?: boolean;
}

export default function InvoiceTemplate({ draft, customItems = [], showDetails = true }: InvoiceTemplateProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { template, loading } = useInvoiceTemplate();

  const pricePerCm = (draft.fabric?.price_per_meter ?? 0) / 100;
  const seddarsFabric = draft.seddars.reduce((s, x) => s + seddariFabricCm(x), 0);
  const formajaCount = draft.seddars.filter(s => s.junction === 'formaja').length;
  const fabricCm = seddarsFabric + formajaCount * DEFAULTS.formajaFabricCm;
  const fabricCost = Math.round(fabricCm * pricePerCm);
  const seddariSewing = draft.seddars.length * DEFAULTS.seddariSewingPrice;
  const formajaCost = formajaCount * DEFAULTS.formajaSewingPrice;
  const cushionsCost = draft.cushions.reduce((s, c) => s + c.count * c.stitchPrice, 0);
  const stuffingCost = draft.cushions.reduce((s, c) => s + (c.stuffing ? c.count * DEFAULTS.stuffingPrice : 0), 0);
  const decorCost = draft.decorCushions.reduce((s, d) => s + d.count * d.stitchPrice, 0);
  const extrasCost = draft.extras.reduce((s, e) => s + e.qty * e.price, 0);
  const customTotal = customItems.reduce((s, i) => s + i.price, 0);
  const computed = fabricCost + seddariSewing + formajaCost + cushionsCost + stuffingCost + decorCost + extrasCost + customTotal;
  const total = draft.totalOverride ?? computed;
  const deposit = draft.deposit || 0;
  const remaining = total - deposit;

  const lineItems = [
    { desc: `🧵 الثوب (${draft.fabric?.name || 'غير محدد'})`, qty: fmtM(fabricCm), unit: draft.fabric?.price_per_meter || 0, total: fabricCost },
    { desc: `✂️ خياطة السدادر (${draft.seddars.length})`, qty: draft.seddars.length, unit: DEFAULTS.seddariSewingPrice, total: seddariSewing },
    ...(formajaCount > 0 ? [{ desc: `🔺 الفورمجات (${formajaCount})`, qty: formajaCount, unit: DEFAULTS.formajaSewingPrice, total: formajaCost }] : []),
    ...(cushionsCost > 0 ? [{ desc: `🛏️ خياطة المخاد`, qty: draft.cushions.reduce((s, c) => s + c.count, 0), unit: '-', total: cushionsCost }] : []),
    ...(stuffingCost > 0 ? [{ desc: `☁️ الحشو (لواط)`, qty: draft.cushions.filter(c => c.stuffing).reduce((s, c) => s + c.count, 0), unit: DEFAULTS.stuffingPrice, total: stuffingCost }] : []),
    ...(decorCost > 0 ? [{ desc: `🎀 مخاد الديكور`, qty: draft.decorCushions.reduce((s, d) => s + d.count, 0), unit: '-', total: decorCost }] : []),
    ...(extrasCost > 0 ? [{ desc: `➕ الإضافات`, qty: draft.extras.length, unit: '-', total: extrasCost }] : []),
    ...customItems.map(item => ({ desc: `📎 ${item.name}`, qty: 1, unit: item.price, total: item.price })),
  ];

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
            <p className="text-gray-700">{draft.customer.name || 'غير محدد'}</p>
            <p className="text-gray-500 text-sm" dir="ltr">{draft.customer.phone}</p>
            {draft.customer.deliveryDate && (
              <p className="text-gray-500 text-sm">تاريخ التسليم: {draft.customer.deliveryDate}</p>
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
                    <td className="py-3 px-4 text-center text-gray-600">{typeof item.unit === 'number' ? fmtDh(item.unit) : item.unit}</td>
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
        <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition" style={{ backgroundColor: template.accentColor }}>
          <Printer className="w-5 h-5" /> طباعة / PDF
        </button>
      </div>
    </div>
  );
}