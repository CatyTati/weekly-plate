-- Which of your recipes were copied from someone, kept apart from the recipe so that only
-- the cook it came from (and you) can see it. Other people looking at your recipes can't.
create table public.recipe_copies (
  copy_id       uuid primary key references public.recipes (id) on delete cascade,
  source_owner  uuid not null references public.profiles (id) on delete cascade,
  created_at    timestamptz not null default now()
);

alter table public.recipe_copies enable row level security;

create policy copies_read on public.recipe_copies for select to authenticated
  using (source_owner = auth.uid() or public.owns_recipe(copy_id));
create policy copies_insert_own on public.recipe_copies for insert to authenticated
  with check (public.owns_recipe(copy_id) and source_owner <> auth.uid());
create policy copies_delete_own on public.recipe_copies for delete to authenticated
  using (public.owns_recipe(copy_id));

grant select, insert, delete on public.recipe_copies to authenticated;
