create index if not exists logs_atividades_created_at_id_idx
  on public.logs_atividades (created_at desc, id desc);
