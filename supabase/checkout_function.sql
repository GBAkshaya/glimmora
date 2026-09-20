-- Glimmora — atomic order creation
-- Run after schema.sql + policies.sql.
--
-- Creates the order + order_items + decrements stock as one transaction,
-- so a partial failure never leaves a broken/half-created order. Row locks
-- (FOR UPDATE) prevent two simultaneous checkouts from overselling the same
-- item's remaining stock.

create or replace function create_order(
  p_shipping_address jsonb,
  p_whatsapp_number text,
  p_gift_wrap boolean,
  p_gift_wrap_fee numeric,
  p_items jsonb -- [{ "product_id": "...", "quantity": 2 }, ...]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_subtotal numeric := 0;
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

  -- Lock the rows we're about to sell from and validate stock up front.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::int;

    select * into v_product from products
      where id = (v_item->>'product_id')::uuid
      for update;

    if v_product.id is null then
      raise exception 'Product not found: %', v_item->>'product_id';
    end if;
    if v_product.stock_count < v_quantity then
      raise exception 'Insufficient stock for %', v_product.name;
    end if;

    v_unit_price := v_product.price * (1 - v_product.discount_percent / 100);
    v_subtotal := v_subtotal + v_unit_price * v_quantity;
  end loop;

  insert into orders (
    customer_id, status, subtotal, discount_amount, gift_wrap, gift_wrap_fee,
    total, shipping_address, whatsapp_number
  ) values (
    auth.uid(), 'Pending', v_subtotal, 0, p_gift_wrap, p_gift_wrap_fee,
    v_subtotal + p_gift_wrap_fee, p_shipping_address, p_whatsapp_number
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

  return v_order_id;
end;
$$;

revoke execute on function create_order from public;
grant execute on function create_order(jsonb, text, boolean, numeric, jsonb) to authenticated;
