-- Glimmora — rollback: removes the delivery fee added in a previous migration
-- (supabase/delivery_fee.sql). Only run this if you already applied that file —
-- if you never ran it, this is a safe no-op.

drop function if exists create_order(jsonb, text, boolean, numeric, jsonb, text, numeric);

create or replace function create_order(
  p_shipping_address jsonb,
  p_whatsapp_number text,
  p_gift_wrap boolean,
  p_gift_wrap_fee numeric,
  p_items jsonb,
  p_coupon_code text default null
)
returns uuid
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
  returning id into v_order_id;

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

  return v_order_id;
end;
$$;

revoke execute on function create_order(jsonb, text, boolean, numeric, jsonb, text) from public;
grant execute on function create_order(jsonb, text, boolean, numeric, jsonb, text) to authenticated;

alter table orders drop column if exists delivery_fee;
