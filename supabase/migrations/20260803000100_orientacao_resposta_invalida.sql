alter table public.historico_mensagens
  add column if not exists orientacao_resposta_invalida_em timestamptz;

comment on column public.historico_mensagens.orientacao_resposta_invalida_em is
  'Registra a reserva atômica da única orientação enviada após resposta textual inválida.';
