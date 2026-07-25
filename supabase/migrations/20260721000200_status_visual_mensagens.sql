begin;

alter table public.historico_mensagens
  add column if not exists status_ordem integer,
  add column if not exists status_atualizado_em timestamptz,
  add column if not exists entregue_em timestamptz,
  add column if not exists lido_em timestamptz;

update public.historico_mensagens
set
  status_ordem = case upper(coalesce(status, ''))
    when 'LIDO' then 3
    when 'ENTREGUE' then 2
    when 'ENVIADO' then 1
    else 0
  end,
  status_atualizado_em = coalesce(status_atualizado_em, data_envio)
where status_ordem is null
   or status_atualizado_em is null;

alter table public.historico_mensagens
  alter column status_ordem set default 1,
  alter column status_ordem set not null,
  alter column status_atualizado_em set default timezone('utc'::text, now());

create index if not exists idx_historico_mensagens_mensagem_id
  on public.historico_mensagens(mensagem_id)
  where mensagem_id is not null;

create index if not exists idx_historico_mensagens_consulta_envio
  on public.historico_mensagens(consulta_id, data_envio desc)
  where consulta_id is not null;

commit;
