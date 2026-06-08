const webhookService = require("../services/webhookService");

class WebhookController {
  async receberStatusEvolution(request, reply) {
    try {
      const webhookSecret = request.headers["x-evolution-secret"];
      const expectedWebhookSecret = process.env.EVOLUTION_WEBHOOK_SECRET;

      if (!expectedWebhookSecret || webhookSecret !== expectedWebhookSecret) {
        console.warn("⚠️ Acesso não autorizado ao webhook");
        return reply.code(403).send({ erro: "Acesso negado" });
      }

      const payload = request.body;
      await webhookService.processarEvento(payload);

      return reply.code(200).send({ recebido: true });
    } catch (error) {
      console.error("❌ Erro no webhookController:", error);
      return reply.code(500).send({ erro: "Erro no webhook" });
    }
  }
}

module.exports = new WebhookController();
