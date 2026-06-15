-- =========================================================================
-- Arcore — schema Supabase (Postgres)
-- Cole tudo no SQL Editor do seu projeto Supabase e clique RUN.
-- Depois preencha url + anonKey em config.js para ligar o app à nuvem.
--
-- AVISO: as policies abaixo são ABERTAS (anon pode ler e escrever) para
-- facilitar o protótipo. Antes de produção, troque por Supabase Auth +
-- policies por usuário/role. Veja o final do arquivo.
-- =========================================================================

-- ---------- tabelas ----------
create table if not exists members (
  id            text primary key,
  name          text not null,
  belt          text not null default 'branca',
  stripes       int  not null default 0,
  status        text not null default 'ativo',          -- ativo | experimental | inativo
  joined_at     timestamptz not null default now(),
  last_class_at timestamptz,
  phone         text,
  avatar        text,
  total_classes int  not null default 0,
  mat_hours     numeric not null default 0,
  classes_since_stripe int not null default 0,
  xp            int  not null default 0,
  week_xp       int  not null default 0,
  league        text not null default 'roxa',
  silent_mode   boolean not null default false,
  best_streak   int  not null default 0,
  streak_weeks  int  not null default 0,
  winback_contacted_at timestamptz
);

create table if not exists classes (
  id        text primary key,
  title     text not null,
  type      text,
  datetime  timestamptz not null default now(),
  coach     text
);

create table if not exists badges (
  id      text primary key,
  name    text not null,
  icon    text,
  rarity  text,
  stripe  boolean default false,
  "desc"  text
);

create table if not exists checkins (
  id         text primary key default gen_random_uuid()::text,
  member_id  text references members(id) on delete cascade,
  class_id   text references classes(id) on delete set null,
  at         timestamptz not null default now()
);
create index if not exists checkins_member_idx on checkins(member_id);
create index if not exists checkins_at_idx on checkins(at);

create table if not exists posts (
  id         text primary key default gen_random_uuid()::text,
  title      text not null,
  position   text,
  tags       text[] default '{}',
  class_id   text,
  coach      text,
  at         timestamptz not null default now(),
  "desc"     text,
  video_url  text,
  voice_note text,
  likes      int not null default 0,
  liked_by   text[] default '{}',
  saved_by   text[] default '{}'
);
create index if not exists posts_at_idx on posts(at desc);

create table if not exists awards (
  id          text primary key default gen_random_uuid()::text,
  member_id   text references members(id) on delete cascade,
  badge_id    text references badges(id) on delete cascade,
  by          text,
  at          timestamptz not null default now(),
  reactions   int not null default 0,
  reacted_by  text[] default '{}'
);
create index if not exists awards_at_idx on awards(at desc);

create table if not exists goals (
  id         text primary key default gen_random_uuid()::text,
  member_id  text references members(id) on delete cascade,
  title      text not null,
  target     int not null default 1,
  progress   int not null default 0,
  period     text default 'semana',
  icon       text default 'target'
);

-- ---------- seed (mesmos dados de demonstração do modo local) ----------
insert into members (id,name,belt,stripes,status,last_class_at,phone,avatar,total_classes,mat_hours,classes_since_stripe,xp,week_xp,league,silent_mode,best_streak,streak_weeks) values
 ('m_joao','João Vieira','roxa',2,'ativo',        now()              ,'+5513998001234','J',142,213,22,7100,845,'roxa',false,18,12),
 ('m_pedro','Pedro Alencar','roxa',3,'ativo',     now()-interval '1 day','+5513998011235','P',168,250,26,9200,980,'roxa',false,18,11),
 ('m_ana','Ana Beatriz','azul',2,'ativo',         now()-interval '2 day','+5513998021236','A',96,140,15,5400,870,'roxa',false,18,10),
 ('m_lucas','Lucas Moraes','azul',1,'ativo',      now()-interval '3 day','+5513998031237','L',72,104,9,4100,790,'roxa',false,18,9),
 ('m_bruna','Bruna Costa','branca',2,'experimental',now()-interval '1 day','+5513998041238','B',8,12,5,600,760,'roxa',false,18,1),
 ('m_rafa','Rafael Tavares','marrom',1,'ativo',   now()-interval '4 day','+5513998051239','R',210,320,18,9800,720,'roxa',false,18,8),
 ('m_carlos','Carlos Henrique','branca',3,'ativo',now()-interval '14 day','+5513998061240','C',34,50,12,2000,220,'roxa',false,18,1),
 ('m_marina','Marina Lopes','azul',1,'ativo',     now()-interval '12 day','+5513998071241','M',60,88,7,3300,180,'roxa',false,18,1),
 ('m_diego','Diego Santana','branca',0,'experimental',now()-interval '9 day','+5513998081242','D',3,4,2,150,90,'roxa',false,18,1),
 ('m_juliana','Juliana Reis','branca',1,'ativo',  now()-interval '2 day','+5513998091243','J',22,31,9,1200,540,'roxa',true,18,3)
