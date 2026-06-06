const { AppError } = require("../errors/AppError");

function errorHandler(error, request, reply) {
  // Log completo no console do servidor para diagnóstico interno
  request.log.error(error);

  // 1. Trata erros internos customizados (AppError)
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      code: error.code,
      erro: error.message,
    });
  }

  // 2. Trata erros do Supabase / PostgreSQL (Segurança & Integridade)

  // Código 42501 - Erro de RLS / Permissões insuficientes
  if (error.code === "42501") {
    return reply.status(403).send({
      code: "FORBIDDEN",
      erro: "Você não tem permissão para realizar esta operação ou sua sessão expirou.",
    });
  }

  // Código 23505 - Violação de restrição única (Duplicate Key)
  if (error.code === "23505") {
    let mensagem = "Este registro já existe no sistema.";
    if (error.message?.includes("pacientes_cpf_cns_key")) {
      mensagem =
        "Este CPF ou CNS já está cadastrado para outro paciente no sistema.";
    } else if (error.message?.includes("users_email_key")) {
      mensagem = "Este endereço de e-mail já está em uso.";
    }

    return reply.status(409).send({
      code: "CONFLICT",
      erro: mensagem,
    });
  }

  // 3. Trata erros de validação nativa do Schema do Fastify
  if (error.validation) {
    return reply.status(400).send({
      code: "VALIDATION_ERROR",
      erro: "Dados enviados inválidos.",
      detalhes: error.validation,
    });
  }

  // 4. Fallback de Segurança para qualquer outro erro não mapeado (evita vazamento de SQL/Stacktrace)
  return reply.status(500).send({
    code: "INTERNAL_SERVER_ERROR",
    erro: "Ocorreu um erro interno no servidor. Por favor, tente novamente mais tarde.",
  });
}

module.exports = errorHandler;
