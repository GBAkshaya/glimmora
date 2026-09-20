-- ============================================================================
-- Glimmora — COMPLETE BACKEND SETUP (single-file, idempotent)
-- ============================================================================
-- Run this ONCE in a fresh Supabase project: Dashboard > SQL Editor > New query
-- > paste all of this > Run. Safe to re-run.
--
-- This file is the consolidated FINAL state of all 21 incremental migrations in
-- this folder. Replaying those files in filename order FAILS: the create_order
-- function's return type changes from `uuid` to `table(...)` across them, and
-- `create or replace` cannot change a return type. This file resolves every
-- superseded version to its final form, so there is nothing to sequence.
--
-- The individual migration files are kept for history only. For a new project,
-- run THIS file and nothing else.
--
-- Two manual steps remain afterwards — see STEP A and STEP B at the end.
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================ 1. CATALOG ====================================

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- `section` and `product_code` are folded in from add_product_section.sql and
-- product_codes.sql rather than bolted on with ALTER afterwards.
create table if not exists products (
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

create index if not exists products_category_idx on products(category_id);
create index if not exists products_featured_idx on products(is_featured) where is_featured = true;

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_idx on product_images(product_id);

-- ============================ 2. CUSTOMERS ==================================
-- customers.id == auth.users.id (Supabase phone auth, WhatsApp OTP channel)

create table if not exists customers (
  id uuid primary key references auth.users(id) on delete cascade,
  whatsapp_number text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

-- The unique (product_id, customer_id) pair is prevent_duplicate_reviews.sql,
-- inlined: without it one customer could review the same product repeatedly and
-- skew its average rating.
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  constraint reviews_product_customer_unique unique (product_id, customer_id)
);

create index if not exists reviews_product_idx on reviews(product_id);

create table if not exists wishlists (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

-- ============================ 3. COUPONS + ORDERS ===========================
-- Declared coupons -> orders -> coupon_redemptions so every foreign key exists
-- at creation time (the original schema.sql needed a trailing ALTER for this).

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percent', 'amount')),
  discount_value numeric(10,2) not null check (discount_value >= 0),
  expires_at timestamptz,
  usage_limit_per_user int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- `order_number` is folded in from order_numbers.sql. There is no delivery_fee
-- column: remove_delivery_fee.sql dropped it.
create table if not exists orders (
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

create index if not exists orders_customer_idx on orders(customer_id);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  product_name text not null,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(10,2) not null
);

create index if not exists order_items_order_idx on order_items(order_id);

create table if not exists coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  redeemed_at timestamptz not null default now(),
  unique (coupon_id, customer_id)
);

-- ============================ 4. SITE CONTENT ===============================

create table if not exists home_content (
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

create table if not exists follow_glow_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  link_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists follow_glow_images_sort_idx on follow_glow_images(sort_order);

create table if not exists vip_subscribers (
  id uuid primary key default gen_random_uuid(),
  whatsapp_number text unique not null,
  created_at timestamptz not null default now()
);

-- Single-row table (id is always true); holds the payment QR shown to customers.
create table if not exists store_settings (
  id boolean primary key default true check (id),
  payment_qr_url text,
  updated_at timestamptz not null default now()
);

insert into store_settings (id) values (true) on conflict (id) do nothing;

-- ============================ 5. ADMIN ======================================
-- Plain auth.users (email/password) whose id is listed here are admins.

create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- SECURITY DEFINER so it can read `admins` without tripping that table's own RLS.
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- ============================ 6. ROW LEVEL SECURITY =========================

alter table categories         enable row level security;
alter table products           enable row level security;
alter table product_images     enable row level security;
alter table customers          enable row level security;
alter table reviews            enable row level security;
alter table wishlists          enable row level security;
alter table coupons            enable row level security;
alter table coupon_redemptions enable row level security;
alter table orders             enable row level security;
alter table order_items        enable row level security;
alter table home_content       enable row level security;
alter table follow_glow_images enable row level security;
alter table vip_subscribers    enable row level security;
alter table store_settings     enable row level security;
alter table admins             enable row level security;

-- ---- Catalog + content: public read, admin write ----

drop policy if exists categories_public_read on categories;
create policy categories_public_read on categories for select using (true);
drop policy if exists categories_admin_write on categories;
create policy categories_admin_write on categories for all using (is_admin()) with check (is_admin());

drop policy if exists products_public_read on products;
create policy products_public_read on products for select using (is_active = true or is_admin());
drop policy if exists products_admin_write on products;
create policy products_admin_write on products for all using (is_admin()) with check (is_admin());

drop policy if exists product_images_public_read on product_images;
create policy product_images_public_read on product_images for select using (true);
drop policy if exists product_images_admin_write on product_images;
create policy product_images_admin_write on product_images for all using (is_admin()) with check (is_admin());

drop policy if exists home_content_public_read on home_content;
create policy home_content_public_read on home_content for select using (is_active = true or is_admin());
drop policy if exists home_content_admin_write on home_content;
create policy home_content_admin_write on home_content for all using (is_admin()) with check (is_admin());

drop policy if exists follow_glow_images_public_read on follow_glow_images;
create policy follow_glow_images_public_read on follow_glow_images for select using (is_active = true or is_admin());
drop policy if exists follow_glow_images_admin_write on follow_glow_images;
create policy follow_glow_images_admin_write on follow_glow_images for all using (is_admin()) with check (is_admin());

-- ---- Customers: own row only, admin sees all ----

drop policy if exists customers_self_select on customers;
create policy customers_self_select on customers for select using (auth.uid() = id or is_admin());
drop policy if exists customers_self_insert on customers;
create policy customers_self_insert on customers for insert with check (auth.uid() = id);
drop policy if exists customers_self_update on customers;
create policy customers_self_update on customers for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---- Reviews: public read, customers write their own ----

drop policy if exists reviews_public_read on reviews;
create policy reviews_public_read on reviews for select using (true);
drop policy if exists reviews_customer_insert on reviews;
create policy reviews_customer_insert on reviews for insert with check (auth.uid() = customer_id);
drop policy if exists reviews_admin_delete on reviews;
create policy reviews_admin_delete on reviews for delete using (is_admin());

-- ---- Wishlists: fully owned by the customer ----

drop policy if exists wishlists_owner_all on wishlists;
create policy wishlists_owner_all on wishlists for all
  using (auth.uid() = customer_id) with check (auth.uid() = customer_id);

-- ---- Coupons: admin only. Customers never read this table directly; codes are
-- ---- checked through validate_coupon() so they stay server-side. ----

drop policy if exists coupons_admin_all on coupons;
create policy coupons_admin_all on coupons for all using (is_admin()) with check (is_admin());

drop policy if exists coupon_redemptions_owner_select on coupon_redemptions;
create policy coupon_redemptions_owner_select on coupon_redemptions for select
  using (auth.uid() = customer_id or is_admin());
drop policy if exists coupon_redemptions_owner_insert on coupon_redemptions;
create policy coupon_redemptions_owner_insert on coupon_redemptions for insert
  with check (auth.uid() = customer_id);

-- ---- Orders: customer sees/creates own, only admin changes status ----

drop policy if exists orders_owner_select on orders;
create policy orders_owner_select on orders for select using (auth.uid() = customer_id or is_admin());
drop policy if exists orders_owner_insert on orders;
create policy orders_owner_insert on orders for insert with check (auth.uid() = customer_id);
drop policy if exists orders_admin_update on orders;
create policy orders_admin_update on orders for update using (is_admin()) with check (is_admin());

drop policy if exists order_items_owner_select on order_items;
create policy order_items_owner_select on order_items for select using (
  exists (select 1 from orders o where o.id = order_id and (o.customer_id = auth.uid() or is_admin()))
);
drop policy if exists order_items_owner_insert on order_items;
create policy order_items_owner_insert on order_items for insert with check (
  exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
);
-- Admin delete lets a product that only appears in cancelled orders be removed;
-- products in live orders are still protected by the foreign key.
drop policy if exists order_items_admin_delete on order_items;
create policy order_items_admin_delete on order_items for delete using (is_admin());

-- ---- VIP subscribers: anyone may subscribe, only admins may read or delete ----
-- Read and delete MUST stay admin-only: these are customers' WhatsApp numbers,
-- and an open policy would expose every one of them via the public REST API.

drop policy if exists "Anyone can insert VIP subscriber" on vip_subscribers;
create policy "Anyone can insert VIP subscriber" on vip_subscribers for insert with check (true);
drop policy if exists vip_subscribers_admin_select on vip_subscribers;
create policy vip_subscribers_admin_select on vip_subscribers for select using (is_admin());
drop policy if exists vip_subscribers_admin_delete on vip_subscribers;
create policy vip_subscribers_admin_delete on vip_subscribers for delete using (is_admin());

-- ---- Store settings: admin only (the QR reaches customers through the edge
-- ---- function, which uses the service role and bypasses RLS) ----

drop policy if exists store_settings_admin_all on store_settings;
create policy store_settings_admin_all on store_settings for all using (is_admin()) with check (is_admin());

-- ---- Admins table: no client access at all. is_admin() reads it as
-- ---- SECURITY DEFINER, so no policy is needed. ----

-- ============================ 7. TRIGGERS ===================================

-- Human-readable order numbers, e.g. 070826-A1B2 (DDMMYY + 4 random chars).
create or replace function generate_order_number()
returns trigger
language plpgsql
as $$
declare
  v_date_part text;
  v_candidate text;
  v_exists boolean;
begin
  v_date_part := to_char(new.created_at, 'DDMMYY');
  loop
    select v_date_part || '-' || string_agg(
      substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', (floor(random() * 36) + 1)::int, 1), ''
    )
    into v_candidate
    from generate_series(1, 4);

    select exists(select 1 from orders where order_number = v_candidate) into v_exists;
    exit when not v_exists;
  end loop;

  new.order_number := v_candidate;
  return new;
end;
$$;

drop trigger if exists orders_set_number on orders;
create trigger orders_set_number
  before insert on orders
  for each row
  when (new.order_number is null)
  execute function generate_order_number();

-- Human-readable product codes, e.g. GER001. Admin-facing only, but included in
-- the WhatsApp order message sent to the store.
create or replace function generate_product_code()
returns trigger
language plpgsql
as $$
declare
  v_prefix text;
  v_next int;
begin
  select case c.slug
    when 'rings' then 'GRG'
    when 'earrings' then 'GER'
    when 'pendants' then 'GPD'
    when 'necklace' then 'GNK'
    else 'GXX'
  end into v_prefix
  from categories c
  where c.id = new.category_id;

  select coalesce(max(substring(product_code from 4)::int), 0) + 1
    into v_next
    from products
    where product_code like v_prefix || '%';

  new.product_code := v_prefix || lpad(v_next::text, 3, '0');
  return new;
end;
$$;

drop trigger if exists products_set_code on products;
create trigger products_set_code
  before insert on products
  for each row
  when (new.product_code is null)
  execute function generate_product_code();

-- Cancelling an order returns the stock it had reserved. Without this,
-- cancelled orders burn inventory permanently.
create or replace function restore_stock_on_order_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'Cancelled' and old.status is distinct from 'Cancelled' then
    update products p
    set stock_count = p.stock_count + oi.quantity
    from order_items oi
    where oi.order_id = new.id and oi.product_id = p.id;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_restore_stock_on_cancel on orders;
create trigger orders_restore_stock_on_cancel
  after update on orders
  for each row
  execute function restore_stock_on_order_cancel();

-- ============================ 8. RPC FUNCTIONS ==============================

-- Lets the client check a code before checkout without exposing the coupons
-- table to direct reads.
create or replace function validate_coupon(p_code text)
returns table (valid boolean, discount_type text, discount_value numeric, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon coupons%rowtype;
  v_used_count int;
begin
  select * into v_coupon from coupons where code = p_code and is_active = true;

  if v_coupon.id is null then
    return query select false, null::text, null::numeric, 'Invalid coupon code';
    return;
  end if;

  if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
    return query select false, null::text, null::numeric, 'This coupon has expired';
    return;
  end if;

  if auth.uid() is not null then
    select count(*) into v_used_count from coupon_redemptions
      where coupon_id = v_coupon.id and customer_id = auth.uid();
    if v_used_count >= v_coupon.usage_limit_per_user then
      return query select false, null::text, null::numeric, 'You have already used this coupon';
      return;
    end if;
  end if;

  return query select true, v_coupon.discount_type, v_coupon.discount_value, 'Coupon applied';
end;
$$;

revoke execute on function validate_coupon(text) from public;
grant execute on function validate_coupon(text) to authenticated;

-- Atomic order creation: order + line items + stock decrement in one
-- transaction, so a partial failure never leaves a half-created order. The
-- FOR UPDATE row locks stop two simultaneous checkouts overselling the same
-- remaining stock.
--
-- This is the FINAL version, and it returns table (id, order_number) because
-- Checkout.tsx destructures both. Every `where products.id = ...` is
-- table-qualified on purpose: the table return type makes `id` an implicit
-- variable in the body, and an unqualified `where id = ...` fails with
-- "column reference id is ambiguous" on every checkout.
--
-- Dropped first because earlier migrations in this folder defined this function
-- as `returns uuid`; `create or replace` cannot change a return type.
drop function if exists create_order(jsonb, text, boolean, numeric, jsonb);
drop function if exists create_order(jsonb, text, boolean, numeric, jsonb, text);
drop function if exists create_order(jsonb, text, boolean, numeric, jsonb, text, numeric);

create function create_order(
  p_shipping_address jsonb,
  p_whatsapp_number text,
  p_gift_wrap boolean,
  p_gift_wrap_fee numeric,
  p_items jsonb, -- [{ "product_id": "...", "quantity": 2 }, ...]
  p_coupon_code text default null
)
returns table (id uuid, order_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_subtotal numeric := 0;
  v_discount_amount numeric := 0;
  v_coupon coupons%rowtype;
  v_item jsonb;
  v_product products%rowtype;
  v_unit_price numeric;
  v_quantity int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  -- Lock the rows we are about to sell from and validate everything up front.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::int;
    select * into v_product from products where products.id = (v_item->>'product_id')::uuid for update;
    if v_product.id is null then
      raise exception 'Product not found: %', v_item->>'product_id';
    end if;
    -- Without this check a deactivated product with leftover stock could still
    -- be ordered straight through the API, even though the storefront hides it.
    if not v_product.is_active then
      raise exception 'Product is no longer available: %', v_product.name;
    end if;
    if v_product.stock_count < v_quantity then
      raise exception 'Insufficient stock for %', v_product.name;
    end if;
    v_unit_price := v_product.price * (1 - v_product.discount_percent / 100);
    v_subtotal := v_subtotal + v_unit_price * v_quantity;
  end loop;

  -- Re-validate the coupon server-side; the client's discount math is never trusted.
  if p_coupon_code is not null then
    select * into v_coupon from coupons where code = p_coupon_code and is_active = true for update;
    if v_coupon.id is null then
      raise exception 'Invalid coupon code';
    end if;
    if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
      raise exception 'Coupon has expired';
    end if;
    if (select count(*) from coupon_redemptions
          where coupon_id = v_coupon.id and customer_id = auth.uid()) >= v_coupon.usage_limit_per_user then
      raise exception 'Coupon already used';
    end if;

    -- Both branches clamp to subtotal, so a coupon can never exceed order value.
    if v_coupon.discount_type = 'percent' then
      v_discount_amount := least(v_subtotal * (v_coupon.discount_value / 100), v_subtotal);
    else
      v_discount_amount := least(v_coupon.discount_value, v_subtotal);
    end if;
  end if;

  insert into orders (
    customer_id, status, subtotal, discount_amount, gift_wrap, gift_wrap_fee,
    coupon_id, total, shipping_address, whatsapp_number
  ) values (
    auth.uid(), 'Pending', v_subtotal, v_discount_amount, p_gift_wrap, p_gift_wrap_fee,
    v_coupon.id, v_subtotal - v_discount_amount + p_gift_wrap_fee, p_shipping_address, p_whatsapp_number
  )
  returning orders.id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::int;
    select * into v_product from products where products.id = (v_item->>'product_id')::uuid;
    v_unit_price := v_product.price * (1 - v_product.discount_percent / 100);

    insert into order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
    values (v_order_id, v_product.id, v_product.name, v_unit_price, v_quantity, v_unit_price * v_quantity);

    update products set stock_count = stock_count - v_quantity where products.id = v_product.id;
  end loop;

  if v_coupon.id is not null then
    insert into coupon_redemptions (coupon_id, customer_id, order_id)
    values (v_coupon.id, auth.uid(), v_order_id);
  end if;

  return query select o.id, o.order_number from orders o where o.id = v_order_id;
end;
$$;

revoke execute on function create_order(jsonb, text, boolean, numeric, jsonb, text) from public;
grant execute on function create_order(jsonb, text, boolean, numeric, jsonb, text) to authenticated;

-- ============================ 9. STORAGE BUCKETS ============================

insert into storage.buckets (id, name, public) values
  ('product-images', 'product-images', true),
  ('home-media',     'home-media',     true),
  -- order-invoices stays PRIVATE: the PDFs hold a customer's full name, address
  -- and phone number. Only the notify-order edge function (service role, which
  -- bypasses storage RLS) touches it, handing WhatsApp a short-lived signed URL.
  ('order-invoices', 'order-invoices', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists product_images_bucket_read on storage.objects;
create policy product_images_bucket_read on storage.objects for select
  using (bucket_id = 'product-images');
drop policy if exists product_images_bucket_write on storage.objects;
create policy product_images_bucket_write on storage.objects for all
  using (bucket_id = 'product-images' and is_admin())
  with check (bucket_id = 'product-images' and is_admin());

drop policy if exists home_media_bucket_read on storage.objects;
create policy home_media_bucket_read on storage.objects for select
  using (bucket_id = 'home-media');
drop policy if exists home_media_bucket_write on storage.objects;
create policy home_media_bucket_write on storage.objects for all
  using (bucket_id = 'home-media' and is_admin())
  with check (bucket_id = 'home-media' and is_admin());

-- Deliberately NO read policy for order-invoices.
drop policy if exists order_invoices_bucket_read on storage.objects;

-- ============================ 10. STARTER DATA ==============================

insert into categories (name, slug, sort_order) values
  ('Rings',    'rings',    1),
  ('Earrings', 'earrings', 2),
  ('Pendants', 'pendants', 3),
  ('Necklace', 'necklace', 4)
on conflict (slug) do nothing;

insert into home_content (section, text_content, is_active) values
  ('offer_strip',     'Flat 10% off on your first order', true),
  ('hero_banner',     null,                               true),
  ('follow_the_glow', '@glimmora.in',                     true)
on conflict (section) do nothing;

-- ============================================================================
-- STEP A — CREATE YOUR ADMIN USER (required; the admin panel stays locked without it)
-- ============================================================================
-- 1. Dashboard > Authentication > Users > "Add user" > "Create new user".
--    Enter an email + password and tick "Auto Confirm User".
-- 2. Come back here and run, with your own email:
--
--      insert into admins (user_id)
--      select id from auth.users where email = 'you@example.com'
--      on conflict (user_id) do nothing;
--
--    Then sign in at /admin/login with that email and password.
--
-- ============================================================================
-- STEP B — ENABLE PHONE AUTH (required for customer login)
-- ============================================================================
-- Dashboard > Authentication > Sign In / Providers > enable "Phone" and connect
-- an SMS/WhatsApp provider. Customers sign in with a one-time code.
-- Browsing, search and wishlist work without this; checkout does not, because
-- create_order refuses an unauthenticated caller.
--
-- ============================================================================
-- OPTIONAL — DEMO PRODUCTS
-- ============================================================================
-- To see a populated storefront before adding real stock, run
-- supabase/seed_demo_products.sql. Remove it all later with:
--   delete from products where slug like 'demo-%';
-- ============================================================================
