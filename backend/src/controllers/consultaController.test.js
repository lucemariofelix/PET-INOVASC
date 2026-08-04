vi.mock("../services/consultaService");
vi.mock("../repositories/logRepository");

const consultaService = require("../services/consultaService");
const logRepository = require("../repositories/logRepository");
const consultaController = require("./consultaController");

const criarReply = () => {
  const reply = {
    status: vi.fn(() => reply),
    send: vi.fn(() => reply),
  };
  return reply;
};

describe("ConsultaController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logRepository.registrar = vi.fn().mockResolvedValue();
  });

  it.each([
    ["REALIZADA", "REGISTROU_CONSULTA_REALIZADA"],
    ["FALTOU", "REGISTROU_FALTA_CONSULTA"],
  ])("audita o desfecho %s", async (status, acao) => {
    const resultado = {
      consulta: {
        id: "consulta-1",
        paciente_id: "paciente-1",
        status_consulta: status,
      },
      notificacao: { enviada: false, aviso: null },
      ja_registrado: false,
    };
    consultaService.registrarDesfecho = vi.fn().mockResolvedValue(resultado);
    const request = {
      params: { id: "consulta-1" },
      body: { desfecho: status.toLowerCase() },
      headers: { authorization: "Bearer token" },
      user: { id: "usuario-1" },
    };
    const reply = criarReply();

    await consultaController.registrarDesfecho(request, reply);

    expect(consultaService.registrarDesfecho).toHaveBeenCalledWith(
      "consulta-1",
      status,
      "Bearer token",
    );
    expect(logRepository.registrar).toHaveBeenCalledWith(
      "usuario-1",
      acao,
      expect.stringContaining("consulta-1"),
    );
    expect(reply.status).toHaveBeenCalledWith(200);
  });
});
