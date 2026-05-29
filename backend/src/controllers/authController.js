const authService = require('../services/authService');
const logRepository = require("../repositories/logRepository"); // <-- IMPORTADO

class AuthController {
  async login(request, reply) {
    try {
      const { email, senha } = request.body;
      const resultado = await authService.login(email, senha);

      // REGISTO DE AUDITORIA - Login com sucesso
      // Se a sua função de login devolver o ID do utilizador, podemos capturá-lo
      const usuario_id = resultado.usuario?.id || null;
      
      await logRepository.registrar(
        usuario_id, 
        'LOGIN', 
        `Sessão iniciada pelo email: ${email}`
      );

      return reply.send(resultado);
    } catch (error) {
      request.log.error(error);

      // Opcional: Registar também tentativas falhadas (ajuda a detetar intrusões)
      await logRepository.registrar(
        null, 
        'FALHA_LOGIN', 
        `Tentativa de acesso falhada para o email: ${request.body.email}`
      );

      return reply.status(401).send({ erro: error.message });
    }
  }
}

module.exports = new AuthController();
