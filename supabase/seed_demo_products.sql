-- Glimmora — DEMO products for development only.
-- Run after schema.sql + policies.sql + seed.sql (categories must already exist).
--
-- All demo products are prefixed "demo-" in their slug so they're trivial to
-- wipe later, once real products are added via the admin panel:
--   delete from products where slug like 'demo-%';
-- (product_images cascade-deletes automatically via the FK.)

insert into products (name, slug, description, price, discount_percent, category_id, stock_count, is_featured, is_active) values
  ('Aurora Solitaire Ring', 'demo-aurora-solitaire-ring', 'A single radiant stone, set to catch the light from every angle.', 1499, 10, (select id from categories where slug = 'rings'), 25, true, true),
  ('Luna Halo Ring', 'demo-luna-halo-ring', 'A halo of small stones circling a warm center — quietly luminous.', 1899, 0, (select id from categories where slug = 'rings'), 15, false, true),
  ('Stella Band Ring', 'demo-stella-band-ring', 'A slim, stackable band for everyday wear.', 999, 15, (select id from categories where slug = 'rings'), 40, false, true),
  ('Celeste Twist Ring', 'demo-celeste-twist-ring', 'An open twist design with a modern, sculptural edge.', 1299, 0, (select id from categories where slug = 'rings'), 0, false, true),

  ('Whisper Hoop Earrings', 'demo-whisper-hoop-earrings', 'Lightweight hoops for everyday elegance.', 899, 0, (select id from categories where slug = 'earrings'), 30, true, true),
  ('Dew Drop Earrings', 'demo-dew-drop-earrings', 'A single drop stone suspended in a delicate setting.', 1099, 20, (select id from categories where slug = 'earrings'), 20, false, true),
  ('Glow Stud Earrings', 'demo-glow-stud-earrings', 'Understated studs that catch the light without trying too hard.', 699, 0, (select id from categories where slug = 'earrings'), 50, true, true),
  ('Marigold Chandelier Earrings', 'demo-marigold-chandelier-earrings', 'Statement earrings for evenings that call for a little more shine.', 1799, 10, (select id from categories where slug = 'earrings'), 12, false, true),

  ('Eternal Heart Pendant', 'demo-eternal-heart-pendant', 'A classic heart silhouette on a fine chain.', 1599, 0, (select id from categories where slug = 'pendants'), 18, true, true),
  ('Halo Drop Pendant', 'demo-halo-drop-pendant', 'A softly framed stone that moves gently as you do.', 1399, 15, (select id from categories where slug = 'pendants'), 22, false, true),
  ('Infinity Pendant', 'demo-infinity-pendant', 'A timeless symbol, minimally rendered.', 1199, 0, (select id from categories where slug = 'pendants'), 35, false, true),
  ('Starlight Pendant', 'demo-starlight-pendant', 'A scattering of tiny stones set like a constellation.', 1699, 10, (select id from categories where slug = 'pendants'), 10, false, false),

  ('Golden Cascade Necklace', 'demo-golden-cascade-necklace', 'Layered chains that fall in a soft cascade.', 2499, 0, (select id from categories where slug = 'necklace'), 8, true, true),
  ('Layered Glow Necklace', 'demo-layered-glow-necklace', 'Two fine chains at different lengths, styled to wear together.', 2199, 20, (select id from categories where slug = 'necklace'), 14, false, true),
  ('Classic Chain Necklace', 'demo-classic-chain-necklace', 'A simple, sturdy chain that goes with everything.', 1799, 0, (select id from categories where slug = 'necklace'), 28, false, true);

insert into product_images (product_id, image_url, sort_order)
select id, 'https://picsum.photos/seed/' || slug || '-1/800/800', 0
from products where slug like 'demo-%';

insert into product_images (product_id, image_url, sort_order)
select id, 'https://picsum.photos/seed/' || slug || '-2/800/800', 1
from products where slug like 'demo-%';
