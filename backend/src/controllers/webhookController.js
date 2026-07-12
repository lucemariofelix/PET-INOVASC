const webhookService = require("../services/webhookService");
const { ForbiddenError } = require("../errors/AppError");
const { executarController } = require("./controllerExecutor");

class WebhookController {
  async receberStatusEvolution(request, reply) {
    const webhookSecret = request.headers["x-evolution-secret"];
    const expectedWebhookSecret = process.env.EVOLUTION_WEBHOOK_SECRET;

    return executarController(request, reply, {
      executar: async () => {
      if (!expectedWebhookSecret || webhookSecret !== expectedWebhookSecret) {
        console.warn("⚠️ Acesso não autorizado ao webhook");
          throw new ForbiddenError("Acesso negado");
      }

        await webhookService.processarEvento(request.body);
      },
      responder: () => reply.code(200).send({ recebido: true }),
    });
  }
}

module.exports = new WebhookController();
