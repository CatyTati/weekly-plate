-- The recipe a copy was made from, so every device knows which recipes you already copied.
-- Left empty if the original is deleted; the copy keeps its "copied from" cook.
alter table public.recipe_copies
  add column source_recipe uuid references public.recipes (id) on delete set null;
