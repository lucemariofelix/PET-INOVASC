const notificacaoController = require("../controllers/notificacaoController");
const { verificarPermissao } = require("../middlewares/authMiddleware");

const esquemaDisparoLote = {
  body: {
    type: "object",
    required: ["mensagemBase", "pacientes"],
    properties: {
      mensagemBase: { type: "string", minLength: 5 },
      usuario_id: { type: ["string", "null"] },
      pacientes: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          required: ["telefone", "nome_completo"],
          properties: {
            id: { type: "string" },
            telefone: { type: "string", minLength: 10 },
            nome_completo: { type: "string" },
          },
        },
      },
    },
    additionalProperties: false,
  },
};

async function rotasNotificacoes(fastify, options) {
  const todosAutenticados = {
    preHandler: [verificarPermissao(["ADMIN", "RECEPCAO", "ACS"])],
  };

  // CORREÇÃO: .bind(notificacaoController) adicionado para preservar o
  // contexto `this` quando o Fastify invocar o método como handler.
  fastify.post(
    "/notificacoes/lote",
    {
      ...todosAutenticados,
      schema: esquemaDisparoLote,
    },
    notificacaoController.disparar.bind(notificacaoController),
  );

  // CORREÇÃO: A rota /notificacoes/webhook foi REMOVIDA.
  // Ela duplicava o papel do /webhooks/evolution sem processar nada,
  // fazendo com que metade dos eventos da Evolution fosse descartada.
  // Configure na Evolution API somente: POST /webhooks/evolution
}

module.exports = rotasNotificacoes;
