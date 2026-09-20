-- Glimmora — coupon validation + coupon-aware order creation
-- Run after checkout_function.sql.

-- Lets the client check a code before checkout without ever exposing the
-- coupons table itself to direct reads (codes stay server-side only).
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

-- Re-validates the coupon server-side (never trusts the client's discount
-- math) and records the redemption atomically with the rest of the order.
-- Returns both the internal uuid and the human-readable order_number
-- (assigned by the orders_set_number trigger, see order_numbers.sql).
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
