// src/routes/rotasNotificacoes.js
const notificacaoController = require("../controllers/notificacaoController");

const esquemaDisparoLote = {
  body: {
    type: "object",
    required: ["mensagem", "pacientes"],
    properties: {
      mensagem: { type: "string", minLength: 5 }, // Impede o envio de mensagens em branco ou com 1 letra
      pacientes: {
        type: "array",
        minItems: 1, // Impede o disparo se a lista estiver vazia
        items: {
          type: "object",
          required: ["telefone", "nome_completo"],
          properties: {
            telefone: { type: "string", minLength: 10 },
            nome_completo: { type: "string" },
          },
        },
      },
    },
    additionalProperties: false,
  },
};

// Se você usa middleware para verificar token/permissão, importe-o aqui.
// Exemplo genérico:
// const { verificarPermissao } = require('../middlewares/authMiddleware');

async function rotasNotificacoes(fastify, options) {
  // A rota exata que o frontend está procurando
  // Se tiver middleware de segurança, adicione-o como no resto do sistema
  fastify.post(
    "/notificacoes/lote",
    { schema: esquemaDisparoLote },
    notificacaoController.disparar,
  );
}

module.exports = rotasNotificacoes;
