'use client';

import React, { useState, useRef } from 'react';
import { Printer, Download, Eye, EyeOff, ToggleLeft, ToggleRight } from 'lucide-react';
import { OrderDraft, Seddari, FabricItem } from '@/lib/types';
import { seddariFabricCm, DEFAULTS, fmtDh, fmtM } from '@/lib/calculations';
import { CustomAddition } from './StageSummary';

interface InvoiceA4Props {
  draft: OrderDraft;
  customItems?: CustomAddition[];
  showManagerToggle?: boolean;
}

export default function InvoiceA4({ draft, customItems = [], showManagerToggle = true }: InvoiceA4Props) {
  const [showDetails, setShowDetails] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Manager Toggle */}
      {showManagerToggle && (
        <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-[#E8E4DC] shadow-sm">
          <div className="flex items-center gap-3">
            {showDetails ? <Eye className="w-5 h-5 text-[#1B5E3B]" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
            <span className="font-bold text-[#1B5E3B]">
              {showDetails ? 'الفاتورة مفصلة (للمدير)' : 'الفاتورة ملخصة (للزبون)'}
            </span>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1B5E3B] text-white font-bold hover:bg-[#144d2f] transition"
          >
            {showDetails ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            {showDetails ? 'تبديل للملخص' : 'تبديل للتفاصيل'}
          </button>
        </div>
      )}

      {/* A4 Invoice */}
      <div
        ref={printRef}
        className="bg-[#FDFCF8] w-[210mm] min-h-[297mm] mx-auto shadow-2xl print:shadow-none print:w-full print:min-h-0"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        <div className="p-12 print:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-5xl font-bold text-[#8B7355] tracking-wider mb-4">FACTURE</h1>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Fait le {new Date().toLocaleDateString('fr-FR')}</p>
                <p>شارع الحنصالي قرب قيسارية</p>
                <p>السعادة 217 بني ملال</p>
                <p dir="ltr">06 67 74 70 91</p>
              </div>
            </div>
            <div className="text-center">
              {/* Logo placeholder */}
              <div className="w-24 h-24 bg-[#1B5E3B] rounded-full flex items-center justify-center mb-2 mx-auto">
                <svg viewBox="0 0 100 100" className="w-16 h-16 text-white">
                  <rect x="15" y="50" width="70" height="30" rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path d="M20 50 L30 30 L70 30 L80 50" fill="none" stroke="currentColor" strokeWidth="3" />
                  <rect x="25" y="55" width="20" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
                  <rect x="55" y="55" width="20" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <p className="font-bold text-[#1B5E3B] text-sm">AMEUBLEMENT</p>
              <p className="font-bold text-[#1B5E3B] text-sm">ET DÉCO</p>
              <p className="font-bold text-[#1B5E3B] text-lg">EL MAHBOUBI</p>
              <p className="text-xs text-[#C9A84C]">Un intérieur qui vous ressemble</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Facture n° {String(Date.now()).slice(-6)}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-[#F5F0E8] rounded-xl p-4 mb-6">
            <p className="font-bold text-[#1B5E3B] mb-1">الزبون:</p>
            <p className="text-gray-700">{draft.customer.name || 'غير محدد'}</p>
            <p className="text-gray-500 text-sm" dir="ltr">{draft.customer.phone}</p>
            {draft.customer.deliveryDate && (
              <p className="text-gray-500 text-sm">تاريخ التسليم: {draft.customer.deliveryDate}</p>
            )}
          </div>

          {/* Table */}
          <table className="w-full mb-6">
            <thead>
              <tr className="border-b-2 border-[#1B5E3B]">
                <th className="text-right py-3 px-4 font-bold text-[#1B5E3B]">Description</th>
                <th className="text-center py-3 px-4 font-bold text-[#1B5E3B]">Prix Unitaire</th>
                <th className="text-center py-3 px-4 font-bold text-[#1B5E3B]">Quantité</th>
                <th className="text-left py-3 px-4 font-bold text-[#1B5E3B]">Total</th>
              </tr>
            </thead>
            <tbody>
              {showDetails ? (
                lineItems.map((item, i) => (
                  <tr key={i} className="border-b border-[#E8E4DC]">
                    <td className="py-3 px-4 text-gray-700">{item.desc}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{typeof item.unit === 'number' ? fmtDh(item.unit) : item.unit}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{item.qty}</td>
                    <td className="py-3 px-4 text-left font-bold text-[#1B5E3B]">{fmtDh(item.total)}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-[#E8E4DC]">
                  <td className="py-3 px-4 text-gray-700">Prestation complète</td>
                  <td className="py-3 px-4 text-center text-gray-600">-</td>
                  <td className="py-3 px-4 text-center text-gray-600">1</td>
                  <td className="py-3 px-4 text-left font-bold text-[#1B5E3B]">{fmtDh(total)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80 space-y-2">
              {showDetails && (
                <>
                  <div className="flex justify-between py-2 border-b border-[#E8E4DC]">
                    <span className="text-gray-600">Sous-total</span>
                    <span className="font-bold">{fmtDh(computed)}</span>
                  </div>
                  {draft.totalOverride !== null && (
                    <div className="flex justify-between py-2 border-b border-[#E8E4DC]">
                      <span className="text-amber-600">Ajustement manuel</span>
                      <span className="font-bold text-amber-600">{fmtDh(draft.totalOverride - computed)}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between py-3 border-b-2 border-[#1B5E3B]">
                <span className="font-bold text-[#1B5E3B] text-lg">TOTAL</span>
                <span className="font-extrabold text-[#1B5E3B] text-xl">{fmtDh(total)}</span>
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

          {/* Conditions */}
          <div className="border-t-2 border-[#1B5E3B] pt-6 mt-8">
            <h3 className="font-bold text-[#1B5E3B] mb-3">CONDITIONS GÉNÉRALES DE VENTE :</h3>
            <div className="text-xs text-gray-600 space-y-2 leading-relaxed">
              <p><span className="font-bold">Acompte :</span> Un acompte de 30% du montant total est exigible à la commande pour lancer la production. Le travail ne débutera qu'après réception de cet acompte.</p>
              <p><span className="font-bold">Délai de réalisation :</span> Le délai maximum de fabrication est de 60 jours (2 mois) à compter de la date de réception de l'acompte.</p>
              <p><span className="font-bold">Conditions de paiement et remise :</span> Le solde restant doit être réglé en totalité, soit par espèces au magasin, soit par virement bancaire sur le RIB ci-dessous, avant toute remise ou livraison de la marchandise.</p>
            </div>
          </div>

          {/* Footer Contact */}
          <div className="mt-8 pt-4 border-t border-[#E8E4DC] text-xs text-gray-500 space-y-1">
            <p>EMAIL : AMEUBLEMENT_DECO_ELMAHBOUBI@GMAIL.COM</p>
            <p>TIK TOK : AMEUBLEMENT_ELMAHBOUBI</p>
            <p>INSTAGRAM : AMEUBLEMENT_DECO_ELMAHBOUBI</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-[#1B5E3B] text-white rounded-xl font-bold hover:bg-[#144d2f] transition"
        >
          <Printer className="w-5 h-5" />
          طباعة / PDF
        </button>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          ${printRef.current ? `[data-print-ref="${printRef.current.dataset.printRef}"]` : ''},
          ${printRef.current ? `[data-print-ref="${printRef.current.dataset.printRef}"] *` : ''} {
            visibility: visible;
          }
          ${printRef.current ? `[data-print-ref="${printRef.current.dataset.printRef}"]` : ''} {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}