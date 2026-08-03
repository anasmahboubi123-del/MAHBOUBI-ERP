'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, Users, Package, DollarSign, Printer, 
  Bell, Zap, Globe, Shield, MessageCircle,
  Plus, Trash2, AlertTriangle, RefreshCw,
  Eye, EyeOff, LucideIcon,Waves
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SettingsProvider, useSettings, useSetting } from '@/hooks/useSettings';

// ============================================
// Types & Interfaces
// ============================================
type TabKey = 'general' | 'users' | 'products' | 'finance' | 'printing' | 'notifications' | 'rules' | 'messages';
type PinKey = 'admin' | 'seller' | 'tailor' | 'sadari';

interface MessageTemplate {
  id: string;
  name: string;
  trigger_event: string;
  channel: string;
  recipient_type: string;
  template_body: string;
  is_active: boolean;
  variables: string[];
}

interface Addon {
  id?: string;
  name: string;
  price: number;
}

interface GeneralSettings {
  shop_name: string;
  shop_address: string;
  shop_phone: string;
  currency: string;
  timezone: string;
  language: string;
  maintenance_mode: boolean;
  logo_url: string;
}

interface PinSettings {
  admin: string;
  seller: string;
  tailor: string;
  sadari: string;
  dynamic_pin_enabled: boolean;
}

interface ProductSettings {
  foumage_default_cm: number;
  format_default_width: number;
  min_delivery_days: number;
  default_addons: Addon[];
  shapes: string[];
}

interface FinanceSettings {
  tailor_wage_pct: number;
  seller_commission_pct: number;
  vat_pct: number;
  currency_symbol: string;
}

interface PrintingSettings {
  invoice_header: string;
  invoice_footer: string;
  paper_size: string;
  show_logo: boolean;
  show_vat: boolean;
}

interface NotificationSettings {
  new_order_sound: boolean;
  new_order_popup: boolean;
  tailor_message_sound: boolean;
  wage_reminder_days: number;
  browser_notifications: boolean;
}

interface BusinessRuleSettings {
  discount_threshold: number;
  discount_pct: number;
  vip_orders_threshold: number;
  rush_mode: boolean;
}

interface MakeSettings {
  enabled: boolean;
  webhook_url: string;
  whatsapp_api_key: string;
  default_country_code: string;
}

interface InputProps {
  label: string;
  value: string | number;
  onChange: (value: any) => void;
  type?: 'text' | 'number' | 'password';
  placeholder?: string;
  suffix?: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}

// ============================================
// Tabs Configuration
// ============================================
const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'general', label: 'عام', icon: Settings },
  { key: 'users', label: 'المستخدمون', icon: Users },
  { key: 'products', label: 'المنتجات', icon: Package },
  { key: 'finance', label: 'مالية', icon: DollarSign },
  { key: 'printing', label: 'الطباعة', icon: Printer },
  { key: 'notifications', label: 'الإشعارات', icon: Bell },
  { key: 'rules', label: 'قواعد العمل', icon: Zap },
  { key: 'messages', label: 'رسائل Make', icon: MessageCircle },
];

// ============================================
// Helper Components
// ============================================
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder = '', suffix = '' }: InputProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all"
        />
        {suffix && <span className="absolute left-3 top-2.5 text-gray-400 text-sm">{suffix}</span>}
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-rose-500' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'right-1' : 'left-1'}`} />
      </button>
    </div>
  );
}

