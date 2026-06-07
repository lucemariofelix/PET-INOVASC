// src/routes/rotasNotificacoes.js
const notificacaoController = require("../controllers/notificacaoController");
const { verificarPermissao } = require("../middlewares/authMiddleware");

const esquemaDisparoLote = {
  body: {
    type: "object",
    required: ["mensagemBase", "pacientes"],
    properties: {
      mensagemBase: { type: "string", minLength: 5 }, // Impede o envio de mensagens em branco ou com 1 letra
      usuario_id: { type: ["string", "null"] },
      pacientes: {
        type: "array",
        minItems: 1, // Impede o disparo se a lista estiver vazia
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

  // A rota exata que o frontend está procurando
  fastify.post(
    "/notificacoes/lote",
    {
      ...todosAutenticados,
      schema: esquemaDisparoLote,
    },
    notificacaoController.disparar,
  );

  // A NOVA rota para escutar a Evolution API
  fastify.post("/webhook", NotificacaoController.receberWebhook);
}

module.exports = rotasNotificacoes;
