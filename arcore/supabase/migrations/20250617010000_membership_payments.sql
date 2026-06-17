-- =========================================================================
-- Arcore — matrícula + histórico de pagamentos
--   members.enrolled_at: data da 1ª matrícula
--   members.plan: mensal | trimestral | semestral | anual | experimental
--   payments: histórico (professor lança; aluno vê os próprios)
-- =========================================================================
alter table members add column if not exists enrolled_at date;
alter table members add column if not exists plan text;

create table if not exists payments (
  id          uuid primary key default gen_random_uuid(),
  member_id   text not null references members(id) on delete cascade,
  paid_at     date not null default current_date,
  amount      numeric not null default 0,
  method      text,                          -- pix | cartao | dinheiro | boleto
  period      text,                          -- ex.: "Jun/2026" ou o plano
  status      text not null default 'pago',  -- pago | pendente
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists payments_member_idx on payments(member_id);

alter table payments enable row level security;

drop policy if exists payments_select on payments;
create policy payments_select on payments
  for select to authenticated
  using (public.is_coach() or member_id = public.my_member_id());

drop policy if exists payments_write on payments;
create policy payments_write on payments
  for all to authenticated
  using (public.is_coach())
  with check (public.is_coach());
