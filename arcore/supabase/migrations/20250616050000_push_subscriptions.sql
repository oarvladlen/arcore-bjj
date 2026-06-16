-- =========================================================================
-- Arcore — Web Push subscriptions
--   Cada aparelho guarda sua subscription; o edge fn push-send (service role)
--   lê todas e envia. Aluno só mexe nas próprias.
-- =========================================================================

create table if not exists push_subscriptions (
  endpoint    text primary key,
  member_id   text references members(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists push_subs_member_idx on push_subscriptions(member_id);

alter table push_subscriptions enable row level security;

drop policy if exists push_subs_own on push_subscriptions;
create policy push_subs_own on push_subscriptions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
