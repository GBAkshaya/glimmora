-- Glimmora — human-readable order numbers, e.g. 070826-A1B2
-- Format: DDMMYY-XXXX (order date + 4 random alphanumeric characters).
-- Run after coupons_function.sql (which already returns order_number for new
-- orders placed after this migration — this file also backfills older ones
-- and adds the trigger that assigns the number automatically on insert).

alter table orders add column if not exists order_number text unique;

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

-- Backfill any existing orders, using each order's own created_at date for the prefix.
do $$
declare
  v_order record;
  v_date_part text;
  v_candidate text;
  v_exists boolean;
begin
  for v_order in select id, created_at from orders where order_number is null loop
    v_date_part := to_char(v_order.created_at, 'DDMMYY');
    loop
      select v_date_part || '-' || string_agg(
        substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', (floor(random() * 36) + 1)::int, 1), ''
      )
      into v_candidate
      from generate_series(1, 4);

      select exists(select 1 from orders where order_number = v_candidate) into v_exists;
      exit when not v_exists;
    end loop;

    update orders set order_number = v_candidate where id = v_order.id;
  end loop;
end $$;

-- create_order's return type is changing (uuid -> table), which CREATE OR REPLACE can't
-- do, so drop the old 6-arg/uuid-returning version before recreating it. Existing
-- databases that haven't run the updated coupons_function.sql yet need this; if you've
-- already re-run coupons_function.sql after this file was added, this is a safe no-op.
drop function if exists create_order(jsonb, text, boolean, numeric, jsonb, text);

create function create_order(
  p_shipping_address jsonb,
  p_whatsapp_number text,
  p_gift_wrap boolean,
  p_gift_wrap_fee numeric,
  p_items jsonb,
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

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::int;
    select * into v_product from products where id = (v_item->>'product_id')::uuid for update;
    if v_product.id is null then
      raise exception 'Product not found: %', v_item->>'product_id';
    end if;
    if v_product.stock_count < v_quantity then
      raise exception 'Insufficient stock for %', v_product.name;
    end if;
    v_unit_price := v_product.price * (1 - v_product.discount_percent / 100);
    v_subtotal := v_subtotal + v_unit_price * v_quantity;
  end loop;

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

    if v_coupon.discount_type = 'percent' then
      v_discount_amount := v_subtotal * (v_coupon.discount_value / 100);
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
    select * into v_product from products where id = (v_item->>'product_id')::uuid;
    v_unit_price := v_product.price * (1 - v_product.discount_percent / 100);

    insert into order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
    values (v_order_id, v_product.id, v_product.name, v_unit_price, v_quantity, v_unit_price * v_quantity);

    update products set stock_count = stock_count - v_quantity where id = v_product.id;
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
