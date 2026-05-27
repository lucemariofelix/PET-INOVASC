// src/controllers/notificacaoController.js
const notificacaoService = require('../services/notificacaoService');

class NotificacaoController {
  async disparar(request, reply) {
    try {
      const authHeader = request.headers.authorization;
      const resultado = await notificacaoService.iniciarDisparoLote(request.body, authHeader);
      return reply.send(resultado);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ erro: error.message });
    }
  }
}

module.exports = new NotificacaoController();
