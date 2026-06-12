const logController = require('../controllers/logController');
const { verificarPermissao } = require("../middlewares/authMiddleware");

// A função empacota as rotas e recebe a instância do fastify
async function rotasConfiguracoes(fastify, options) {
  const soAdmin = { preHandler: [verificarPermissao(["ADMIN"])] };

  fastify.get('/logs', soAdmin, logController.listar);

}

// Exporta a função para que o server.js consiga registrá-la
module.exports = rotasConfiguracoes;
