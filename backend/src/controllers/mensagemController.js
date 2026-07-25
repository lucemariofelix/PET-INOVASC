const mensagemService = require("../services/mensagemService");
const { executarController } = require("./controllerExecutor");

// PRIMEIRA FUNÇÃO: Enviar a mensagem
exports.enviarMensagem = async (request, reply) => {
  const dadosBody = request.body;
  const authHeader = request.headers.authorization;
  return executarController(request, reply, {
    executar: () => mensagemService.dispararMensagem(
      dadosBody,
      authHeader,
    ),
    responder: (resultado) =>
      reply.status(200).send({ sucesso: true, ...resultado }),
  });
};

exports.listarStatusMensagens = async (request, reply) => {
  const authHeader = request.headers.authorization;
  return executarController(request, reply, {
    executar: () =>
      mensagemService.listarStatusMensagens(
        request.query.consulta_ids,
        authHeader,
      ),
    responder: (mensagens) => reply.send({ mensagens }),
  });
};

// SEGUNDA FUNÇÃO: Checar o Status (AGORA ISOLADA E COM O EXPORTS CORRETO)
exports.checarStatusWhatsApp = async (request, reply) => {
  return executarController(request, reply, {
    executar: () => mensagemService.statusConexaoWhatsApp(),
    responder: (status) => reply.send(status),
  });
};
