'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface InvoiceTemplate {
  html: string;
  logoUrl: string | null;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  tiktok: string;
  instagram: string;
  terms: string;
  accentColor: string;
}

const DEFAULT_TEMPLATE: InvoiceTemplate = {
  html: '',
  logoUrl: null,
  companyName: 'AMEUBLEMENT ET DÉCO EL MAHBOUBI',
  address: 'شارع الحنصالي قرب قيسارية، السعادة 217 بني ملال',
  phone: '06 67 74 70 91',
  email: 'AMEUBLEMENT_DECO_ELMAHBOUBI@GMAIL.COM',
  tiktok: 'AMEUBLEMENT_ELMAHBOUBI',
  instagram: 'AMEUBLEMENT_DECO_ELMAHBOUBI',
  terms: `Acompte : Un acompte de 30% du montant total est exigible à la commande pour lancer la production.
Délai de réalisation : Le délai maximum de fabrication est de 60 jours (2 mois).
Conditions de paiement : Le solde restant doit être réglé en totalité avant toute remise ou livraison.`,
  accentColor: '#1B5E3B',
};

export function useInvoiceTemplate() {
  const [template, setTemplate] = useState<InvoiceTemplate>(DEFAULT_TEMPLATE);
  const [loading, setLoading] = useState(true);

  const fetchTemplate = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'invoice_template')
        .single();

      const value = (data as unknown as { value: unknown } | null)?.value;

      if (error || value === undefined) {
        console.log('Using default invoice template');
        setTemplate(DEFAULT_TEMPLATE);
      } else {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        setTemplate({ ...DEFAULT_TEMPLATE, ...parsed });
      }
    } catch (err) {
      console.error('Error fetching invoice template:', err);
      setTemplate(DEFAULT_TEMPLATE);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveTemplate = useCallback(async (updates: Partial<InvoiceTemplate>) => {
    const newTemplate = { ...template, ...updates };
    const { error } = await supabase
      .from('settings')
      .upsert({
        key: 'invoice_template',
        value: JSON.stringify(newTemplate),
        description: 'Invoice template configuration',
      } as never, { onConflict: 'key' });

    if (error) throw error;
    setTemplate(newTemplate);
    return newTemplate;
  }, [template]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  return { template, loading, saveTemplate, refresh: fetchTemplate };
}