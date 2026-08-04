begin;

alter table public.consultas
  add column if not exists desfecho_em timestamptz,
  add column if not exists desfecho_por uuid references public.perfis_usuarios(id) on delete set null;

create index if not exists idx_consultas_desfecho_por
  on public.consultas(desfecho_por)
  where desfecho_por is not null;

create or replace function public.registrar_desfecho_consulta(
  p_consulta_id uuid,
  p_desfecho text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_consulta public.consultas%rowtype;
  v_desfecho text := upper(nullif(btrim(p_desfecho), ''));
  v_hoje date := timezone('America/Sao_Paulo', now())::date;
begin
  if auth.uid() is null then
    raise insufficient_privilege using message = 'Autenticação obrigatória.';
  end if;

  if not exists (
    select 1 from public.perfis_usuarios
    where id = auth.uid() and funcao in ('ADMIN', 'RECEPCAO')
  ) then
    raise insufficient_privilege using message = 'Perfil sem permissão para registrar desfecho.';
  end if;

  if v_desfecho is null or v_desfecho not in ('REALIZADA', 'FALTOU') then
    return jsonb_build_object('sucesso', false, 'codigo', 'INVALID_CONSULTATION_OUTCOME');
  end if;

  select * into v_consulta
  from public.consultas
  where id = p_consulta_id
  for update;

  if not found then
    return jsonb_build_object('sucesso', false, 'codigo', 'CONSULTATION_NOT_FOUND');
  end if;

  if upper(coalesce(v_consulta.status_consulta, '')) = v_desfecho then
    return jsonb_build_object(
      'sucesso', true,
      'ja_registrado', true,
      'consulta', to_jsonb(v_consulta)
    );
  end if;

  if upper(coalesce(v_consulta.status_consulta, '')) <> 'AGENDADA' then
    return jsonb_build_object('sucesso', false, 'codigo', 'CONSULTATION_NOT_OPEN');
  end if;

  if v_consulta.data_proxima_consulta is null or v_consulta.data_proxima_consulta > v_hoje then
    return jsonb_build_object('sucesso', false, 'codigo', 'CONSULTATION_OUTCOME_TOO_EARLY');
  end if;

  update public.consultas
  set
    status_consulta = v_desfecho,
    data_ultima_consulta = case
      when v_desfecho = 'REALIZADA' then data_proxima_consulta
      else data_ultima_consulta
    end,
    desfecho_em = now(),
    desfecho_por = auth.uid()
  where id = p_consulta_id
  returning * into v_consulta;

  return jsonb_build_object(
    'sucesso', true,
    'ja_registrado', false,
    'consulta', to_jsonb(v_consulta)
  );
end;
$$;

revoke all on function public.registrar_desfecho_consulta(uuid, text) from public;
grant execute on function public.registrar_desfecho_consulta(uuid, text) to authenticated;

commit;
