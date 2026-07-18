-- Salon Marocain ERP - Supabase Schema
-- نفّذ هذا الملف في SQL Editor داخل Supabase

create extension if not exists "uuid-ossp";

-- المنتجات العامة (صالون، زربية، خامية...)
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  image_url text,
  active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- كتالوج الأثواب
create table if not exists fabrics (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  color text,
  price_per_meter numeric not null default 0,
  image_url text,
  gallery jsonb default '[]', -- صور الثوب في صالون حقيقي
  active boolean default true,
  created_at timestamptz default now()
);

-- أنماط الخياطة
create table if not exists stitch_styles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  target text not null default 'cushion', -- cushion | decor | seddari
  price numeric not null default 0,
  image_url text,
  active boolean default true
);

-- أشكال المخاد
create table if not exists cushion_styles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  image_url text,
  active boolean default true
);

-- الإضافات (لحايف، طابورية، بونج...)
create table if not exists extras (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price numeric not null default 0,
  image_url text,
  active boolean default true
);

-- أشكال الفورماجة
create table if not exists formas (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  image_url text,
  fabric_cm numeric default 250,
  sewing_price numeric default 50,
  active boolean default true
);

-- الزبائن
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text,
  created_at timestamptz default now()
);

-- الخياطين
create table if not exists tailors (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text,
  pin_code text,
  active boolean default true,
  created_at timestamptz default now()
);

-- المستخدمين وأكواد الدخول
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  role text not null check (role in ('seller','tailor','admin')),
  pin_code text not null,
  active boolean default true
);

-- الطلبيات
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_number serial,
  customer_id uuid references customers(id),
  customer_name text,
  customer_phone text,
  fabric_id uuid references fabrics(id),
  status text not null default 'pending', -- pending | reviewed | in_progress | completed | delivered
  tailor_id uuid references tailors(id),
  drawing_url text,
  total numeric not null default 0,
  deposit numeric not null default 0,
  delivery_date date,
  notes text,
  payload jsonb, -- التفاصيل الكاملة للطلبية
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  kind text not null, -- fabric | sewing | cushion | decor | extra | formaja
  label text not null,
  qty numeric default 1,
  unit_price numeric default 0,
  total numeric default 0
);

create table if not exists order_seddars (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  length_cm numeric not null,
  width_cm numeric not null default 70,
  height_cm numeric not null default 50,
  junction text default 'none', -- formaja | insert | wooden_box | none
  insert_direction text,
  fabric_cm numeric,
  sort_order int default 0
);

create table if not exists order_cushions (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  seddari_index int,
  size_cm int not null,
  count int not null default 1,
  stitch_price numeric default 0,
  stuffing boolean default false,
  is_decor boolean default false,
  shape text
);

-- الإعدادات العامة
create table if not exists settings (
  key text primary key,
  value text not null,
  description text
);

-- نظام المراسلة الداخلي
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  sender_role text not null, -- admin | tailor
  body text,
  attachment_url text,
  audio_url text,
  created_at timestamptz default now()
);

-- القيم الافتراضية
insert into settings (key, value, description) values
  ('pin_seller', '1111', 'كود دخول البائع'),
  ('pin_tailor', '2222', 'كود دخول الخياط'),
  ('pin_admin', '9999', 'كود دخول المدير'),
  ('seddari_sewing_price', '10', 'ثمن خياطة السداري'),
  ('formaja_sewing_price', '50', 'ثمن خياطة الفورماجة'),
  ('formaja_fabric_cm', '250', 'كمية ثوب الفورماجة بالسنتيمتر'),
  ('stuffing_price', '100', 'ثمن الحشو (لواط) للوسادة'),
  ('min_deposit_ratio', '0.3', 'الحد الأدنى للتسبيق'),
  ('default_seddari_width', '70', 'العرض الافتراضي للسداري'),
  ('whatsapp_webhook', '', 'Make.com Webhook - رسائل WhatsApp'),
  ('calendar_webhook', '', 'Make.com Webhook - Google Calendar')
on conflict (key) do nothing;

-- Storage Buckets المطلوبة (أنشئها من واجهة Supabase - Public):
-- fabrics / stitch-styles / orders / catalogue / invoices
