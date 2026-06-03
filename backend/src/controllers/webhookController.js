const webhookService = require("../services/webhookService");

class WebhookController {
  async receberStatusEvolution(request, reply) {
    try {
      const webhookSecret = request.headers["x-evolution-secret"];

      if (webhookSecret !== process.env.EVOLUTION_WEBHOOK_SECRET) {
        console.warn("⚠️ Acesso não autorizado ao webhook");
        return reply.code(403).send({ erro: "Acesso negado" });
      }

      const payload = request.body;

      // 🔥 PROCESSAMENTO DIRETO (com await)
      await webhookService.processarEvento(payload);

      return reply.code(200).send({ recebido: true });

    } catch (error) {
      request.log.error("❌ Erro no webhook:", error);
      return reply.code(500).send({ erro: "Erro no webhook" });
    }
  }
}

module.exports = new WebhookController();
