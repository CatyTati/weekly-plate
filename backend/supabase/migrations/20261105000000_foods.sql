-- Foods and their nutrition, for counting calories in recipes. Values are per 100 g.
-- Anyone can suggest a food; it waits as 'pending' until an admin approves it, and only
-- then does everyone see it. Until then only the person who added it (and admins) see it,
-- plus anyone who can read a recipe that uses it, so copied recipes keep their calories.
create table public.foods (
  id          uuid primary key default gen_random_uuid(),
  names       jsonb not null check (jsonb_typeof(names) = 'object'),  -- {"he": [...], "en": [...], "ru": [...]}
  aisle       text not null default 'pantry' check (aisle in ('veg', 'dairy', 'meat', 'bread', 'frozen', 'pantry')),
  kcal        numeric(6, 1) not null check (kcal between 0 and 900),
  protein     numeric(5, 1) check (protein between 0 and 100),
  carbs       numeric(5, 1) check (carbs between 0 and 100),
  fat         numeric(5, 1) check (fat between 0 and 100),
  piece_g     numeric(7, 1) check (piece_g > 0),   -- one piece (or head, loaf, can, bag), in grams
  density     numeric(4, 2) check (density > 0),   -- grams per ml, for cups and spoons
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  source      text,
  created_by  uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);
create index foods_status_idx on public.foods (status);

-- Who may approve foods. Rows are added by hand in the SQL editor.
create table public.app_admins (
  user_id uuid primary key references public.profiles (id) on delete cascade
);
alter table public.app_admins enable row level security;
create policy admins_read_own on public.app_admins for select to authenticated using (user_id = auth.uid());
grant select on public.app_admins to authenticated;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_admins where user_id = auth.uid());
$$;

-- An ingredient can point at the food it is, so its calories are counted.
alter table public.recipe_ingredients add column food_id uuid references public.foods (id) on delete set null;
create index recipe_ingredients_food_idx on public.recipe_ingredients (food_id) where food_id is not null;

create function public.food_in_readable_recipe(fid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.recipe_ingredients ri
    where ri.food_id = fid and public.can_read_recipe(ri.recipe_id)
  );
$$;

alter table public.foods enable row level security;
create policy foods_read on public.foods for select to authenticated
  using (status = 'approved' or created_by = auth.uid() or public.is_admin() or public.food_in_readable_recipe(id));
create policy foods_suggest on public.foods for insert to authenticated
  with check (created_by = auth.uid() and status = 'pending' and reviewed_at is null);
create policy foods_review on public.foods for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy foods_delete on public.foods for delete to authenticated
  using (public.is_admin() or (created_by = auth.uid() and status <> 'approved'));
grant select, insert, update, delete on public.foods to authenticated;

-- New recipes keep the food each ingredient is linked to.
create or replace function public.create_recipe(payload jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  rid uuid;
begin
  insert into public.recipes (owner_id, name, lang, prep_minutes, method, tags, kid_note,
                              keeps_days, cook_method, is_public)
  values (auth.uid(),
          btrim(payload->>'name'),
          coalesce(payload->>'lang', 'he'),
          (payload->>'prep_minutes')::smallint,
          btrim(payload->>'method'),
          coalesce(array(select jsonb_array_elements_text(payload->'tags')), '{}'),
          nullif(btrim(payload->>'kid_note'), ''),
          (payload->>'keeps_days')::smallint,
          coalesce(payload->>'cook_method', 'stove'),
          coalesce((payload->>'is_public')::boolean, false))
  returning id into rid;

  insert into public.recipe_ingredients (recipe_id, position, name, qty, unit, aisle, food_id)
  select rid, (i.ord - 1)::smallint, btrim(i.item->>'name'), (i.item->>'qty')::numeric,
         i.item->>'unit', i.item->>'aisle', nullif(i.item->>'food_id', '')::uuid
  from jsonb_array_elements(payload->'ingredients') with ordinality as i(item, ord);

  return rid;
end;
$$;
