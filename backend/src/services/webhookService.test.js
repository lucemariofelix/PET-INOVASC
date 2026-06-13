// =============================================================================
// MOCK do repositório — evita carregar Supabase real nos testes do service
// =============================================================================
vi.mock("../repositories/webhookRepository");

const webhookRepository = require("../repositories/webhookRepository");
const webhookService = require("./webhookService");

// =============================================================================
// Helpers
// =============================================================================
const criarPayload = (status) => ({
  event: "messages.update",
  data: {
    keyId: "msg-123",
    update: { status },
  },
});

// =============================================================================
// SUÍTE PRINCIPAL
// =============================================================================
describe("WebhookService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    webhookRepository.atualizarStatusMensagem = vi.fn().mockResolvedValue([]);
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // processarEvento
  // ===========================================================================
  describe("processarEvento", () => {
    // -----------------------------------------------------------------------
    // 1. Evento ignorado
    // -----------------------------------------------------------------------
    it('deve ignorar evento diferente de "messages.update"', async () => {
      await expect(
        webhookService.processarEvento({
          event: "connection.update",
          data: {
            key: { id: "msg-123" },
            update: { status: "READ" },
          },
        }),
      ).resolves.toBeUndefined();
    });

    // -----------------------------------------------------------------------
    // 2. Repository não é chamado para evento ignorado
    // -----------------------------------------------------------------------
    it("deve não chamar webhookRepository.atualizarStatusMensagem quando o evento for ignorado", async () => {
      webhookRepository.atualizarStatusMensagem = vi.fn().mockResolvedValue([]);

      await webhookService.processarEvento({
        event: "connection.update",
        data: {
          key: { id: "msg-123" },
          update: { status: "READ" },
        },
      });

      expect(webhookRepository.atualizarStatusMensagem).not.toHaveBeenCalled();
    });

    // -----------------------------------------------------------------------
    // 3. Status 2 -> ENTREGUE
    // -----------------------------------------------------------------------
    it('deve mapear status "2" para "ENTREGUE"', async () => {
      await webhookService.processarEvento(criarPayload("2"));

      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledTimes(
        1,
      );
      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledWith(
        "msg-123",
        "ENTREGUE",
      );
    });

    // -----------------------------------------------------------------------
    // 4. Status DELIVERY_ACK -> ENTREGUE
    // -----------------------------------------------------------------------
    it('deve mapear status "DELIVERY_ACK" para "ENTREGUE"', async () => {
      await webhookService.processarEvento(criarPayload("DELIVERY_ACK"));

      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledTimes(
        1,
      );
      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledWith(
        "msg-123",
        "ENTREGUE",
      );
    });

    // -----------------------------------------------------------------------
    // 5. Status RECEIVED -> ENTREGUE
    // -----------------------------------------------------------------------
    it('deve mapear status "RECEIVED" para "ENTREGUE"', async () => {
      await webhookService.processarEvento(criarPayload("RECEIVED"));

      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledTimes(
        1,
      );
      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledWith(
        "msg-123",
        "ENTREGUE",
      );
    });

    it('deve mapear status "DELIVERED" para "ENTREGUE"', async () => {
      await webhookService.processarEvento(criarPayload("DELIVERED"));

      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledTimes(
        1,
      );
      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledWith(
        "msg-123",
        "ENTREGUE",
      );
    });

    // -----------------------------------------------------------------------
    // 6. Status 3 -> ENTREGUE
    // -----------------------------------------------------------------------
    it('deve mapear status "3" para "ENTREGUE"', async () => {
      await webhookService.processarEvento(criarPayload("3"));

      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledTimes(
        1,
      );
      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledWith(
        "msg-123",
        "ENTREGUE",
      );
    });

    // -----------------------------------------------------------------------
    // 7. Status 4 -> LIDO
    // -----------------------------------------------------------------------
    it('deve mapear status "4" para "LIDO"', async () => {
      await webhookService.processarEvento(criarPayload("4"));

      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledTimes(
        1,
      );
      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledWith(
        "msg-123",
        "LIDO",
      );
    });

    // -----------------------------------------------------------------------
    // 8. Status READ -> LIDO
    // -----------------------------------------------------------------------
    it('deve mapear status "READ" para "LIDO"', async () => {
      await webhookService.processarEvento(criarPayload("READ"));

      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledTimes(
        1,
      );
      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledWith(
        "msg-123",
        "LIDO",
      );
    });

    // -----------------------------------------------------------------------
    // 9. Status PLAYED -> LIDO
    // -----------------------------------------------------------------------
    it('deve mapear status "PLAYED" para "LIDO"', async () => {
      await webhookService.processarEvento(criarPayload("PLAYED"));

      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledTimes(
        1,
      );
      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledWith(
        "msg-123",
        "LIDO",
      );
    });

    it('deve mapear status "VIEWED" para "LIDO"', async () => {
      await webhookService.processarEvento(criarPayload("VIEWED"));

      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledTimes(
        1,
      );
      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledWith(
        "msg-123",
        "LIDO",
      );
    });

    it('deve processar "messages.update" mesmo com fromMe false', async () => {
      await webhookService.processarEvento({
        event: "messages.update",
        data: {
          keyId: "msg-from-me-false",
          fromMe: false,
          update: { status: "READ" },
        },
      });

      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledWith(
        "msg-from-me-false",
        "LIDO",
      );
    });

    it("deve usar data.keyId e ignorar data.messageId em messages.update", async () => {
      await webhookService.processarEvento({
        event: "messages.update",
        data: {
          keyId: "key-id-correto",
          messageId: "message-id-errado",
          update: { status: "READ" },
        },
      });

      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledWith(
        "key-id-correto",
        "LIDO",
      );
    });

    it("deve ignorar messages.update sem data.keyId mesmo com messageId", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});

      await webhookService.processarEvento({
        event: "messages.update",
        data: {
          messageId: "message-id-nao-usado",
          update: { status: "READ" },
        },
      });

      expect(webhookRepository.atualizarStatusMensagem).not.toHaveBeenCalled();
    });
  });
});
