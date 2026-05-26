const mensagemController = require('../controllers/mensagemController');

async function rotasMensagens(fastify, options) {
  
  // Rota para o React solicitar o disparo da notificação via Evolution API
  fastify.post('/mensagens/enviar', mensagemController.enviarMensagem);
  fastify.get('/api/whatsapp/status', mensagemController.checarStatusWhatsApp);

}

module.exports = rotasMensagens;
