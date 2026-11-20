-- A recipe can suit several meals (a salad for lunch and for dinner), so its one meal
-- becomes a list. Every recipe keeps the meal it had.
alter table public.recipes add column meals text[] not null default '{dinner}'
  check (cardinality(meals) between 1 and 5
         and meals <@ array['breakfast', 'lunch', 'dinner', 'snack', 'dessert']);
update public.recipes set meals = array[meal];
alter table public.recipes drop column meal;

-- New recipes keep their meals.
create or replace function public.create_recipe(payload jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  rid uuid;
begin
  insert into public.recipes (owner_id, name, lang, prep_minutes, method, tags, kid_note,
                              keeps_days, cook_method, is_public, meals)
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
          case when jsonb_typeof(payload->'meals') = 'array' and jsonb_array_length(payload->'meals') > 0
               then array(select jsonb_array_elements_text(payload->'meals'))
               else '{dinner}' end)
  returning id into rid;

  insert into public.recipe_ingredients (recipe_id, position, name, qty, unit, aisle, food_id)
  select rid, (i.ord - 1)::smallint, btrim(i.item->>'name'), (i.item->>'qty')::numeric,
         i.item->>'unit', i.item->>'aisle', nullif(i.item->>'food_id', '')::uuid
  from jsonb_array_elements(payload->'ingredients') with ordinality as i(item, ord);

  return rid;
end;
$$;
