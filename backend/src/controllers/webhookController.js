const webhookService = require("../services/webhookService"); // [cite: 1]

class WebhookController {
  async receberStatusEvolution(request, reply) {
    try {
      const webhookSecret = request.headers["x-evolution-secret"];
      const expectedWebhookSecret = process.env.EVOLUTION_WEBHOOK_SECRET;

      if (!expectedWebhookSecret || webhookSecret !== expectedWebhookSecret) {
        // [cite: 2]
        console.warn("⚠️ Acesso não autorizado ao webhook");
        return reply.code(403).send({ erro: "Acesso negado" }); // [cite: 3]
      }

      const payload = request.body;
      await webhookService.processarEvento(payload); // [cite: 4]

      return reply.code(200).send({ recebido: true });
    } catch (error) {
      // Correção 2: Tratamento de logger seguro
      console.error("❌ Erro no webhook:", error);
      return reply.code(500).send({ erro: "Erro no webhook" }); // [cite: 6]
    }
  }
}

module.exports = new WebhookController();
