-- Table for storing VIP WhatsApp subscribers from footer & admin
create table if not exists vip_subscribers (
  id uuid primary key default gen_random_uuid(),
  whatsapp_number text unique not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table vip_subscribers enable row level security;

-- Public can subscribe
create policy "Anyone can insert VIP subscriber" on vip_subscribers
  for insert with check (true);

-- Only admins can view or delete subscribers (see fix_vip_subscribers_rls.sql)
create policy vip_subscribers_admin_select on vip_subscribers
  for select using (is_admin());
create policy vip_subscribers_admin_delete on vip_subscribers
  for delete using (is_admin());
