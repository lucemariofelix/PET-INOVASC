# Implantação e validação

## Ambientes

- Frontend React/Vite: Vercel.
- Backend Node.js/Fastify: Render.
- Banco PostgreSQL e autenticação: Supabase.
- WhatsApp: Evolution API v2.3.x em infraestrutura própria.

## Variáveis do backend

```env
PORT=3000
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE_NAME=
EVOLUTION_WEBHOOK_SECRET=
EVOLUTION_DIAGNOSTICS=false
```

`SUPABASE_SERVICE_ROLE_KEY`, `EVOLUTION_API_KEY` e `EVOLUTION_WEBHOOK_SECRET` são exclusivos do backend e nunca devem ser expostos no frontend ou em logs.

## Webhook da Evolution

Configuração mínima da instância:

```json
{
  "webhook": {
    "enabled": true,
    "url": "https://pet-inovasc.onrender.com/webhooks/evolution",
    "webhookByEvents": true,
    "webhookBase64": false,
    "events": ["MESSAGES_UPDATE", "MESSAGES_UPSERT"],
    "headers": {
      "x-evolution-secret": "MESMO_VALOR_DE_EVOLUTION_WEBHOOK_SECRET"
    }
  }
}
```

Sem `MESSAGES_UPSERT`, respostas `1` e `2` não serão processadas. Sem `MESSAGES_UPDATE`, os estados de entrega e leitura não serão atualizados.

## Ordem de implantação

1. Aplicar as migrations do Supabase na ordem dos nomes dos arquivos.
2. Confirmar especialmente:
   - `20260721000200_status_visual_mensagens.sql`;
   - `20260725000100_confirmacao_textual_consultas.sql`;
   - `20260725000200_bloqueio_reenvio_confirmacao.sql`.
   - `20260804000100_efetivacao_cancelamento_consulta.sql`.
   - `20260805000100_desfecho_manual_consulta.sql`.
3. Implantar o backend no Render.
4. Configurar o webhook da instância Evolution.
5. Implantar o frontend na Vercel.
6. Fazer atualização forçada do navegador após alterações de interface.

A migração de bloqueio pode reclassificar dados existentes como `EXPIRADO` ou `SUBSTITUIDO`, mas não remove históricos.

## Verificação pós-implantação

1. Confirmar `GET /health` com resposta `{"status":"ok"}`.
2. Enviar um lembrete e verificar `sendText`, HTTP 201/200 e `key.id`.
3. Confirmar o histórico inicialmente como `ENVIADO`.
4. Observar `DELIVERY_ACK`/`SERVER_ACK` e depois `READ` no webhook.
5. Responder `1` e confirmar `CONFIRMADO` no Dashboard.
6. Repetir em outra consulta com `2` e confirmar `CANCELAMENTO_SOLICITADO`.
7. Tentar reenviar e confirmar HTTP 409 sem nova chamada à Evolution.
8. Desativar `EVOLUTION_DIAGNOSTICS` após o ciclo.
9. Responder `2`, efetivar o cancelamento no Dashboard com cada perfil e confirmar `CANCELADA`, responsável, horário e mensagem final ao paciente.
10. Com ADMIN e RECEPCAO, registrar uma consulta do dia como `REALIZADA` e outra como `FALTOU`; confirmar bloqueio para ACS e datas futuras.

## Validação local

```bash
cd backend
npm test

cd ../frontend
pnpm test
pnpm lint
pnpm build
```
