-- Glimmora — human-readable product codes (e.g. GER001)
-- Admin-only: never rendered in customer-facing UI, but included in the WhatsApp order
-- message sent to admin at checkout, and shown in the admin product list/form.
-- Run after schema.sql + seed.sql.

alter table products add column if not exists product_code text unique;

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

-- Backfill any existing products (e.g. demo products) that don't have a code yet,
-- numbering them in creation order within each category.
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
    where p.product_code is null
    order by p.created_at
  loop
    v_prefix := case v_product.slug
      when 'rings' then 'GRG'
      when 'earrings' then 'GER'
      when 'pendants' then 'GPD'
      when 'necklace' then 'GNK'
      else 'GXX'
    end;

    select coalesce(max(substring(product_code from 4)::int), 0) + 1
      into v_next
      from products
      where product_code like v_prefix || '%';

    update products set product_code = v_prefix || lpad(v_next::text, 3, '0') where id = v_product.id;
  end loop;
end $$;
