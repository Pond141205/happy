-- Run in a NEW, dedicated Supabase Free project using its SQL Editor.
-- No personal information, birthdays or media belongs in this repository.
begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create table if not exists private.museum_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table private.museum_members enable row level security;
revoke all on private.museum_members from anon, authenticated;

create or replace function private.is_museum_member()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from private.museum_members
    where user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_museum_member() from public;
grant execute on function private.is_museum_member() to anon, authenticated;

create table if not exists public.exhibitions (
  id text primary key,
  content jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.exhibitions enable row level security;
alter table public.exhibitions force row level security;
revoke all on public.exhibitions from anon, authenticated;
grant select on public.exhibitions to authenticated;

drop policy if exists "Members can read the exhibition" on public.exhibitions;
create policy "Members can read the exhibition" on public.exhibitions
  for select to authenticated using ((select private.is_museum_member()));
drop policy if exists "Always require membership" on public.exhibitions;
create policy "Always require membership" on public.exhibitions as restrictive
  for select to public using ((select private.is_museum_member()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memories', 'memories', false, 52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'])
on conflict (id) do update set public = false,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Members can read memories" on storage.objects;
create policy "Members can read memories" on storage.objects
  for select to authenticated using (
    bucket_id = 'memories' and (select private.is_museum_member())
  );
-- Defense against a future permissive SELECT policy accidentally opening this bucket.
drop policy if exists "Memories always require membership" on storage.objects;
create policy "Memories always require membership" on storage.objects as restrictive
  for select to public using (
    bucket_id <> 'memories' or (select private.is_museum_member())
  );
-- Clients are viewers only. Uploads/edits are performed by the owner in the Dashboard.
drop policy if exists "No client inserts into memories" on storage.objects;
create policy "No client inserts into memories" on storage.objects as restrictive
  for insert to public with check (bucket_id <> 'memories');
drop policy if exists "No client updates to memories" on storage.objects;
create policy "No client updates to memories" on storage.objects as restrictive
  for update to public using (bucket_id <> 'memories') with check (bucket_id <> 'memories');
drop policy if exists "No client deletes from memories" on storage.objects;
create policy "No client deletes from memories" on storage.objects as restrictive
  for delete to public using (bucket_id <> 'memories');

commit;

-- After both people have signed in once, copy their exact UUIDs from Authentication > Users.
-- Add them privately in SQL Editor, never in a committed migration:
-- insert into private.museum_members (user_id) values ('YOUR-USER-UUID'), ('PARTNER-USER-UUID');
-- Revoke later with: delete from private.museum_members where user_id = 'USER-UUID';
-- Keep "private" OUT of the project's exposed API schemas.
