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

const esquemaDisparoGrupo = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", minLength: 36, maxLength: 36 },
    },
  },
  body: {
    type: "object",
    required: ["mensagem"],
    properties: {
      mensagem: { type: "string", minLength: 1 },
    },
    additionalProperties: false,
  },
};

async function rotasGruposAcompanhamento(fastify, options) {
  const todosAutenticados = {
    preHandler: [verificarPermissao(["ADMIN", "RECEPCAO", "ACS"])],
  };

  const adminERecepcao = {
    preHandler: [verificarPermissao(["ADMIN", "RECEPCAO"])],
  };

  fastify.get(
    "/grupos-acompanhamento",
    todosAutenticados,
    grupoAcompanhamentoController.listar,
  );

  fastify.post(
    "/grupos-acompanhamento",
    {
      ...adminERecepcao,
      schema: esquemaGrupoAcompanhamento,
    },
    grupoAcompanhamentoController.criar,
  );

  fastify.post(
    "/grupos-acompanhamento/:id/disparo",
    {
      ...adminERecepcao,
      schema: esquemaDisparoGrupo,
    },
    grupoAcompanhamentoController.disparar,
  );
}

module.exports = rotasGruposAcompanhamento;
