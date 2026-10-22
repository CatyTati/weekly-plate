-- Weekly Plate: initial schema for Supabase (PostgreSQL)
-- Validation lives here as a safety net: even if the API has a bug,
-- the database refuses invalid data. Row Level Security (RLS) decides
-- who may read or change each row.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles (one per Supabase Auth user)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  display_name   text check (char_length(btrim(display_name)) between 1 and 40),
  lang           text not null default 'he' check (lang in ('he', 'en', 'ru')),
  modes          text[] not null default '{}'
                 check (modes <@ array['kids', 'budget', 'prep', 'quick']),
  servings       smallint not null default 4 check (servings between 1 and 12),
  weekly_budget  numeric(8, 2) not null default 450 check (weekly_budget >= 0),
  is_premium     boolean not null default false,  -- set only by the payment webhook
  created_at     timestamptz not null default now()
);

-- Create a profile automatically when someone signs up.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Recipes
-- owner_id null = a built-in recipe shipped with the app.
-- ---------------------------------------------------------------------------
create table public.recipes (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references public.profiles (id) on delete cascade,
  name          text not null check (char_length(btrim(name)) between 2 and 60),
  lang          text not null default 'he' check (lang in ('he', 'en', 'ru')),
  prep_minutes  smallint not null check (prep_minutes between 5 and 240),
  method        text not null check (char_length(btrim(method)) between 15 and 3000),
  tags          text[] not null default '{}'
                check (tags <@ array['kids', 'budget', 'prep', 'quick']),
  kid_note      text check (char_length(kid_note) <= 100),
  keeps_days    smallint check (keeps_days between 0 and 14),
  cook_method   text not null default 'stove' check (cook_method in ('stove', 'oven')),
  is_public     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- a kid note only makes sense on a kid-friendly recipe
  constraint kid_note_needs_kids_tag check (kid_note is null or 'kids' = any (tags))
);

-- One name per owner, ignoring case.
create unique index recipes_owner_name_uniq
  on public.recipes (owner_id, lower(btrim(name))) where owner_id is not null;
create index recipes_public_idx on public.recipes (created_at desc) where is_public;

-- Translations for built-in recipes (and later, AI translations of user recipes).
create table public.recipe_translations (
  recipe_id  uuid not null references public.recipes (id) on delete cascade,
  lang       text not null check (lang in ('he', 'en', 'ru')),
  name       text not null check (char_length(btrim(name)) between 2 and 60),
  kid_note   text check (char_length(kid_note) <= 100),
  primary key (recipe_id, lang)
);

create table public.recipe_ingredients (
  recipe_id       uuid not null references public.recipes (id) on delete cascade,
  position        smallint not null check (position between 0 and 29),  -- max 30
  name            text not null check (char_length(btrim(name)) between 1 and 40),
  qty             numeric(10, 2) not null check (qty > 0 and qty <= 100000),
  unit            text not null check (unit in
                    ('pcs', 'g', 'kg', 'ml', 'cup', 'tbsp', 'tsp', 'can', 'bag', 'head', 'loaf')),
  aisle           text not null check (aisle in
                    ('veg', 'dairy', 'meat', 'bread', 'frozen', 'pantry')),
  price_per_unit  numeric(10, 4) check (price_per_unit >= 0),  -- ₪, built-in recipes only
  primary key (recipe_id, position)
);

create table public.recipe_photos (
  recipe_id     uuid not null references public.recipes (id) on delete cascade,
  position      smallint not null check (position between 0 and 2),  -- max 3 photos
  storage_path  text not null unique,
  created_at    timestamptz not null default now(),
  primary key (recipe_id, position)
);

-- Free plan: up to 20 own recipes. Enforced here too, not only in the API.
create function public.enforce_recipe_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  premium boolean;
  owned   integer;
begin
  if new.owner_id is null then
    return new;
  end if;
  select is_premium into premium from public.profiles where id = new.owner_id;
  if coalesce(premium, false) then
    return new;
  end if;
  select count(*) into owned from public.recipes where owner_id = new.owner_id;
  if owned >= 20 then
    raise exception 'free_plan_recipe_limit' using errcode = 'P0001',
      hint = 'Free plan allows up to 20 recipes';
  end if;
  return new;
end;
$$;

create trigger recipes_free_limit
  before insert on public.recipes
  for each row execute function public.enforce_recipe_limit();

create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger recipes_touch before update on public.recipes
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Weekly plans
-- ---------------------------------------------------------------------------
create table public.weekly_plans (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  week_start  date not null check (extract(dow from week_start) = 0),  -- weeks start on Sunday
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (owner_id, week_start)
);

create table public.plan_days (
  plan_id    uuid not null references public.weekly_plans (id) on delete cascade,
  day        smallint not null check (day between 0 and 6),  -- 0 = Sunday
  recipe_id  uuid references public.recipes (id) on delete set null,
  primary key (plan_id, day)
);

create table public.shopping_checks (
  plan_id   uuid not null references public.weekly_plans (id) on delete cascade,
  item_key  text not null check (char_length(item_key) between 1 and 80),
  checked   boolean not null default true,
  primary key (plan_id, item_key)
);

