const authService = require('../services/authService');

class AuthController {
  async login(request, reply) {
    try {
      const { email, senha } = request.body;
      const resultado = await authService.login(email, senha);
      return reply.send(resultado);
    } catch (error) {
      request.log.error(error);
      return reply.status(401).send({ erro: error.message });
    }
  }
}

module.exports = new AuthController();