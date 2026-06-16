-- =========================================================================
-- Arcore — políticas RLS que faltavam para escrita
--   • goals UPDATE/DELETE: aluno mexe nas PRÓPRIAS metas (stepper, avanço
--     automático no check-in, remover meta). Professor também.
--   • posts DELETE: só professor apaga técnicas do feed.
-- Sem isso, as gravações falham silenciosamente sob RLS (0 linhas afetadas).
-- =========================================================================

drop policy if exists goals_update on goals;
create policy goals_update on goals
  for update to authenticated
  using (member_id = public.my_member_id() or public.is_coach())
  with check (member_id = public.my_member_id() or public.is_coach());

drop policy if exists goals_delete on goals;
create policy goals_delete on goals
  for delete to authenticated
  using (member_id = public.my_member_id() or public.is_coach());

drop policy if exists posts_delete on posts;
create policy posts_delete on posts
  for delete to authenticated
  using (public.is_coach());
