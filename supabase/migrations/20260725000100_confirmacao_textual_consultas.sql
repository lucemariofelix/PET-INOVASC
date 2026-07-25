begin;

alter table public.historico_mensagens
  add column if not exists confirmacao_expira_em timestamptz,
  add column if not exists respondido_em timestamptz,
  add column if not exists resposta_confirmacao text;

update public.historico_mensagens
set confirmacao_expira_em = data_envio + interval '72 hours'
where confirmacao_status = 'PENDENTE'
  and confirmacao_expira_em is null;

create index if not exists idx_historico_mensagens_confirmacao_pendente
  on public.historico_mensagens(
    telefone_destino,
    confirmacao_expira_em,
    data_envio desc
  )
  where confirmacao_status = 'PENDENTE';

commit;
