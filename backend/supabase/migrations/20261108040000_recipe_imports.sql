-- Reading a recipe from a screenshot costs money (each one is a call to Claude), so each
-- account may do it a few times a day. A row is written for every screenshot read; the
-- recipe-from-image function counts them before it calls Claude.
create table public.recipe_imports (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index recipe_imports_user_time_idx on public.recipe_imports (user_id, created_at desc);

alter table public.recipe_imports enable row level security;
-- You see and add only your own; nobody can delete one to get more.
create policy imports_read_own on public.recipe_imports for select to authenticated using (user_id = auth.uid());
create policy imports_add_own on public.recipe_imports for insert to authenticated with check (user_id = auth.uid());
grant select, insert on public.recipe_imports to authenticated;
