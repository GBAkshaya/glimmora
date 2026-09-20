-- Glimmora — allow admins to delete order_items so that products which only
-- appear in cancelled orders can be deleted (products in active orders still
-- block deletion via the existing foreign key).
-- Run once in the Supabase SQL editor.

drop policy if exists order_items_admin_delete on order_items;
create policy order_items_admin_delete on order_items for delete using (is_admin());
