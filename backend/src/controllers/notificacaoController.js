const notificacaoService = require("../services/notificacaoService");
const { executarController } = require("./controllerExecutor");

class NotificacaoController {
  async disparar(request, reply) {
    const authHeader = request.headers.authorization;
    return executarController(request, reply, {
      executar: () => notificacaoService.iniciarDisparoLote(
        request.body,
        authHeader,
      ),
      responder: (resultado) => reply.send(resultado),
    });
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
