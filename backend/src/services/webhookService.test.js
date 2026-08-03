// =============================================================================
// MOCK do repositório — evita carregar Supabase real nos testes do service
// =============================================================================
vi.mock("../repositories/webhookRepository");

const webhookRepository = require("../repositories/webhookRepository");
const mensageriaService = require("./mensageriaService");
const webhookService = require("./webhookService");

// =============================================================================
// Helpers
// =============================================================================
const criarPayload = (status) => ({
  event: "messages.update",
  date_time: "2026-07-21T22:54:24.369Z",
  data: {
    keyId: "msg-123",
    update: { status },
  },
});

const atualizacaoEsperada = (status, ordem) => ({
  status,
  ordem,
  dataEvento: "2026-07-21T22:54:24.369Z",
});

const criarRespostaTexto = (texto, sobrescritas = {}) => ({
  event: "messages.upsert",
  date_time: "2026-07-25T12:00:00.000Z",
  data: {
    key: {
      fromMe: false,
      remoteJid: "5584999998888@s.whatsapp.net",
    },
    message: { conversation: texto },
    ...sobrescritas,
  },
});

const pendenciaAtiva = {
  id: "hist-pendente-1",
  mensagem_id: "msg-lembrete-1",
  consulta_id: "consulta-1",
  paciente_id: "paciente-1",
  telefone_destino: "5584999998888",
};

