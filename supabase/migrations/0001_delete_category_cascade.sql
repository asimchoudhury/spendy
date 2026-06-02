-- Atomically delete a category and all of its expenses in a single transaction.
--
-- Phase 3 deletes a category and its expenses across two tables. Doing that as two
-- separate client calls is not atomic: if the second delete fails, you are left with
-- a category that has zero expenses (or orphaned expenses). Wrapping both deletes in
-- one plpgsql function makes them all-or-nothing — the function body runs inside a
-- single implicit transaction, so either both deletes commit or neither does.
--
-- SECURITY INVOKER (the default) means the function runs as the calling user, so the
-- existing Row Level Security policies on `expenses` and `categories` still apply.
-- We additionally scope every delete to auth.uid() as defence-in-depth.
--
-- To apply: paste this into the Supabase SQL editor and run it (or use the Supabase CLI).

create or replace function public.delete_category_cascade(cat_name text)
returns void
language plpgsql
security invoker
as $$
begin
  delete from public.expenses
    where category = cat_name
      and user_id = auth.uid();

  delete from public.categories
    where name = cat_name
      and user_id = auth.uid();
end;
$$;

grant execute on function public.delete_category_cascade(text) to authenticated;
