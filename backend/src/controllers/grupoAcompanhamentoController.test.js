vi.mock("../services/grupoAcompanhamentoService");
vi.mock("../repositories/logRepository");

const grupoAcompanhamentoService = require("../services/grupoAcompanhamentoService");
const logRepository = require("../repositories/logRepository");
const grupoAcompanhamentoController = require("./grupoAcompanhamentoController");

const criarReply = () => {
  const reply = {
    status: vi.fn(() => reply),
    send: vi.fn(() => reply),
  };
  return reply;
};

describe("GrupoAcompanhamentoController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logRepository.registrar = vi.fn().mockResolvedValue();
  });

  it("deve excluir o grupo, responder sucesso e registrar auditoria", async () => {
    const grupo = {
      id: "22222222-2222-2222-2222-222222222222",
      nome: "Hipertensos",
    };
    grupoAcompanhamentoService.excluirGrupo = vi.fn().mockResolvedValue(grupo);
    const request = {
      params: { id: grupo.id },
      headers: { authorization: "Bearer token" },
      user: { id: "admin-1", funcao: "ADMIN" },
    };
    const reply = criarReply();

    await grupoAcompanhamentoController.excluir(request, reply);

    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      mensagem: "Grupo de acompanhamento excluído com sucesso!",
      grupo,
    });
    expect(logRepository.registrar).toHaveBeenCalledWith(
      "admin-1",
      "EXCLUIU_GRUPO_ACOMPANHAMENTO",
      "Excluiu o grupo de acompanhamento: Hipertensos (22222222-2222-2222-2222-222222222222)",
    );
  });
});
