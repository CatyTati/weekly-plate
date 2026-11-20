-- Private accounts and follow requests, shared recipes and weekly plans.
--
-- A private account approves each new follower. Everyone signed in can see
-- public recipes; only approved followers can see someone's weekly plans.

-- ---------------------------------------------------------------------------
-- Private accounts
-- ---------------------------------------------------------------------------
alter table public.profiles add column is_private boolean not null default false;
grant update (is_private) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Follow requests: pending until a private account approves them
-- ---------------------------------------------------------------------------
alter table public.follows add column status text not null default 'approved'
  check (status in ('pending', 'approved'));

-- The database decides the status, so nobody can approve themselves.
create function public.set_follow_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.status := case
    when (select is_private from public.profiles where id = new.followee_id) then 'pending'
    else 'approved'
  end;
  return new;
end;
$$;

create trigger follows_set_status
  before insert on public.follows
  for each row execute function public.set_follow_status();

-- The person being followed approves a request...
create policy follows_approve on public.follows for update to authenticated
  using (followee_id = auth.uid()) with check (followee_id = auth.uid() and status = 'approved');
revoke update on public.follows from authenticated;
grant update (status) on public.follows to authenticated;

-- ...or declines it, or removes a follower. Followers can still unfollow.
drop policy follows_delete_own on public.follows;
create policy follows_delete_own on public.follows for delete to authenticated
  using (follower_id = auth.uid() or followee_id = auth.uid());

-- Making an account public approves the requests that were waiting.
create function public.approve_waiting_follows() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.is_private and not new.is_private then
    update public.follows set status = 'approved' where followee_id = new.id and status = 'pending';
  end if;
  return new;
end;
$$;

create trigger profiles_approve_waiting
  after update of is_private on public.profiles
  for each row execute function public.approve_waiting_follows();

create function public.is_approved_follower(owner uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.follows f
    where f.follower_id = auth.uid() and f.followee_id = owner and f.status = 'approved'
  );
$$;

-- ---------------------------------------------------------------------------
-- Recipes: a short description
-- ---------------------------------------------------------------------------
alter table public.recipes add column description text check (char_length(description) <= 160);

-- ---------------------------------------------------------------------------
-- Weekly plans: built-in recipes live in the app, so a day can name one by its app id.
-- Approved followers can see your plans.
-- ---------------------------------------------------------------------------
alter table public.plan_days add column builtin_id text check (char_length(builtin_id) between 1 and 40);
alter table public.plan_days add constraint plan_day_one_recipe check (recipe_id is null or builtin_id is null);

create or replace function public.can_read_plan(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.weekly_plans p
    where p.id = pid and (p.is_public or p.owner_id = auth.uid() or public.is_approved_follower(p.owner_id))
  );
$$;

drop policy plans_read on public.weekly_plans;
create policy plans_read on public.weekly_plans for select to authenticated
  using (is_public or owner_id = auth.uid() or public.is_approved_follower(owner_id));

-- Replaces the user's plan for one week. `days` holds 7 entries, Sunday first:
-- a recipe uuid, a built-in recipe id, or null for no dinner.
create function public.save_week(week date, days jsonb) returns uuid
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
  delete from public.plan_days where plan_id = pid;
  insert into public.plan_days (plan_id, day, recipe_id, builtin_id)
  select pid, (d.ord - 1)::smallint,
         case when d.v ~ '^[0-9a-f-]{36}$' then d.v::uuid end,
         case when d.v !~ '^[0-9a-f-]{36}$' then d.v end
  from jsonb_array_elements_text(days) with ordinality as d(v, ord)
  where d.v is not null;
  return pid;
end;
$$;

grant execute on function public.save_week(date, jsonb) to authenticated;
