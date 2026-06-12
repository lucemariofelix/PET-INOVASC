const notificacaoService = require("../services/notificacaoService");

class NotificacaoController {
  async disparar(request, reply) {
    try {
      const authHeader = request.headers.authorization;
      const resultado = await notificacaoService.iniciarDisparoLote(
        request.body,
        authHeader,
      );
      return reply.send(resultado);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ erro: error.message });
    }
  }

  // CORREÇÃO: O método receberWebhook foi removido deste controller.
  // Ele existia em paralelo com o webhookController.receberStatusEvolution,
  // criando duas rotas de webhook ativas ao mesmo tempo. A versão aqui
  // apenas logava o payload sem processar nada, causando confusão sobre
  // qual endpoint configurar na Evolution API e garantindo que o status
  // NUNCA seria atualizado no banco quando a Evolution batia nesta rota.
  //
  // O único endpoint de webhook da Evolution é:
  //   POST /webhooks/evolution  →  webhookController + webhookService
}

module.exports = new NotificacaoController();
