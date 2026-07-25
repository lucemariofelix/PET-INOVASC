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
    gt: vi.fn((campo, valor) => {
      estado.filtros.push(["gt", campo, valor]);
      return query;
    }),
    lte: vi.fn((campo, valor) => {
      estado.filtros.push(["lte", campo, valor]);
      return query;
    }),
    order: vi.fn((campo, opcoes) => {
      estado.ordem = [campo, opcoes];
      return query;
    }),
    select: vi.fn(() => query),
    then: (resolve) =>
      resolve({ data: estado.data || [{ id: "hist-1" }], error: null }),
  };

  return query;
};

describe("WebhookRepository", () => {
  let estado;

  beforeEach(() => {
    estado = { atualizacao: null, filtros: [], data: null, ordem: null };
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
    expect(estado.atualizacao).toEqual(
      expect.objectContaining({
        confirmacao_status: "CONFIRMADO",
        respondido_em: "2026-07-21T23:00:00.000Z",
        resposta_confirmacao: "1",
      }),
    );
  });

  it("busca apenas pendências ativas do telefone na data do evento", async () => {
    await webhookRepository.listarConfirmacoesPendentesPorTelefone(
      "5584999998888",
      "2026-07-25T12:00:00.000Z",
    );

    expect(estado.filtros).toEqual(
      expect.arrayContaining([
        ["eq", "telefone_destino", "5584999998888"],
        ["eq", "confirmacao_status", "PENDENTE"],
        ["gt", "confirmacao_expira_em", "2026-07-25T12:00:00.000Z"],
        ["lte", "data_envio", "2026-07-25T12:00:00.000Z"],
      ]),
    );
    expect(estado.ordem).toEqual(["data_envio", { ascending: false }]);
  });

  it("registra cancelamento solicitado com atualização atômica da pendência", async () => {
    await webhookRepository.registrarRespostaConfirmacao({
      historicoId: "hist-1",
      resposta: "2",
      confirmacaoStatus: "CANCELAMENTO_SOLICITADO",
      dataEvento: "2026-07-25T12:00:00.000Z",
    });

    expect(estado.atualizacao).toEqual({
      confirmacao_status: "CANCELAMENTO_SOLICITADO",
      respondido_em: "2026-07-25T12:00:00.000Z",
      resposta_confirmacao: "2",
    });
    expect(estado.filtros).toEqual(
      expect.arrayContaining([
        ["eq", "id", "hist-1"],
        ["eq", "confirmacao_status", "PENDENTE"],
        ["gt", "confirmacao_expira_em", "2026-07-25T12:00:00.000Z"],
      ]),
    );
  });
});
