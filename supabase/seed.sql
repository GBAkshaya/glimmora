-- Glimmora — starter data
-- Run after schema.sql + policies.sql.

insert into categories (name, slug, sort_order) values
  ('Rings', 'rings', 1),
  ('Earrings', 'earrings', 2),
  ('Pendants', 'pendants', 3),
  ('Necklace', 'necklace', 4);

insert into home_content (section, text_content, is_active) values
  ('offer_strip', 'Flat 10% off on your first order', true),
  ('hero_banner', null, true),
  ('follow_the_glow', '@glimmora.in', true);
