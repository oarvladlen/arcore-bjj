-- get_invite_public: detect if auth user already created (invite e-mail sent)
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
