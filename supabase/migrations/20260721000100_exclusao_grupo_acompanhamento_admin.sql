begin;

drop policy if exists "grupos_acompanhamento_delete_admin"
  on public.grupos_acompanhamento;

create policy "grupos_acompanhamento_delete_admin"
  on public.grupos_acompanhamento
  for delete
  to authenticated
  using (public.usuario_tem_funcao(array['ADMIN']));

grant delete on table public.grupos_acompanhamento to authenticated;

commit;
