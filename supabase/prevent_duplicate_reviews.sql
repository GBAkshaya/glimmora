-- Glimmora — reviews had no unique constraint, so a logged-in customer
-- could submit unlimited reviews for the same product, skewing the average
-- rating. Add a uniqueness constraint (enforced at the DB level so it holds
-- even under concurrent submits) and let the app surface a friendly message.
-- Run once in the Supabase SQL editor.

alter table reviews add constraint reviews_product_customer_unique unique (product_id, customer_id);
