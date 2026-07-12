begin;

create or replace function public.usuario_funcao()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select perfis_usuarios.funcao::text
  from public.perfis_usuarios
  where perfis_usuarios.id = auth.uid()
  limit 1
$$;

create or replace function public.usuario_tem_funcao(funcoes text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.usuario_funcao() = any(funcoes), false)
$$;

revoke all on function public.usuario_funcao() from public, anon;
revoke all on function public.usuario_tem_funcao(text[]) from public, anon;
grant execute on function public.usuario_funcao() to authenticated, service_role;
grant execute on function public.usuario_tem_funcao(text[]) to authenticated, service_role;

drop policy if exists "Permitir Leitura Pública do Realtime" on public.historico_mensagens;
drop policy if exists "Permitir leitura para autenticados" on public.historico_mensagens;
drop policy if exists "Permitir inserção para autenticados" on public.historico_mensagens;

drop policy if exists "Permitir leitura para autenticados" on public.consultas;
drop policy if exists "Permitir inserção para autenticados" on public.consultas;
drop policy if exists "Permitir atualização para autenticados" on public.consultas;

drop policy if exists "Permitir leitura para autenticados" on public.pacientes;
drop policy if exists "Permitir inserção para autenticados" on public.pacientes;
drop policy if exists "Permitir atualização para autenticados" on public.pacientes;

drop policy if exists "Permitir leitura para usuários autenticados" on public.perfis_usuarios;
drop policy if exists "Permitir inserção para autenticados" on public.perfis_usuarios;
drop policy if exists "Permitir atualização de autenticados" on public.perfis_usuarios;
drop policy if exists "Permitir deletar autenticados" on public.perfis_usuarios;

drop policy if exists "Permitir leitura para autenticados" on public.grupos_acompanhamento;
drop policy if exists "Permitir inserção para autenticados" on public.grupos_acompanhamento;

drop policy if exists "Permitir leitura para autenticados" on public.pacientes_grupos;
drop policy if exists "Permitir inserção para autenticados" on public.pacientes_grupos;
drop policy if exists "Permitir atualização para autenticados" on public.pacientes_grupos;
drop policy if exists "Permitir deleção para autenticados" on public.pacientes_grupos;

create policy "perfis_usuarios_select_por_funcao"
  on public.perfis_usuarios
  for select
  to authenticated
  using (
    id = auth.uid()
    or public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO'])
    or (
      funcao = 'ACS'::public.funcao_usuario
      and public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO', 'ACS'])
    )
  );

create policy "perfis_usuarios_insert_admin"
  on public.perfis_usuarios
  for insert
  to authenticated
  with check (public.usuario_tem_funcao(array['ADMIN']));

create policy "perfis_usuarios_update_admin"
  on public.perfis_usuarios
  for update
  to authenticated
  using (public.usuario_tem_funcao(array['ADMIN']))
  with check (public.usuario_tem_funcao(array['ADMIN']));

create policy "perfis_usuarios_delete_admin"
  on public.perfis_usuarios
  for delete
  to authenticated
  using (public.usuario_tem_funcao(array['ADMIN']));

create policy "pacientes_select_equipe"
  on public.pacientes
  for select
  to authenticated
  using (public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO', 'ACS']));

create policy "pacientes_insert_admin_recepcao"
  on public.pacientes
  for insert
  to authenticated
  with check (public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO']));

create policy "pacientes_update_admin_recepcao"
  on public.pacientes
  for update
  to authenticated
  using (public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO']))
  with check (public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO']));

create policy "consultas_select_equipe"
  on public.consultas
  for select
  to authenticated
  using (public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO', 'ACS']));

create policy "consultas_insert_admin_recepcao"
  on public.consultas
  for insert
  to authenticated
  with check (public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO']));

create policy "consultas_update_admin_recepcao"
  on public.consultas
  for update
  to authenticated
  using (public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO']))
  with check (public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO']));

create policy "historico_mensagens_select_equipe"
  on public.historico_mensagens
  for select
  to authenticated
  using (public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO', 'ACS']));

create policy "historico_mensagens_insert_equipe"
  on public.historico_mensagens
  for insert
  to authenticated
  with check (
    public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO', 'ACS'])
    and (usuario_id is null or usuario_id = auth.uid())
  );

create policy "grupos_acompanhamento_select_equipe"
  on public.grupos_acompanhamento
  for select
  to authenticated
  using (public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO', 'ACS']));

create policy "grupos_acompanhamento_insert_admin_recepcao"
  on public.grupos_acompanhamento
  for insert
  to authenticated
  with check (public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO']));

create policy "grupos_acompanhamento_update_admin_recepcao"
  on public.grupos_acompanhamento
  for update
  to authenticated
  using (public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO']))
  with check (public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO']));

create policy "pacientes_grupos_select_equipe"
  on public.pacientes_grupos
  for select
  to authenticated
  using (public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO', 'ACS']));

create policy "pacientes_grupos_insert_admin_recepcao"
  on public.pacientes_grupos
  for insert
  to authenticated
  with check (public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO']));

create policy "pacientes_grupos_update_admin_recepcao"
  on public.pacientes_grupos
  for update
  to authenticated
  using (public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO']))
  with check (public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO']));

create policy "pacientes_grupos_delete_admin_recepcao"
  on public.pacientes_grupos
  for delete
  to authenticated
  using (public.usuario_tem_funcao(array['ADMIN', 'RECEPCAO']));

revoke all on table public.consultas from anon;
revoke all on table public.historico_mensagens from anon;
revoke all on table public.logs_atividades from anon;
revoke all on table public.pacientes from anon;
revoke all on table public.perfis_usuarios from anon;
revoke all on table public.grupos_acompanhamento from anon;
revoke all on table public.pacientes_grupos from anon;

revoke all on table public.consultas from authenticated;
revoke all on table public.historico_mensagens from authenticated;
revoke all on table public.logs_atividades from authenticated;
revoke all on table public.pacientes from authenticated;
revoke all on table public.perfis_usuarios from authenticated;
revoke all on table public.grupos_acompanhamento from authenticated;
revoke all on table public.pacientes_grupos from authenticated;

grant select, insert, update on table public.consultas to authenticated;
grant select, insert on table public.historico_mensagens to authenticated;
grant select, insert, update on table public.pacientes to authenticated;
grant select, insert, update, delete on table public.perfis_usuarios to authenticated;
grant select, insert, update on table public.grupos_acompanhamento to authenticated;
grant select, insert, update, delete on table public.pacientes_grupos to authenticated;

grant all on table public.consultas to service_role;
grant all on table public.historico_mensagens to service_role;
grant all on table public.logs_atividades to service_role;
grant all on table public.pacientes to service_role;
grant all on table public.perfis_usuarios to service_role;
grant all on table public.grupos_acompanhamento to service_role;
grant all on table public.pacientes_grupos to service_role;

alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on functions from anon;
alter default privileges for role postgres in schema public revoke all on sequences from anon;
alter default privileges for role postgres in schema public revoke all on tables from authenticated;
alter default privileges for role postgres in schema public revoke all on functions from authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from authenticated;

commit;
