-- =========================================================================
-- Arcore — ranking público (privacy-safe)
-- Alunos não podem ler a tabela members inteira (RLS), então o ranking
-- usa uma função SECURITY DEFINER que devolve só o necessário: primeiro
-- nome, faixa, graus, XP da semana e avatar. Nada de telefone/e-mail.
-- =========================================================================
create or replace function public.leaderboard()
returns table (id text, name text, belt text, stripes int, week_xp int, avatar text)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, split_part(m.name, ' ', 1), m.belt, m.stripes, m.week_xp, m.avatar
  from members m
  where m.silent_mode = false and m.status <> 'inativo'
  order by m.week_xp desc, m.name asc;
$$;

grant execute on function public.leaderboard() to authenticated;
