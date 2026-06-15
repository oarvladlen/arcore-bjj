-- =========================================================================
-- Arcore — Auth + RLS de produção
-- Rode DEPOIS do schema.sql base, no SQL Editor do Supabase.
--
-- O que faz:
--   • Tabela profiles (liga auth.users → member_id + role)
--   • Trigger para criar profile no cadastro
--   • Policies fechadas (substituem anon_all do protótipo)
-- =========================================================================

-- ---------- profiles ----------
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  member_id    text references members(id) on delete set null,
  role         text not null default 'member' check (role in ('member', 'coach')),
  email        text,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists profiles_member_idx on profiles(member_id);
create index if not exists profiles_role_idx on profiles(role);

alter table profiles enable row level security;

-- ---------- helpers RLS ----------
create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'coach'
  );
$$;

create or replace function public.my_member_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select member_id from profiles where id = auth.uid() limit 1;
$$;

-- ---------- trigger: profile no signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, role, member_id, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'member'),
    nullif(new.raw_user_meta_data->>'member_id', ''),
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- policies: profiles ----------
drop policy if exists profiles_read_own on profiles;
create policy profiles_read_own on profiles
  for select to authenticated
  using (id = auth.uid() or public.is_coach());

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------- remover policies abertas do protótipo ----------
do $$
declare t text;
begin
  foreach t in array array['members','classes','badges','checkins','posts','awards','goals'] loop
    execute format('drop policy if exists anon_all on %I;', t);
  end loop;
end $$;

-- ---------- members ----------
drop policy if exists members_select on members;
create policy members_select on members
  for select to authenticated
  using (public.is_coach() or id = public.my_member_id());

drop policy if exists members_update on members;
create policy members_update on members
  for update to authenticated
  using (public.is_coach() or id = public.my_member_id())
  with check (public.is_coach() or id = public.my_member_id());

-- ---------- classes (leitura geral; escrita só coach) ----------
drop policy if exists classes_select on classes;
create policy classes_select on classes
  for select to authenticated using (true);

drop policy if exists classes_write on classes;
create policy classes_write on classes
  for all to authenticated
  using (public.is_coach())
  with check (public.is_coach());

-- ---------- badges ----------
drop policy if exists badges_select on badges;
create policy badges_select on badges
  for select to authenticated using (true);

-- ---------- checkins ----------
drop policy if exists checkins_select on checkins;
create policy checkins_select on checkins
  for select to authenticated
  using (public.is_coach() or member_id = public.my_member_id());

drop policy if exists checkins_insert on checkins;
create policy checkins_insert on checkins
  for insert to authenticated
  with check (public.is_coach() or member_id = public.my_member_id());

-- ---------- posts ----------
drop policy if exists posts_select on posts;
create policy posts_select on posts
  for select to authenticated using (true);

drop policy if exists posts_insert on posts;
create policy posts_insert on posts
  for insert to authenticated
  with check (public.is_coach());

drop policy if exists posts_update on posts;
create policy posts_update on posts
  for update to authenticated
  using (true)
  with check (true);

-- ---------- awards ----------
drop policy if exists awards_select on awards;
create policy awards_select on awards
  for select to authenticated using (true);

drop policy if exists awards_insert on awards;
create policy awards_insert on awards
  for insert to authenticated
  with check (public.is_coach());

drop policy if exists awards_update on awards;
create policy awards_update on awards
  for update to authenticated
  using (true)
  with check (true);

-- ---------- goals ----------
drop policy if exists goals_select on goals;
create policy goals_select on goals
  for select to authenticated
  using (public.is_coach() or member_id = public.my_member_id());

drop policy if exists goals_insert on goals;
create policy goals_insert on goals
  for insert to authenticated
  with check (member_id = public.my_member_id());

-- ---------- storage: voicenotes (só autenticados) ----------
drop policy if exists voicenotes_read on storage.objects;
create policy voicenotes_read on storage.objects
  for select to authenticated
  using (bucket_id = 'voicenotes');

drop policy if exists voicenotes_write on storage.objects;
create policy voicenotes_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'voicenotes' and public.is_coach());

-- =========================================================================
-- CONVIDAR USUÁRIOS (via Dashboard ou Admin API)
--
-- Aluno (liga ao registro em members):
--   User Metadata: { "role": "member", "member_id": "m_joao" }
--
-- Professor:
--   User Metadata: { "role": "coach" }
--
-- Ou atualize manualmente depois do signup:
--   update profiles set role = 'coach' where email = 'professor@...';
--   update profiles set member_id = 'm_joao' where email = 'joao@...';
-- =========================================================================
