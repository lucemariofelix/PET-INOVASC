const webhookController = require("../controllers/webhookController");

async function rotasWebhooks(fastify, options) {
  // ATENÇÃO: Esta rota é PÚBLICA (não usa token).
  // A Evolution precisa conseguir acessar livremente.

  // CORREÇÃO: .bind(webhookController) garante que `this` dentro de
  // receberStatusEvolution aponta para a instância correta do controller.
  // Sem o bind, o Fastify chama o método sem contexto e qualquer acesso
  // a `this` dentro do método quebraria silenciosamente.
  fastify.post(
    "/webhooks/evolution",
    webhookController.receberStatusEvolution.bind(webhookController),
  );
}

module.exports = rotasWebhooks;
