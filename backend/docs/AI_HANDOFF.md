# AI Handoff — Fase 2: Testes

**Data:** 06/06/2026
**Status:** Em andamento (Etapas 1 a 7 concluídas + investigação ativa do Webhook/Evolution)

---

## 1. Módulos já cobertos por testes

| Etapa     | Módulo               | Arquivo de teste                          | Testes |
| --------- | -------------------- | ----------------------------------------- | ------ |
| 1         | `AppError`           | `src/errors/AppError.test.js`             | 8      |
| 2         | `ConsultaService`    | `src/services/consultaService.test.js`    | 8      |
| 3         | `MensagemService`    | `src/services/mensagemService.test.js`    | 7      |
| 4         | `PacienteService`    | `src/services/pacienteService.test.js`    | 7      |
| 5         | `AuthService`        | `src/services/authService.test.js`        | 5      |
| 6         | `UsuarioService`     | `src/services/usuarioService.test.js`     | 13     |
| 7         | `NotificacaoService` | `src/services/notificacaoService.test.js` | 20     |
| **Total** | **7 módulos**        | **7 arquivos**                            | **68** |

**68/68 testes passam consistentemente.**

---

## 2. Quantidade atual de testes

```text
68 testes — 7 test files — 0 falhas
```

### 2.1 Métricas atuais

- 68 testes
- 7 módulos cobertos
- 0 falhas
- 0 alterações em produção durante a Fase 2
- Vitest 4.1.8

---

## 3. Arquivos de teste criados

| Arquivo                                           | Etapa   | Data       |
| ------------------------------------------------- | ------- | ---------- |
| `backend/src/errors/AppError.test.js`             | Etapa 1 | existente  |
| `backend/src/services/consultaService.test.js`    | Etapa 2 | existente  |
| `backend/src/services/mensagemService.test.js`    | Etapa 3 | 05/06/2026 |
| `backend/src/services/pacienteService.test.js`    | Etapa 4 | 05/06/2026 |
| `backend/src/services/authService.test.js`        | Etapa 5 | 05/06/2026 |
| `backend/src/services/usuarioService.test.js`     | Etapa 6 | 05/06/2026 |
| `backend/src/services/notificacaoService.test.js` | Etapa 7 | 06/06/2026 |

---

## 4. Decisões técnicas tomadas

### 4.1 Padrão de mock para repositories (CommonJS)

```js
vi.mock("../repositories/nomeRepository");

const repository = require("../repositories/nomeRepository");
const service = require("./nomeService");

beforeEach(() => {
  vi.clearAllMocks();
  repository.metodoX = vi.fn().mockResolvedValue(...);
});
```

Aplicado em:

- PacienteService
- UsuarioService

---

### 4.2 Padrão de mock para Supabase (CommonJS)

```js
vi.mock("../config/supabase", () => ({
  supabase: {
    auth: {},
    from: vi.fn(),
  },
}));
```

Motivação:

- Vitest 4.x + CommonJS
- Mutação in-place funciona corretamente
- Evita problemas com factories capturando variáveis externas

Aplicado em:

- AuthService
- UsuarioService

---

### 4.3 Mock de fetch global

```js
vi.stubGlobal("fetch", vi.fn());

afterEach(() => {
  vi.unstubAllGlobals();
});
```

Aplicado em:

- MensagemService
- NotificacaoService

---

### 4.4 Mock de process.env

```js
let originalEnv;

beforeEach(() => {
  originalEnv = { ...process.env };
});

afterEach(() => {
  process.env = originalEnv;
});
```

Aplicado em:

- MensagemService
- NotificacaoService

---

### 4.5 Duplo mock (Supabase + Repository)

```js
vi.mock("../config/supabase", () => ({
  supabaseAdmin: { auth: { admin: {} } },
}));

vi.mock("../repositories/usuarioRepository");
```

Aplicado em:

- UsuarioService

---

### 4.6 Spy em console.error

```js
const spy = vi.spyOn(console, "error").mockImplementation(() => {});
```

Aplicado em:

- UsuarioService (fluxo best effort)

---

## 5. NotificacaoService

### 5.1 Cenários cobertos

