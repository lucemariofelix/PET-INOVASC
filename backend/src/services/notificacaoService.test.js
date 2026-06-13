// =============================================================================
// MOCK do repositório — evita carregar Supabase real nos testes do service
// =============================================================================
vi.mock("../repositories/notificacaoRepository");

const notificacaoRepository = require("../repositories/notificacaoRepository");
const notificacaoService = require("./notificacaoService");

// =============================================================================
// Dados base
// =============================================================================
const authHeader = "Bearer token-abc";

const pacientesBase = [
  {
    id: 1,
    nome_completo: "Maria Silva",
    telefone: "84999998888",
  },
];

let originalEnv;

// =============================================================================
// SUÍTE PRINCIPAL
// =============================================================================
describe("NotificacaoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // iniciarDisparoLote
  // ===========================================================================
  describe("iniciarDisparoLote", () => {
    // -----------------------------------------------------------------------
    // 1. Lista de pacientes vazia
    // -----------------------------------------------------------------------
    it("deve lançar erro quando a lista de pacientes estiver vazia", async () => {
      const spy = vi
        .spyOn(notificacaoService, "processarFilaAssincrona")
        .mockResolvedValue();

      await expect(
        notificacaoService.iniciarDisparoLote(
          {
            pacientes: [],
            mensagemBase: "Olá, {nome}",
            usuario_id: 10,
          },
          authHeader,
        ),
      ).rejects.toThrow("A lista de pacientes está vazia.");

      expect(spy).not.toHaveBeenCalled();
    });

    // -----------------------------------------------------------------------
    // 2. Mensagem sem variável {nome}
    // -----------------------------------------------------------------------
    it('deve lançar erro quando mensagemBase não contiver "{nome}"', async () => {
      const spy = vi
        .spyOn(notificacaoService, "processarFilaAssincrona")
        .mockResolvedValue();

      await expect(
        notificacaoService.iniciarDisparoLote(
          {
            pacientes: pacientesBase,
            mensagemBase: "Olá, paciente",
            usuario_id: 10,
          },
          authHeader,
        ),
      ).rejects.toThrow(
        "A mensagem deve conter a variável {nome} para personalização.",
      );

      expect(spy).not.toHaveBeenCalled();
    });

    // -----------------------------------------------------------------------
    // 3. Retorno imediato e processamento fire-and-forget
    // -----------------------------------------------------------------------
    it("deve retornar sucesso imediatamente e chamar processarFilaAssincrona em modo fire-and-forget", async () => {
      const spy = vi
        .spyOn(notificacaoService, "processarFilaAssincrona")
        .mockResolvedValue();

      const resultado = await notificacaoService.iniciarDisparoLote(
        {
          pacientes: pacientesBase,
          mensagemBase: "Olá, {nome}",
          usuario_id: 10,
        },
        authHeader,
      );

      expect(resultado).toEqual({
        sucesso: true,
        mensagem:
          "Disparo em massa iniciado para 1 pacientes. O processo está rodando em segundo plano.",
      });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(pacientesBase, "Olá, {nome}", 10);
    });
  });

  // ===========================================================================
  // processarFilaAssincrona
  // ===========================================================================
  describe("processarFilaAssincrona", () => {
    beforeEach(() => {
      process.env.EVOLUTION_API_URL = "https://evo.example.com";
      process.env.EVOLUTION_API_KEY = "api-key-123";
      process.env.EVOLUTION_INSTANCE_NAME = "ubs_test";

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          text: vi
            .fn()
            .mockResolvedValue(JSON.stringify({ key: { id: "msg-123" } })),
        }),
      );

      notificacaoRepository.registrarEnvio = vi
        .fn()
        .mockResolvedValue({ id: 1 });

      vi.spyOn(console, "log").mockImplementation(() => {});
      vi.spyOn(global, "setTimeout").mockImplementation((callback) => {
        callback();
        return 0;
      });
    });

    // -----------------------------------------------------------------------
    // 4. Envio com sucesso
    // -----------------------------------------------------------------------
    it("deve enviar mensagem para um paciente com sucesso", async () => {
      await notificacaoService.processarFilaAssincrona(
        pacientesBase,
        "Olá, {nome}",
        10,
      );

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        "https://evo.example.com/message/sendText/ubs_test",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: "api-key-123",
          },
        }),
      );
    });

    // -----------------------------------------------------------------------
    // 5. Personalização da mensagem
    // -----------------------------------------------------------------------
    it('deve substituir "{nome}" pelo primeiro nome do paciente', async () => {
      await notificacaoService.processarFilaAssincrona(
        pacientesBase,
        "Olá, {nome}",
        10,
      );

      const [, options] = fetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(body).toEqual({
        number: "5584999998888",
        text: "Olá, Maria",
      });
    });

    // -----------------------------------------------------------------------
    // 6. Registro do envio
    // -----------------------------------------------------------------------
    it('deve registrar envio com status "ENVIADO"', async () => {
      await notificacaoService.processarFilaAssincrona(
        pacientesBase,
        "Olá, {nome}",
        10,
      );

      expect(notificacaoRepository.registrarEnvio).toHaveBeenCalledTimes(1);
      expect(notificacaoRepository.registrarEnvio).toHaveBeenCalledWith({
        paciente_id: 1,
        telefone_destino: "5584999998888",
        texto_enviado: "Olá, Maria",
        status: "ENVIADO",
        usuario_id: 10,
        mensagem_id: "msg-123",
      });
    });

    // -----------------------------------------------------------------------
    // 7. Limpeza de caracteres não numéricos do telefone
    // -----------------------------------------------------------------------
    it("deve limpar caracteres não numéricos do telefone", async () => {
      const pacientes = [
        {
          id: 1,
          nome_completo: "Maria Silva",
          telefone: "(84) 9 9999-8888",
        },
      ];

      await notificacaoService.processarFilaAssincrona(
        pacientes,
        "Olá, {nome}",
        10,
      );

      const [, options] = fetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(body.number).toBe("5584999998888");
    });

    // -----------------------------------------------------------------------
    // 8. Prefixo 55 quando ausente
    // -----------------------------------------------------------------------
    it('deve adicionar o prefixo "55" quando o telefone não começar com "55"', async () => {
      await notificacaoService.processarFilaAssincrona(
        pacientesBase,
        "Olá, {nome}",
        10,
      );

      const [, options] = fetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(body.number).toBe("5584999998888");
    });

    // -----------------------------------------------------------------------
    // 9. Mantém prefixo 55 existente
    // -----------------------------------------------------------------------
    it('deve manter o telefone quando já começar com "55"', async () => {
      const pacientes = [
        {
          id: 1,
          nome_completo: "Maria Silva",
          telefone: "5584999998888",
        },
      ];

      await notificacaoService.processarFilaAssincrona(
        pacientes,
        "Olá, {nome}",
        10,
      );

      const [, options] = fetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(body.number).toBe("5584999998888");
    });

    // -----------------------------------------------------------------------
    // 10. Body enviado para Evolution
    // -----------------------------------------------------------------------
    it("deve enviar para o fetch um body contendo number e text corretos", async () => {
      await notificacaoService.processarFilaAssincrona(
        pacientesBase,
        "Olá, {nome}",
        10,
      );

      const [, options] = fetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(body).toEqual(
        expect.objectContaining({
          number: "5584999998888",
          text: "Olá, Maria",
        }),
      );
    });

    it("deve lançar erro claro quando paciente vier undefined no envio individual", async () => {
      await expect(
        notificacaoService.enviarMensagemPaciente({
          paciente: undefined,
          mensagem: "Olá",
          usuario_id: 10,
        }),
      ).rejects.toThrow("Paciente inválido para envio de mensagem.");

      expect(fetch).not.toHaveBeenCalled();
    });

    it("deve lançar erro claro quando paciente.id estiver ausente no envio individual", async () => {
      await expect(
        notificacaoService.enviarMensagemPaciente({
          paciente: { telefone: "84999998888" },
          mensagem: "Olá",
          usuario_id: 10,
        }),
      ).rejects.toThrow("Paciente inválido para envio de mensagem.");

      expect(fetch).not.toHaveBeenCalled();
    });

    // -----------------------------------------------------------------------
    // 11. Evolution API retorna falha
    // -----------------------------------------------------------------------
    it('deve registrar status "ERRO" quando a Evolution API retornar ok: false', async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue("erro remoto"),
      });

      await notificacaoService.processarFilaAssincrona(
        pacientesBase,
        "Olá, {nome}",
        10,
      );

      expect(notificacaoRepository.registrarEnvio).toHaveBeenCalledTimes(1);
      expect(notificacaoRepository.registrarEnvio).toHaveBeenCalledWith({
        paciente_id: 1,
        telefone_destino: "5584999998888",
        texto_enviado: "Olá, Maria",
        status: "ERRO",
        usuario_id: 10,
        mensagem_id: null,
      });
    });

    // -----------------------------------------------------------------------
    // 12. Fetch lança erro
    // -----------------------------------------------------------------------
    it('deve registrar status "ERRO" quando fetch lançar erro', async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      fetch.mockRejectedValueOnce(new Error("falha de rede"));

      await notificacaoService.processarFilaAssincrona(
        pacientesBase,
        "Olá, {nome}",
        10,
      );

      expect(notificacaoRepository.registrarEnvio).toHaveBeenCalledTimes(1);
      expect(notificacaoRepository.registrarEnvio).toHaveBeenCalledWith({
        paciente_id: 1,
        telefone_destino: "5584999998888",
        texto_enviado: "Olá, Maria",
        status: "ERRO",
        usuario_id: 10,
        mensagem_id: null,
      });
    });

    // -----------------------------------------------------------------------
    // 13. Paciente sem telefone
    // -----------------------------------------------------------------------
    it('deve registrar status "ERRO" quando o paciente não tiver telefone', async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const pacientes = [
        {
          id: 1,
          nome_completo: "Maria Silva",
        },
      ];

      await notificacaoService.processarFilaAssincrona(
        pacientes,
        "Olá, {nome}",
        10,
      );

      expect(fetch).not.toHaveBeenCalled();
      expect(notificacaoRepository.registrarEnvio).toHaveBeenCalledTimes(1);
      expect(notificacaoRepository.registrarEnvio).toHaveBeenCalledWith({
        paciente_id: 1,
        telefone_destino: "N/A",
        texto_enviado: "Olá, Maria",
        status: "ERRO",
        usuario_id: 10,
        mensagem_id: null,
      });
    });

    // -----------------------------------------------------------------------
    // 14. Processamento sequencial de dois pacientes
    // -----------------------------------------------------------------------
    it("deve processar dois pacientes em sequência", async () => {
      const pacientes = [
        {
          id: 1,
          nome_completo: "Maria Silva",
          telefone: "84999998888",
        },
        {
          id: 2,
          nome_completo: "João Souza",
          telefone: "85999997777",
        },
      ];

      await notificacaoService.processarFilaAssincrona(
        pacientes,
        "Olá, {nome}",
        10,
      );

      const primeiroBody = JSON.parse(fetch.mock.calls[0][1].body);
      const segundoBody = JSON.parse(fetch.mock.calls[1][1].body);

      expect(primeiroBody).toEqual(
        expect.objectContaining({
          number: "5584999998888",
          text: "Olá, Maria",
        }),
      );
      expect(segundoBody).toEqual(
        expect.objectContaining({
          number: "5585999997777",
          text: "Olá, João",
        }),
      );
    });

    // -----------------------------------------------------------------------
    // 15. Uma chamada fetch por paciente
    // -----------------------------------------------------------------------
    it("deve chamar fetch uma vez para cada paciente", async () => {
      const pacientes = [
        {
          id: 1,
          nome_completo: "Maria Silva",
          telefone: "84999998888",
        },
        {
          id: 2,
          nome_completo: "João Souza",
          telefone: "85999997777",
        },
      ];

      await notificacaoService.processarFilaAssincrona(
        pacientes,
        "Olá, {nome}",
        10,
      );

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    // -----------------------------------------------------------------------
    // 16. Um registro por paciente
    // -----------------------------------------------------------------------
    it("deve registrar envio para cada paciente", async () => {
      const pacientes = [
        {
          id: 1,
          nome_completo: "Maria Silva",
          telefone: "84999998888",
        },
        {
          id: 2,
          nome_completo: "João Souza",
          telefone: "85999997777",
        },
      ];

      await notificacaoService.processarFilaAssincrona(
        pacientes,
        "Olá, {nome}",
        10,
      );

      expect(notificacaoRepository.registrarEnvio).toHaveBeenCalledTimes(2);
      expect(notificacaoRepository.registrarEnvio).toHaveBeenNthCalledWith(1, {
        paciente_id: 1,
        telefone_destino: "5584999998888",
        texto_enviado: "Olá, Maria",
        status: "ENVIADO",
        usuario_id: 10,
        mensagem_id: "msg-123",
      });
      expect(notificacaoRepository.registrarEnvio).toHaveBeenNthCalledWith(2, {
        paciente_id: 2,
        telefone_destino: "5585999997777",
        texto_enviado: "Olá, João",
        status: "ENVIADO",
        usuario_id: 10,
        mensagem_id: "msg-123",
      });
    });

    // -----------------------------------------------------------------------
    // 17. Fallback para paciente.nome
    // -----------------------------------------------------------------------
    it("deve usar paciente.nome quando nome_completo não existir", async () => {
      const pacientes = [
        {
          id: 1,
          nome: "Ana Costa",
          telefone: "84999998888",
        },
      ];

      await notificacaoService.processarFilaAssincrona(
        pacientes,
        "Olá, {nome}",
        10,
      );

      expect(notificacaoRepository.registrarEnvio).toHaveBeenCalledWith(
        expect.objectContaining({
          texto_enviado: "Olá, Ana",
        }),
      );
    });

    // -----------------------------------------------------------------------
    // 18. Fallback para "Paciente"
    // -----------------------------------------------------------------------
    it('deve usar "Paciente" quando não houver nome_completo nem nome', async () => {
      const pacientes = [
        {
          id: 1,
          telefone: "84999998888",
        },
      ];

      await notificacaoService.processarFilaAssincrona(
        pacientes,
        "Olá, {nome}",
        10,
      );

      expect(notificacaoRepository.registrarEnvio).toHaveBeenCalledWith(
        expect.objectContaining({
          texto_enviado: "Olá, Paciente",
        }),
      );
    });

    // -----------------------------------------------------------------------
    // 19. mensagem_id vindo de key.id
    // -----------------------------------------------------------------------
    it("deve registrar mensagem_id usando key.id quando existir", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        text: vi
          .fn()
          .mockResolvedValue(JSON.stringify({ key: { id: "msg-key-456" } })),
      });

      await notificacaoService.processarFilaAssincrona(
        pacientesBase,
        "Olá, {nome}",
        10,
      );

      expect(notificacaoRepository.registrarEnvio).toHaveBeenCalledWith(
        expect.objectContaining({
          mensagem_id: "msg-key-456",
        }),
      );
    });

    // -----------------------------------------------------------------------
    // 20. mensagem_id vindo de id
    // -----------------------------------------------------------------------
    it("deve registrar mensagem_id usando id quando key.id não existir", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ id: "msg-id-789" })),
      });

      await notificacaoService.processarFilaAssincrona(
        pacientesBase,
        "Olá, {nome}",
        10,
      );

      expect(notificacaoRepository.registrarEnvio).toHaveBeenCalledWith(
        expect.objectContaining({
          mensagem_id: "msg-id-789",
        }),
      );
    });
  });
});
