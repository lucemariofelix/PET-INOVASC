const mensageriaService = require("./mensageriaService");

class WebhookService {
  async processarEvento(payload) {
    // Log do payload completo (Pode comentar/remover quando for para produção)
    console.log("=== JSON BRUTO DA V2.3.7 ===");
    console.log(JSON.stringify(payload, null, 2));

    try {
      await mensageriaService.processarEventoWebhook(payload);
    } catch (error) {
      console.error("❌ Erro no webhookService:", error);
      throw error;
    }
  }
}

module.exports = new WebhookService();