-- ---------------------------------------------------------------------------
-- Follows
-- ---------------------------------------------------------------------------
create table public.follows (
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  followee_id  uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index follows_followee_idx on public.follows (followee_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.recipes             enable row level security;
alter table public.recipe_translations enable row level security;
alter table public.recipe_ingredients  enable row level security;
alter table public.recipe_photos       enable row level security;
alter table public.weekly_plans        enable row level security;
alter table public.plan_days           enable row level security;
alter table public.shopping_checks     enable row level security;
alter table public.follows             enable row level security;

-- Helper: can the current user see this recipe?
create function public.can_read_recipe(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.recipes r
    where r.id = rid
      and (r.owner_id is null or r.is_public or r.owner_id = auth.uid())
  );
$$;

create function public.owns_recipe(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.recipes r where r.id = rid and r.owner_id = auth.uid());
$$;

create function public.can_read_plan(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.weekly_plans p
    where p.id = pid and (p.is_public or p.owner_id = auth.uid())
  );
$$;

create function public.owns_plan(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.weekly_plans p where p.id = pid and p.owner_id = auth.uid());
$$;

-- Profiles: everyone signed in can see names (for the community); only you edit yours.
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- is_premium is not in this list, so users cannot upgrade themselves.
revoke update on public.profiles from authenticated;
grant update (display_name, lang, modes, servings, weekly_budget) on public.profiles to authenticated;

-- Recipes: built-in and public recipes are readable; private ones only by the owner.
create policy recipes_read on public.recipes for select to authenticated
  using (owner_id is null or is_public or owner_id = auth.uid());
create policy recipes_insert_own on public.recipes for insert to authenticated
  with check (owner_id = auth.uid());
create policy recipes_update_own on public.recipes for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy recipes_delete_own on public.recipes for delete to authenticated
  using (owner_id = auth.uid());

create policy translations_read on public.recipe_translations for select to authenticated
  using (public.can_read_recipe(recipe_id));
create policy translations_write_own on public.recipe_translations for all to authenticated
  using (public.owns_recipe(recipe_id)) with check (public.owns_recipe(recipe_id));

create policy ingredients_read on public.recipe_ingredients for select to authenticated
  using (public.can_read_recipe(recipe_id));
create policy ingredients_write_own on public.recipe_ingredients for all to authenticated
  using (public.owns_recipe(recipe_id)) with check (public.owns_recipe(recipe_id));

create policy photos_read on public.recipe_photos for select to authenticated
  using (public.can_read_recipe(recipe_id));
create policy photos_write_own on public.recipe_photos for all to authenticated
  using (public.owns_recipe(recipe_id)) with check (public.owns_recipe(recipe_id));

create policy plans_read on public.weekly_plans for select to authenticated
  using (is_public or owner_id = auth.uid());
create policy plans_write_own on public.weekly_plans for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy plan_days_read on public.plan_days for select to authenticated
  using (public.can_read_plan(plan_id));
create policy plan_days_write_own on public.plan_days for all to authenticated
  using (public.owns_plan(plan_id))
  with check (public.owns_plan(plan_id) and (recipe_id is null or public.can_read_recipe(recipe_id)));

create policy checks_own on public.shopping_checks for all to authenticated
  using (public.owns_plan(plan_id)) with check (public.owns_plan(plan_id));

create policy follows_read on public.follows for select to authenticated using (true);
create policy follows_insert_own on public.follows for insert to authenticated
  with check (follower_id = auth.uid());
create policy follows_delete_own on public.follows for delete to authenticated
  using (follower_id = auth.uid());

grant select, insert, update, delete on
  public.recipes, public.recipe_translations, public.recipe_ingredients, public.recipe_photos,
  public.weekly_plans, public.plan_days, public.shopping_checks, public.follows
  to authenticated;
grant select on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Atomic writes called by the API (security invoker: RLS still applies).
-- ---------------------------------------------------------------------------

-- Saves a recipe and its ingredients together, or nothing at all.
create function public.create_recipe(payload jsonb) returns uuid
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

  insert into public.recipe_ingredients (recipe_id, position, name, qty, unit, aisle)
  select rid, (i.ord - 1)::smallint, btrim(i.item->>'name'), (i.item->>'qty')::numeric,
         i.item->>'unit', i.item->>'aisle'
  from jsonb_array_elements(payload->'ingredients') with ordinality as i(item, ord);

  return rid;
end;
$$;

-- Replaces the user's plan for one week (7 days, Sunday first).
create function public.save_week_plan(week date, recipe_ids uuid[]) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  pid uuid;
begin
  if coalesce(array_length(recipe_ids, 1), 0) <> 7 then
    raise exception 'plan_needs_7_days' using errcode = 'P0001';
  end if;
  insert into public.weekly_plans (owner_id, week_start) values (auth.uid(), week)
  on conflict (owner_id, week_start) do update set week_start = excluded.week_start
  returning id into pid;
  delete from public.plan_days where plan_id = pid;
  insert into public.plan_days (plan_id, day, recipe_id)
  select pid, (d.ord - 1)::smallint, d.rid
  from unnest(recipe_ids) with ordinality as d(rid, ord);
  delete from public.shopping_checks where plan_id = pid;
  return pid;
end;
$$;

grant execute on function public.create_recipe(jsonb), public.save_week_plan(date, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Photo storage: public bucket, images only, 10 MB max,
-- and each user may write only inside a folder named after their user id.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recipe-photos', 'recipe-photos', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy photos_upload_own_folder on storage.objects for insert to authenticated
  with check (bucket_id = 'recipe-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy photos_delete_own_folder on storage.objects for delete to authenticated
  using (bucket_id = 'recipe-photos' and (storage.foldername(name))[1] = auth.uid()::text);
