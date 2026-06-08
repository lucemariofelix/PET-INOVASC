const webhookController = require("../controllers/webhookController");

async function rotasWebhooks(fastify, options) {
  // ATENÇÃO: Esta rota é PÚBLICA (não usa token). A Evolution precisa conseguir acessar livremente.
  // CORREÇÃO 3: .bind(webhookController) garante que `this` dentro de
  // receberStatusEvolution aponte para a instância correta do controller,
  // evitando TypeError silencioso se o método usar `this` no futuro.
  fastify.post(
    "/webhooks/evolution",
    webhookController.receberStatusEvolution.bind(webhookController),
  );
}

module.exports = rotasWebhooks;
