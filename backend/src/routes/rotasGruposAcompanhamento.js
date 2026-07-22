const grupoAcompanhamentoController = require("../controllers/grupoAcompanhamentoController");
const { verificarPermissao } = require("../middlewares/authMiddleware");

const esquemaGrupoAcompanhamento = {
  body: {
    type: "object",
    required: ["nome"],
    properties: {
      nome: { type: "string", minLength: 2 },
      descricao: { type: "string" },
    },
    additionalProperties: false,
  },
};

const esquemaIdGrupo = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", minLength: 36, maxLength: 36 },
  },
};

const esquemaDisparoGrupo = {
  params: esquemaIdGrupo,
  body: {
    type: "object",
    required: ["mensagem"],
    properties: {
      mensagem: { type: "string", minLength: 1 },
    },
    additionalProperties: false,
  },
};

async function rotasGruposAcompanhamento(fastify, options = {}) {
  const controller =
    options.grupoAcompanhamentoController || grupoAcompanhamentoController;
  const criarVerificacao = options.verificarPermissao || verificarPermissao;
  const todosAutenticados = {
    preHandler: [criarVerificacao(["ADMIN", "RECEPCAO", "ACS"])],
  };

  const adminERecepcao = {
    preHandler: [criarVerificacao(["ADMIN", "RECEPCAO"])],
  };

  const somenteAdmin = {
    preHandler: [criarVerificacao(["ADMIN"])],
  };

  fastify.get(
    "/grupos-acompanhamento",
    todosAutenticados,
    controller.listar,
  );

  fastify.post(
    "/grupos-acompanhamento",
    {
      ...adminERecepcao,
      schema: esquemaGrupoAcompanhamento,
    },
    controller.criar,
  );

  fastify.delete(
    "/grupos-acompanhamento/:id",
    {
      ...somenteAdmin,
      schema: { params: esquemaIdGrupo },
    },
    controller.excluir,
  );

  fastify.post(
    "/grupos-acompanhamento/:id/disparo",
    {
      ...adminERecepcao,
      schema: esquemaDisparoGrupo,
    },
    controller.disparar,
  );
}

module.exports = rotasGruposAcompanhamento;
