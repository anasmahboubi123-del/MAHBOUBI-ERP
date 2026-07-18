'use client';
import { useState } from 'react';
import CatalogueManager, { Field } from '../components/CatalogueManager';

const nameField: Field = { key: 'name', label: 'الاسم' };

const tabs: { key: string; label: string; table: string; bucket: string; fields: Field[] }[] = [
  {
    key: 'fabrics',
    label: '🧶 الأثواب',
    table: 'fabrics',
    bucket: 'fabrics',
    fields: [nameField, { key: 'color', label: 'اللون' }, { key: 'price_per_meter', label: 'الثمن للمتر (DH)', type: 'number' }]
  },
  {
    key: 'stitch',
    label: '🪡 أنماط الخياطة',
    table: 'stitch_styles',
    bucket: 'stitch-styles',
    fields: [nameField, { key: 'target', label: 'النوع (cushion/decor/seddari)' }, { key: 'price', label: 'الثمن (DH)', type: 'number' }]
  },
  {
    key: 'cushions',
    label: '🛏️ أشكال المخاد',
    table: 'cushion_styles',
    bucket: 'catalogue',
    fields: [nameField]
  },
  {
    key: 'extras',
    label: '➕ الإضافات',
    table: 'extras',
    bucket: 'catalogue',
    fields: [nameField, { key: 'price', label: 'الثمن (DH)', type: 'number' }]
  },
  {
    key: 'formas',
    label: '🔺 الفورماجات',
    table: 'formas',
    bucket: 'catalogue',
    fields: [nameField, { key: 'fabric_cm', label: 'كمية الثوب (cm)', type: 'number' }, { key: 'sewing_price', label: 'ثمن الخياطة (DH)', type: 'number' }]
  }
];

export default function CataloguePage() {
  const [active, setActive] = useState(tabs[0]);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-brand-700">إدارة الكتالوج</h1>
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 font-semibold ${active.key === t.key ? 'bg-brand-600 text-white' : 'bg-white text-gray-600'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <CatalogueManager key={active.key} table={active.table} title={active.label} fields={active.fields} bucket={active.bucket} />
    </div>
  );
}
