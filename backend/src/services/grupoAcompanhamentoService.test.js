vi.mock("../repositories/grupoAcompanhamentoRepository");
vi.mock("./notificacaoService");

const grupoAcompanhamentoRepository = require("../repositories/grupoAcompanhamentoRepository");
const notificacaoService = require("./notificacaoService");
const grupoAcompanhamentoService = require("./grupoAcompanhamentoService");

const authHeader = "Bearer token-abc";

describe("GrupoAcompanhamentoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listarGrupos", () => {
    it("deve listar grupos chamando o repository", async () => {
      const gruposMock = [
        { id: "1", nome: "Diabéticos", descricao: "Pacientes diabéticos" },
      ];
      grupoAcompanhamentoRepository.listarTodos = vi
        .fn()
        .mockResolvedValue(gruposMock);

      const resultado =
        await grupoAcompanhamentoService.listarGrupos(authHeader);

      expect(grupoAcompanhamentoRepository.listarTodos).toHaveBeenCalledWith(
        authHeader,
      );
      expect(resultado).toEqual(gruposMock);
    });
  });

  describe("criarGrupo", () => {
    it("deve lançar erro sem nome válido", async () => {
      await expect(
        grupoAcompanhamentoService.criarGrupo({ nome: " " }, authHeader),
      ).rejects.toThrow("O nome do grupo deve ter pelo menos 2 caracteres.");
    });

    it("deve criar grupo com payload válido", async () => {
      const grupoMock = {
        id: "1",
        nome: "Hipertensos",
        descricao: "Acompanhamento HAS",
      };
      grupoAcompanhamentoRepository.criar = vi
        .fn()
        .mockResolvedValue(grupoMock);

      const resultado = await grupoAcompanhamentoService.criarGrupo(
        {
          nome: " Hipertensos ",
          descricao: " Acompanhamento HAS ",
        },
        authHeader,
      );

      expect(grupoAcompanhamentoRepository.criar).toHaveBeenCalledWith(
        {
          nome: "Hipertensos",
          descricao: "Acompanhamento HAS",
        },
        authHeader,
      );
      expect(resultado).toEqual(grupoMock);
    });
  });

  describe("dispararMensagens", () => {
    const grupoId = "22222222-2222-2222-2222-222222222222";
    const usuarioId = "11111111-1111-1111-1111-111111111111";
    const pacientes = [
      {
        id: "paciente-1",
        telefone: "(84) 9 9999-8888",
      },
      {
        id: "paciente-2",
        telefone: "85999997777",
      },
    ];

    let sleepOriginal;
    let calcularDelayOriginal;

    beforeEach(() => {
      sleepOriginal = grupoAcompanhamentoService.sleep;
      calcularDelayOriginal = grupoAcompanhamentoService.calcularDelayDisparo;

      grupoAcompanhamentoRepository.listarPacientesDoGrupo = vi
        .fn()
        .mockResolvedValue(pacientes);
      notificacaoService.enviarMensagemPaciente = vi.fn().mockResolvedValue({});
      notificacaoService.registrarFalhaEnvio = vi.fn().mockResolvedValue({});
      notificacaoService.sanitizarTelefone = vi.fn((telefone) => {
        const limpo = telefone.replace(/\D/g, "");
        return limpo.startsWith("55") ? limpo : `55${limpo}`;
      });
      grupoAcompanhamentoService.sleep = vi.fn().mockResolvedValue();
      grupoAcompanhamentoService.calcularDelayDisparo = vi
        .fn()
        .mockReturnValue(3000);
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      grupoAcompanhamentoService.sleep = sleepOriginal;
      grupoAcompanhamentoService.calcularDelayDisparo = calcularDelayOriginal;
      vi.restoreAllMocks();
    });

    it("deve buscar pacientes vinculados ao grupo", async () => {
      await grupoAcompanhamentoService.dispararMensagens(
        grupoId,
        "Mensagem do grupo",
        usuarioId,
        authHeader,
      );

      expect(
        grupoAcompanhamentoRepository.listarPacientesDoGrupo,
      ).toHaveBeenCalledWith(grupoId, authHeader);
    });

    it("deve enviar mensagens em sequência e aplicar sleep após cada sucesso", async () => {
      const eventos = [];
      notificacaoService.enviarMensagemPaciente.mockImplementation(
        async ({ paciente }) => {
          eventos.push(`envio-${paciente.id}`);
        },
      );
      grupoAcompanhamentoService.sleep.mockImplementation(async () => {
        eventos.push("sleep");
      });

      await grupoAcompanhamentoService.dispararMensagens(
        grupoId,
        "Mensagem do grupo",
        usuarioId,
        authHeader,
      );

      expect(eventos).toEqual([
        "envio-paciente-1",
        "sleep",
        "envio-paciente-2",
        "sleep",
      ]);
      expect(grupoAcompanhamentoService.sleep).toHaveBeenCalledTimes(2);
      expect(grupoAcompanhamentoService.sleep).toHaveBeenCalledWith(3000);
    });

    it("deve chamar o envio individual do notificacaoService para cada paciente", async () => {
      await grupoAcompanhamentoService.dispararMensagens(
        grupoId,
        " Mensagem do grupo ",
        usuarioId,
        authHeader,
      );

      expect(notificacaoService.enviarMensagemPaciente).toHaveBeenNthCalledWith(
        1,
        {
          paciente: pacientes[0],
          mensagem: "Mensagem do grupo",
          usuario_id: usuarioId,
        },
      );
      expect(notificacaoService.enviarMensagemPaciente).toHaveBeenNthCalledWith(
        2,
        {
          paciente: pacientes[1],
          mensagem: "Mensagem do grupo",
          usuario_id: usuarioId,
        },
      );
    });

    it('deve registrar status "FALHA" e continuar quando um paciente falhar', async () => {
      notificacaoService.enviarMensagemPaciente
        .mockRejectedValueOnce(new Error("número inválido"))
        .mockResolvedValueOnce({});

      const resultado = await grupoAcompanhamentoService.dispararMensagens(
        grupoId,
        "Mensagem do grupo",
        usuarioId,
        authHeader,
      );

      expect(notificacaoService.enviarMensagemPaciente).toHaveBeenCalledTimes(2);
      expect(notificacaoService.registrarFalhaEnvio).toHaveBeenCalledWith({
        paciente: pacientes[0],
        telefone: "5584999998888",
        mensagem: "Mensagem do grupo",
        usuario_id: usuarioId,
        status: "FALHA",
      });
      expect(resultado).toEqual({
        sucesso: true,
        mensagem: "Disparo finalizado: 1 enviada(s), 1 falha(s).",
        total: 2,
        enviados: 1,
        falhas: 1,
      });
    });

    it("deve aplicar sleep somente após disparo bem-sucedido", async () => {
      notificacaoService.enviarMensagemPaciente
        .mockRejectedValueOnce(new Error("número inválido"))
        .mockResolvedValueOnce({});

      await grupoAcompanhamentoService.dispararMensagens(
        grupoId,
        "Mensagem do grupo",
        usuarioId,
        authHeader,
      );

      expect(grupoAcompanhamentoService.sleep).toHaveBeenCalledTimes(1);
    });

    it("deve lançar erro quando não houver pacientes no grupo", async () => {
      grupoAcompanhamentoRepository.listarPacientesDoGrupo.mockResolvedValue([]);

      await expect(
        grupoAcompanhamentoService.dispararMensagens(
          grupoId,
          "Mensagem do grupo",
          usuarioId,
          authHeader,
        ),
      ).rejects.toThrow("Nenhum paciente vinculado a este grupo.");
    });
  });
});