function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ============================================
// Tab: General
// ============================================
function GeneralTab() {
  const [general, setGeneral] = useSetting<GeneralSettings>('general', {
    shop_name: 'صالون المحبوبي',
    shop_address: '',
    shop_phone: '',
    currency: 'MAD',
    timezone: 'Africa/Casablanca',
    language: 'ar',
    maintenance_mode: false,
    logo_url: ''
  });

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-rose-500" />
          معلومات الصالون
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="اسم الصالون" value={general.shop_name} onChange={(v: string) => setGeneral({ ...general, shop_name: v })} />
          <Input label="رقم الهاتف" value={general.shop_phone} onChange={(v: string) => setGeneral({ ...general, shop_phone: v })} />
          <div className="md:col-span-2">
            <Input label="العنوان" value={general.shop_address} onChange={(v: string) => setGeneral({ ...general, shop_address: v })} />
          </div>
          <Select
            label="العملة"
            value={general.currency}
            onChange={(v: string) => setGeneral({ ...general, currency: v })}
            options={[
              { value: 'MAD', label: 'درهم مغربي (MAD)' },
              { value: 'EUR', label: 'يورو (EUR)' },
              { value: 'USD', label: 'دولار (USD)' },
            ]}
          />
          <Select
            label="اللغة الافتراضية"
            value={general.language}
            onChange={(v: string) => setGeneral({ ...general, language: v })}
            options={[
              { value: 'ar', label: 'العربية' },
              { value: 'fr', label: 'Français' },
            ]}
          />
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-500" />
          وضع الصيانة
        </h3>
        <Toggle
          label="تفعيل وضع الصيانة (إيقاف النظام مؤقتاً)"
          checked={general.maintenance_mode}
          onChange={(v: boolean) => setGeneral({ ...general, maintenance_mode: v })}
        />
        {general.maintenance_mode && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-sm text-orange-700">سيتم إيقاف الوصول للبائعين والخياطين. المدير فقط يمكنه الدخول.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================
// Tab: Users
// ============================================
function UsersTab() {
  const [pins, setPins] = useSetting<PinSettings>('pins', {
    admin: '1111',
    seller: '9999',
    tailor: '5678',
    sadari: '2222',
    dynamic_pin_enabled: false
  });

  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

  const PinField = ({ label, keyName, color }: { label: string; keyName: PinKey; color: string }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={showPins[keyName] ? 'text' : 'password'}
          value={pins[keyName] || ''}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
            setPins({ ...pins, [keyName]: val });
          }}
          maxLength={4}
          className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-center tracking-[0.5em] font-mono font-bold focus:outline-none focus:ring-2 ${color}`}
        />
        <button
          type="button"
          onClick={() => setShowPins((prev) => ({ ...prev, [keyName]: !prev[keyName] }))}
          className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
        >
          {showPins[keyName] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          أكواد الدخول (PIN)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PinField label="كود المدير" keyName="admin" color="focus:ring-blue-200" />
          <PinField label="كود البائع" keyName="seller" color="focus:ring-green-200" />
          <PinField label="كود الخياط" keyName="tailor" color="focus:ring-purple-200" />
          <PinField label="كود السداري" keyName="sadari" color="focus:ring-orange-200" />
        </div>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <Toggle
            label="تفعيل PIN ديناميكي (يتغير يومياً)"
            checked={pins.dynamic_pin_enabled}
            onChange={(v: boolean) => setPins({ ...pins, dynamic_pin_enabled: v })}
          />
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-green-500" />
          إدارة الحسابات
        </h3>
        <div className="space-y-3">
          {[
            { role: 'البائعون', desc: 'إنشاء الطلبيات وإدارة الزبائن', count: 2 },
            { role: 'الخياطون', desc: 'تنفيذ الطلبيات والمحادثة', count: 2 },
            { role: 'السداريون', desc: 'تفصيل السدادر والمخاد', count: 1 },
          ].map((item) => (
            <div key={item.role} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">{item.role}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <span className="px-3 py-1 bg-white rounded-lg text-sm font-medium text-gray-600 border border-gray-200">
                {item.count} مستخدم
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================
// Tab: Products
// ============================================
function ProductsTab() {
  const [products, setProducts] = useSetting<ProductSettings>('products', {
    foumage_default_cm: 70,
    format_default_width: 250,
    min_delivery_days: 3,
    default_addons: [],
    shapes: ['مستطيل', 'دائري', 'مربع', 'بيضاوي']
  });

  const [newAddon, setNewAddon] = useState('');
  const [newShape, setNewShape] = useState('');

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-500" />
          الإعدادات الافتراضية
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="كمية ثوب الفوماج (سم)"
            value={products.foumage_default_cm}
            onChange={(v: number) => setProducts({ ...products, foumage_default_cm: v })}
            type="number"
            suffix="سم"
          />
          <Input
            label="عرض الفورمات للسداري (سم)"
            value={products.format_default_width}
            onChange={(v: number) => setProducts({ ...products, format_default_width: v })}
            type="number"
            suffix="سم"
          />
          <Input
            label="الحد الأدنى للتسليم (أيام)"
            value={products.min_delivery_days}
            onChange={(v: number) => setProducts({ ...products, min_delivery_days: v })}
            type="number"
            suffix="يوم"
          />
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-500" />
          الأشكال المتاحة
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {products.shapes?.map((shape: string, i: number) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm">
              {shape}
              <button
                type="button"
                onClick={() => {
                  const newShapes = products.shapes.filter((_: string, idx: number) => idx !== i);
                  setProducts({ ...products, shapes: newShapes });
                }}
                className="hover:text-red-500"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newShape}
            onChange={(e) => setNewShape(e.target.value)}
            placeholder="شكل جديد..."
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="button"
            onClick={() => {
              if (newShape.trim()) {
                setProducts({ ...products, shapes: [...(products.shapes || []), newShape.trim()] });
                setNewShape('');
              }
            }}
            className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm hover:bg-indigo-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          الإضافات الافتراضية
        </h3>
        <div className="space-y-2 mb-4">
          {products.default_addons?.map((addon: Addon, i: number) => (
            <div key={addon.id || i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm">{addon.name}</span>
              <button
                type="button"
                onClick={() => {
                  const newAddons = products.default_addons.filter((_: Addon, idx: number) => idx !== i);
                  setProducts({ ...products, default_addons: newAddons });
                }}
                className="text-red-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newAddon}
            onChange={(e) => setNewAddon(e.target.value)}
            placeholder="إضافة جديدة (فرشة، تلبيسة...)"
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-200"
          />
          <button
            type="button"
            onClick={() => {
              if (newAddon.trim()) {
                setProducts({
                  ...products,
                  default_addons: [
                    ...(products.default_addons || []), 
                    { id: Date.now().toString(), name: newAddon.trim(), price: 0 }
                  ]
                });
                setNewAddon('');
              }
            }}
            className="px-4 py-2 bg-yellow-500 text-white rounded-xl text-sm hover:bg-yellow-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// Tab: Finance
// ============================================
function FinanceTab() {
  const [finance, setFinance] = useSetting<FinanceSettings>('finance', {
    tailor_wage_pct: 40,
    seller_commission_pct: 0,
    vat_pct: 20,
    currency_symbol: 'درهم'
  });

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-500" />
          إعدادات الأجور والضرائب
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="نسبة أجر الخياط الافتراضية"
            value={finance.tailor_wage_pct}
            onChange={(v: number) => setFinance({ ...finance, tailor_wage_pct: v })}
            type="number"
            suffix="%"
          />
          <Input
            label="نسبة عمولة البائع"
            value={finance.seller_commission_pct}
            onChange={(v: number) => setFinance({ ...finance, seller_commission_pct: v })}
            type="number"
            suffix="%"
          />
          <Input
            label="نسبة الضريبة (VAT)"
            value={finance.vat_pct}
            onChange={(v: number) => setFinance({ ...finance, vat_pct: v })}
            type="number"
            suffix="%"
          />
          <Input
            label="رمز العملة"
            value={finance.currency_symbol}
            onChange={(v: string) => setFinance({ ...finance, currency_symbol: v })}
          />
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-500" />
          معاينة الحساب
        </h3>
        <div className="p-4 bg-blue-50 rounded-xl space-y-2">
          <p className="text-sm text-blue-800">
            إذا كانت تكلفة خياطة طلبية = <strong>1000 درهم</strong>
          </p>
          <p className="text-sm text-blue-800">
            أجر الخياط = <strong>{(1000 * (finance.tailor_wage_pct / 100)).toFixed(0)} درهم</strong> ({finance.tailor_wage_pct}%)
          </p>
          <p className="text-sm text-blue-800">
            الضريبة = <strong>{(1000 * (finance.vat_pct / 100)).toFixed(0)} درهم</strong> ({finance.vat_pct}%)
          </p>
          <p className="text-sm text-blue-800 font-bold">
            الإجمالي مع الضريبة = <strong>{(1000 * (1 + finance.vat_pct / 100)).toFixed(0)} درهم</strong>
          </p>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// Tab: Printing
// ============================================
function PrintingTab() {
  const [printing, setPrinting] = useSetting<PrintingSettings>('printing', {
    invoice_header: 'صالون المحبوبي - للمفروشات الراقية',
    invoice_footer: 'شكراً لتعاملكم معنا',
    paper_size: 'A4',
    show_logo: true,
    show_vat: true
  });

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Printer className="w-5 h-5 text-gray-600" />
          إعدادات الفاتورة
        </h3>
        <Input
          label="عنوان الفاتورة"
          value={printing.invoice_header}
          onChange={(v: string) => setPrinting({ ...printing, invoice_header: v })}
        />
        <Input
          label="رسالة الذيل"
          value={printing.invoice_footer}
          onChange={(v: string) => setPrinting({ ...printing, invoice_footer: v })}
        />
        <Select
          label="حجم الورق"
          value={printing.paper_size}
          onChange={(v: string) => setPrinting({ ...printing, paper_size: v })}
          options={[
            { value: 'A4', label: 'A4' },
            { value: 'A5', label: 'A5' },
            { value: 'thermal-80', label: 'حراري 80mm' },
          ]}
        />
        <Toggle
          label="عرض الشعار في الفاتورة"
          checked={printing.show_logo}
          onChange={(v: boolean) => setPrinting({ ...printing, show_logo: v })}
        />
        <Toggle
          label="عرض الضريبة في الفاتورة"
          checked={printing.show_vat}
          onChange={(v: boolean) => setPrinting({ ...printing, show_vat: v })}
        />
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4">معاينة الفاتورة</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50 text-center">
          <p className="font-bold text-lg mb-2">{printing.invoice_header}</p>
          <div className="h-20 bg-white rounded-lg my-4 flex items-center justify-center text-gray-400 text-sm">
            محتوى الفاتورة...
          </div>
          <p className="text-sm text-gray-500">{printing.invoice_footer}</p>
          <p className="text-xs text-gray-400 mt-2">{printing.paper_size}</p>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// Tab: Notifications
// ============================================
function NotificationsTab() {
  const [notifications, setNotifications] = useSetting<NotificationSettings>('notifications', {
    new_order_sound: true,
    new_order_popup: true,
    tailor_message_sound: true,
    wage_reminder_days: 1,
    browser_notifications: false
  });

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-rose-500" />
          إعدادات الإشعارات
        </h3>
        <Toggle
          label="صوت عند طلبية جديدة"
          checked={notifications.new_order_sound}
          onChange={(v: boolean) => setNotifications({ ...notifications, new_order_sound: v })}
        />
        <div className="border-t border-gray-100" />
        <Toggle
          label="نافذة منبثقة عند طلبية جديدة"
          checked={notifications.new_order_popup}
          onChange={(v: boolean) => setNotifications({ ...notifications, new_order_popup: v })}
        />
        <div className="border-t border-gray-100" />
        <Toggle
          label="صوت عند رسالة خياط"
          checked={notifications.tailor_message_sound}
          onChange={(v: boolean) => setNotifications({ ...notifications, tailor_message_sound: v })}
        />
        <div className="border-t border-gray-100" />
        <Toggle
          label="إشعارات المتصفح (Browser)"
          checked={notifications.browser_notifications}
          onChange={(v: boolean) => setNotifications({ ...notifications, browser_notifications: v })}
        />
        <div className="mt-4">
          <Input
            label="تذكير بالأجر قبل (أيام)"
            value={notifications.wage_reminder_days}
            onChange={(v: number) => setNotifications({ ...notifications, wage_reminder_days: v })}
            type="number"
            suffix="يوم"
          />
        </div>
      </Card>
    </div>
  );
}

// ============================================
// Tab: Business Rules
// ============================================
function RulesTab() {
  const [rules, setRules] = useSetting<BusinessRuleSettings>('business_rules', {
    discount_threshold: 5000,
    discount_pct: 5,
    vip_orders_threshold: 5,
    rush_mode: false
  });

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          قواعد العمل الذكية
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="حد الخصم التلقائي (درهم)"
            value={rules.discount_threshold}
            onChange={(v: number) => setRules({ ...rules, discount_threshold: v })}
            type="number"
            suffix="درهم"
          />
          <Input
            label="نسبة الخصم التلقائي"
            value={rules.discount_pct}
            onChange={(v: number) => setRules({ ...rules, discount_pct: v })}
            type="number"
            suffix="%"
          />
          <Input
            label="عدد الطلبيات لتصبح VIP"
            value={rules.vip_orders_threshold}
            onChange={(v: number) => setRules({ ...rules, vip_orders_threshold: v })}
            type="number"
            suffix="طلبية"
          />
        </div>
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-800">
            إذا تجاوزت الطلبية {rules.discount_threshold} درهم ← خصم تلقائي {rules.discount_pct}%
          </p>
          <p className="text-sm text-yellow-800 mt-1">
            الزبون الذي لديه أكثر من {rules.vip_orders_threshold} طلبيات يحصل على أولوية في التسليم
          </p>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          وضع الضغط (Rush Mode)
        </h3>
        <Toggle
          label="تفعيل وضع الضغط"
          checked={rules.rush_mode}
          onChange={(v: boolean) => setRules({ ...rules, rush_mode: v })}
        />
        {rules.rush_mode && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700">وضع الضغط مفعل: سيتم تقليل الحد الأدنى للتسليم، وإشعارات أقوى، ولون أحمر في الواجهة.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================
// Tab: Messages (Make)
// ============================================
function MessagesTab() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [makeSettings, setMakeSettings] = useSetting<MakeSettings>('make_webhooks', {
    enabled: false,
    webhook_url: '',
    whatsapp_api_key: '',
    default_country_code: '+212'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data } = await supabase.from('message_templates').select('*').order('created_at');
    setTemplates(data || []);
    setLoading(false);
  };

  const toggleTemplate = async (id: string, isActive: boolean) => {
    await supabase.from('message_templates').update({ is_active: !isActive }).eq('id', id);
    fetchTemplates();
  };

  const testWebhook = async () => {
    if (!makeSettings.webhook_url) return;
    try {
      const res = await fetch(makeSettings.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test: true,
          message: 'اختبار من صالون المحبوبي',
          timestamp: new Date().toISOString()
        })
      });
      alert(res.ok ? 'Webhook يعمل!' : 'فشل الاتصال');
    } catch (e) {
      alert('خطأ في الاتصال: ' + (e as Error).message);
    }
  };

  const triggerEvents = [
    { value: 'new_order', label: 'طلبية جديدة' },
    { value: 'order_ready', label: 'الطلبية جاهزة' },
    { value: 'wage_due', label: 'أجر مستحق' },
    { value: 'late_delivery', label: 'تأخير في التسليم' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-green-500" />
          إعدادات Make (Webhooks)
        </h3>
        <Toggle
          label="تفعيل الربط مع Make"
          checked={makeSettings.enabled}
          onChange={(v: boolean) => setMakeSettings({ ...makeSettings, enabled: v })}
        />
        <div className="mt-4 space-y-4">
          <Input
            label="رابط Webhook (من Make)"
            value={makeSettings.webhook_url}
            onChange={(v: string) => setMakeSettings({ ...makeSettings, webhook_url: v })}
            placeholder="https://hook.make.com/..."
          />
          <Input
            label="مفتاح WhatsApp API (إن وجد)"
            value={makeSettings.whatsapp_api_key}
            onChange={(v: string) => setMakeSettings({ ...makeSettings, whatsapp_api_key: v })}
            type="password"
          />
          <Input
            label="كود الدولة الافتراضي"
            value={makeSettings.default_country_code}
            onChange={(v: string) => setMakeSettings({ ...makeSettings, default_country_code: v })}
          />
          <button
            type="button"
            onClick={testWebhook}
            disabled={!makeSettings.webhook_url}
            className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            اختبار الاتصال
          </button>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          قوالب الرسائل التلقائية
        </h3>
        {loading ? (
          <p className="text-center text-gray-400 py-8">جاري التحميل...</p>
        ) : (
          <div className="space-y-3">
            {templates.map((tmpl) => (
              <div key={tmpl.id} className={`p-4 rounded-xl border ${tmpl.is_active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-gray-800">{tmpl.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {triggerEvents.find(e => e.value === tmpl.trigger_event)?.label} ← {tmpl.recipient_type}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleTemplate(tmpl.id, tmpl.is_active)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${tmpl.is_active ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}
                  >
                    {tmpl.is_active ? 'مفعل' : 'معطل'}
                  </button>
                </div>
                <div className="p-3 bg-white rounded-lg text-sm text-gray-600 border border-gray-100 font-mono leading-relaxed">
                  {tmpl.template_body}
                </div>
                <div className="flex gap-1 mt-2">
                  {tmpl.variables?.map((v: string) => (
                    <span key={v} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{v}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4">كيفية الربط مع Make</h3>
        <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
          <li>افتح <strong>make.com</strong> وأنشئ سيناريو جديد</li>
          <li>أضف <strong>Webhook</strong> كـ Trigger وانسخ الرابط</li>
          <li>ألصق الرابط في الحقل أعلاه</li>
          <li>أضف <strong>WhatsApp Business API</strong> كـ Action</li>
          <li>اربط المتغيرات: phone, message</li>
          <li>فعّل السيناريو</li>
        </ol>
      </Card>
    </div>
  );
}

// ============================================
// Main Page Component — WITH SettingsProvider
// ============================================
/* ─── Foam Tab ─── */
function FoamTab() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', is_default: false, is_active: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [foamSettings, setFoamSettings] = useState({ foam_reminder_days: 3, foam_order_prefix: 'MHB-FOAM', admin_pin: '9999' });

  const load = async () => {
    setLoading(true);
    const [{ data: sData }, { data: setData }] = await Promise.all([
      supabase.from('suppliers').select('*').order('name'),
      supabase.from('settings').select('key, value').in('key', ['foam_reminder_days', 'foam_order_prefix', 'admin_pin']),
    ]);
    setSuppliers(sData || []);
    const map: Record<string, any> = {};
    (setData || []).forEach((row) => { try { map[row.key] = JSON.parse(row.value); } catch { map[row.key] = row.value; } });
    setFoamSettings(prev => ({ ...prev, ...map }));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveSupplier = async () => {
    if (!form.name.trim()) return;
    if (editingId) {
      await supabase.from('suppliers').update(form).eq('id', editingId);
    } else {
      await supabase.from('suppliers').insert(form);
    }
    if (form.is_default && editingId) {
      await supabase.from('suppliers').update({ is_default: false }).neq('id', editingId);
    } else if (form.is_default && !editingId) {
      const { data } = await supabase.from('suppliers').select('id').eq('is_default', true).single();
      if (data) await supabase.from('suppliers').update({ is_default: false }).eq('id', data.id);
    }
    setShowForm(false); setForm({ name: '', phone: '', email: '', address: '', is_default: false, is_active: true }); setEditingId(null); load();
  };

  const deleteSupplier = async (id: string) => { if (!confirm('حذف المورد؟')) return; await supabase.from('suppliers').delete().eq('id', id); load(); };

  const saveSetting = async (key: string, value: any) => {
    const jsonValue = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
    await supabase.from('settings').upsert({ key, value: jsonValue }, { onConflict: 'key' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Users className="w-5 h-5 text-[#1B5E3B]" />موردين البونج</h3>
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', phone: '', email: '', address: '', is_default: false, is_active: true }); }}
            className="px-4 py-2 bg-[#1B5E3B] text-white rounded-xl text-sm font-bold hover:bg-[#14502d] transition flex items-center gap-1"><Plus className="w-4 h-4" /> إضافة مورد</button>
        </div>
        {loading ? <p className="text-center text-gray-400 py-8">جاري التحميل...</p> : suppliers.length === 0 ? <p className="text-center text-gray-400 py-8">لا يوجد موردين</p> : (
          <div className="space-y-3">
            {suppliers.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-800">{s.name}</p>
                    {s.is_default && <span className="px-2 py-0.5 bg-[#1B5E3B] text-white text-[10px] font-bold rounded-full">افتراضي</span>}
                    {!s.is_active && <span className="px-2 py-0.5 bg-gray-300 text-gray-600 text-[10px] font-bold rounded-full">معطل</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{s.phone || '—'} {s.email ? `| ${s.email}` : ''}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(s.id); setForm(s); setShowForm(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"><Settings className="w-4 h-4" /></button>
                  <button onClick={() => deleteSupplier(s.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Waves className="w-5 h-5 text-[#C9A84C]" />إعدادات البونج</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">أيام التذكير قبل التسليم</label>
            <input type="number" value={foamSettings.foam_reminder_days} onChange={(e) => { const v = Number(e.target.value); setFoamSettings(p => ({ ...p, foam_reminder_days: v })); saveSetting('foam_reminder_days', v); }}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C9A84C]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">بادئة رقم الطلب</label>
            <input type="text" value={foamSettings.foam_order_prefix} onChange={(e) => { const v = e.target.value; setFoamSettings(p => ({ ...p, foam_order_prefix: v })); saveSetting('foam_order_prefix', v); }}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C9A84C]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">كود المدير</label>
            <input type="password" value={foamSettings.admin_pin} onChange={(e) => { const v = e.target.value; setFoamSettings(p => ({ ...p, admin_pin: v })); saveSetting('admin_pin', v); }}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C9A84C]" />
          </div>
        </div>
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editingId ? 'تعديل مورد' : 'مورد جديد'}</h3>
            <div className="space-y-3">
              <input placeholder="الاسم" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
              <input placeholder="الهاتف" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
              <input placeholder="البريد" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
              <input placeholder="العنوان" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E3B]" />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.is_default} onChange={e => setForm(p => ({ ...p, is_default: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-[#1B5E3B] focus:ring-[#1B5E3B]" /> مورد افتراضي
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-[#1B5E3B] focus:ring-[#1B5E3B]" /> نشط
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition">إلغاء</button>
              <button onClick={saveSupplier} className="flex-1 px-4 py-2.5 bg-[#1B5E3B] text-white rounded-xl font-bold text-sm hover:bg-[#14502d] transition">حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <SettingsProvider>
      <SettingsPageInner />
    </SettingsProvider>
  );
}

function SettingsPageInner() {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const { loading, error } = useSettings();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-md p-6 bg-white rounded-2xl shadow-sm border border-red-200">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-700 mb-2">فشل الاتصال بـ Supabase</h3>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'general': return <GeneralTab />;
      case 'users': return <UsersTab />;
      case 'products': return <ProductsTab />;
      case 'finance': return <FinanceTab />;
      case 'printing': return <PrintingTab />;
      case 'notifications': return <NotificationsTab />;
      case 'rules': return <RulesTab />;
      case 'messages': return <MessagesTab />;
      default: return <GeneralTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Top Header & Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">إعدادات النظام</h1>
                <p className="text-sm text-gray-500">إدارة جميع إعدادات صالون المحبوبي</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>النظام متصل</span>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-none">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {renderTab()}
      </main>
    </div>
  );
}