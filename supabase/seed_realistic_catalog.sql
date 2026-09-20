-- ============================================================================
-- Glimmora — realistic catalog for the portfolio / demo deployment
-- Paste into Supabase Dashboard > SQL Editor and run once.
-- ============================================================================
-- 16 products across all five categories, with real-sounding names, varied
-- prices, discounts, stock levels and a Casual/Ethnic split. Six are flagged
-- is_featured so the homepage carousel (Home.tsx fetches featuredOnly) is
-- populated, and one is intentionally out of stock and one intentionally
-- inactive so those UI states are demonstrable.
--
-- Slugs are natural (e.g. /product/aurora-solitaire-ring) so product URLs look
-- like a real store's rather than "demo-*".
--
-- IMAGES: these point at picsum.photos so the catalog renders immediately with
-- nothing broken. They are generic photos, not jewellery. Replacing them with
-- real product images through the admin panel (Admin > Products > edit > upload)
-- is the single highest-impact thing you can do for how this reads to a
-- reviewer — budget 20 minutes for it.
--
-- product_code is left out on purpose: the products_set_code trigger assigns
-- GRG001 / GER001 / GPD001 / GNK001 / GBR001 automatically on insert.
-- Run resume_prep_fixes.sql FIRST if you want bracelets to get GBR instead of GXX.
-- ============================================================================

insert into products
  (name, slug, description, price, discount_percent, category_id, section, stock_count, is_featured, is_active)
values
  -- ---------------- Rings ----------------
  ('Aurora Solitaire Ring', 'aurora-solitaire-ring',
   'A single radiant stone raised on a fine tapered band, cut to catch light from every angle. Our most-gifted engagement piece.',
   2499, 10, (select id from categories where slug = 'rings'), 'casual', 18, true, true),

  ('Luna Halo Ring', 'luna-halo-ring',
   'A halo of pavé stones circling a warm centre, quietly luminous without being loud. Sits flush under a stacked band.',
   3199, 0, (select id from categories where slug = 'rings'), 'casual', 12, true, true),

  ('Stella Stacking Band', 'stella-stacking-band',
   'A slim 2mm band designed to be worn two or three at a time. Comfortable enough to forget you have it on.',
   1099, 15, (select id from categories where slug = 'rings'), 'casual', 40, false, true),

  ('Meenakari Statement Ring', 'meenakari-statement-ring',
   'Hand-painted enamel in deep jewel tones set in an antique-finish frame. Made for festive wear and heavy silk.',
   2899, 0, (select id from categories where slug = 'rings'), 'ethnic', 9, false, true),

  -- ---------------- Earrings ----------------
  ('Whisper Hoop Earrings', 'whisper-hoop-earrings',
   'Featherweight 18mm hoops you can wear from desk to dinner. Secure snap closure, no sag.',
   999, 0, (select id from categories where slug = 'earrings'), 'casual', 35, true, true),

  ('Dew Drop Earrings', 'dew-drop-earrings',
   'A single faceted drop suspended in a delicate setting so it moves with you and catches the light as it does.',
   1299, 20, (select id from categories where slug = 'earrings'), 'casual', 24, false, true),

  ('Glow Stud Earrings', 'glow-stud-earrings',
   'Understated 5mm studs that finish an outfit without asking for attention. The pair most customers buy first.',
   749, 0, (select id from categories where slug = 'earrings'), 'casual', 60, true, true),

  ('Jhumka Chandelier Earrings', 'jhumka-chandelier-earrings',
   'Traditional dome jhumkas with layered beaded fringe and a gold antique finish. Weighted to hang straight.',
   1999, 10, (select id from categories where slug = 'earrings'), 'ethnic', 15, false, true),

  -- ---------------- Pendants ----------------
  ('Eternal Heart Pendant', 'eternal-heart-pendant',
   'A classic heart silhouette on a fine 16-inch chain, with a 2-inch extender for layering.',
   1699, 0, (select id from categories where slug = 'pendants'), 'casual', 20, false, true),

  ('Halo Drop Pendant', 'halo-drop-pendant',
   'A softly framed centre stone that sits just below the collarbone and moves gently as you do.',
   1549, 15, (select id from categories where slug = 'pendants'), 'casual', 26, true, true),

  ('Infinity Pendant', 'infinity-pendant',
   'A timeless symbol rendered minimally in a polished finish. A safe gift that rarely misses.',
   1249, 0, (select id from categories where slug = 'pendants'), 'casual', 32, false, true),

  ('Starlight Pendant', 'starlight-pendant',
   'Tiny stones scattered and set like a constellation across a brushed disc.',
   1899, 10, (select id from categories where slug = 'pendants'), 'casual', 0, false, true),

  -- ---------------- Necklace ----------------
  ('Golden Cascade Necklace', 'golden-cascade-necklace',
   'Three graduated chains falling in a soft cascade. Reads as a styled layered look but fastens as one piece.',
   2799, 0, (select id from categories where slug = 'necklace'), 'casual', 10, true, true),

  ('Kundan Choker Set', 'kundan-choker-set',
   'Uncut kundan stones set in a structured choker with matching drop earrings. Bridal-weight, fully lined at the back.',
   5499, 12, (select id from categories where slug = 'necklace'), 'ethnic', 6, false, true),

  ('Classic Rope Chain', 'classic-rope-chain',
   'A sturdy 20-inch rope chain that holds its shape and goes with every pendant we make.',
   1849, 0, (select id from categories where slug = 'necklace'), 'casual', 28, false, true),

  -- ---------------- Bracelets ----------------
  ('Ivy Charm Bracelet', 'ivy-charm-bracelet',
   'An adjustable chain bracelet with three removable charms, so it can be changed up rather than replaced.',
   1399, 0, (select id from categories where slug = 'bracelets'), 'casual', 22, false, true),

  ('Temple Kada Bangle', 'temple-kada-bangle',
   'A broad antique-finish kada with temple motif detailing, sized 2.6. Substantial without being uncomfortable.',
   2399, 0, (select id from categories where slug = 'bracelets'), 'ethnic', 11, false, false)

