vi.mock("../config/supabase", () => ({
  supabaseAdmin: {},
}));

const supabaseConfig = require("../config/supabase");
const webhookRepository = require("./webhookRepository");

const criarQuery = (estado) => {
  const query = {
    update: vi.fn((dados) => {
      estado.atualizacao = dados;
      return query;
    }),
    eq: vi.fn((campo, valor) => {
      estado.filtros.push(["eq", campo, valor]);
      return query;
    }),
    lt: vi.fn((campo, valor) => {
      estado.filtros.push(["lt", campo, valor]);
      return query;
    }),
    select: vi.fn(async () => ({ data: [{ id: "hist-1" }], error: null })),
  };

  return query;
};

describe("WebhookRepository", () => {
  let estado;

  beforeEach(() => {
    estado = { atualizacao: null, filtros: [] };
    supabaseConfig.supabaseAdmin.from = vi.fn(() => criarQuery(estado));
  });

  it("atualiza leitura somente quando a ordem recebida for maior", async () => {
    await webhookRepository.atualizarStatusMensagem("msg-1", {
      status: "LIDO",
      ordem: 3,
      dataEvento: "2026-07-21T22:54:24.369Z",
    });

    expect(estado.atualizacao).toEqual({
      status: "LIDO",
      status_ordem: 3,
      status_atualizado_em: "2026-07-21T22:54:24.369Z",
      lido_em: "2026-07-21T22:54:24.369Z",
    });
    expect(estado.filtros).toContainEqual(["eq", "mensagem_id", "msg-1"]);
    expect(estado.filtros).toContainEqual(["lt", "status_ordem", 3]);
  });

  it("confirma somente mensagens ainda pendentes", async () => {
    await webhookRepository.registrarConfirmacaoMensagem(
      "CONFIRMAR_PRESENCA:consulta:token",
      "2026-07-21T23:00:00.000Z",
    );

    expect(estado.filtros).toContainEqual([
      "eq",
      "botao_id",
      "CONFIRMAR_PRESENCA:consulta:token",
    ]);
    expect(estado.filtros).toContainEqual([
      "eq",
      "confirmacao_status",
      "PENDENTE",
    ]);
  });
});
