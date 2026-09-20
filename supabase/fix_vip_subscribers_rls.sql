-- Glimmora — lock down vip_subscribers: the original policies in
-- vip_subscribers.sql left select and delete open to `using (true)`, meaning
-- any anonymous visitor could read or delete every subscriber's WhatsApp
-- number via the public REST API, bypassing the admin panel entirely.
-- Insert stays public (the footer signup form is meant to be open to anyone).
-- Run once in the Supabase SQL editor.

drop policy if exists "Anyone can view VIP subscribers" on vip_subscribers;
drop policy if exists "Anyone can delete VIP subscriber" on vip_subscribers;

create policy vip_subscribers_admin_select on vip_subscribers
  for select using (is_admin());
create policy vip_subscribers_admin_delete on vip_subscribers
  for delete using (is_admin());
