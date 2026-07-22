const { AppError } = require("../errors/AppError");

const erroContem = (error, trecho) => error.message?.includes(trecho);

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

  if (error.code === "FST_ERR_CTP_EMPTY_JSON_BODY") {
    return reply.status(400).send({
      code: "VALIDATION_ERROR",
      erro: "O corpo JSON da requisição não pode estar vazio.",
    });
  }

  // 2. Trata erros do Supabase / PostgreSQL (Segurança & Integridade)

  // Código 42501 - Erro de RLS / Permissões insuficientes
  if (error.code === "42501") {
    return reply.status(401).send({
      code: "SESSION_OR_PERMISSION_ERROR",
      erro: "Sessão expirada ou sem permissão. Por favor, faça login novamente.",
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
    } else if (error.message?.includes("grupos_acompanhamento_nome_key")) {
      mensagem = "Já existe um grupo de acompanhamento com este nome.";
    } else if (error.message?.includes("perfis_usuarios_email_key")) {
      mensagem = "Este email já está cadastrado no sistema.";
    }

    return reply.status(409).send({
      code: "CONFLICT",
      erro: mensagem,
    });
  }

  if (error.code === "PGRST303") {
    return reply.status(401).send({
      code: "SESSION_EXPIRED",
      erro: "Sessão expirada. Por favor, faça login novamente.",
    });
  }

  if (error.message === "WHATSAPP_DESCONECTADO") {
    return reply.status(409).send({
      code: "WHATSAPP_DESCONECTADO",
      erro: "O WhatsApp do posto está desconectado. Por favor, vá à aba de configurações e leia o QR Code antes de enviar mensagens.",
    });
  }

  if (
    erroContem(error, "E-mail ou senha incorretos") ||
    erroContem(error, "Perfil de usuário não configurado") ||
    erroContem(error, "Sessão não retornada")
  ) {
    return reply.status(401).send({
      code: "AUTHENTICATION_ERROR",
      erro: error.message,
    });
  }

  if (erroContem(error, "não autorizou")) {
    return reply.status(400).send({
      code: "CONSENTIMENTO_NECESSARIO",
      erro: error.message,
    });
  }

  if (
    erroContem(error, "obrigatório") ||
    erroContem(error, "Informe") ||
    erroContem(error, "inválido") ||
    erroContem(error, "não possui um número") ||
    erroContem(error, "nome do grupo") ||
    erroContem(error, "Nenhum paciente") ||
    erroContem(error, "lista de pacientes") ||
    erroContem(error, "mensagem deve conter")
  ) {
    return reply.status(400).send({
      code: "VALIDATION_ERROR",
      erro: error.message,
    });
  }

  if (erroContem(error, "não encontrado")) {
    return reply.status(404).send({
      code: "NOT_FOUND",
      erro: error.message,
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
