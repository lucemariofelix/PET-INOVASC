alter table public.pacientes
  add column if not exists agente_id uuid;

alter table public.pacientes
  add constraint pacientes_agente_id_fkey
  foreign key (agente_id)
  references public.perfis_usuarios(id)
  on delete set null;

create table if not exists public.grupos_acompanhamento (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  criado_em timestamptz not null default now(),
  constraint grupos_acompanhamento_nome_key unique (nome)
);

create table if not exists public.pacientes_grupos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  grupo_id uuid not null references public.grupos_acompanhamento(id) on delete cascade,
  constraint pacientes_grupos_paciente_grupo_key unique (paciente_id, grupo_id)
);

create index if not exists idx_pacientes_agente_id
  on public.pacientes(agente_id);

create index if not exists idx_pacientes_grupos_paciente_id
  on public.pacientes_grupos(paciente_id);

create index if not exists idx_pacientes_grupos_grupo_id
  on public.pacientes_grupos(grupo_id);

alter table public.grupos_acompanhamento enable row level security;
alter table public.pacientes_grupos enable row level security;

create policy "Permitir leitura para autenticados"
  on public.grupos_acompanhamento
  for select
  to authenticated
  using (true);

create policy "Permitir inserção para autenticados"
  on public.grupos_acompanhamento
  for insert
  to authenticated
  with check (true);

create policy "Permitir leitura para autenticados"
  on public.pacientes_grupos
  for select
  to authenticated
  using (true);

create policy "Permitir inserção para autenticados"
  on public.pacientes_grupos
  for insert
  to authenticated
  with check (true);

create policy "Permitir atualização para autenticados"
  on public.pacientes_grupos
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Permitir deleção para autenticados"
  on public.pacientes_grupos
  for delete
  to authenticated
  using (true);

grant all on table public.grupos_acompanhamento to anon;
grant all on table public.grupos_acompanhamento to authenticated;
grant all on table public.grupos_acompanhamento to service_role;

grant all on table public.pacientes_grupos to anon;
grant all on table public.pacientes_grupos to authenticated;
grant all on table public.pacientes_grupos to service_role;
