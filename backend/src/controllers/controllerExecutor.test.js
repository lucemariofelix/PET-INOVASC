vi.mock("../repositories/logRepository");

const logRepository = require("../repositories/logRepository");
const { executarController } = require("./controllerExecutor");

describe("controllerExecutor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logRepository.registrar = vi.fn().mockResolvedValue();
  });

  it("deve executar ação, registrar auditoria de sucesso e responder", async () => {
    const request = { user: { id: "user-1" } };
    const reply = { send: vi.fn() };

    await executarController(request, reply, {
      executar: vi.fn().mockResolvedValue({ id: "resultado-1" }),
      auditoria: ({ resultado }) => ({
        acao: "ACAO_TESTE",
        detalhes: `Resultado ${resultado.id}`,
      }),
      responder: (resultado) => reply.send(resultado),
    });

    expect(logRepository.registrar).toHaveBeenCalledWith(
      "user-1",
      "ACAO_TESTE",
      "Resultado resultado-1",
    );
    expect(reply.send).toHaveBeenCalledWith({ id: "resultado-1" });
  });

  it("deve registrar auditoria de falha e relançar erro", async () => {
    const erro = new Error("falha");
    const request = { body: { email: "teste@ubs.com" } };

    await expect(
      executarController(request, {}, {
        executar: vi.fn().mockRejectedValue(erro),
        auditoriaFalha: ({ request: req }) => ({
          usuario_id: null,
          acao: "FALHA_TESTE",
          detalhes: req.body.email,
        }),
        responder: vi.fn(),
      }),
    ).rejects.toThrow("falha");

    expect(logRepository.registrar).toHaveBeenCalledWith(
      null,
      "FALHA_TESTE",
      "teste@ubs.com",
    );
  });
});