- iniciarDisparoLote
- validações de entrada
- envio bem-sucedido
- substituição de `{nome}`
- registro `ENVIADO`
- registro `ERRO`
- fallback de nome
- fallback de `mensagem_id`
- múltiplos pacientes
- formatação de telefone
- payload enviado para Evolution
- falhas de fetch
- falhas de resposta
- continuidade da fila

### 5.2 Estratégia aplicada

- Repository mockado
- Fetch mockado
- Process.env controlado
- Delay neutralizado em testes
- Nenhuma chamada real à Evolution API

---

## 6. Próximos módulos candidatos

### 6.1 WebhookService (prioridade alta)

- 71 linhas
- 1 método público: `processarEvento`
- Possui retry interno
- Usa `setTimeout`
- Depende de `webhookRepository`

Estratégia:

- Mock do repository
- Fake timers
- Testes de retry
- Testes de mapeamento de status

### 6.2 Controllers (prioridade baixa)

- Camadas finas
- Melhor como integração

### 6.3 Repositories (prioridade baixa)

- Acoplamento forte ao Supabase
- Preferir testes de integração

---

## 7. Investigação Evolution API / Webhook (06/06/2026)

### 7.1 Situação resolvida

Problemas corrigidos durante a investigação:

- Erro 500 no envio de mensagens.
- Redis restaurado.
- QR Code voltou a ser gerado.
- Evolution voltou a conectar.
- Mensagens voltaram a ser enviadas.
- Envio confirmado via Postman.
- Envio confirmado pelo sistema.
- Status WhatsApp retornando corretamente.
- Webhook configurado com sucesso na Evolution.

### 7.2 Situação atual

Mensagens:

- chegam ao destinatário;
- são entregues;
- são lidas.

Porém:

- frontend não atualiza ENTREGUE;
- frontend não atualiza LIDO.

### 7.3 Evidências confirmadas

Webhook configurado:

```json
{
  "enabled": true,
  "url": "https://pet-inovasc.onrender.com/webhooks/evolution",
  "events": [
    "MESSAGES_UPDATE",
    "MESSAGES_UPSERT",
    "CONNECTION_UPDATE",
    "SEND_MESSAGE"
  ]
}
```

Render registrou:

```text
POST /webhooks/evolution
```

Portanto:

- Evolution → Render está funcionando.
- O webhook está chegando ao backend.

### 7.4 Evidências adicionais

Teste manual executado:

```text
TESTE-SIMULADOR-123 → LIDO
Nenhuma linha atualizada
```

Resultado:

- rota funciona;
- webhookRepository executa;
- atualização não encontra registros correspondentes.

Indício forte de incompatibilidade entre:

```text
messageId recebido
```

e

```text
mensagem_id salvo na tabela historico_mensagens
```

### 7.5 Hipóteses atuais

Hipótese 1 (mais provável)

- webhook chega;
- payload não corresponde ao formato esperado pelo WebhookService;
- evento é descartado silenciosamente.

Hipótese 2

- webhook chega;
- messageId extraído não coincide com mensagem_id armazenado.

Hipótese 3

- evento recebido pela Evolution difere dos eventos atualmente tratados pelo service.

### 7.6 Próximo passo recomendado

Adicionar logs temporários de diagnóstico no WebhookService.

Registrar:

- event recebido;
- formato de data (array/objeto);
- messageId extraído;
- status bruto recebido;
- motivo de descarte;
- momento da chamada ao webhookRepository;
- quantidade de registros atualizados.

Restrições:

- não alterar regra de negócio;
- não alterar repository;
- não alterar resposta HTTP;
- não expor secrets;
- não logar conteúdo completo das mensagens.

Objetivo:

Identificar exatamente por que o webhook recebido não atualiza o status da mensagem.

---

## 8. Observações

- Nenhum código de produção foi alterado durante a construção dos 68 testes.
- Todos os mocks permanecem isolados por teste.
- Nenhuma chamada real a Supabase ou Evolution ocorre na suíte.
- Projeto utiliza JavaScript puro (CommonJS).
- Vitest 4.1.8.
- Comando padrão:

```bash
cd backend
pnpm test
```
