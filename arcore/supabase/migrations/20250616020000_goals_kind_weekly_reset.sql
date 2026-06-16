-- =========================================================================
-- Arcore — metas auto-rastreadas + reset semanal
--   • goals.kind: 'treinos' (avança no check-in) | 'custom' (manual)
--   • weekly_reset(): zera week_xp e progresso de metas semanais
--   • pg_cron: roda toda segunda 03:00 UTC (~00:00 domingo→segunda BRT)
-- =========================================================================

alter table goals add column if not exists kind text not null default 'custom';

-- metas de treino existentes (a seed "Treinar 3x por semana") contam sozinhas
update goals set kind = 'treinos'
  where kind = 'custom' and (lower(title) like '%trein%' or lower(title) like '%aula%');

create or replace function public.weekly_reset()
returns void language sql security definer set search_path = public as $$
  update members set week_xp = 0;
  update goals set progress = 0 where period = 'semana';
$$;

create extension if not exists pg_cron;

select cron.unschedule('arcore-weekly-reset')
  where exists (select 1 from cron.job where jobname = 'arcore-weekly-reset');

select cron.schedule('arcore-weekly-reset', '0 3 * * 1', $$select public.weekly_reset()$$);
