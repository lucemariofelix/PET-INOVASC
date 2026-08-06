alter table public.perfis_usuarios
  add column if not exists avatar_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'perfis_usuarios_avatar_url_tamanho_check'
      and conrelid = 'public.perfis_usuarios'::regclass
  ) then
    alter table public.perfis_usuarios
      add constraint perfis_usuarios_avatar_url_tamanho_check
      check (avatar_url is null or length(avatar_url) <= 2048);
  end if;
end $$;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  true,
  204800,
  array['image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_insert_proprio" on storage.objects;
drop policy if exists "avatars_select_proprio" on storage.objects;
drop policy if exists "avatars_update_proprio" on storage.objects;

create policy "avatars_insert_proprio"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "avatars_select_proprio"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "avatars_update_proprio"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create or replace function public.atualizar_avatar_proprio(p_avatar_url text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_avatar_url text;
begin
  if v_usuario_id is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if p_avatar_url is null
    or length(p_avatar_url) > 2048
    or p_avatar_url !~ '^https://.*/storage/v1/object/public/avatars/' then
    raise exception 'INVALID_AVATAR_URL';
  end if;

  update public.perfis_usuarios
  set avatar_url = p_avatar_url
  where id = v_usuario_id
  returning avatar_url into v_avatar_url;

  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;

  return v_avatar_url;
end;
$$;

revoke all on function public.atualizar_avatar_proprio(text) from public;
revoke all on function public.atualizar_avatar_proprio(text) from anon;
grant execute on function public.atualizar_avatar_proprio(text) to authenticated;
