-- ============================================================================
-- Glimmora — swap picsum placeholders for real jewellery photos
-- Paste into Supabase Dashboard > SQL Editor and run once. Safe to re-run.
-- ============================================================================
-- Replaces the generic picsum.photos placeholders seeded by
-- seed_realistic_catalog.sql with category-matched photos from Unsplash's CDN
-- (rings get rings, earrings get earrings, and so on).
--
-- SAFE BY CONSTRUCTION: every statement is guarded with
--   and image_url like '%picsum%'
-- so images you uploaded yourself through the admin panel are never touched.
-- Products already using your own photos simply no-op here.
--
-- All 34 URLs were checked before this file was written: each returns HTTP 200
-- with an image content-type, and all are distinct. They are served from
-- Unsplash's CDN at 900x900, cropped square to match the product grid.
--
-- These remain stock photos. Real photographs of your own stock are still
-- better, and uploading one through the admin panel overrides whatever is here.
-- ============================================================================

update product_images set image_url = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'aurora-solitaire-ring')
   and sort_order = 0 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1605100804567-1ffe942b5cd6?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'aurora-solitaire-ring')
   and sort_order = 1 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'luna-halo-ring')
   and sort_order = 0 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1598560917807-1bae44bd2be8?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'luna-halo-ring')
   and sort_order = 1 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1607703829739-c05b7beddf60?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'stella-stacking-band')
   and sort_order = 0 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1613945407943-59cd755fd69e?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'stella-stacking-band')
   and sort_order = 1 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1589674668791-4889d2bba4c6?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'meenakari-statement-ring')
   and sort_order = 0 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'meenakari-statement-ring')
   and sort_order = 1 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'whisper-hoop-earrings')
   and sort_order = 0 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1629224316810-9d8805b95e76?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'whisper-hoop-earrings')
   and sort_order = 1 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1693212793204-bcea856c75fe?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'dew-drop-earrings')
   and sort_order = 0 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1615655114865-4cc1bda5901e?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'dew-drop-earrings')
   and sort_order = 1 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1652766540048-de0a878a3266?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'glow-stud-earrings')
   and sort_order = 0 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1608508644127-ba99d7732fee?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'glow-stud-earrings')
   and sort_order = 1 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1603974372039-adc49044b6bd?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'jhumka-chandelier-earrings')
   and sort_order = 0 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'jhumka-chandelier-earrings')
   and sort_order = 1 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'eternal-heart-pendant')
   and sort_order = 0 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1676329945867-01c9975aa9d1?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'eternal-heart-pendant')
   and sort_order = 1 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1569397288884-4d43d6738fbd?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'halo-drop-pendant')
   and sort_order = 0 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1722410180687-b05b50922362?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'halo-drop-pendant')
   and sort_order = 1 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'infinity-pendant')
   and sort_order = 0 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1620656798579-1984d9e87df7?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'infinity-pendant')
   and sort_order = 1 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1685970731194-e27b477e87ba?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'starlight-pendant')
   and sort_order = 0 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1610694955371-d4a3e0ce4b52?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'starlight-pendant')
   and sort_order = 1 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1633934542430-0905ccb5f050?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'golden-cascade-necklace')
   and sort_order = 0 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'golden-cascade-necklace')
   and sort_order = 1 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1685970731571-72ede0cb26ea?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'kundan-choker-set')
   and sort_order = 0 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'kundan-choker-set')
   and sort_order = 1 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1722410180670-b6d5a2e704fa?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'classic-rope-chain')
   and sort_order = 0 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1631965004544-1762fc696476?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'classic-rope-chain')
   and sort_order = 1 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'ivy-charm-bracelet')
   and sort_order = 0 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'ivy-charm-bracelet')
   and sort_order = 1 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1692421098809-6cdfcfea289a?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'temple-kada-bangle')
   and sort_order = 0 and image_url like '%picsum%';

update product_images set image_url = 'https://images.unsplash.com/photo-1721103428054-6bcf4f655594?w=900&h=900&fit=crop&q=80'
 where product_id = (select id from products where slug = 'temple-kada-bangle')
   and sort_order = 1 and image_url like '%picsum%';

-- Verify nothing is left on a placeholder:
--   select p.name, pi.sort_order, pi.image_url
--   from product_images pi join products p on p.id = pi.product_id
--   where pi.image_url like '%picsum%';
