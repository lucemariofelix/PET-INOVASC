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

  // 1. Rota de envio: Protegida (Apenas usuários logados do sistema podem acionar)
  fastify.post(
    "/notificacoes/lote",
    {
      ...todosAutenticados,
      schema: esquemaDisparoLote,
    },
    notificacaoController.disparar,
  );

  // 2. Rota de escuta (Webhook): Aberta para a Evolution API enviar os status de leitura
  // Observação: Não colocamos schema de body aqui ainda porque queremos logar o JSON
  // cru da Evolution para descobrir a estrutura exata primeiro.
  fastify.post("/notificacoes/webhook", notificacaoController.receberWebhook);
}

module.exports = rotasNotificacoes;
