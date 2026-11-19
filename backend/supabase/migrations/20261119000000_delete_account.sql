-- Anyone can delete their own account from the app, as the App Store requires.
-- The app first removes the user's photo files, then calls delete_my_account(). Deleting the
-- auth user removes their profile, and with it every recipe, plan, follow, like, comment and
-- usage row, since they all point at the profile with "on delete cascade".

-- The app lists its own photo folder to remove it; the Storage API also needs to read a
-- file before it deletes it.
create policy photos_read_own_folder on storage.objects for select to authenticated
  using (bucket_id = 'recipe-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
