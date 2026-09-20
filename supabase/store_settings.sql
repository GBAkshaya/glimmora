-- Glimmora — store-wide settings (currently just the payment QR code)
-- Run after schema.sql + policies.sql.

create table if not exists store_settings (
  id boolean primary key default true check (id),
  payment_qr_url text,
  updated_at timestamptz not null default now()
);

insert into store_settings (id) values (true) on conflict do nothing;

alter table store_settings enable row level security;

create policy store_settings_admin_all on store_settings
  for all using (is_admin()) with check (is_admin());
