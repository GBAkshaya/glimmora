-- Glimmora — add Casual/Ethnic section to products
-- Run in the SQL Editor. Safe to run once; existing products default to 'casual'.

alter table products
  add column if not exists section text not null default 'casual'
  check (section in ('casual', 'ethnic'));
