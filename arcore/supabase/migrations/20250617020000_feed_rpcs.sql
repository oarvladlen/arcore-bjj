-- =========================================================================
-- Arcore — mural/newsfeed privacy-safe
-- Alunos não leem a tabela members inteira (RLS), então o mural de selos vinha
-- com nome em branco. Estas funções SECURITY DEFINER devolvem só o necessário.
--   awards_feed(): selos dados (primeiro nome + selo + reações)
--   academy_pulse(): contador de treinos CONFIRMADOS pelo professor (verified)
-- =========================================================================
create or replace function public.awards_feed()
returns table (id text, member_id text, name text, avatar text, belt text,
               by text, at timestamptz, badge_name text, badge_icon text,
               reactions int, reacted_by text[])
language sql stable security definer set search_path = public as $$
  select a.id::text, a.member_id, split_part(m.name, ' ', 1), m.avatar, m.belt,
         a.by, a.at, b.name, b.icon, a.reactions, a.reacted_by
  from awards a
  join members m on m.id = a.member_id
  join badges b on b.id = a.badge_id
  order by a.at desc
  limit 30;
$$;
grant execute on function public.awards_feed() to authenticated;

create or replace function public.academy_pulse()
returns table (confirmed_today int, confirmed_week int)
language sql stable security definer set search_path = public as $$
  select
    count(*) filter (where c.verified = true and c.at::date = current_date)::int,
    count(*) filter (where c.verified = true and c.at >= date_trunc('week', now()))::int
  from checkins c;
$$;
grant execute on function public.academy_pulse() to authenticated;
