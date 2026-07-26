begin;

update public.historico_mensagens
set
  confirmacao_status = null,
  confirmacao_expira_em = null
where confirmacao_status = 'PENDENTE'
  and status = 'ERRO';

update public.historico_mensagens
set confirmacao_expira_em = data_envio + interval '72 hours'
where confirmacao_status = 'PENDENTE'
  and confirmacao_expira_em is null;

update public.historico_mensagens
set confirmacao_status = 'EXPIRADO'
where confirmacao_status = 'PENDENTE'
  and confirmacao_expira_em <= now();

update public.historico_mensagens as pendente
set confirmacao_status = 'SUBSTITUIDO'
where pendente.confirmacao_status = 'PENDENTE'
  and pendente.consulta_id is not null
  and exists (
    select 1
    from public.historico_mensagens as terminal
    where terminal.consulta_id = pendente.consulta_id
      and terminal.confirmacao_status in (
        'CONFIRMADO',
        'CANCELAMENTO_SOLICITADO'
      )
  );

with pendencias_ordenadas as (
  select
    id,
    row_number() over (
      partition by consulta_id
      order by data_envio desc, id desc
    ) as ordem
  from public.historico_mensagens
  where confirmacao_status = 'PENDENTE'
    and consulta_id is not null
)
update public.historico_mensagens as historico
set confirmacao_status = 'SUBSTITUIDO'
from pendencias_ordenadas
where historico.id = pendencias_ordenadas.id
  and pendencias_ordenadas.ordem > 1;

create unique index if not exists uq_historico_confirmacao_pendente_consulta
  on public.historico_mensagens(consulta_id)
  where confirmacao_status = 'PENDENTE'
    and consulta_id is not null;

create index if not exists idx_historico_confirmacao_consulta_estado
  on public.historico_mensagens(
    consulta_id,
    confirmacao_status,
    data_envio desc
  )
  where confirmacao_status is not null
    and consulta_id is not null;

create or replace function public.reservar_disparo_confirmacao(
  p_consulta_id uuid,
  p_paciente_id uuid,
  p_telefone_destino text,
  p_texto_enviado text,
  p_tipo_mensagem text,
  p_botao_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_paciente_consulta uuid;
  v_bloqueio record;
  v_historico_id uuid;
  v_expira_em timestamptz;
begin
  if auth.uid() is null then
    raise insufficient_privilege using message = 'Autenticação obrigatória.';
  end if;

  if not public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO', 'ACS']) then
    raise insufficient_privilege using message = 'Usuário sem permissão para disparar mensagens.';
  end if;

  select paciente_id
  into v_paciente_consulta
  from public.consultas
  where id = p_consulta_id
  for update;

  if not found then
    return jsonb_build_object(
      'permitido', false,
      'codigo', 'CONSULTATION_NOT_FOUND'
    );
  end if;

  if v_paciente_consulta is distinct from p_paciente_id then
    return jsonb_build_object(
      'permitido', false,
      'codigo', 'CONSULTATION_PATIENT_MISMATCH'
    );
  end if;

  update public.historico_mensagens
  set confirmacao_status = 'EXPIRADO'
  where consulta_id = p_consulta_id
    and confirmacao_status = 'PENDENTE'
    and confirmacao_expira_em <= now();

  select
    id,
    confirmacao_status,
    confirmacao_expira_em
  into v_bloqueio
  from public.historico_mensagens
  where consulta_id = p_consulta_id
    and confirmacao_status in (
      'CONFIRMADO',
      'CANCELAMENTO_SOLICITADO'
    )
  order by
    coalesce(respondido_em, confirmado_em, data_envio) desc,
    id desc
  limit 1;

  if found then
    return jsonb_build_object(
      'permitido', false,
      'codigo', case v_bloqueio.confirmacao_status
        when 'CONFIRMADO' then 'CONSULTATION_ALREADY_CONFIRMED'
        else 'CANCELLATION_ALREADY_REQUESTED'
      end,
      'historico_id', v_bloqueio.id
    );
  end if;

  select
    id,
    confirmacao_status,
    confirmacao_expira_em
  into v_bloqueio
  from public.historico_mensagens
  where consulta_id = p_consulta_id
    and confirmacao_status = 'PENDENTE'
  order by data_envio desc, id desc
  limit 1;

  if found then
    return jsonb_build_object(
      'permitido', false,
      'codigo', 'CONFIRMATION_PENDING',
      'historico_id', v_bloqueio.id,
      'confirmacao_expira_em', v_bloqueio.confirmacao_expira_em
    );
  end if;

  v_expira_em := now() + interval '72 hours';

  insert into public.historico_mensagens (
    paciente_id,
    consulta_id,
    telefone_destino,
    texto_enviado,
    status,
    status_ordem,
    status_atualizado_em,
    usuario_id,
    tipo_mensagem,
    confirmacao_status,
    confirmacao_expira_em,
    respondido_em,
    resposta_confirmacao,
    botao_id,
    mensagem_id
  ) values (
    p_paciente_id,
    p_consulta_id,
    p_telefone_destino,
    p_texto_enviado,
    'PROCESSANDO',
    0,
    now(),
    auth.uid(),
    p_tipo_mensagem,
    'PENDENTE',
    v_expira_em,
    null,
    null,
    p_botao_id,
    null
  )
  returning id into v_historico_id;

  return jsonb_build_object(
    'permitido', true,
    'historico_id', v_historico_id,
    'confirmacao_expira_em', v_expira_em
  );
end;
$$;

create or replace function public.finalizar_disparo_confirmacao(
  p_historico_id uuid,
  p_mensagem_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_historico record;
begin
  if auth.uid() is null then
    raise insufficient_privilege using message = 'Autenticação obrigatória.';
  end if;

  if nullif(btrim(p_mensagem_id), '') is null then
    raise check_violation using message = 'Identificador da mensagem obrigatório.';
  end if;

  update public.historico_mensagens
  set
    status = 'ENVIADO',
    status_ordem = 1,
    status_atualizado_em = now(),
    mensagem_id = p_mensagem_id
  where id = p_historico_id
    and usuario_id = auth.uid()
    and status = 'PROCESSANDO'
    and confirmacao_status = 'PENDENTE'
  returning * into v_historico;

  if not found then
    return null;
  end if;

  return to_jsonb(v_historico)
    - 'telefone_destino'
    - 'texto_enviado'
    - 'usuario_id';
end;
$$;

create or replace function public.falhar_disparo_confirmacao(
  p_historico_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_atualizados integer;
begin
  if auth.uid() is null then
    raise insufficient_privilege using message = 'Autenticação obrigatória.';
  end if;

  update public.historico_mensagens
  set
    status = 'ERRO',
    status_ordem = 0,
    status_atualizado_em = now(),
    confirmacao_status = null,
    confirmacao_expira_em = null
  where id = p_historico_id
    and usuario_id = auth.uid()
    and status = 'PROCESSANDO';

  get diagnostics v_atualizados = row_count;
  return v_atualizados = 1;
end;
$$;

revoke all on function public.reservar_disparo_confirmacao(
  uuid,
  uuid,
  text,
  text,
  text,
  text
) from public;
revoke all on function public.finalizar_disparo_confirmacao(uuid, text)
  from public;
revoke all on function public.falhar_disparo_confirmacao(uuid)
  from public;

grant execute on function public.reservar_disparo_confirmacao(
  uuid,
  uuid,
  text,
  text,
  text,
  text
) to authenticated;
grant execute on function public.finalizar_disparo_confirmacao(uuid, text)
  to authenticated;
grant execute on function public.falhar_disparo_confirmacao(uuid)
  to authenticated;

commit;
