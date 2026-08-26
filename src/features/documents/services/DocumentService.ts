/* ═══════════════════════════════════════════════════════════════
   DOCUMENT SERVICE — El Mahboubi Style
   Matches the cream/green professional invoice design
   ═══════════════════════════════════════════════════════════════ */

import { supabase } from '@/lib/supabase';
import {
  DocumentType, PrintVariant, DocumentLanguage, GeneratedDocument,
  BusinessProfile, DocumentConditions, PrintJob,
} from '../types';

const DOC_PREFIXES: Record<DocumentType, { prefix: string; titleAr: string; titleFr: string }> = {
  devis: { prefix: 'DEVIS', titleAr: 'عرض سعر', titleFr: 'DEVIS' },
  bon_de_commande: { prefix: 'BC', titleAr: 'أمر شراء', titleFr: 'BON DE COMMANDE' },
  facture: { prefix: 'FACTURE', titleAr: 'فاتورة', titleFr: 'FACTURE' },
  work_order: { prefix: 'OT', titleAr: 'أمر شغل', titleFr: 'ORDRE DE TRAVAIL' },
};

export class DocumentService {
  /* ── Fetch Business Profile ── */
  static async getBusinessProfile(): Promise<BusinessProfile | null> {
    const { data } = await supabase.from('business_profile').select('*').single();
    if (!data) return null;
    const profile = data as Record<string, string | null>;
    return {
      companyName: profile.company_name ?? '',
      commercialName: profile.commercial_name ?? undefined,
      address: profile.address ?? '',
      city: profile.city ?? '',
      phone: profile.phone ?? '',
      mobile: profile.mobile ?? undefined,
      email: profile.email ?? '',
      website: profile.website ?? undefined,
      facebook: profile.facebook ?? undefined,
      instagram: profile.instagram ?? undefined,
      whatsapp: profile.whatsapp ?? undefined,
      ice: profile.ice ?? '',
      if_: profile.if_ ?? '',
      rc: profile.rc ?? '',
      patente: profile.patente ?? '',
      logoUrl: profile.logo_url ?? undefined,
      stampUrl: profile.stamp_url ?? undefined,
      signatureUrl: profile.signature_url ?? undefined,
      bankName: profile.bank_name ?? undefined,
      rib: profile.rib ?? undefined,
      iban: profile.iban ?? undefined,
      swift: profile.swift ?? undefined,
    };
  }

  /* ── Fetch Conditions ── */
  static async getConditions(): Promise<DocumentConditions> {
    const { data } = await supabase.from('document_conditions').select('*').single();
    const row = data as any;
    return {
      devis: row?.devis_conditions || 'صلاحية هذا العرض 15 يوماً.',
      bonDeCommande: row?.bc_conditions || 'العربون غير قابل للاسترجاع بعد بدء التصنيع.',
      facture: row?.facture_conditions || 'الفاتورة تثبت البيع.',
    };
  }

  /* ── Generate Document Number ── */
  static generateNumber(type: DocumentType, orderNumber: string): string {
    return `${DOC_PREFIXES[type].prefix}-${orderNumber}`;
  }

  /* ── Create Document Record ── */
  static async createDocumentRecord(
    orderId: string,
    job: PrintJob,
    userId: string
  ): Promise<GeneratedDocument> {
    const { data: order } = await supabase.from('orders').select('order_number').eq('id', orderId).single();
    const orderRow = order as any;
    const number = this.generateNumber(job.documentType, orderRow?.order_number || 'UNKNOWN');

    const { data, error } = await supabase
      .from('generated_documents')
      .insert({
        order_id: orderId,
        type: job.documentType,
        print_variant: job.printVariant,
        number,
        language: job.language,
        generated_by: userId,
        generated_at: new Date().toISOString(),
        version: 1,
      } as any)
      .select()
      .single();

    if (error) throw error;
    const doc = data as any;

    return {
      id: doc.id,
      orderId,
      type: job.documentType,
      printVariant: job.printVariant,
      number,
      language: job.language,
      generatedBy: userId,
      generatedAt: doc.generated_at,
      version: 1,
    };
  }

