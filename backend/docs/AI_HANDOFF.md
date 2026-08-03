# AI Handoff — Estado atual do SGBA-UBS

**Atualizado em:** 03/08/2026

**Status:** fluxo de mensageria, webhook, confirmação textual e bloqueio de reenvios implementados e validados.

## Estado verificado

- Backend: 20 arquivos de teste e 234 testes aprovados.
- Frontend: 4 arquivos de teste executados pelo `node:test`.
- Frontend: lint e build de produção aprovados.
- Branch de trabalho: `main`.
- Integração real validada com Evolution API v2.3.x, incluindo envio, entrega, leitura e resposta textual.

## Arquitetura relevante

### Mensageria

`mensagemService` recebe o contrato HTTP e delega para `mensageriaService`, que concentra:

- consentimento e validação do telefone;
- preflight de existência no WhatsApp;
- transporte `sendText`/compatibilidade legada de botões;
- validação da resposta real da Evolution;
- reserva e finalização de lembretes com confirmação;
- normalização dos webhooks;
- respostas automáticas.

`mensagemRepository` usa o cliente autenticado do Supabase para histórico, polling e RPCs transacionais. `webhookRepository` usa `supabaseAdmin`, pois a Evolution não possui sessão de usuário.

### Frontend

- O Dashboard solicita confirmação somente por menu textual.
- A tela de agendamento ainda usa o contrato legado `usarBotaoConfirmacao`; não confundir essa compatibilidade com o fluxo textual validado no Dashboard.
- O status é atualizado por `GET /mensagens/status` a cada 10 segundos.
- O Dashboard mantém `ultima_mensagem_whatsapp` separada de `confirmacao_whatsapp`: entrega/leitura e confirmação são exibidas simultaneamente e uma pendência nunca mascara o transporte.
- O botão de disparo é bloqueado visualmente, mas o banco é a autoridade contra concorrência.
- O shell autenticado possui largura máxima de 1600 px; tabelas usam o espaço amplo e formulários/modais preservam limites próprios.

## Contratos principais

### Enviar mensagem

```http
POST /mensagens/enviar
Authorization: Bearer <token>
Content-Type: application/json
```

Para lembrete com confirmação:

```json
{
  "paciente_id": "uuid",
  "consulta_id": "uuid",
  "telefone": "DDD + celular",
  "consentimento_msg": true,
  "tipo": "LEMBRETE_CONSULTA",
  "solicitarConfirmacao": true
}
```

Bloqueios esperados:

| HTTP | Código | Motivo |
| ---: | --- | --- |
| 409 | `CONFIRMATION_PENDING` | Há uma pendência ativa. |
| 409 | `CONSULTATION_ALREADY_CONFIRMED` | A presença já foi confirmada. |
| 409 | `CANCELLATION_ALREADY_REQUESTED` | Já existe pedido de cancelamento. |
| 409 | `WHATSAPP_DESCONECTADO` | A instância não está conectada. |
| 422 | `WHATSAPP_NUMBER_NOT_FOUND` | O número não existe no WhatsApp. |
| 502 | `WHATSAPP_PROVIDER_ERROR` | Preflight ou envio retornou resposta inválida. |

### Polling

```http
GET /mensagens/status?consulta_ids=<uuid,uuid>
Authorization: Bearer <token>
```

Aceita até 20 IDs e retorna a mensagem mais recente de cada consulta com `confirmacao_efetiva`.

### Webhook

```http
POST /webhooks/evolution
x-evolution-secret: <EVOLUTION_WEBHOOK_SECRET>
```

Eventos obrigatórios: `MESSAGES_UPDATE` e `MESSAGES_UPSERT`.

Nas confirmações textuais, o conteúdo é extraído nesta ordem:

1. `data.message.conversation`;
2. `data.message.extendedTextMessage.text`, usado também em respostas que citam a mensagem original;
3. `data.body`, mantido como fallback de compatibilidade.

