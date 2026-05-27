// src/routes/rotasNotificacoes.js
const notificacaoController = require("../controllers/notificacaoController");

// Se você usa middleware para verificar token/permissão, importe-o aqui.
// Exemplo genérico:
// const { verificarPermissao } = require('../middlewares/authMiddleware');

async function rotasNotificacoes(fastify, options) {
  // A rota exata que o frontend está procurando
  // Se tiver middleware de segurança, adicione-o como no resto do sistema
  fastify.post("/notificacoes/lote", notificacaoController.disparar);
}

module.exports = rotasNotificacoes;
