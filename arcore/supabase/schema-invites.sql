-- =========================================================================
-- Arcore — convites de aluno + telefone/marketing
-- Rode DEPOIS de schema-auth.sql
-- =========================================================================

alter table members add column if not exists email text;
alter table members add column if not exists marketing_email boolean not null default true;
alter table members add column if not exists marketing_whatsapp boolean not null default true;

alter table profiles add column if not exists phone text;
alter table profiles add column if not exists marketing_email boolean not null default true;
alter table profiles add column if not exists marketing_whatsapp boolean not null default true;

create table if not exists invitations (
  id          text primary key default gen_random_uuid()::text,
  member_id   text not null references members(id) on delete cascade,
  email       text not null,
  phone       text,
  token       text not null unique default replace(gen_random_uuid()::text, '-', ''),
  status      text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  invited_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '30 days')
);

create index if not exists invitations_email_idx on invitations(email);
create index if not exists invitations_token_idx on invitations(token);
create index if not exists invitations_status_idx on invitations(status);
create index if not exists members_email_idx on members(email);

alter table invitations enable row level security;

-- coach pode criar/listar convites
drop policy if exists invitations_coach on invitations;
create policy invitations_coach on invitations
  for all to authenticated
  using (public.is_coach())
  with check (public.is_coach());

-- coach pode inserir alunos
drop policy if exists members_insert on members;
create policy members_insert on members
  for insert to authenticated
  with check (public.is_coach());

-- RPC: aluno anônimo lê convite pelo token (só dados mínimos)
create or replace function public.get_invite_public(p_token text)
returns json
language sql
stable
security definer
set search_path = public, auth
as $$
  select json_build_object(
    'valid', (i.status = 'pending' and i.expires_at > now()),
    'email', i.email,
    'phone', i.phone,
    'name', m.name,
    'member_id', i.member_id,
    'status', i.status,
    'user_exists', exists(
      select 1 from auth.users u where lower(u.email) = lower(i.email)
    )
  )
  from invitations i
  join members m on m.id = i.member_id
  where i.token = p_token
  limit 1;
$$;

grant execute on function public.get_invite_public(text) to anon, authenticated;

-- RPC: após signup, vincula perfil ao member_id do convite
create or replace function public.accept_invitation(p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id text;
  v_inv invitations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_inv from invitations
  where token = p_token and status = 'pending' and expires_at > now()
  limit 1;

  if not found then
    return json_build_object('ok', false, 'error', 'invalid_invite');
  end if;

  if lower(v_inv.email) <> lower(coalesce(auth.jwt() ->> 'email', '')) then
    return json_build_object('ok', false, 'error', 'email_mismatch');
  end if;

  update invitations set status = 'accepted' where id = v_inv.id;
  update profiles set
    member_id = v_inv.member_id,
    role = 'member',
    phone = coalesce(phone, v_inv.phone),
    email = v_inv.email
  where id = auth.uid();

  update members set
    status = 'experimental',
    email = v_inv.email,
    phone = coalesce(members.phone, v_inv.phone)
  where id = v_inv.member_id;

  return json_build_object('ok', true, 'member_id', v_inv.member_id);
end;
$$;

grant execute on function public.accept_invitation(text) to authenticated;

-- trigger: copia phone/marketing do metadata no signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, role, member_id, display_name, phone, marketing_email, marketing_whatsapp)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'member'),
    nullif(new.raw_user_meta_data->>'member_id', ''),
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    nullif(new.raw_user_meta_data->>'phone', ''),
    coalesce((new.raw_user_meta_data->>'marketing_email')::boolean, true),
    coalesce((new.raw_user_meta_data->>'marketing_whatsapp')::boolean, true)
  )
  on conflict (id) do update set
    email = excluded.email,
    member_id = coalesce(profiles.member_id, excluded.member_id),
    phone = coalesce(profiles.phone, excluded.phone),
    updated_at = now();
  return new;
end;
$$;
