-- Glimmora — storage bucket for auto-generated order-summary PDFs
-- Run after storage.sql. The bucket is private: these PDFs contain a customer's full
-- name, address and phone number, so there is no public or client-side read/write
-- policy at all. Only the notify-order Edge Function (service role, which bypasses
-- storage RLS entirely) ever touches this bucket — it uploads the PDF and hands
-- WhatsApp a short-lived signed URL (see make_order_invoices_private.sql for the
-- migration from the original public bucket, and the updated edge function).

insert into storage.buckets (id, name, public) values
  ('order-invoices', 'order-invoices', false)
on conflict (id) do nothing;
