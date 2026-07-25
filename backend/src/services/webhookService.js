const mensageriaService = require("./mensageriaService");

class WebhookService {
  async processarEvento(payload) {
    console.log(
      "[WEBHOOK] Evento recebido",
      JSON.stringify({
        evento: payload?.event || null,
        itens: Array.isArray(payload?.data) ? payload.data.length : 1,
        instancia: payload?.instance || null,
      }),
    );

    try {
      await mensageriaService.processarEventoWebhook(payload);
    } catch (error) {
      console.error("❌ Erro no webhookService:", error);
      throw error;
    }
  }
}

module.exports = new WebhookService();
