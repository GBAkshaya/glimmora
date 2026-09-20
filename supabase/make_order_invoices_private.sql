-- Glimmora — lock down the order-invoices bucket.
-- It was originally created public so WhatsApp's servers could fetch the PDF link,
-- but that means anyone with a link (which contains the customer's full name,
-- address, and phone number) could view it indefinitely with no auth at all.
-- The notify-order Edge Function now generates a short-lived signed URL instead
-- (see supabase/functions/notify-order/index.ts), so public access is no longer
-- needed — only the service role (which bypasses storage RLS) ever reads this bucket.
-- Run once in the Supabase SQL editor, then redeploy the notify-order function.

update storage.buckets set public = false where id = 'order-invoices';

drop policy if exists order_invoices_bucket_read on storage.objects;
