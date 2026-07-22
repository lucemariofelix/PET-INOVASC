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

  // Mock do repository
  mensagemRepository.salvarHistorico = vi.fn().mockResolvedValue({ id: 1 });
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

      expect(resultado).toEqual(evolutionResponse);
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
        {
          type: "reply",
          displayText: "Confirmar presença",
          id: "CONFIRMAR_PRESENCA:20",
        },
      ]);
      expect(mensagemRepository.salvarHistorico).toHaveBeenCalledWith(
        expect.objectContaining({
          confirmacao_status: "PENDENTE",
          botao_id: "CONFIRMAR_PRESENCA:20",
        }),
        authHeader,
      );
    });
  });
});
