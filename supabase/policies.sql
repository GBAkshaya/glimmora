-- Glimmora — Row Level Security
-- Run after schema.sql.

-- Helper: is the current session an admin? (SECURITY DEFINER bypasses RLS on admins itself)
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table customers enable row level security;
alter table reviews enable row level security;
alter table wishlists enable row level security;
alter table coupons enable row level security;
alter table coupon_redemptions enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table home_content enable row level security;
alter table admins enable row level security;

-- ============ CATALOG: public read, admin write ============

create policy categories_public_read on categories for select using (true);
create policy categories_admin_write on categories for all using (is_admin()) with check (is_admin());

create policy products_public_read on products for select using (is_active = true or is_admin());
create policy products_admin_write on products for all using (is_admin()) with check (is_admin());

create policy product_images_public_read on product_images for select using (true);
create policy product_images_admin_write on product_images for all using (is_admin()) with check (is_admin());

create policy home_content_public_read on home_content for select using (is_active = true or is_admin());
create policy home_content_admin_write on home_content for all using (is_admin()) with check (is_admin());

-- ============ CUSTOMERS: own row only, admin sees all ============

create policy customers_self_select on customers for select using (auth.uid() = id or is_admin());
create policy customers_self_insert on customers for insert with check (auth.uid() = id);
create policy customers_self_update on customers for update using (auth.uid() = id) with check (auth.uid() = id);

-- ============ REVIEWS: public read, customers write their own ============

create policy reviews_public_read on reviews for select using (true);
create policy reviews_customer_insert on reviews for insert with check (auth.uid() = customer_id);
create policy reviews_admin_delete on reviews for delete using (is_admin());

-- ============ WISHLISTS: fully owned by customer ============

create policy wishlists_owner_all on wishlists for all
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

-- ============ COUPONS: admin only (validated via RPC, not direct select) ============

create policy coupons_admin_all on coupons for all using (is_admin()) with check (is_admin());

create policy coupon_redemptions_owner_select on coupon_redemptions for select
  using (auth.uid() = customer_id or is_admin());
create policy coupon_redemptions_owner_insert on coupon_redemptions for insert
  with check (auth.uid() = customer_id);

-- ============ ORDERS: customer sees/creates own, only admin updates status ============

create policy orders_owner_select on orders for select using (auth.uid() = customer_id or is_admin());
create policy orders_owner_insert on orders for insert with check (auth.uid() = customer_id);
create policy orders_admin_update on orders for update using (is_admin()) with check (is_admin());

create policy order_items_owner_select on order_items for select using (
  exists (select 1 from orders o where o.id = order_id and (o.customer_id = auth.uid() or is_admin()))
);
create policy order_items_owner_insert on order_items for insert with check (
  exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
);
create policy order_items_admin_delete on order_items for delete using (is_admin());

-- ============ ADMINS: no client access at all ============
-- (is_admin() reads it via SECURITY DEFINER; no policy needed for normal use)
