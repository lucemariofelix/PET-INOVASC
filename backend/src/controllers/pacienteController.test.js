vi.mock("../services/pacienteService");
vi.mock("../repositories/logRepository");

const pacienteService = require("../services/pacienteService");
const logRepository = require("../repositories/logRepository");
const pacienteController = require("./pacienteController");

describe("PacienteController atualização", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna o paciente completo confirmado e registra auditoria", async () => {
    const atualizado = {
      id: "paciente-1",
      agente_id: null,
      acs: null,
      agente: null,
    };
    pacienteService.atualizarPaciente = vi.fn().mockResolvedValue(atualizado);
    logRepository.registrar = vi.fn().mockResolvedValue(undefined);
    const request = {
      params: { id: "paciente-1" },
      body: { agente_id: null },
      headers: { authorization: "Bearer token" },
      user: { id: "admin-1" },
    };
    const reply = {
      status: vi.fn(function status() {
        return this;
      }),
      send: vi.fn((payload) => payload),
    };

    await pacienteController.atualizar(request, reply);

    expect(pacienteService.atualizarPaciente).toHaveBeenCalledWith(
      "paciente-1",
      { agente_id: null },
      "Bearer token",
    );
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      mensagem: "Paciente atualizado com sucesso!",
      paciente: atualizado,
    });
    expect(logRepository.registrar).toHaveBeenCalledWith(
      "admin-1",
      "ATUALIZOU_PACIENTE",
      "Atualizou os dados do paciente ID: paciente-1",
    );
  });
});
