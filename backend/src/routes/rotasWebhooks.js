const webhookController = require("../controllers/webhookController");

async function rotasWebhooks(fastify, options) {
  // ATENÇÃO: Esta rota é PÚBLICA (não usa token). A Evolution precisa conseguir acessar livremente.
  fastify.post("/webhooks/evolution", webhookController.receberStatusEvolution);
}

module.exports = rotasWebhooks;
