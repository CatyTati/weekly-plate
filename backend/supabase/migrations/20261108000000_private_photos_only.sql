-- A private account's recipes open only for its approved followers. Everyone else sees just
-- the photos: photos_of() gives them, and nothing else about the recipes.

create function public.is_private_account(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_private from public.profiles where id = uid), false);
$$;

-- Built-in recipes and your own as before; someone else's public recipe only when their
-- account is public, or you are an approved follower.
create or replace function public.can_read_recipe(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.recipes r
    where r.id = rid
      and (r.owner_id is null or r.owner_id = auth.uid()
           or (r.is_public and (not public.is_private_account(r.owner_id) or public.is_approved_follower(r.owner_id))))
  );
$$;

drop policy recipes_read on public.recipes;
create policy recipes_read on public.recipes for select to authenticated
  using (owner_id is null or owner_id = auth.uid()
         or (is_public and (not public.is_private_account(owner_id) or public.is_approved_follower(owner_id))));

-- Someone's public recipes as photos only, newest first: a recipe id to keep tiles apart and
-- its first photo (null when it has none). No names, ingredients or method.
create function public.photos_of(owner uuid)
returns table (recipe_id uuid, storage_path text)
language sql stable security definer set search_path = public as $$
  select r.id,
         (select p.storage_path from public.recipe_photos p where p.recipe_id = r.id order by p.position limit 1)
  from public.recipes r
  where r.owner_id = owner and r.is_public
  order by r.created_at desc;
$$;

revoke execute on function public.photos_of(uuid) from public, anon;
grant execute on function public.photos_of(uuid) to authenticated;
