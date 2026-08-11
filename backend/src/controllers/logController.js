const logRepository = require('../repositories/logRepository');
const { executarController } = require("./controllerExecutor");

class LogController {
  async listar(request, reply) {
    const pagina = Number(request.query?.pagina || 1);
    const limite = Number(request.query?.limite || 5);
    return executarController(request, reply, {
      executar: () => logRepository.listarUltimos(pagina, limite),
      responder: (resultado) => reply.send(resultado),
    });
  }
}

module.exports = new LogController();
