const webhookService = require("../services/webhookService");

class WebhookController {
  async receberStatusEvolution(request, reply) {
    try {
      // 1. SEGURANÇA (O Cadeado)
      const webhookSecret = request.headers["x-evolution-secret"];

      if (webhookSecret !== process.env.EVOLUTION_WEBHOOK_SECRET) {
        console.warn("⚠️ [SEGURANÇA] Tentativa de acesso não autorizado ao Webhook bloqueada.");
        return reply.code(403).send({ erro: "Acesso negado" });
      }

      // 2. ENCAMINHAMENTO PARA O SERVICE
      const payload = request.body;
      
      // Não usamos await aqui intencionalmente (Fire and Forget)
      // A Evolution precisa da resposta 200 imediata, o processamento ocorre em segundo plano
      webhookService.processarEvento(payload).catch((err) => {
        console.error("Erro assíncrono no processamento do Webhook:", err);
      });

      // 3. RESPOSTA IMEDIATA
      return reply.code(200).send({ recebido: true });
      
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ erro: "Falha interna no controlador do webhook" });
    }
  }
}

module.exports = new WebhookController();