  /* ═══════════════════════════════════════════════════════════
     BUILD HTML — Exact match to El Mahboubi PDF style
     ═══════════════════════════════════════════════════════════ */

  static buildHtml(
    job: PrintJob,
    orderData: any,
    business: BusinessProfile,
    conditions: DocumentConditions
  ): string {
    const isRtl = job.language === 'ar';
    const dir = isRtl ? 'rtl' : 'ltr';
    const meta = DOC_PREFIXES[job.documentType];
    
    // Choose title based on language
    let docTitle = meta.titleFr;
    if (job.language === 'ar') docTitle = meta.titleAr;
    else if (job.language === 'bilingual') docTitle = `${meta.titleAr} · ${meta.titleFr}`;

    // Conditions text
    const condText = job.documentType === 'devis' ? conditions.devis
      : job.documentType === 'bon_de_commande' ? conditions.bonDeCommande
      : conditions.facture;

    // Show prices?
    const showPrices = job.includePrices && job.printVariant !== 'production';
    const showCosts = job.includeCosts && job.printVariant === 'manager';

    // Format date
    const today = new Date().toLocaleDateString('fr-FR');
    const orderDate = orderData.createdAt 
      ? new Date(orderData.createdAt).toLocaleDateString('fr-FR') 
      : today;

    // ── Build items rows ──
    const itemsHtml = orderData.items?.map((item: any) => {
      let descExtra = '';
      if (job.includeProductionDetails) {
        const d = item.details || {};
        if (d.seddari) descExtra += `<div style="font-size:10px;color:#666;margin-top:2px;">📐 ${d.seddari.lengthCm}×${d.seddari.widthCm} سم</div>`;
        if (d.fabric) descExtra += `<div style="font-size:10px;color:#666;">🧵 ${d.fabric.name}</div>`;
        if (d.dimensions?.areaSqm) descExtra += `<div style="font-size:10px;color:#666;">📏 ${d.dimensions.areaSqm} م²</div>`;
        if (d.woodItems?.length) descExtra += `<div style="font-size:10px;color:#666;">🪵 ${d.woodItems.length} عنصر خشب</div>`;
      }

      const unitPrice = showPrices ? item.unitPrice : 0;
      const totalPrice = showPrices ? item.totalPrice : 0;

      return `
        <tr>
          <td style="padding:14px 8px;border-bottom:1px solid #C9A84C40;font-size:13px;color:#1a1a1a;">
            <div style="font-weight:600;">${item.productName}</div>
            ${descExtra}
          </td>
          <td style="padding:14px 8px;border-bottom:1px solid #C9A84C40;text-align:center;font-size:13px;color:#1a1a1a;">
            ${item.quantity}
          </td>
          ${showPrices ? `
          <td style="padding:14px 8px;border-bottom:1px solid #C9A84C40;text-align:center;font-size:13px;color:#1a1a1a;">
            ${unitPrice.toFixed(2)} <span style="font-size:10px;color:#888;">MAD</span>
          </td>
          <td style="padding:14px 8px;border-bottom:1px solid #C9A84C40;text-align:center;font-size:13px;font-weight:600;color:#1B5E38;">
            ${totalPrice.toFixed(2)} <span style="font-size:10px;color:#888;">MAD</span>
          </td>
          ` : ''}
        </tr>
      `;
    }).join('') || '';

    // ── Financial summary ──
    let financialHtml = '';
    if (showPrices && orderData.total) {
      financialHtml = `
        <div style="margin-top:30px;border-top:2px solid #1B5E38;padding-top:20px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="text-align:left;padding:6px 0;font-size:13px;color:#555;">TOTAL</td>
              <td style="text-align:right;padding:6px 0;font-size:18px;font-weight:700;color:#1B5E38;">
                ${orderData.total.toFixed(2)} MAD
              </td>
            </tr>
          </table>
          ${orderData.depositAmount > 0 ? `
          <div style="margin-top:10px;padding:12px;background:#1B5E3808;border-radius:8px;">
            <div style="display:flex;justify-content:space-between;font-size:12px;color:#666;">
              <span>Acompte versé · العربون</span>
              <span>${orderData.depositAmount.toFixed(2)} MAD</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12px;color:#666;margin-top:4px;">
              <span>Reste · المتبقي</span>
              <span>${orderData.remaining.toFixed(2)} MAD</span>
            </div>
          </div>
          ` : ''}
        </div>
      `;
    }

    // ── Social / Footer info ──
    const socialHtml = [];
    if (business.email) socialHtml.push(`EMAIL : ${business.email.toUpperCase()}`);
    if (business.instagram) socialHtml.push(`INSTAGRAM : ${business.instagram.toUpperCase()}`);
    if (business.facebook) socialHtml.push(`FACEBOOK : ${business.facebook.toUpperCase()}`);
    if (business.whatsapp) socialHtml.push(`WHATSAPP : ${business.whatsapp}`);
    
    const socialBlock = socialHtml.length ? `
      <div style="margin-top:40px;padding-top:20px;border-top:1px solid #1B5E38;">
        ${socialHtml.map(s => `<div style="font-size:11px;color:#1B5E38;letter-spacing:0.5px;margin-bottom:3px;">${s}</div>`).join('')}
      </div>
    ` : '';

    // ── Conditions ──
    const conditionsHtml = job.documentType !== 'work_order' ? `
      <div style="margin-top:40px;padding-top:20px;border-top:1px solid #1B5E38;">
        <h3 style="font-size:13px;font-weight:700;color:#1B5E38;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;">
          Conditions Générales de Vente · الشروط العامة للبيع
        </h3>
        <div style="font-size:10px;line-height:1.8;color:#444;text-align:justify;">
          ${condText.replace(/\n/g, '<br>')}
        </div>
      </div>
    ` : '';

    // ── Signatures ──
    const signaturesHtml = job.includeSignatures && job.printVariant !== 'production' ? `
      <div style="margin-top:50px;display:flex;justify-content:space-between;gap:40px;">
        <div style="flex:1;text-align:center;">
          <div style="border-top:1px solid #1B5E38;padding-top:8px;margin-top:60px;">
            <span style="font-size:11px;color:#1B5E38;font-weight:600;">Signature Client · توقيع الزبون</span>
          </div>
        </div>
        <div style="flex:1;text-align:center;">
          <div style="border-top:1px solid #1B5E38;padding-top:8px;margin-top:60px;">
            <span style="font-size:11px;color:#1B5E38;font-weight:600;">Signature Gérant · توقيع المدير</span>
          </div>
        </div>
      </div>
    ` : '';

    // ── QR Code ──
    const qrHtml = job.includeQrCode ? `
      <div style="position:absolute;bottom:40px;left:40px;">
        <div style="width:70px;height:70px;border:1px solid #1B5E38;display:flex;align-items:center;justify-content:center;font-size:9px;color:#1B5E38;text-align:center;">
          QR<br>VERIFY
        </div>
      </div>
    ` : '';

    // ── Logo handling ──
    const logoHtml = business.logoUrl
      ? `<img src="${business.logoUrl}" style="max-width:100px;max-height:100px;object-fit:contain;" alt="Logo" />`
      : `<div style="width:80px;height:80px;border:2px solid #1B5E38;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#1B5E38;text-align:center;">LOGO</div>`;

    // ── Stamp ──
    const stampHtml = job.includeStamp && business.stampUrl
      ? `<img src="${business.stampUrl}" style="position:absolute;bottom:100px;right:60px;width:100px;opacity:0.7;" />`
      : '';

    // ── MAIN HTML ──
    return `
      <!DOCTYPE html>
      <html dir="${dir}">
      <head>
        <meta charset="UTF-8">
        <title>${docTitle} — ${orderData.orderNumber || ''}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: ${isRtl ? "'Cairo', sans-serif" : "'Inter', 'Cairo', sans-serif"};
            background: #F5F0E8;
            color: #1a1a1a;
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 40px 50px;
            position: relative;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page { position: relative; width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div class="page">
          ${stampHtml}

          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
            <div style="flex:1;">
              <h1 style="font-size:52px;font-weight:700;color:#1B5E38;letter-spacing:2px;line-height:1;margin:0;text-transform:uppercase;">
                ${docTitle}
              </h1>
            </div>
            <div style="text-align:center;">
              ${logoHtml}
              <div style="margin-top:6px;font-size:11px;font-weight:700;color:#1B5E38;letter-spacing:1px;">
                AMEUBLEMENT<br>ET DÉCO<br>EL MAHBOUBI
              </div>
              <div style="font-size:8px;color:#C9A84C;margin-top:2px;">Un intérieur qui vous ressemble</div>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:20px;margin-bottom:8px;">
            <div style="font-size:12px;color:#1a1a1a;line-height:1.8;">
              <div>Fait le ${orderDate}</div>
              <div style="direction:rtl;">${business.address || ''}</div>
              <div>${business.phone || ''}</div>
            </div>
            <div style="text-align:left;font-size:13px;color:#1a1a1a;">
              <div style="font-weight:600;">${meta.prefix} n° ${orderData.orderNumber || ''}</div>
            </div>
          </div>

          <div style="height:2px;background:#1B5E38;margin:15px 0 25px 0;"></div>

          ${job.printVariant !== 'production' ? `
          <div style="margin-bottom:25px;padding:12px 0;">
            <div style="font-size:11px;color:#666;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;">Client · الزبون</div>
            <div style="font-size:14px;font-weight:700;color:#1B5E38;">${orderData.customer?.name || ''}</div>
            <div style="font-size:12px;color:#555;">${orderData.customer?.phone || ''} · ${orderData.customer?.city || ''}</div>
          </div>
          ` : ''}

          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="text-align:left;padding:12px 8px;border-bottom:2px solid #1B5E38;font-size:12px;font-weight:700;color:#1B5E38;text-transform:uppercase;letter-spacing:0.5px;">
                  Description
                </th>
                <th style="text-align:center;padding:12px 8px;border-bottom:2px solid #1B5E38;font-size:12px;font-weight:700;color:#1B5E38;text-transform:uppercase;letter-spacing:0.5px;width:80px;">
                  Quantité
                </th>
                ${showPrices ? `
                <th style="text-align:center;padding:12px 8px;border-bottom:2px solid #1B5E38;font-size:12px;font-weight:700;color:#1B5E38;text-transform:uppercase;letter-spacing:0.5px;width:100px;">
                  Prix Unitaire
                </th>
                <th style="text-align:center;padding:12px 8px;border-bottom:2px solid #1B5E38;font-size:12px;font-weight:700;color:#1B5E38;text-transform:uppercase;letter-spacing:0.5px;width:100px;">
                  Total
                </th>
                ` : ''}
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          ${financialHtml}
          ${socialBlock}
          ${conditionsHtml}
          ${signaturesHtml}
          ${qrHtml}

          <div style="position:absolute;bottom:30px;left:50px;right:50px;text-align:center;font-size:9px;color:#999;letter-spacing:0.5px;">
            ${business.companyName || 'El Mahboubi'} · ${business.phone || ''} · Document généré le ${new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /* ── Print Window ── */
  static print(job: PrintJob, orderData: any, business: BusinessProfile, conditions: DocumentConditions) {
    const html = this.buildHtml(job, orderData, business, conditions);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بفتح النوافذ المنبثقة للطباعة');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 800);
  }

  /* ── Generate & Upload PDF ── */
  static async generatePdf(job: PrintJob, orderData: any, business: BusinessProfile, conditions: DocumentConditions): Promise<Blob | null> {
    console.log('PDF generation requires html2canvas + jsPDF libraries');
    return null;
  }
}