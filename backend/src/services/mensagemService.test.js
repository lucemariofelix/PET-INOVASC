// =============================================================================
// MOCK do repositório — hoisted pelo Vitest antes de qualquer import
// =============================================================================
vi.mock("../repositories/mensagemRepository");

const mensagemRepository = require("../repositories/mensagemRepository");
const mensageriaService = require("./mensageriaService");
const mensagemService = require("./mensagemService");

// =============================================================================
// Dados base reaproveitados em vários testes
// =============================================================================
const dadosBase = {
  paciente_id: 10,
  consulta_id: 20,
  telefone: "84999998888",
  nome: "Maria Silva",
  profissional: "Médico",
  status_consulta: "AGENDADA",
  data_referencia: "2026-07-15",
  consentimento_msg: true,
};

const authHeader = "Bearer token-abc";

// =============================================================================
// Helpers de env
// =============================================================================
let originalEnv;

beforeEach(() => {
  vi.clearAllMocks();
  originalEnv = { ...process.env };

  // Configura env completo por padrão (modo REAL)
  process.env.EVOLUTION_API_URL = "https://evo.example.com";
  process.env.EVOLUTION_API_KEY = "api-key-123";
  process.env.EVOLUTION_INSTANCE_NAME = "ubs_test";

  // Mock do fetch global
  vi.stubGlobal("fetch", vi.fn());

  // A conexão real é coberta separadamente; aqui isolamos o envio.
  vi.spyOn(mensageriaService, "verificarConexaoWhatsApp")
    .mockResolvedValue({ conectado: true, estado: "open" });
  vi.spyOn(mensageriaService, "verificarNumeroWhatsApp").mockResolvedValue({
    number: "5584999998888",
    exists: true,
  });

  // Mock do repository
  mensagemRepository.salvarHistorico = vi.fn().mockResolvedValue({
    id: "historico-1",
    mensagem_id: "MSG-ABC-123",
    consulta_id: 20,
    status: "ENVIADO",
    data_envio: "2026-07-21T22:50:00.000Z",
  });
  mensagemRepository.reservarDisparoConfirmacao = vi.fn().mockResolvedValue({
    permitido: true,
    historico_id: "reserva-confirmacao-1",
    confirmacao_expira_em: "2026-07-28T22:50:00.000Z",
  });
  mensagemRepository.finalizarDisparoConfirmacao = vi.fn().mockResolvedValue({
    id: "reserva-confirmacao-1",
    mensagem_id: "MSG-ABC-123",
    consulta_id: 20,
    status: "ENVIADO",
    confirmacao_status: "PENDENTE",
    confirmacao_expira_em: "2026-07-28T22:50:00.000Z",
  });
  mensagemRepository.falharDisparoConfirmacao = vi.fn().mockResolvedValue(true);
  mensagemRepository.listarUltimasPorConsultas = vi.fn().mockResolvedValue([]);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  process.env = originalEnv;
});

