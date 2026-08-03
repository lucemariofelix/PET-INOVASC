# Mensageria e confirmação de consultas via WhatsApp

## Visão geral

O backend integra o SGBA-UBS à Evolution API v2.3.x. Lembretes com confirmação usam texto simples, enquanto o Dashboard acompanha separadamente o transporte da mensagem e a resposta do paciente.

```text
Dashboard
  → POST /mensagens/enviar
  → reserva atômica no Supabase
  → valida conexão e número no WhatsApp
  → POST /message/sendText/{instance}
  → exige key.id e finaliza como ENVIADO

Evolution
  → MESSAGES_UPDATE → ENTREGUE/LIDO
  → MESSAGES_UPSERT → resposta 1/2

Dashboard
  ← GET /mensagens/status a cada 10 segundos
```

## Envio seguro

O envio de um lembrete com confirmação segue estas regras:

1. O paciente precisa ter consentimento para WhatsApp.
2. O telefone aceita apenas `DDD + 9 dígitos` ou `55 + DDD + 9 dígitos`.
3. O DDD precisa ser brasileiro e o número local deve começar com `9`.
4. Números antigos de dez dígitos são rejeitados; o nono dígito não é inventado no envio.
5. O backend consulta `POST /chat/whatsappNumbers/{instance}` e exige `exists: true`.
6. Uma resposta HTTP 2xx da Evolution só é sucesso quando o JSON contém `key.id` ou o `id` legado e não informa erro interno.
7. O `mensagem_id` é persistido exatamente como retornado pela Evolution.

Quando `solicitarConfirmacao` é verdadeiro, o texto recebe o menu:

```text
1 — Confirmar presença
2 — Solicitar cancelamento
```

O contrato `usarBotaoConfirmacao` continua disponível por compatibilidade e ainda é utilizado no envio criado pela tela de agendamento. Para sessões conectadas por QR Code, o fluxo comprovado como confiável é `solicitarConfirmacao: true` com `sendText`; o Dashboard já usa exclusivamente essa opção.

## Estados da mensagem

| Estado | Ordem | Significado |
| --- | ---: | --- |
| `PROCESSANDO` | 0 | Reserva criada antes da chamada ao provedor. |
| `ERRO` | 0 | Falha conhecida antes da aceitação do provedor. |
| `SIMULADO` | 0 | Evolution não configurada no ambiente. |
| `ENVIADO` | 1 | Evolution aceitou e retornou um identificador. |
| `ENTREGUE` | 2 | Webhook recebeu confirmação de entrega. |
| `LIDO` | 3 | Webhook recebeu confirmação de leitura. |

Os eventos `SERVER_ACK`, `DELIVERY_ACK`, `DELIVERED`, `RECEIVED`, `2` e `3` são normalizados para `ENTREGUE`. `READ`, `VIEWED`, `PLAYED`, `4` e `5` são normalizados para `LIDO`. A atualização usa `status_ordem`, impedindo regressões como `LIDO → ENTREGUE`.

Eventos `MESSAGES_UPDATE` com `fromMe: false` descrevem mensagens recebidas e não atualizam o histórico de mensagens enviadas. Quando os diagnósticos estão ativos, eles são registrados apenas como `EVOLUTION_WEBHOOK_STATUS_IGNORED`, sem identificadores pessoais. Eventos com `fromMe: true` ou sem esse campo continuam sendo processados para manter compatibilidade com versões da Evolution que o omitem.

## Horário dos webhooks

Todo horário usado para atualizar o transporte ou correlacionar uma confirmação é normalizado para ISO UTC. A origem é escolhida nesta ordem:

1. `messageTimestamp` Unix da mensagem, em segundos, milissegundos ou string numérica;
2. `date_time` quando possuir `Z` ou offset explícito, como `-03:00`;
3. horário em que o backend recebeu o payload.

Um `date_time` sem offset não é interpretado como horário local, pois seu resultado dependeria do fuso configurado no servidor. Todos os itens de um mesmo payload compartilham o mesmo horário de recebimento usado como fallback. Com os diagnósticos ativos, `origemDataEvento` informa `MESSAGE_TIMESTAMP`, `DATE_TIME_WITH_OFFSET` ou `SERVER_RECEIVED_AT`.

## Correlação do webhook

Para `MESSAGES_UPDATE`, o identificador de correlação é:

1. `data.keyId`;
2. fallback para `data.key.id`.

`data.messageId` é somente informativo nos diagnósticos e não participa da correlação, pois representa uma referência interna diferente na Evolution.

## Respostas de confirmação

O evento `MESSAGES_UPSERT` só é processado quando:

