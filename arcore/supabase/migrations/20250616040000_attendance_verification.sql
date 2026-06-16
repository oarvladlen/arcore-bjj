-- =========================================================================
-- Arcore — verificação de presença (chamada do professor)
--   • checkins.verified: null = pendente, true = presente (👍), false = ausente (👎)
--   • checkins_update: só professor altera (a chamada)
--   • ensure_class(): materializa a aula do slot da grade no 1º check-in
--     (aluno não pode inserir em classes; RPC security-definer faz isso)
-- =========================================================================

alter table checkins add column if not exists verified boolean;

drop policy if exists checkins_update on checkins;
create policy checkins_update on checkins
  for update to authenticated
  using (public.is_coach())
  with check (public.is_coach());

create or replace function public.ensure_class(p_id text, p_title text, p_type text, p_datetime timestamptz)
returns void
language sql
security definer
set search_path = public
as $$
  insert into classes (id, title, type, datetime, coach)
  values (p_id, p_title, p_type, p_datetime, null)
  on conflict (id) do nothing;
$$;

grant execute on function public.ensure_class(text, text, text, timestamptz) to authenticated;