// =============================================================================
// SUÍTE PRINCIPAL
// =============================================================================
describe("MensagemService", () => {
  describe("dispararMensagem", () => {
    // -----------------------------------------------------------------------
    // 1. Telefone ausente
    // -----------------------------------------------------------------------
    it("deve lançar erro quando telefone estiver ausente", async () => {
      await expect(
        mensagemService.dispararMensagem(
          {
            nome: "João",
            profissional: "Enfermeiro",
            status_consulta: "AGENDADA",
            data_referencia: "2026-08-01",
          },
          authHeader,
        ),
      ).rejects.toThrow(
        "Este paciente não possui um número de telefone cadastrado.",
      );
    });

    it("deve impedir o envio e retornar conflito quando o WhatsApp estiver desconectado", async () => {
      mensageriaService.verificarConexaoWhatsApp.mockRejectedValue(
        Object.assign(new Error("WhatsApp desconectado"), {
          statusCode: 409,
          code: "WHATSAPP_DESCONECTADO",
        }),
      );

      await expect(
        mensagemService.dispararMensagem(dadosBase, authHeader),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: "WHATSAPP_DESCONECTADO",
      });

      expect(fetch).not.toHaveBeenCalled();
      expect(mensagemRepository.salvarHistorico).not.toHaveBeenCalled();
    });

    // -----------------------------------------------------------------------
    // 2. Modo simulação — Evolution não configurada
    // -----------------------------------------------------------------------
    it("deve funcionar em modo simulação quando a Evolution API não estiver configurada", async () => {
      // Arrange: remove todas as variáveis de ambiente da Evolution
      delete process.env.EVOLUTION_API_URL;
      delete process.env.EVOLUTION_API_KEY;
      delete process.env.EVOLUTION_INSTANCE_NAME;

      // Act
      const resultado = await mensagemService.dispararMensagem(
        dadosBase,
        authHeader,
      );

      // Assert
      expect(resultado).toEqual({
        aviso: "Mensagem simulada. Configure as variáveis.",
        mensagem: expect.objectContaining({ id: "historico-1" }),
      });
    });

    // -----------------------------------------------------------------------
    // 3. Modo simulação — não chama fetch
    // -----------------------------------------------------------------------
    it("deve não chamar fetch no modo simulação", async () => {
      // Arrange
      delete process.env.EVOLUTION_API_URL;
      delete process.env.EVOLUTION_API_KEY;
      delete process.env.EVOLUTION_INSTANCE_NAME;

      // Act
      await mensagemService.dispararMensagem(dadosBase, authHeader);

      // Assert
      expect(fetch).not.toHaveBeenCalled();
    });

    // -----------------------------------------------------------------------
    // 4. Modo simulação — salva histórico com status SIMULADO
    // -----------------------------------------------------------------------
    it('deve salvar histórico com status "SIMULADO" no modo simulação', async () => {
      // Arrange
      delete process.env.EVOLUTION_API_URL;
      delete process.env.EVOLUTION_API_KEY;
      delete process.env.EVOLUTION_INSTANCE_NAME;

      // Act
      await mensagemService.dispararMensagem(dadosBase, authHeader);

      // Assert
      expect(mensagemRepository.salvarHistorico).toHaveBeenCalledTimes(1);
      expect(mensagemRepository.salvarHistorico).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "SIMULADO",
          telefone_destino: "5584999998888",
          paciente_id: 10,
          consulta_id: 20,
        }),
        authHeader,
      );
    });

    // -----------------------------------------------------------------------
    // 5. Envio real com sucesso
    // -----------------------------------------------------------------------
    it("deve enviar mensagem com sucesso quando Evolution estiver configurada e fetch for mockado", async () => {
      // Arrange
      const evolutionResponse = {
        key: { id: "MSG-ABC-123" },
        status: "PENDING",
      };
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(evolutionResponse)),
      });

      // Act
      const resultado = await mensagemService.dispararMensagem(
        dadosBase,
        authHeader,
      );

      // Assert: fetch chamado com parâmetros corretos
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(
        mensageriaService.verificarNumeroWhatsApp,
      ).toHaveBeenCalledWith("5584999998888");

      const [url, options] = fetch.mock.calls[0];
      expect(url).toBe("https://evo.example.com/message/sendText/ubs_test");
      expect(options.method).toBe("POST");
      expect(options.headers).toEqual({
        "Content-Type": "application/json",
        apikey: "api-key-123",
      });

      const body = JSON.parse(options.body);
      expect(body.number).toBe("5584999998888");
      expect(body.text).toContain("Olá, *Maria Silva*!");

      expect(resultado).toEqual({
        mensagem: expect.objectContaining({ id: "historico-1" }),
      });
    });

    // -----------------------------------------------------------------------
    // 6. Envio real — salva histórico com status ENVIADO e mensagem_id
    // -----------------------------------------------------------------------
    it('deve salvar histórico com status "ENVIADO" e mensagem_id retornado pela Evolution', async () => {
      // Arrange
      const evolutionResponse = {
        key: { id: "MSG-XYZ-456" },
        status: "PENDING",
      };
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(evolutionResponse)),
      });

      // Act
      await mensagemService.dispararMensagem(dadosBase, authHeader);

      // Assert
      expect(mensagemRepository.salvarHistorico).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "ENVIADO",
          mensagem_id: "MSG-XYZ-456",
          telefone_destino: "5584999998888",
        }),
        authHeader,
      );
    });

    // -----------------------------------------------------------------------
    // 7. Falha da Evolution API
    // -----------------------------------------------------------------------
    it("deve ocultar detalhes quando a Evolution rejeitar um payload inválido", async () => {
      // Arrange
      vi.spyOn(console, "error").mockImplementation(() => {});
      fetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: () =>
          Promise.resolve(
            '{"response":{"message":[["buttons[0] requires property type"]]}}',
          ),
      });

      // Act & Assert
      await expect(
        mensagemService.dispararMensagem(dadosBase, authHeader),
      ).rejects.toMatchObject({
        statusCode: 502,
        code: "WHATSAPP_PROVIDER_ERROR",
        message:
          "Não foi possível enviar a mensagem pelo WhatsApp. Tente novamente mais tarde.",
      });

      // Não deve salvar histórico em caso de falha
      expect(mensagemRepository.salvarHistorico).not.toHaveBeenCalled();
    });

    it("deve bloquear envio quando o paciente não tiver consentimento", async () => {
      await expect(
        mensagemService.dispararMensagem(
          {
            ...dadosBase,
            consentimento_msg: false,
          },
          authHeader,
        ),
      ).rejects.toThrow(
        "Paciente não autorizou o recebimento de mensagens via WhatsApp.",
      );

      expect(fetch).not.toHaveBeenCalled();
      expect(mensagemRepository.salvarHistorico).not.toHaveBeenCalled();
    });

    it("deve usar template de agendamento quando tipo for AGENDAMENTO_CONSULTA", async () => {
      const evolutionResponse = {
        key: { id: "MSG-AGENDAMENTO" },
        status: "PENDING",
      };
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(evolutionResponse)),
      });

      await mensagemService.dispararMensagem(
        {
          ...dadosBase,
          tipo: "AGENDAMENTO_CONSULTA",
        },
        authHeader,
      );

      const [, options] = fetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(body.text).toContain("foi agendada para *15/07/2026*");
      expect(mensagemRepository.salvarHistorico).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_mensagem: "AGENDAMENTO_CONSULTA",
        }),
        authHeader,
      );
    });

    it("deve enviar botao de confirmação quando solicitado", async () => {
      const evolutionResponse = {
        key: { id: "MSG-BOTAO" },
        status: "PENDING",
      };
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(evolutionResponse)),
      });

      await mensagemService.dispararMensagem(
        {
          ...dadosBase,
          usarBotaoConfirmacao: true,
        },
        authHeader,
      );

      const [url, options] = fetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(url).toBe("https://evo.example.com/message/sendButtons/ubs_test");
      expect(body.buttons).toEqual([
        expect.objectContaining({
          type: "reply",
          displayText: "Confirmar presença",
          id: expect.stringMatching(
            /^CONFIRMAR_PRESENCA:20:[0-9a-f-]{36}$/,
          ),
        }),
      ]);
      const botaoId = body.buttons[0].id;
      expect(mensagemRepository.reservarDisparoConfirmacao).toHaveBeenCalledWith(
        expect.objectContaining({
          botao_id: botaoId,
        }),
        authHeader,
      );
      expect(
        mensagemRepository.finalizarDisparoConfirmacao,
      ).toHaveBeenCalledWith(
        "reserva-confirmacao-1",
        "MSG-BOTAO",
        authHeader,
      );
    });

    it("deve solicitar confirmação por menu textual usando sendText", async () => {
      const evolutionResponse = {
        key: { id: "MSG-MENU-TEXTO" },
        status: "PENDING",
      };
      fetch.mockResolvedValue({
        ok: true,
        status: 201,
        text: () => Promise.resolve(JSON.stringify(evolutionResponse)),
      });
      await mensagemService.dispararMensagem(
        {
          ...dadosBase,
          solicitarConfirmacao: true,
          usarBotaoConfirmacao: true,
        },
        authHeader,
      );

      const [url, options] = fetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(url).toBe("https://evo.example.com/message/sendText/ubs_test");
      expect(body.text).toContain("1 — Confirmar presença");
      expect(body.text).toContain("2 — Solicitar cancelamento");
      expect(body.buttons).toBeUndefined();

      expect(mensagemRepository.reservarDisparoConfirmacao).toHaveBeenCalledWith(
        expect.objectContaining({
          consulta_id: 20,
          botao_id: null,
          texto_enviado: expect.stringContaining("1 — Confirmar presença"),
        }),
        authHeader,
      );
      expect(
        mensagemRepository.finalizarDisparoConfirmacao,
      ).toHaveBeenCalledWith(
        "reserva-confirmacao-1",
        "MSG-MENU-TEXTO",
        authHeader,
      );
      expect(mensagemRepository.salvarHistorico).not.toHaveBeenCalled();
    });

    it.each([
      ["CONFIRMATION_PENDING", "aguardando resposta"],
      ["CONSULTATION_ALREADY_CONFIRMED", "já foi confirmada"],
      ["CANCELLATION_ALREADY_REQUESTED", "solicitação de cancelamento"],
    ])(
      "deve bloquear no backend sem chamar a Evolution para %s",
      async (codigo, trechoMensagem) => {
        mensagemRepository.reservarDisparoConfirmacao.mockResolvedValue({
          permitido: false,
          codigo,
          historico_id: "historico-bloqueador",
        });

        await expect(
          mensagemService.dispararMensagem(
            { ...dadosBase, solicitarConfirmacao: true },
            authHeader,
          ),
        ).rejects.toMatchObject({
          statusCode: 409,
          code: codigo,
          message: expect.stringContaining(trechoMensagem),
        });

        expect(fetch).not.toHaveBeenCalled();
        expect(
          mensageriaService.verificarConexaoWhatsApp,
        ).not.toHaveBeenCalled();
        expect(
          mensagemRepository.finalizarDisparoConfirmacao,
        ).not.toHaveBeenCalled();
      },
    );

    it("deve exigir consulta para uma mensagem com confirmação", async () => {
      await expect(
        mensagemService.dispararMensagem(
          {
            ...dadosBase,
            consulta_id: undefined,
            solicitarConfirmacao: true,
          },
          authHeader,
        ),
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR", statusCode: 400 });

      expect(
        mensagemRepository.reservarDisparoConfirmacao,
      ).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    });

    it("deve liberar a reserva quando o provedor falhar antes de aceitar o envio", async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 503,
        text: () => Promise.resolve("provider unavailable"),
      });
      vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(
        mensagemService.dispararMensagem(
          { ...dadosBase, solicitarConfirmacao: true },
          authHeader,
        ),
      ).rejects.toMatchObject({ code: "WHATSAPP_PROVIDER_ERROR" });

      expect(mensagemRepository.falharDisparoConfirmacao).toHaveBeenCalledWith(
        "reserva-confirmacao-1",
        authHeader,
      );
    });

    it("deve manter a reserva se o provedor aceitar e a finalização falhar", async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 201,
        text: () =>
          Promise.resolve(
            JSON.stringify({ key: { id: "MSG-ACEITA" }, status: "PENDING" }),
          ),
      });
      mensagemRepository.finalizarDisparoConfirmacao.mockRejectedValue(
        new Error("banco indisponível"),
      );

      await expect(
        mensagemService.dispararMensagem(
          { ...dadosBase, solicitarConfirmacao: true },
          authHeader,
        ),
      ).rejects.toThrow("banco indisponível");

      expect(
        mensagemRepository.falharDisparoConfirmacao,
      ).not.toHaveBeenCalled();
    });

    it("deve permitir somente uma chamada ao provedor em disparos concorrentes", async () => {
      mensagemRepository.reservarDisparoConfirmacao
        .mockResolvedValueOnce({
          permitido: true,
          historico_id: "reserva-concorrente",
        })
        .mockResolvedValueOnce({
          permitido: false,
          codigo: "CONFIRMATION_PENDING",
          historico_id: "reserva-concorrente",
        });
      fetch.mockResolvedValue({
        ok: true,
        status: 201,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              key: { id: "MSG-CONCORRENTE" },
              status: "PENDING",
            }),
          ),
      });

      const resultados = await Promise.allSettled([
        mensagemService.dispararMensagem(
          { ...dadosBase, solicitarConfirmacao: true },
          authHeader,
        ),
        mensagemService.dispararMensagem(
          { ...dadosBase, solicitarConfirmacao: true },
          authHeader,
        ),
      ]);

      expect(resultados.map((resultado) => resultado.status).sort()).toEqual([
        "fulfilled",
        "rejected",
      ]);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("deve manter mensagens sem confirmação fora da reserva", async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 201,
        text: () =>
          Promise.resolve(
            JSON.stringify({ key: { id: "MSG-AVISO" }, status: "PENDING" }),
          ),
      });

      await mensagemService.dispararMensagem(
        { ...dadosBase, tipo: "AVISO_GERAL" },
        authHeader,
      );

      expect(
        mensagemRepository.reservarDisparoConfirmacao,
      ).not.toHaveBeenCalled();
      expect(mensagemRepository.salvarHistorico).toHaveBeenCalledTimes(1);
    });

    it("deve registrar resposta automática com ID correlacionável", async () => {
      vi.spyOn(mensageriaService, "enviarEvolution").mockResolvedValue({
        key: { id: "MSG-RESPOSTA-AUTOMATICA" },
        status: "PENDING",
      });
      vi.spyOn(mensageriaService, "registrarHistorico").mockResolvedValue({
        id: "hist-resposta",
      });

      await mensageriaService.enviarRespostaAutomatica({
        telefone: "5584999998888",
        texto: "Resposta automática segura",
        referencia: {
          paciente_id: "paciente-1",
          consulta_id: "consulta-1",
        },
      });

      expect(mensageriaService.enviarEvolution).toHaveBeenCalledWith({
        telefone: "5584999998888",
        texto: "Resposta automática segura",
        usarBotaoConfirmacao: false,
        botaoId: null,
      });
      expect(mensageriaService.registrarHistorico).toHaveBeenCalledWith(
        expect.objectContaining({
          mensagem_id: "MSG-RESPOSTA-AUTOMATICA",
          tipo_mensagem: "RESPOSTA_AUTOMATICA",
          status: "ENVIADO",
          consulta_id: null,
          botao_id: null,
        }),
      );
    });

    it("deve listar somente os IDs únicos e válidos solicitados", async () => {
      const consulta1 = "11111111-1111-4111-8111-111111111111";
      const consulta2 = "22222222-2222-4222-8222-222222222222";

      await mensagemService.listarStatusMensagens(
        `${consulta1},${consulta2},${consulta1}`,
        authHeader,
      );

      expect(mensagemRepository.listarUltimasPorConsultas).toHaveBeenCalledWith(
        [consulta1, consulta2],
        authHeader,
      );
    });

    it("deve rejeitar consulta de status com ID inválido", async () => {
      await expect(
        mensagemService.listarStatusMensagens("id-invalido", authHeader),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: "VALIDATION_ERROR",
      });
    });

    it.each([
      ["84999998888", "5584999998888"],
      ["(84) 9 9999-8888", "5584999998888"],
      ["5584999998888", "5584999998888"],
    ])("deve normalizar celular brasileiro válido %s", (entrada, esperado) => {
      expect(mensageriaService.sanitizarTelefone(entrada)).toBe(esperado);
    });

    it.each([
      "8499998888",
      "5500999998888",
      "558499998888",
      "15584999998888",
    ])("deve rejeitar telefone inválido %s", (telefone) => {
      expect(() => mensageriaService.sanitizarTelefone(telefone)).toThrow(
        /celular brasileiro/i,
      );
    });

    it("deve rejeitar HTTP 2xx sem identificador da mensagem", async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ status: "PENDING" })),
      });

      await expect(
        mensagemService.dispararMensagem(dadosBase, authHeader),
      ).rejects.toMatchObject({
        statusCode: 502,
        code: "WHATSAPP_PROVIDER_ERROR",
      });
      expect(mensagemRepository.salvarHistorico).not.toHaveBeenCalled();
    });

    it("deve rejeitar resposta de envio com JSON inválido", async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve("resposta-invalida"),
      });

      await expect(
        mensagemService.dispararMensagem(dadosBase, authHeader),
      ).rejects.toMatchObject({ code: "WHATSAPP_PROVIDER_ERROR" });
      expect(mensagemRepository.salvarHistorico).not.toHaveBeenCalled();
    });

    it("deve rejeitar status interno de falha mesmo com key.id", async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({ key: { id: "MSG-FALHA" }, status: "FAILED" }),
          ),
      });

      await expect(
        mensagemService.dispararMensagem(dadosBase, authHeader),
      ).rejects.toMatchObject({ code: "WHATSAPP_PROVIDER_ERROR" });
      expect(mensagemRepository.salvarHistorico).not.toHaveBeenCalled();
    });

    it("deve validar a existência do número no preflight", async () => {
      mensageriaService.verificarNumeroWhatsApp.mockRestore();
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              numbers: [{ number: "5584999998888", exists: true }],
            }),
          ),
      });

      await expect(
        mensageriaService.verificarNumeroWhatsApp("5584999998888"),
      ).resolves.toMatchObject({ exists: true });
      expect(fetch).toHaveBeenCalledWith(
        "https://evo.example.com/chat/whatsappNumbers/ubs_test",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ numbers: ["5584999998888"] }),
        }),
      );
    });

    it("deve rejeitar número inexistente no WhatsApp", async () => {
      mensageriaService.verificarNumeroWhatsApp.mockRestore();
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify([
              { number: "5584999998888", exists: false },
            ]),
          ),
      });

      await expect(
        mensageriaService.verificarNumeroWhatsApp("5584999998888"),
      ).rejects.toMatchObject({
        statusCode: 422,
        code: "WHATSAPP_NUMBER_NOT_FOUND",
      });
    });

    it("deve falhar fechado quando o preflight estiver indisponível", async () => {
      mensageriaService.verificarNumeroWhatsApp.mockRestore();
      fetch.mockRejectedValue(new Error("offline"));

      await expect(
        mensageriaService.verificarNumeroWhatsApp("5584999998888"),
      ).rejects.toMatchObject({
        statusCode: 502,
        code: "WHATSAPP_PROVIDER_ERROR",
      });
    });

    it("deve manter dados sensíveis fora dos logs diagnósticos", async () => {
      process.env.EVOLUTION_DIAGNOSTICS = "true";
      const log = vi.spyOn(console, "log").mockImplementation(() => {});
      fetch.mockResolvedValue({
        ok: true,
        status: 201,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              key: {
                id: "MSG-LOG-1",
                remoteJid: "5584999998888@s.whatsapp.net",
              },
              status: "PENDING",
            }),
          ),
      });

      await mensagemService.dispararMensagem(dadosBase, authHeader);

      const logs = log.mock.calls.flat().join(" ");
      expect(logs).not.toContain("api-key-123");
      expect(logs).not.toContain("5584999998888");
      expect(logs).not.toContain("Olá, *Maria Silva*!");
      expect(logs).toContain("55*********88");
    });
  });
});
