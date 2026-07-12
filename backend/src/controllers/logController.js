const logRepository = require('../repositories/logRepository');
const { executarController } = require("./controllerExecutor");

class LogController {
  async listar(request, reply) {
    return executarController(request, reply, {
      executar: () => logRepository.listarUltimos(),
      responder: (logs) => reply.send(logs),
    });
  }
}

module.exports = new LogController();