// =============================================================================
// SUÍTE PRINCIPAL
// =============================================================================
describe("WebhookService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    webhookRepository.atualizarStatusMensagem = vi.fn().mockResolvedValue([]);
    webhookRepository.registrarConfirmacaoMensagem = vi.fn().mockResolvedValue([]);
    webhookRepository.listarConfirmacoesPendentesPorTelefone = vi
      .fn()
      .mockResolvedValue([]);
    webhookRepository.registrarRespostaConfirmacao = vi
      .fn()
      .mockResolvedValue([]);
    webhookRepository.reservarOrientacaoRespostaInvalida = vi
      .fn()
      .mockResolvedValue(false);
    vi.spyOn(mensageriaService, "enviarRespostaAutomatica").mockResolvedValue({});
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
        atualizacaoEsperada("ENTREGUE", 2),
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
        atualizacaoEsperada("ENTREGUE", 2),
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
        atualizacaoEsperada("ENTREGUE", 2),
      );
    });

    it('deve mapear status "DELIVERED" para "ENTREGUE"', async () => {
      await webhookService.processarEvento(criarPayload("DELIVERED"));

      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledTimes(
        1,
      );
      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledWith(
        "msg-123",
        atualizacaoEsperada("ENTREGUE", 2),
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
        atualizacaoEsperada("ENTREGUE", 2),
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
        atualizacaoEsperada("LIDO", 3),
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
        atualizacaoEsperada("LIDO", 3),
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
        atualizacaoEsperada("LIDO", 3),
      );
    });

    it('deve mapear status "VIEWED" para "LIDO"', async () => {
      await webhookService.processarEvento(criarPayload("VIEWED"));

      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledTimes(
        1,
      );
      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledWith(
        "msg-123",
        atualizacaoEsperada("LIDO", 3),
      );
    });

    it('deve processar "messages.update" mesmo com fromMe false', async () => {
      await webhookService.processarEvento({
        event: "messages.update",
        date_time: "2026-07-21T22:54:24.369Z",
        data: {
          keyId: "msg-from-me-false",
          fromMe: false,
          update: { status: "READ" },
        },
      });

      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledWith(
        "msg-from-me-false",
        atualizacaoEsperada("LIDO", 3),
      );
    });

    it("deve usar data.keyId e ignorar data.messageId em messages.update", async () => {
      await webhookService.processarEvento({
        event: "messages.update",
        date_time: "2026-07-21T22:54:24.369Z",
        data: {
          keyId: "key-id-correto",
          messageId: "message-id-errado",
          update: { status: "READ" },
        },
      });

      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledWith(
        "key-id-correto",
        atualizacaoEsperada("LIDO", 3),
      );
    });

    it("deve usar data.key.id quando keyId não estiver presente", async () => {
      await webhookService.processarEvento({
        event: "messages.update",
        date_time: "2026-07-21T22:54:24.369Z",
        data: {
          key: { id: "key-object-id", fromMe: true },
          messageId: "message-id-interno",
          update: { status: "READ" },
        },
      });

      expect(webhookRepository.atualizarStatusMensagem).toHaveBeenCalledWith(
        "key-object-id",
        atualizacaoEsperada("LIDO", 3),
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

    it("deve registrar confirmação quando messages.upsert receber resposta de botão", async () => {
      await webhookService.processarEvento({
        event: "messages.upsert",
        date_time: "2026-07-21T23:00:00.000Z",
        data: {
          fromMe: false,
          message: {
            buttonsResponseMessage: {
              selectedButtonId: "CONFIRMAR_PRESENCA:consulta-123",
            },
          },
        },
      });

      expect(webhookRepository.registrarConfirmacaoMensagem).toHaveBeenCalledWith(
        "CONFIRMAR_PRESENCA:consulta-123",
        "2026-07-21T23:00:00.000Z",
      );
      expect(webhookRepository.atualizarStatusMensagem).not.toHaveBeenCalled();
    });

    it("deve reconhecer confirmação em resposta interativa native-flow", async () => {
      await webhookService.processarEvento({
        event: "messages.upsert",
        date_time: "2026-07-21T23:05:00.000Z",
        data: {
          key: { fromMe: false },
          message: {
            interactiveResponseMessage: {
              nativeFlowResponseMessage: {
                paramsJson: JSON.stringify({
                  id: "CONFIRMAR_PRESENCA:consulta-123:token-unico",
                }),
              },
            },
          },
        },
      });

      expect(webhookRepository.registrarConfirmacaoMensagem).toHaveBeenCalledWith(
        "CONFIRMAR_PRESENCA:consulta-123:token-unico",
        "2026-07-21T23:05:00.000Z",
      );
    });

    it('deve confirmar a única pendência ativa ao receber exatamente "1"', async () => {
      webhookRepository.listarConfirmacoesPendentesPorTelefone.mockResolvedValue([
        pendenciaAtiva,
      ]);
      webhookRepository.registrarRespostaConfirmacao.mockResolvedValue([
        { ...pendenciaAtiva, confirmacao_status: "CONFIRMADO" },
      ]);

      await webhookService.processarEvento(criarRespostaTexto(" 1 "));

      expect(
        webhookRepository.listarConfirmacoesPendentesPorTelefone,
      ).toHaveBeenCalledWith(
        "5584999998888",
        "2026-07-25T12:00:00.000Z",
      );
      expect(
        webhookRepository.registrarRespostaConfirmacao,
      ).toHaveBeenCalledWith({
        historicoId: "hist-pendente-1",
        resposta: "1",
        confirmacaoStatus: "CONFIRMADO",
        dataEvento: "2026-07-25T12:00:00.000Z",
      });
      expect(mensageriaService.enviarRespostaAutomatica).toHaveBeenCalledWith(
        expect.objectContaining({
          telefone: "5584999998888",
          referencia: {
            paciente_id: "paciente-1",
            consulta_id: "consulta-1",
          },
        }),
      );
    });

    it.each(["1", "sim", "confirmar", "ok", "s"])(
      'deve confirmar a única pendência ativa ao receber "%s"',
      async (resposta) => {
        webhookRepository.listarConfirmacoesPendentesPorTelefone.mockResolvedValue([
          pendenciaAtiva,
        ]);
        webhookRepository.registrarRespostaConfirmacao.mockResolvedValue([
          { ...pendenciaAtiva, confirmacao_status: "CONFIRMADO" },
        ]);

        await webhookService.processarEvento(
          criarRespostaTexto(`  ${resposta.toUpperCase()}  `),
        );

        expect(
          webhookRepository.registrarRespostaConfirmacao,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            resposta,
            confirmacaoStatus: "CONFIRMADO",
          }),
        );
      },
    );

    it('deve solicitar cancelamento sem alterar a consulta ao receber exatamente "2"', async () => {
      webhookRepository.listarConfirmacoesPendentesPorTelefone.mockResolvedValue([
        pendenciaAtiva,
      ]);
      webhookRepository.registrarRespostaConfirmacao.mockResolvedValue([
        {
          ...pendenciaAtiva,
          confirmacao_status: "CANCELAMENTO_SOLICITADO",
        },
      ]);

      await webhookService.processarEvento(criarRespostaTexto("2"));

      expect(
        webhookRepository.registrarRespostaConfirmacao,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          resposta: "2",
          confirmacaoStatus: "CANCELAMENTO_SOLICITADO",
        }),
      );
      expect(mensageriaService.enviarRespostaAutomatica).toHaveBeenCalledWith(
        expect.objectContaining({
          texto: expect.stringContaining("solicitação de cancelamento"),
        }),
      );
    });

    it.each(["2", "nao", "não", "cancelar", "n"])(
      'deve solicitar cancelamento ao receber "%s"',
      async (resposta) => {
        webhookRepository.listarConfirmacoesPendentesPorTelefone.mockResolvedValue([
          pendenciaAtiva,
        ]);
        webhookRepository.registrarRespostaConfirmacao.mockResolvedValue([
          {
            ...pendenciaAtiva,
            confirmacao_status: "CANCELAMENTO_SOLICITADO",
          },
        ]);

        await webhookService.processarEvento(
          criarRespostaTexto(`  ${resposta.toUpperCase()}  `),
        );

        expect(
          webhookRepository.registrarRespostaConfirmacao,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            resposta,
            confirmacaoStatus: "CANCELAMENTO_SOLICITADO",
          }),
        );
      },
    );

    it("deve aceitar resposta em extendedTextMessage ao citar a mensagem original", async () => {
      webhookRepository.listarConfirmacoesPendentesPorTelefone.mockResolvedValue([
        pendenciaAtiva,
      ]);
      webhookRepository.registrarRespostaConfirmacao.mockResolvedValue([
        { ...pendenciaAtiva, confirmacao_status: "CONFIRMADO" },
      ]);

      await webhookService.processarEvento(
        criarRespostaTexto(undefined, {
          message: { extendedTextMessage: { text: " Sim " } },
        }),
      );

      expect(
        webhookRepository.registrarRespostaConfirmacao,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          resposta: "sim",
          confirmacaoStatus: "CONFIRMADO",
        }),
      );
    });

    it("deve preservar data.body como fallback de compatibilidade", async () => {
      webhookRepository.listarConfirmacoesPendentesPorTelefone.mockResolvedValue([
        pendenciaAtiva,
      ]);
      webhookRepository.registrarRespostaConfirmacao.mockResolvedValue([
        { ...pendenciaAtiva, confirmacao_status: "CONFIRMADO" },
      ]);

      await webhookService.processarEvento(
        criarRespostaTexto(undefined, {
          message: {},
          body: " Ok ",
        }),
      );

      expect(
        webhookRepository.registrarRespostaConfirmacao,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          resposta: "ok",
          confirmacaoStatus: "CONFIRMADO",
        }),
      );
    });

    it("deve priorizar conversation quando os dois campos de texto estiverem presentes", async () => {
      webhookRepository.listarConfirmacoesPendentesPorTelefone.mockResolvedValue([
        pendenciaAtiva,
      ]);
      webhookRepository.registrarRespostaConfirmacao.mockResolvedValue([
        {
          ...pendenciaAtiva,
          confirmacao_status: "CANCELAMENTO_SOLICITADO",
        },
      ]);

      await webhookService.processarEvento(
        criarRespostaTexto("2", {
          message: {
            conversation: "2",
            extendedTextMessage: { text: "sim" },
          },
        }),
      );

      expect(
        webhookRepository.registrarRespostaConfirmacao,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          resposta: "2",
          confirmacaoStatus: "CANCELAMENTO_SOLICITADO",
        }),
      );
    });

    it("deve ignorar resposta repetida, expirada ou sem pendência ativa", async () => {
      await webhookService.processarEvento(criarRespostaTexto("1"));

      expect(
        webhookRepository.registrarRespostaConfirmacao,
      ).not.toHaveBeenCalled();
      expect(mensageriaService.enviarRespostaAutomatica).not.toHaveBeenCalled();
    });

    it("deve ser idempotente quando outra requisição consumir a pendência primeiro", async () => {
      webhookRepository.listarConfirmacoesPendentesPorTelefone.mockResolvedValue([
        pendenciaAtiva,
      ]);
      webhookRepository.registrarRespostaConfirmacao.mockResolvedValue([]);

      await webhookService.processarEvento(criarRespostaTexto("1"));

      expect(
        webhookRepository.registrarRespostaConfirmacao,
      ).toHaveBeenCalledTimes(1);
      expect(mensageriaService.enviarRespostaAutomatica).not.toHaveBeenCalled();
    });

    it("não deve escolher uma pendência quando houver múltiplas", async () => {
      webhookRepository.listarConfirmacoesPendentesPorTelefone.mockResolvedValue([
        pendenciaAtiva,
        { ...pendenciaAtiva, id: "hist-pendente-2", consulta_id: "consulta-2" },
      ]);

      await webhookService.processarEvento(criarRespostaTexto("1"));

      expect(
        webhookRepository.registrarRespostaConfirmacao,
      ).not.toHaveBeenCalled();
      expect(mensageriaService.enviarRespostaAutomatica).toHaveBeenCalledWith(
        expect.objectContaining({
          texto: expect.stringContaining("mais de uma consulta"),
        }),
      );
    });

    it.each(["10", "12", "1 confirmo", "🎤"])(
      "deve consultar pendências sem orientar quando não houver pendência para: %s",
      async (texto) => {
        await webhookService.processarEvento(criarRespostaTexto(texto));

        expect(
          webhookRepository.listarConfirmacoesPendentesPorTelefone,
        ).toHaveBeenCalledWith(
          "5584999998888",
          "2026-07-25T12:00:00.000Z",
        );
        expect(
          webhookRepository.reservarOrientacaoRespostaInvalida,
        ).not.toHaveBeenCalled();
      },
    );

    it("deve ignorar conteúdo textual vazio", async () => {
      await webhookService.processarEvento(criarRespostaTexto(""));

      expect(
        webhookRepository.listarConfirmacoesPendentesPorTelefone,
      ).not.toHaveBeenCalled();
    });

    it("deve orientar uma vez quando houver uma pendência e a resposta for inválida", async () => {
      webhookRepository.listarConfirmacoesPendentesPorTelefone.mockResolvedValue([
        pendenciaAtiva,
      ]);
      webhookRepository.reservarOrientacaoRespostaInvalida.mockResolvedValue(
        true,
      );

      await webhookService.processarEvento(criarRespostaTexto("bom dia"));

      expect(
        webhookRepository.reservarOrientacaoRespostaInvalida,
      ).toHaveBeenCalledWith(
        pendenciaAtiva.id,
        "2026-07-25T12:00:00.000Z",
      );
      expect(mensageriaService.enviarRespostaAutomatica).toHaveBeenCalledWith(
        expect.objectContaining({
          telefone: "5584999998888",
          texto:
            "Não conseguimos identificar sua resposta. Para responder sobre esta consulta, envie somente:\n\n1 — Confirmar presença\n2 — Solicitar cancelamento\n\nResponda apenas com 1 ou 2.",
        }),
      );
      expect(
        webhookRepository.registrarRespostaConfirmacao,
      ).not.toHaveBeenCalled();
    });

    it("não deve repetir a orientação quando a pendência já foi orientada", async () => {
      webhookRepository.listarConfirmacoesPendentesPorTelefone.mockResolvedValue([
        pendenciaAtiva,
      ]);
      webhookRepository.reservarOrientacaoRespostaInvalida.mockResolvedValue(
        false,
      );

      await webhookService.processarEvento(criarRespostaTexto("outra frase"));

      expect(
        webhookRepository.reservarOrientacaoRespostaInvalida,
      ).toHaveBeenCalledTimes(1);
      expect(mensageriaService.enviarRespostaAutomatica).not.toHaveBeenCalled();
    });

    it("deve ignorar texto livre enviado depois de uma resposta terminal", async () => {
      webhookRepository.listarConfirmacoesPendentesPorTelefone
        .mockResolvedValueOnce([pendenciaAtiva])
        .mockResolvedValueOnce([]);
      webhookRepository.registrarRespostaConfirmacao.mockResolvedValueOnce([
        { ...pendenciaAtiva, confirmacao_status: "CONFIRMADO" },
      ]);

      await webhookService.processarEvento(criarRespostaTexto("1"));
      await webhookService.processarEvento(criarRespostaTexto("bom dia"));

      expect(
        webhookRepository.registrarRespostaConfirmacao,
      ).toHaveBeenCalledTimes(1);
      expect(
        webhookRepository.reservarOrientacaoRespostaInvalida,
      ).not.toHaveBeenCalled();
      expect(mensageriaService.enviarRespostaAutomatica).toHaveBeenCalledTimes(
        1,
      );
    });

    it("deve ignorar mensagem de áudio sem conteúdo textual", async () => {
      await webhookService.processarEvento(
        criarRespostaTexto(undefined, {
          message: { audioMessage: { url: "https://example.test/audio" } },
        }),
      );

      expect(
        webhookRepository.listarConfirmacoesPendentesPorTelefone,
      ).not.toHaveBeenCalled();
    });

    it("deve ignorar mensagens próprias, grupos e remetentes sem telefone confiável", async () => {
      await webhookService.processarEvento(
        criarRespostaTexto("1", {
          key: {
            fromMe: true,
            remoteJid: "5584999998888@s.whatsapp.net",
          },
        }),
      );
      await webhookService.processarEvento(
        criarRespostaTexto("1", {
          key: { fromMe: false, remoteJid: "120363012345@g.us" },
        }),
      );
      await webhookService.processarEvento(
        criarRespostaTexto("1", {
          key: { fromMe: false, remoteJid: "123456789@lid" },
        }),
      );

      expect(
        webhookRepository.listarConfirmacoesPendentesPorTelefone,
      ).not.toHaveBeenCalled();
    });

    it("deve usar remoteJidAlt telefônico quando remoteJid for @lid", async () => {
      await webhookService.processarEvento(
        criarRespostaTexto("1", {
          key: {
            fromMe: false,
            remoteJid: "123456789012345@lid",
            remoteJidAlt: "558499998888@s.whatsapp.net",
          },
        }),
      );

      expect(
        webhookRepository.listarConfirmacoesPendentesPorTelefone,
      ).toHaveBeenCalledWith(
        "5584999998888",
        "2026-07-25T12:00:00.000Z",
      );
    });

    it("deve usar senderPn telefônico quando os JIDs principal e alternativo forem @lid", async () => {
      await webhookService.processarEvento(
        criarRespostaTexto("2", {
          key: {
            fromMe: false,
            remoteJid: "123456789012345@lid",
            remoteJidAlt: "987654321012345@lid",
            senderPn: "558499998888@s.whatsapp.net",
          },
        }),
      );

      expect(
        webhookRepository.listarConfirmacoesPendentesPorTelefone,
      ).toHaveBeenCalledWith(
        "5584999998888",
        "2026-07-25T12:00:00.000Z",
      );
    });

    it("deve restaurar o nono dígito do remoteJid brasileiro recebido", async () => {
      await webhookService.processarEvento(
        criarRespostaTexto("1", {
          key: {
            fromMe: false,
            remoteJid: "558499998888@s.whatsapp.net",
          },
        }),
      );

      expect(
        webhookRepository.listarConfirmacoesPendentesPorTelefone,
      ).toHaveBeenCalledWith(
        "5584999998888",
        "2026-07-25T12:00:00.000Z",
      );
    });

    it("deve preservar o telefone que já contém o nono dígito", async () => {
      await webhookService.processarEvento(criarRespostaTexto("2"));

      expect(
        webhookRepository.listarConfirmacoesPendentesPorTelefone,
      ).toHaveBeenCalledWith(
        "5584999998888",
        "2026-07-25T12:00:00.000Z",
      );
    });

    it.each([
      "550099998888@s.whatsapp.net",
      "351234567890@s.whatsapp.net",
    ])(
      "deve rejeitar remetente de 12 dígitos inválido: %s",
      async (remoteJid) => {
        await webhookService.processarEvento(
          criarRespostaTexto("1", {
            key: { fromMe: false, remoteJid },
          }),
        );

        expect(
          webhookRepository.listarConfirmacoesPendentesPorTelefone,
        ).not.toHaveBeenCalled();
      },
    );

    it("nunca deve interpretar os dígitos de @lid como telefone", async () => {
      await webhookService.processarEvento(
        criarRespostaTexto("1", {
          key: {
            fromMe: false,
            remoteJid: "5584999998888@lid",
            remoteJidAlt: "987654321012345@lid",
          },
        }),
      );

      expect(
        webhookRepository.listarConfirmacoesPendentesPorTelefone,
      ).not.toHaveBeenCalled();
    });

    it("não deve usar JID alternativo de participante quando a conversa for grupo", async () => {
      await webhookService.processarEvento(
        criarRespostaTexto("1", {
          key: {
            fromMe: false,
            remoteJid: "120363012345@g.us",
            remoteJidAlt: "5584999998888@s.whatsapp.net",
          },
        }),
      );

      expect(
        webhookRepository.listarConfirmacoesPendentesPorTelefone,
      ).not.toHaveBeenCalled();
    });

    it("não deve processar broadcast mesmo quando houver senderPn telefônico", async () => {
      await webhookService.processarEvento(
        criarRespostaTexto("1", {
          key: {
            fromMe: false,
            remoteJid: "status@broadcast",
            senderPn: "5584999998888@s.whatsapp.net",
          },
        }),
      );

      expect(
        webhookRepository.listarConfirmacoesPendentesPorTelefone,
      ).not.toHaveBeenCalled();
    });

    it("deve repetir a consulta ao banco após uma falha transitória", async () => {
      webhookRepository.listarConfirmacoesPendentesPorTelefone
        .mockRejectedValueOnce(new Error("falha transitória"))
        .mockResolvedValueOnce([]);
      vi.spyOn(console, "warn").mockImplementation(() => {});

      await webhookService.processarEvento(criarRespostaTexto("1"));

      expect(
        webhookRepository.listarConfirmacoesPendentesPorTelefone,
      ).toHaveBeenCalledTimes(2);
    });

    it("não deve falhar o webhook se a resposta automática não puder ser enviada", async () => {
      webhookRepository.listarConfirmacoesPendentesPorTelefone.mockResolvedValue([
        pendenciaAtiva,
      ]);
      webhookRepository.registrarRespostaConfirmacao.mockResolvedValue([
        { ...pendenciaAtiva, confirmacao_status: "CONFIRMADO" },
      ]);
      mensageriaService.enviarRespostaAutomatica.mockRejectedValue(
        new Error("provedor indisponível"),
      );

      await expect(
        webhookService.processarEvento(criarRespostaTexto("1")),
      ).resolves.toBeUndefined();
    });

    it("deve mascarar o telefone nos diagnósticos da confirmação textual", async () => {
      process.env.EVOLUTION_DIAGNOSTICS = "true";

      await webhookService.processarEvento(criarRespostaTexto("1"));

      const logs = console.log.mock.calls.flat().join(" ");
      expect(logs).not.toContain("5584999998888");
      expect(logs).not.toContain("api-key");
    });

    it("deve diagnosticar somente campos e domínios quando não resolver @lid", async () => {
      process.env.EVOLUTION_DIAGNOSTICS = "true";

      await webhookService.processarEvento(
        criarRespostaTexto("1", {
          key: {
            fromMe: false,
            remoteJid: "123456789012345@lid",
          },
        }),
      );

      const logs = console.log.mock.calls.flat().join(" ");
      expect(logs).toContain('"campo":"key.remoteJid"');
      expect(logs).toContain('"dominio":"@lid"');
      expect(logs).not.toContain("123456789012345");
    });

    it("deve diagnosticar a restauração do nono dígito sem expor o telefone", async () => {
      process.env.EVOLUTION_DIAGNOSTICS = "true";

      await webhookService.processarEvento(
        criarRespostaTexto("1", {
          key: {
            fromMe: false,
            remoteJid: "558499998888@s.whatsapp.net",
          },
        }),
      );

      const logs = console.log.mock.calls.flat().join(" ");
      expect(logs).toContain('"quantidadeDigitosOriginal":12');
      expect(logs).toContain('"quantidadeDigitosNormalizada":13');
      expect(logs).toContain(
        '"normalizacaoAplicada":"NONO_DIGITO_RESTAURADO"',
      );
      expect(logs).not.toContain("558499998888");
      expect(logs).not.toContain("5584999998888");
    });

    it("não registra segredos nem conteúdo do payload bruto", async () => {
      process.env.EVOLUTION_DIAGNOSTICS = "true";
      await webhookService.processarEvento({
        event: "connection.update",
        instance: "ubs-oficial-v2",
        apikey: "CHAVE-NAO-DEVE-APARECER",
        data: { message: { conversation: "conteudo privado" } },
      });

      const logs = console.log.mock.calls.flat().join(" ");
      expect(logs).not.toContain("CHAVE-NAO-DEVE-APARECER");
      expect(logs).not.toContain("conteudo privado");
    });
  });
});
