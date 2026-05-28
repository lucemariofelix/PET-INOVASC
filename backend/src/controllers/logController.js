const logRepository = require('../repositories/logRepository');

class LogController {
  async listar(request, reply) {
    try {
      const logs = await logRepository.listarUltimos();
      return reply.send(logs);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ erro: "Falha ao buscar logs de auditoria." });
    }
  }
}

module.exports = new LogController();
