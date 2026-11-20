-- Meals: a recipe belongs to one (breakfast, lunch, dinner, snacks, desserts and cakes), and a
-- day of a week can hold one dish of each. Everything already saved is dinner, as before.

alter table public.recipes add column meal text not null default 'dinner'
  check (meal in ('breakfast', 'lunch', 'dinner', 'snack', 'dessert'));

alter table public.plan_days add column meal text not null default 'dinner'
  check (meal in ('breakfast', 'lunch', 'dinner', 'snack', 'dessert'));
alter table public.plan_days drop constraint plan_days_pkey;
alter table public.plan_days add primary key (plan_id, day, meal);

-- Saving a week's dinners leaves its other meals alone.
create or replace function public.save_week(week date, days jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  pid uuid;
begin
  if jsonb_array_length(days) <> 7 then
    raise exception 'plan_needs_7_days' using errcode = 'P0001';
  end if;
  insert into public.weekly_plans (owner_id, week_start) values (auth.uid(), week)
  on conflict (owner_id, week_start) do update set week_start = excluded.week_start
  returning id into pid;
  delete from public.plan_days where plan_id = pid and meal = 'dinner';
  insert into public.plan_days (plan_id, day, meal, recipe_id, builtin_id)
  select pid, (d.ord - 1)::smallint, 'dinner',
         case when d.v ~ '^[0-9a-f-]{36}$' then d.v::uuid end,
         case when d.v !~ '^[0-9a-f-]{36}$' then d.v end
  from jsonb_array_elements_text(days) with ordinality as d(v, ord)
  where d.v is not null;
  return pid;
end;
$$;

-- Replaces a week's other meals. The meals argument holds, for each of breakfast, lunch, snack and
-- dessert, 7 entries, Sunday first: a recipe uuid, a built-in recipe id, or null.
create function public.save_meals(week date, meals jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  pid uuid;
begin
  insert into public.weekly_plans (owner_id, week_start) values (auth.uid(), week)
  on conflict (owner_id, week_start) do update set week_start = excluded.week_start
  returning id into pid;
  delete from public.plan_days where plan_id = pid and meal <> 'dinner';
  insert into public.plan_days (plan_id, day, meal, recipe_id, builtin_id)
  select pid, (d.ord - 1)::smallint, m.key,
         case when d.v ~ '^[0-9a-f-]{36}$' then d.v::uuid end,
         case when d.v !~ '^[0-9a-f-]{36}$' then d.v end
  from jsonb_each(meals) as m(key, list)
  cross join lateral jsonb_array_elements_text(m.list) with ordinality as d(v, ord)
  where m.key in ('breakfast', 'lunch', 'snack', 'dessert') and d.ord <= 7 and d.v is not null;
  return pid;
end;
$$;

grant execute on function public.save_meals(date, jsonb) to authenticated;

-- New recipes keep their meal.
create or replace function public.create_recipe(payload jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  rid uuid;
begin
  insert into public.recipes (owner_id, name, lang, prep_minutes, method, tags, kid_note,
                              keeps_days, cook_method, is_public, meal)
  values (auth.uid(),
          btrim(payload->>'name'),
          coalesce(payload->>'lang', 'he'),
          (payload->>'prep_minutes')::smallint,
          btrim(payload->>'method'),
          coalesce(array(select jsonb_array_elements_text(payload->'tags')), '{}'),
          nullif(btrim(payload->>'kid_note'), ''),
          (payload->>'keeps_days')::smallint,
          coalesce(payload->>'cook_method', 'stove'),
          coalesce((payload->>'is_public')::boolean, false),
          coalesce(payload->>'meal', 'dinner'))
  returning id into rid;

  insert into public.recipe_ingredients (recipe_id, position, name, qty, unit, aisle, food_id)
  select rid, (i.ord - 1)::smallint, btrim(i.item->>'name'), (i.item->>'qty')::numeric,
         i.item->>'unit', i.item->>'aisle', nullif(i.item->>'food_id', '')::uuid
  from jsonb_array_elements(payload->'ingredients') with ordinality as i(item, ord);

  return rid;
end;
$$;
