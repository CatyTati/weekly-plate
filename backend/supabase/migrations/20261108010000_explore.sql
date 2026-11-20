-- Search: other people's public dishes, at random when nothing is typed, else the ones whose
-- name matches or is close to it ("שקשוקה" finds "שקשוקה ירוקה" and "שקשוקא").
-- A private account's dish comes back locked until you are an approved follower: its photo
-- and its cook, but no name and no time.

create extension if not exists pg_trgm with schema extensions;

create function public.explore(q text default '')
returns table (id uuid, owner_id uuid, owner_name text, locked boolean, name text, prep_minutes smallint, photo text)
language sql stable security definer set search_path = public, extensions as $$
  with found as (
    select r.*,
           public.is_private_account(r.owner_id) and not public.is_approved_follower(r.owner_id) as is_locked,
           case when coalesce(btrim(q), '') = '' then random()
                when r.name ilike '%' || btrim(q) || '%' then 2 + similarity(r.name, btrim(q))
                else word_similarity(btrim(q), r.name) end as score
    from public.recipes r
    where r.is_public and r.owner_id is not null and r.owner_id <> auth.uid()
  )
  select f.id, f.owner_id, p.display_name, f.is_locked,
         case when f.is_locked then null else f.name end,
         case when f.is_locked then null else f.prep_minutes end,
         (select ph.storage_path from public.recipe_photos ph where ph.recipe_id = f.id order by ph.position limit 1)
  from found f
  join public.profiles p on p.id = f.owner_id
  where coalesce(btrim(q), '') = '' or f.score >= 0.45
  order by f.score desc
  limit 40;
$$;

revoke execute on function public.explore(text) from public, anon;
grant execute on function public.explore(text) to authenticated;
