-- Glimmora — core schema
-- Run this once in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

-- ============ CATALOG ============

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  discount_percent numeric(5,2) not null default 0 check (discount_percent between 0 and 100),
  category_id uuid not null references categories(id),
  section text not null default 'casual' check (section in ('casual', 'ethnic')),
  product_code text unique,
  stock_count int not null default 0 check (stock_count >= 0),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on products(category_id);
create index products_featured_idx on products(is_featured) where is_featured = true;

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_idx on product_images(product_id);

-- ============ CUSTOMERS ============
-- customers.id == auth.users.id (created via Supabase phone auth, WhatsApp OTP channel)

create table customers (
  id uuid primary key references auth.users(id) on delete cascade,
  whatsapp_number text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index reviews_product_idx on reviews(product_id);

create table wishlists (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

-- ============ COUPONS ============

create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percent', 'amount')),
  discount_value numeric(10,2) not null check (discount_value >= 0),
  expires_at timestamptz,
  usage_limit_per_user int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  order_id uuid,
  redeemed_at timestamptz not null default now(),
  unique (coupon_id, customer_id)
);

-- ============ ORDERS ============

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique,
  customer_id uuid not null references customers(id),
  status text not null default 'Pending'
    check (status in ('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled')),
  subtotal numeric(10,2) not null,
  discount_amount numeric(10,2) not null default 0,
  gift_wrap boolean not null default false,
  gift_wrap_fee numeric(10,2) not null default 0,
  coupon_id uuid references coupons(id),
  total numeric(10,2) not null,
  shipping_address jsonb not null,
  whatsapp_number text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_customer_idx on orders(customer_id);

alter table coupon_redemptions
  add constraint coupon_redemptions_order_fk
  foreign key (order_id) references orders(id) on delete set null;

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  product_name text not null,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(10,2) not null
);

create index order_items_order_idx on order_items(order_id);

-- ============ HOME PAGE CONTENT (admin-editable) ============

create table home_content (
  id uuid primary key default gen_random_uuid(),
  section text unique not null check (section in ('offer_strip', 'hero_banner', 'follow_the_glow')),
  text_content text,
  media_url text,
  media_type text check (media_type in ('image', 'video')),
  link_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ============ ADMIN ============
-- Plain auth.users (email/password) whose id is listed here are admins.

create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
