// src/middlewares/authMiddleware.js

// O Fastify permite criar funções que rodam ANTES do Controller
exports.verificarPermissao = (rolesPermitidas) => {
  return async (request, reply) => {
    try {
      // 1. Aqui você idealmente decodifica o JWT para pegar a função do usuário.
      // Vou simular como se você lesse do token ou do header:
      const authHeader = request.headers.authorization;
      if (!authHeader) throw new Error("Token ausente");

      // EXXEMPLO: Decodifique seu JWT aqui.
      // const decoded = jwt.verify(authHeader.replace('Bearer ', ''), process.env.JWT_SECRET);
      // const userRole = decoded.funcao;

      // *ATENÇÃO*: Ajuste esta linha com a forma que você extrai a função do token!
      const userRole = request.headers["x-user-role"]; // Simulando extração

      // 2. Verifica se a função do cara está na lista de VIPs
      if (!rolesPermitidas.includes(userRole)) {
        return reply.status(403).send({
          erro: "Acesso Negado: Seu perfil não tem permissão para realizar esta ação.",
        });
      }

      // Se passar, a requisição continua naturalmente para o Controller!
    } catch (error) {
      request.log.error(error);
      return reply.status(401).send({ erro: "Não autorizado." });
    }
  };
};
