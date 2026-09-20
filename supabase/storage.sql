-- Glimmora — storage buckets
-- Run after policies.sql (needs is_admin()).

insert into storage.buckets (id, name, public) values
  ('product-images', 'product-images', true),
  ('home-media', 'home-media', true)
on conflict (id) do nothing;

create policy product_images_bucket_read on storage.objects for select
  using (bucket_id = 'product-images');
create policy product_images_bucket_write on storage.objects for all
  using (bucket_id = 'product-images' and is_admin())
  with check (bucket_id = 'product-images' and is_admin());

create policy home_media_bucket_read on storage.objects for select
  using (bucket_id = 'home-media');
create policy home_media_bucket_write on storage.objects for all
  using (bucket_id = 'home-media' and is_admin())
  with check (bucket_id = 'home-media' and is_admin());
