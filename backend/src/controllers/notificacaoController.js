// src/controllers/notificacaoController.js
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

  // NOVA FUNÇÃO: O "Ouvido" do sistema para o Webhook
  async receberWebhook(request, reply) {
    try {
      // 1. Log cru para vermos exatamente o que a Evolution manda
      console.log("=== 🚨 WEBHOOK RECEBIDO DA EVOLUTION 🚨 ===");
      console.log(JSON.stringify(request.body, null, 2));

      // Aqui, depois de vermos o formato, vamos chamar o notificacaoService
      // para fazer o UPDATE no banco usando o ID da mensagem.

      // 2. É crucial retornar 200 OK imediatamente para a Evolution.
      // Se não fizermos isso, ela acha que o seu servidor caiu e fica tentando reenviar o mesmo webhook.
      return reply.status(200).send({ status: "Webhook recebido com sucesso" });
    } catch (error) {
      request.log.error(error);
      return reply
        .status(500)
        .send({ erro: "Erro interno ao processar webhook" });
    }
  }
}

module.exports = new NotificacaoController();
