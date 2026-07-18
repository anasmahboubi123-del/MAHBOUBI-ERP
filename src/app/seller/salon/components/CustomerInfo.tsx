'use client';
import { CustomerInfoData } from '@/lib/types';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';

/** المرحلة 7: معلومات الزبون */
export default function CustomerInfo({
  customer,
  onChange
}: {
  customer: CustomerInfoData;
  onChange: (c: CustomerInfoData) => void;
}) {
  return (
    <Card className="mx-auto max-w-xl space-y-4">
      <Input label="الاسم الكامل *" value={customer.name} onChange={(e) => onChange({ ...customer, name: e.target.value })} />
      <Input label="رقم الهاتف *" type="tel" dir="ltr" value={customer.phone} onChange={(e) => onChange({ ...customer, phone: e.target.value })} />
      <Input label="تاريخ التسليم المتفق عليه *" type="date" dir="ltr" value={customer.deliveryDate} onChange={(e) => onChange({ ...customer, deliveryDate: e.target.value })} />
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-gray-600">ملاحظات إضافية</span>
        <textarea
          value={customer.notes}
          onChange={(e) => onChange({ ...customer, notes: e.target.value })}
          rows={3}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg focus:border-brand-600 focus:outline-none"
        />
      </label>
    </Card>
  );
}
