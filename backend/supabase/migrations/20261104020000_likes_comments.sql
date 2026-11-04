-- Likes and comments on recipes. Anyone who can see a recipe can see who liked it and the
-- comments on it. You like, unlike and comment as yourself; you may delete your own
-- comments, and the recipe's cook may delete any comment on it.
create table public.recipe_likes (
  recipe_id   uuid not null references public.recipes (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (recipe_id, user_id)
);

create table public.recipe_comments (
  id          uuid primary key default gen_random_uuid(),
  recipe_id   uuid not null references public.recipes (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  body        text not null check (char_length(btrim(body)) between 1 and 500),
  created_at  timestamptz not null default now()
);
create index recipe_comments_recipe_idx on public.recipe_comments (recipe_id, created_at);

alter table public.recipe_likes enable row level security;
alter table public.recipe_comments enable row level security;

create policy likes_read on public.recipe_likes for select to authenticated
  using (public.can_read_recipe(recipe_id));
create policy likes_insert_own on public.recipe_likes for insert to authenticated
  with check (user_id = auth.uid() and public.can_read_recipe(recipe_id));
create policy likes_delete_own on public.recipe_likes for delete to authenticated
  using (user_id = auth.uid());

create policy comments_read on public.recipe_comments for select to authenticated
  using (public.can_read_recipe(recipe_id));
create policy comments_insert_own on public.recipe_comments for insert to authenticated
  with check (user_id = auth.uid() and public.can_read_recipe(recipe_id));
create policy comments_delete on public.recipe_comments for delete to authenticated
  using (user_id = auth.uid() or public.owns_recipe(recipe_id));

grant select, insert, delete on public.recipe_likes, public.recipe_comments to authenticated;