O primeiro conteúdo textual não vazio é normalizado com remoção dos espaços externos e conversão para minúsculas antes da classificação da intenção.

Quando há exatamente uma confirmação pendente e chega texto fora das intenções aceitas, o sistema reserva atomicamente e envia uma única orientação para responder apenas `1` ou `2`. Novos textos inválidos na mesma pendência e textos posteriores a uma resposta terminal são ignorados. Áudio, mídia e conteúdo vazio não disparam orientação.

## Invariantes que não devem ser quebradas

- HTTP 2xx sem `key.id`/`id` não é envio bem-sucedido.
- `mensagem_id` preserva exatamente o identificador da Evolution.
- `data.messageId` não é usado para correlacionar status.
- O status de entrega só avança: `ENVIADO → ENTREGUE → LIDO`.
- `LIDO` não significa presença confirmada.
- `2` solicita cancelamento; não cancela a consulta.
- Uma resposta terminal prevalece sobre lembretes posteriores.
- O status de transporte é independente da confirmação: `ENTREGUE` e `LIDO` devem aparecer mesmo enquanto a resposta estiver `PENDENTE`.
- No máximo uma pendência pode existir por `consulta_id`.
- Falha após aceitação do provedor mantém a reserva, evitando duplicidade.
- Grupos, mensagens próprias, áudios, reações, frases e valores fora dos sinônimos aceitos não confirmam consultas.
- Respostas textuais aceitas: `1`, `sim`, `confirmar`, `ok` e `s` para confirmação; `2`, `nao`, `não`, `cancelar` e `n` para solicitação de cancelamento. A comparação é integral após a normalização, portanto esses valores não são reconhecidos dentro de frases maiores.
- Uma resposta textual inválida não confirma, não cancela, não encerra nem prorroga a pendência; a orientação é enviada no máximo uma vez por histórico.
- Logs não devem conter texto integral, API key, segredo ou telefone completo.

## Banco de dados

Migrations centrais da entrega:

1. `20260721000200_status_visual_mensagens.sql` — ordem e timestamps de entrega/leitura.
2. `20260725000100_confirmacao_textual_consultas.sql` — prazo e resposta textual.
3. `20260725000200_bloqueio_reenvio_confirmacao.sql` — reconciliação, índice único e RPCs de reserva.
4. `20260803000100_orientacao_resposta_invalida.sql` — reserva atômica da orientação única para texto inválido.

Estados de confirmação: `PENDENTE`, `CONFIRMADO`, `CANCELAMENTO_SOLICITADO`, `EXPIRADO` e `SUBSTITUIDO`.

Não remover históricos conflitantes: a reconciliação os classifica como `SUBSTITUIDO` ou `EXPIRADO`.

## Operação e diagnóstico

Ative `EVOLUTION_DIAGNOSTICS=true` somente durante investigação. O ciclo saudável contém:

```text
EVOLUTION_PREFLIGHT_RESPONSE
EVOLUTION_SEND_REQUEST endpoint=sendText
EVOLUTION_SEND_RESPONSE mensagemId=<id>
EVOLUTION_SEND_PERSISTED status=ENVIADO
EVOLUTION_WEBHOOK_STATUS statusNormalizado=ENTREGUE/LIDO
EVOLUTION_WEBHOOK_MATCH linhasAtualizadas=1
```

Para confirmação textual:

```text
EVOLUTION_CONFIRMATION_RECEIVED resposta=<resposta-normalizada> quantidadePendencias=1
EVOLUTION_CONFIRMATION_MATCH linhasAtualizadas=1
EVOLUTION_AUTO_REPLY_PERSISTED
```

Consulte `docs/MENSAGERIA_WHATSAPP.md` e `docs/IMPLANTACAO.md` na raiz do repositório para detalhes.

## Comandos de validação

```bash
cd backend
npm test

cd ../frontend
pnpm test
pnpm lint
pnpm build
```
