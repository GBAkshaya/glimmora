-- Glimmora — "Follow the Glow" Instagram-style photo grid
-- Run after schema.sql + policies.sql.

create table if not exists follow_glow_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  link_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists follow_glow_images_sort_idx on follow_glow_images(sort_order);

alter table follow_glow_images enable row level security;

create policy follow_glow_images_public_read on follow_glow_images
  for select using (is_active = true or is_admin());
create policy follow_glow_images_admin_write on follow_glow_images
  for all using (is_admin()) with check (is_admin());
