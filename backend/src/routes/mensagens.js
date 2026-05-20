const mensagemController = require('../controllers/mensagemController');

module.exports = async function (fastify, opts) {
  // Rota para o React solicitar o envio (o ideal seria exigir o JWT aqui, igual fizemos nas consultas)
  fastify.post('/mensagens/enviar', mensagemController.enviarMensagem);
};
