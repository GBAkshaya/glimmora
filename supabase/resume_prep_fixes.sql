-- ============================================================================
-- Glimmora — two small live-database fixes
-- Paste into Supabase Dashboard > SQL Editor and run once. Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- FIX 1 (security): validate_coupon is callable by anonymous visitors.
-- Verified against the live API: an unauthenticated request to
-- /rest/v1/rpc/validate_coupon returns a verdict, so anyone can enumerate
-- coupon codes and read their discount values straight off the public REST
-- endpoint. coupons_function.sql intended otherwise but the grant never took
-- effect. Restrict it to signed-in users.
--
-- create_order is also PUBLIC-executable, but it guards itself on auth.uid()
-- and returns 'Not authenticated' to anon callers, so it is not exposed. The
-- revoke below is applied to it anyway for consistency.
-- ---------------------------------------------------------------------------

revoke execute on function validate_coupon(text) from public;
revoke execute on function validate_coupon(text) from anon;
grant  execute on function validate_coupon(text) to authenticated;

revoke execute on function create_order(jsonb, text, boolean, numeric, jsonb, text) from public;
revoke execute on function create_order(jsonb, text, boolean, numeric, jsonb, text) from anon;
grant  execute on function create_order(jsonb, text, boolean, numeric, jsonb, text) to authenticated;

-- ---------------------------------------------------------------------------
-- FIX 2 (cosmetic): the 'Bracelets' category added after product_codes.sql was
-- written has no prefix in generate_product_code(), so every bracelet falls
-- through to the 'GXX' fallback. Add the 'GBR' prefix.
-- ---------------------------------------------------------------------------

create or replace function generate_product_code()
returns trigger
language plpgsql
as $$
declare
  v_prefix text;
  v_next int;
begin
  select case c.slug
    when 'rings'     then 'GRG'
    when 'earrings'  then 'GER'
    when 'pendants'  then 'GPD'
    when 'necklace'  then 'GNK'
    when 'bracelets' then 'GBR'
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

-- Re-code any existing products that got the GXX fallback.
do $$
declare
  v_product record;
  v_prefix text;
  v_next int;
begin
  for v_product in
    select p.id, c.slug
    from products p
    join categories c on c.id = p.category_id
    where p.product_code like 'GXX%'
    order by p.created_at
  loop
    v_prefix := case v_product.slug
      when 'rings'     then 'GRG'
      when 'earrings'  then 'GER'
      when 'pendants'  then 'GPD'
      when 'necklace'  then 'GNK'
      when 'bracelets' then 'GBR'
      else 'GXX'
    end;

    if v_prefix <> 'GXX' then
      select coalesce(max(substring(product_code from 4)::int), 0) + 1
        into v_next
        from products
        where product_code like v_prefix || '%';

      update products
        set product_code = v_prefix || lpad(v_next::text, 3, '0')
        where id = v_product.id;
    end if;
  end loop;
end $$;
