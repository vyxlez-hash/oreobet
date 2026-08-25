-- OREOBET profile/auth repair
-- Run in Supabase SQL Editor.

alter table public.profiles
  add column if not exists username_chosen boolean not null default false,
  add column if not exists is_admin boolean not null default false,
  add column if not exists avatar_url text;

alter table public.profiles enable row level security;

drop policy if exists "select_all_profiles" on public.profiles;
create policy "select_all_profiles" on public.profiles
for select to authenticated using (true);

drop policy if exists "insert_own_profile" on public.profiles;
create policy "insert_own_profile" on public.profiles
for insert to authenticated
with check (auth.uid() = id);

drop policy if exists "update_own_profile" on public.profiles;
create policy "update_own_profile" on public.profiles
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Create a stable avatar seed using DiceBear. No image upload is required.
update public.profiles
set avatar_url = 'https://api.dicebear.com/9.x/adventurer/svg?seed=' ||
                 replace(id::text, '-', '')
where coalesce(avatar_url, '') = '';

-- Repair accounts that existed before the signup trigger.
insert into public.profiles (id, username, balance, level, verified, username_chosen, is_admin, avatar_url)
select
  u.id,
  left(
    coalesce(
      nullif(u.raw_user_meta_data->>'username', ''),
      nullif(split_part(coalesce(u.email, 'user'), '@', 1), ''),
      'user'
    ), 20
  ),
  0, 1, false, false, false,
  'https://api.dicebear.com/9.x/adventurer/svg?seed=' || replace(u.id::text, '-', '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- Use a trigger for future signups.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
begin
  base_username := left(
    coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      nullif(split_part(coalesce(new.email, 'user'), '@', 1), ''),
      'user'
    ), 20
  );

  final_username := base_username;

  if exists (select 1 from public.profiles where username = final_username) then
    final_username := left(base_username, 14) || '_' ||
      substr(replace(new.id::text, '-', ''), 1, 5);
  end if;

  insert into public.profiles
    (id, username, balance, level, verified, username_chosen, is_admin, avatar_url)
  values
    (new.id, final_username, 0, 1, false, false, false,
     'https://api.dicebear.com/9.x/adventurer/svg?seed=' || replace(new.id::text, '-', ''))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Never let clients change admin status.
drop policy if exists "update_own_profile" on public.profiles;
create policy "update_own_profile" on public.profiles
for update to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid())
);

-- Admin promotion is intentionally separate; use make-admin.sql.
