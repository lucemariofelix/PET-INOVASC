const mensageriaService = require("./mensageriaService");

class WebhookService {
  async processarEvento(payload) {
    const itens = Array.isArray(payload?.data) ? payload.data : [payload?.data];
    mensageriaService.logDiagnostico("EVOLUTION_WEBHOOK_RECEIVED", {
      evento: payload?.event || null,
      instancia: payload?.instance || null,
      formatoData: Array.isArray(payload?.data) ? "array" : "object",
      quantidadeItens: itens.filter(Boolean).length,
      chavesPrimeiroItem:
        itens[0] && typeof itens[0] === "object" ? Object.keys(itens[0]) : [],
    });

    try {
      await mensageriaService.processarEventoWebhook(payload);
    } catch (error) {
      console.error("❌ Erro no webhookService:", error);
      throw error;
    }
  }
}

module.exports = new WebhookService();
