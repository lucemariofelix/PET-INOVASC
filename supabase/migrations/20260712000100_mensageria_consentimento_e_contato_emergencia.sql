alter table public.historico_mensagens
  add column if not exists tipo_mensagem text,
  add column if not exists confirmacao_status text,
  add column if not exists confirmado_em timestamptz,
  add column if not exists botao_id text;

alter table public.pacientes
  add column if not exists contato_emergencia_nome text,
  add column if not exists contato_emergencia_telefone varchar(20),
  add column if not exists contato_emergencia_parentesco text;

alter table public.pacientes
  alter column consentimento_msg set default false;

create index if not exists idx_historico_mensagens_botao_id
  on public.historico_mensagens(botao_id);

create index if not exists idx_historico_mensagens_tipo_mensagem
  on public.historico_mensagens(tipo_mensagem);
