begin;

alter table public.consultas
  add column if not exists cancelada_em timestamptz,
  add column if not exists cancelada_por uuid references public.perfis_usuarios(id) on delete set null;

create index if not exists idx_consultas_cancelada_por
  on public.consultas(cancelada_por)
  where cancelada_por is not null;

create or replace function public.efetivar_cancelamento_solicitado(
  p_consulta_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_consulta public.consultas%rowtype;
  v_tem_solicitacao boolean;
begin
  if auth.uid() is null then
    raise insufficient_privilege using message = 'Autenticação obrigatória.';
  end if;

  if not exists (
    select 1 from public.perfis_usuarios
    where id = auth.uid()
      and funcao in ('ADMIN', 'RECEPCAO', 'ACS')
  ) then
    raise insufficient_privilege using message = 'Perfil sem permissão para cancelar consultas.';
  end if;

  select * into v_consulta
  from public.consultas
  where id = p_consulta_id
  for update;

  if not found then
    return jsonb_build_object('sucesso', false, 'codigo', 'CONSULTATION_NOT_FOUND');
  end if;

  if upper(coalesce(v_consulta.status_consulta, '')) in ('CANCELADA', 'CANCELADO') then
    return jsonb_build_object(
      'sucesso', true,
      'ja_cancelada', true,
      'consulta', to_jsonb(v_consulta)
    );
  end if;

  select exists(
    select 1
    from public.historico_mensagens
    where consulta_id = p_consulta_id
      and confirmacao_status = 'CANCELAMENTO_SOLICITADO'
  ) into v_tem_solicitacao;

  if not v_tem_solicitacao then
    return jsonb_build_object('sucesso', false, 'codigo', 'CANCELLATION_NOT_REQUESTED');
  end if;

  if upper(coalesce(v_consulta.status_consulta, '')) <> 'AGENDADA' then
    return jsonb_build_object('sucesso', false, 'codigo', 'CONSULTATION_NOT_CANCELLABLE');
  end if;

  update public.consultas
  set
    status_consulta = 'CANCELADA',
    cancelada_em = now(),
    cancelada_por = auth.uid()
  where id = p_consulta_id
  returning * into v_consulta;

  return jsonb_build_object(
    'sucesso', true,
    'ja_cancelada', false,
    'consulta', to_jsonb(v_consulta)
  );
end;
$$;

revoke all on function public.efetivar_cancelamento_solicitado(uuid) from public;
grant execute on function public.efetivar_cancelamento_solicitado(uuid) to authenticated;

commit;
