const webhookController = require('../controllers/webhookController');

module.exports = async function (fastify, opts) {
  // Rota PÚBLICA para a Evolution API enviar os eventos
  fastify.post('/webhooks/evolution', webhookController.receberStatusEvolution);
};