on conflict (id) do nothing;

insert into badges (id,name,icon,rarity,stripe,"desc") values
 ('armlock_dia','Armlock do Dia','crown','raro',true,'Melhor finalização de braço do dia.'),
 ('coracao_leao','Coração de Leão','flame','incomum',false,'Não bateu o treino inteiro.'),
 ('melhor_treino','Melhor Treino do Dia','trophy','comum',false,'Destaque do treino de hoje.'),
 ('mais_evoluiu','Mais Evoluiu','trending-up','incomum',false,'Maior evolução da semana.'),
 ('madrugadeiro','Madrugadeiro','clock','comum',false,'Treinou no horário das 6h.'),
 ('cem_aulas','100 Aulas','trophy','raro',true,'Cravou 100 aulas na Arcore.'),
 ('primeira_comp','1ª Competição','award','raro',true,'Competiu pela primeira vez.'),
 ('escolha_mestre','Escolha do Mestre','crown','lendário',true,'Escolha do mês do Mestre.')
on conflict (id) do nothing;

insert into classes (id,title,type,datetime,coach) values
 ('c_today','Treino Gi · Fundamentos','gi',  date_trunc('day',now())+interval '19 hour','Mestre Ricardo'),
 ('c_y1','No-Gi · Passagem','nogi',           now()-interval '1 day','Mestre Ricardo'),
 ('c_y2','Treino Gi · Guarda','gi',           now()-interval '3 day','Mestre Ricardo')
on conflict (id) do nothing;

insert into posts (id,title,position,tags,class_id,coach,at,"desc",video_url,voice_note,likes) values
 ('p1','Armlock pela guarda fechada','Guarda · Finalização',array['guarda','finalização','gi'],'c_today','Mestre Ricardo',now(),
   'Quebra de postura, controle do braço e rotação de quadril para finalizar. Revisa antes do próximo treino — quem faltou, não perde.',
   'https://www.youtube.com/watch?v=2oVHEcyJhIM',null,23),
 ('p2','Raspagem de gancho (hook sweep)','Meia-guarda · Raspagem',array['meia-guarda','raspagem','gi'],'c_y1','Mestre Ricardo',now()-interval '1 day',
   'Underhook, gancho na coxa e leva o oponente pro outro lado. Detalhe: cabeça do lado de fora.',
   'https://www.youtube.com/watch?v=VRYCMYJOn4g',null,11)
on conflict (id) do nothing;

insert into awards (id,member_id,badge_id,by,at,reactions) values
 ('a1','m_joao','armlock_dia','Mestre Ricardo',now()-interval '2 hour',23),
 ('a2','m_pedro','coracao_leao','Mestre Ricardo',now()-interval '1 day',9),
 ('a3','m_ana','cem_aulas','Mestre Ricardo',now()-interval '1 day',14)
on conflict (id) do nothing;

insert into goals (id,member_id,title,target,progress,period,icon) values
 ('g1','m_joao','Treinar 3x por semana',3,2,'semana','target'),
 ('g2','m_joao','Competir até dezembro',1,0,'ano','trophy')
on conflict (id) do nothing;

insert into checkins (member_id,class_id,at) values
 ('m_pedro','c_today',date_trunc('day',now())+interval '19 hour 2 minute'),
 ('m_rafa','c_today', date_trunc('day',now())+interval '19 hour 3 minute'),
 ('m_ana','c_today',  date_trunc('day',now())+interval '19 hour 1 minute');

-- ---------- storage: recados de voz ----------
insert into storage.buckets (id, name, public)
values ('voicenotes','voicenotes', true)
on conflict (id) do nothing;

-- ---------- RLS (ABERTO p/ protótipo) ----------
alter table members  enable row level security;
alter table classes  enable row level security;
alter table badges   enable row level security;
alter table checkins enable row level security;
alter table posts    enable row level security;
alter table awards   enable row level security;
alter table goals    enable row level security;

do $$
declare t text;
begin
  foreach t in array array['members','classes','badges','checkins','posts','awards','goals'] loop
    execute format('drop policy if exists anon_all on %I;', t);
    execute format('create policy anon_all on %I for all to anon, authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- storage policy: leitura pública + upload anônimo no bucket voicenotes (protótipo)
drop policy if exists voicenotes_read on storage.objects;
create policy voicenotes_read on storage.objects for select to anon, authenticated using (bucket_id = 'voicenotes');
drop policy if exists voicenotes_write on storage.objects;
create policy voicenotes_write on storage.objects for insert to anon, authenticated with check (bucket_id = 'voicenotes');

-- =========================================================================
-- PRODUÇÃO (depois): substitua a policy anon_all por algo como
--   create policy "alunos leem tudo" on posts for select to authenticated using (true);
--   create policy "dono edita" on goals for all to authenticated using (member_id = auth.uid()::text);
-- e use Supabase Auth (e-mail mágico) para identificar professor x aluno.
-- =========================================================================