on conflict (slug) do nothing;

-- Two images per product so the product-detail gallery has something to page through.
insert into product_images (product_id, image_url, sort_order)
select id, 'https://picsum.photos/seed/' || slug || '-a/900/900', 0
from products
where slug in (
  'aurora-solitaire-ring','luna-halo-ring','stella-stacking-band','meenakari-statement-ring',
  'whisper-hoop-earrings','dew-drop-earrings','glow-stud-earrings','jhumka-chandelier-earrings',
  'eternal-heart-pendant','halo-drop-pendant','infinity-pendant','starlight-pendant',
  'golden-cascade-necklace','kundan-choker-set','classic-rope-chain',
  'ivy-charm-bracelet','temple-kada-bangle'
)
and not exists (
  select 1 from product_images pi where pi.product_id = products.id and pi.sort_order = 0
);

insert into product_images (product_id, image_url, sort_order)
select id, 'https://picsum.photos/seed/' || slug || '-b/900/900', 1
from products
where slug in (
  'aurora-solitaire-ring','luna-halo-ring','stella-stacking-band','meenakari-statement-ring',
  'whisper-hoop-earrings','dew-drop-earrings','glow-stud-earrings','jhumka-chandelier-earrings',
  'eternal-heart-pendant','halo-drop-pendant','infinity-pendant','starlight-pendant',
  'golden-cascade-necklace','kundan-choker-set','classic-rope-chain',
  'ivy-charm-bracelet','temple-kada-bangle'
)
and not exists (
  select 1 from product_images pi where pi.product_id = products.id and pi.sort_order = 1
);

-- A live coupon, so the checkout coupon field demonstrates something.
insert into coupons (code, discount_type, discount_value, usage_limit_per_user, is_active)
values ('WELCOME10', 'percent', 10, 1, true)
on conflict (code) do nothing;

-- ============================================================================
-- OPTIONAL CLEANUP — your three test products ('ooo', 'hello', 'hai')
-- ============================================================================
-- Left commented out deliberately: this deletes data, so read it before running.
-- Safe right now because no orders reference them (products in real orders are
-- protected by a foreign key and will refuse to delete). Images cascade.
--
--   delete from products where slug in ('ooo', 'hello', 'hai');
--
-- If the slugs differ, find them first with:
--   select name, slug, product_code from products order by created_at;
-- ============================================================================
