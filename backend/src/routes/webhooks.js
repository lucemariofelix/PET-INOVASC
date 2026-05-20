const webhookController = require('../controllers/webhookController');

async function rotasWebhooks(fastify, options) {
  
  // Rota PÚBLICA para a Evolution API enviar os eventos de mensagem lida/entregue
  fastify.post('/webhooks/evolution', webhookController.receberStatusEvolution);

}

module.exports = rotasWebhooks;
