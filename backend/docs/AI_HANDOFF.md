# AI Handoff — Estado atual do SGBA-UBS

**Atualizado em:** 05/08/2026

**Status:** fluxos assistenciais anteriores e avatar do usuário via Supabase Storage implementados e validados.

## Estado verificado

- Backend: 30 arquivos de teste e 300 testes aprovados.
- Frontend: 9 arquivos de teste executados pelo `node:test`.
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
- Tipos profissionais permanecem técnicos no banco (`MEDICO`, `ENFERMEIRO`, `DENTISTA`, `NUTRICAO`), mas interface e mensagens usam Médico, Enfermeiro, Dentista e Nutricionista.
- O Header carrega `browser-image-compression` somente após a seleção de uma foto. A sessão expõe `avatar_url` e é renovada após o upload para atualizar desktop e mobile.
- `pacientes.agente_id` é o vínculo canônico com ACS. Quando esse campo participa de uma atualização, o backend limpa `pacientes.acs`; o texto legado permanece apenas como fallback para registros ainda não editados.

### Avatar

- O bucket público `avatars` aceita somente WebP de até 200 KB.
- Cada usuário autenticado grava apenas `<auth.uid()>/avatar.webp`; substituições não acumulam objetos.
- A tabela `perfis_usuarios` guarda a URL pública versionada em `avatar_url`.
- A RPC `atualizar_avatar_proprio` altera somente o avatar do usuário autenticado, sem ampliar a policy administrativa de atualização do perfil.
- O backend valida campo multipart, tamanho, MIME, extensão e assinatura RIFF/WEBP. A compressão do navegador não é tratada como controle de segurança.

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

### Efetivar cancelamento solicitado

```http
PATCH /consultas/<uuid>/cancelamento
Authorization: Bearer <token>
```

ADMIN, RECEPCAO e ACS podem executar. A operação exige uma resposta do paciente classificada como `CANCELAMENTO_SOLICITADO`, grava `CANCELADA`, `cancelada_em` e `cancelada_por` e é idempotente. Falha no aviso final pelo WhatsApp não reverte a consulta.

### Registrar desfecho presencial

```http
PATCH /consultas/<uuid>/desfecho
Content-Type: application/json

{ "desfecho": "REALIZADA" | "FALTOU" }
```

Somente ADMIN e RECEPCAO podem executar na data agendada ou depois. `REALIZADA` atualiza a última consulta; `FALTOU` preserva a data anterior e tenta enviar orientação para reagendamento sem reverter o desfecho em caso de falha.

### Atualizar o próprio avatar

```http
PATCH /usuarios/me/avatar
Content-Type: multipart/form-data

avatar=<arquivo WebP de até 200 KB>
```

ADMIN, RECEPCAO e ACS podem atualizar somente a própria foto. A resposta contém `{ "avatar_url": "..." }`. Erros públicos: `AVATAR_REQUIRED`, `AVATAR_TOO_LARGE` e `UNSUPPORTED_AVATAR_TYPE`.

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
- Após a solicitação, qualquer perfil autenticado pode efetivar o cancelamento; a consulta passa a `CANCELADA` e não pode ser reativada por este fluxo.
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
5. `20260804000100_efetivacao_cancelamento_consulta.sql` — cancelamento transacional, responsável e horário.
6. `20260805000100_desfecho_manual_consulta.sql` — realização/falta transacional e auditoria do responsável.

Estados de confirmação: `PENDENTE`, `CONFIRMADO`, `CANCELAMENTO_SOLICITADO`, `EXPIRADO` e `SUBSTITUIDO`.

Não remover históricos conflitantes: a reconciliação os classifica como `SUBSTITUIDO` ou `EXPIRADO`.

## Operação e diagnóstico

A auditoria administrativa usa `GET /logs?pagina=<n>&limite=<n>`, com padrão de 5 e máximo de 50 registros por página. A resposta contém `logs` e `paginacao`; a ordenação canônica é `created_at desc, id desc`. Não reintroduzir o corte fixo dos 100 registros mais recentes.

ADMIN e RECEPCAO podem encerrar a sessão vinculada por `DELETE /whatsapp/conexao`. O backend consulta o estado antes do logout para manter a operação idempotente na Evolution API v2.3.x. Essa ação nunca deve chamar a exclusão da instância: a configuração e o histórico permanecem, e a reconexão ocorre pela leitura de um novo QR Code em Configurações. ACS pode consultar o status, mas não pode desconectar.

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
