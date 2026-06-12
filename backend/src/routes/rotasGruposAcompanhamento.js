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
}

module.exports = rotasGruposAcompanhamento;
