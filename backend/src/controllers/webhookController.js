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
      
      // 1. Responde IMEDIATAMENTE para a AWS com 200 OK
      // Isso evita Timeouts e retries desnecessários da Evolution
      reply.code(200).send({ recebido: true });

      // 2. Dispara o Service em background (sem o 'await')
      webhookService.processarEvento(payload).catch((error) => {
        // Se der erro no banco, loga no console do Render, 
        // mas a AWS já recebeu o 'OK' e segue a vida.
        console.error("❌ Erro assíncrono no processamento do webhook:", error);
      });

      // Como o reply já foi enviado acima, usamos apenas um return vazio aqui
      return; 
      
    } catch (error) {
      console.error("❌ Erro fatal no webhookController:", error);
      // Este erro 500 só vai acontecer se o código quebrar ANTES do reply.code(200)
      if (!reply.sent) {
        return reply.code(500).send({ erro: "Erro interno no servidor webhook" });
      }
    }
  }
}

module.exports = new WebhookController();