- `fromMe` é `false`;
- a conversa é individual, nunca `@g.us`;
- o conteúdo normalizado é exatamente `1` ou `2`;
- existe uma única pendência ativa para o telefone;
- a resposta está dentro do prazo de 72 horas.

O telefone é extraído, nesta ordem, de `key.remoteJid`, `key.remoteJidAlt`, `key.senderPn`, `remoteJid`, `remoteJidAlt` ou `senderPn`. JIDs brasileiros com 12 dígitos podem ter o nono dígito restaurado no recebimento, porque algumas versões do WhatsApp o omitem no JID mesmo quando o cadastro usa 13 dígitos.

Resultados:

| Resposta | Estado | Efeito |
| --- | --- | --- |
| `1` | `CONFIRMADO` | Registra a presença confirmada. |
| `2` | `CANCELAMENTO_SOLICITADO` | Solicita análise da unidade; não cancela a consulta. |

Após uma resposta válida, o sistema envia uma resposta automática por `sendText` e a registra como `RESPOSTA_AUTOMATICA`. Se houver mais de uma pendência para o mesmo telefone, nenhuma consulta é alterada e o paciente é orientado a contatar a unidade.

Um mesmo telefone pode pertencer a mais de um paciente da mesma família. Isso é esperado, especialmente quando familiares administram as mensagens de pacientes idosos. A associação automática só acontece quando existe exatamente uma pendência ativa para o telefone; múltiplas pendências permanecem ambíguas por segurança.

## Bloqueio de reenvios

Lembretes com confirmação são reservados no banco antes de qualquer chamada à Evolution. A função transacional bloqueia a consulta, expira pendências vencidas e impede:

- uma segunda pendência ativa: `CONFIRMATION_PENDING` (HTTP 409);
- reenvio após confirmação: `CONSULTATION_ALREADY_CONFIRMED` (HTTP 409);
- reenvio após pedido de cancelamento: `CANCELLATION_ALREADY_REQUESTED` (HTTP 409).

Uma falha conhecida antes da aceitação marca a reserva como `ERRO` e permite nova tentativa. Se o provedor aceitar e o processo falhar antes da finalização, a reserva permanece bloqueada para evitar duplicidade silenciosa.

A migração reconcilia o histórico sem apagar registros:

- pendências vencidas tornam-se `EXPIRADO`;
- pendências conflitantes tornam-se `SUBSTITUIDO`;
- no máximo um registro `PENDENTE` pode existir por `consulta_id`.

## Estrutura do histórico

A tabela `historico_mensagens` possui atualmente 20 colunas funcionais:

| Grupo | Colunas |
| --- | --- |
| Identidade e envio | `id`, `data_envio`, `telefone_destino`, `texto_enviado`, `mensagem_id`, `tipo_mensagem` |
| Situação técnica | `status`, `status_ordem`, `status_atualizado_em`, `entregue_em`, `lido_em` |
| Relacionamentos | `usuario_id`, `paciente_id`, `consulta_id` |
| Confirmação | `confirmacao_status`, `confirmado_em`, `botao_id`, `confirmacao_expira_em`, `respondido_em`, `resposta_confirmacao` |

`id` é a chave primária UUID. Usuário, paciente e consulta possuem chaves estrangeiras. Os principais acessos são apoiados por índices em `mensagem_id`, `botao_id`, `(consulta_id, data_envio desc)`, pendências por telefone/prazo e confirmação por consulta/estado. Um índice único parcial limita a uma pendência por consulta.

Os RPCs autenticados que mantêm a reserva são:

- `reservar_disparo_confirmacao`;
- `finalizar_disparo_confirmacao`;
- `falhar_disparo_confirmacao`.

## Confirmação efetiva e Dashboard

O endpoint `GET /mensagens/status?consulta_ids=...` aceita até 20 consultas por requisição e retorna a mensagem mais recente com `confirmacao_efetiva` separada. A prioridade é:

1. `CONFIRMADO` ou `CANCELAMENTO_SOLICITADO`;
2. pendência ativa;
3. prazo expirado;
4. ausência de confirmação.

O frontend consulta esse endpoint a cada 10 segundos, pausa quando a aba está oculta, retoma ao receber foco e cancela requisições ao desmontar. O botão de disparo mostra `Aguardando resposta`, `Presença confirmada` ou `Cancelamento solicitado` e fica desabilitado; o backend continua sendo a proteção autoritativa.

## Diagnóstico seguro

Defina temporariamente:

```env
EVOLUTION_DIAGNOSTICS=true
```

Os eventos de diagnóstico incluem preflight, envio, persistência, entrada do webhook, correlação, normalização do telefone e quantidade de linhas atualizadas. Os logs mascaram telefones e não registram texto da mensagem, API key ou segredo do webhook. Desative a flag após capturar um ciclo completo.
