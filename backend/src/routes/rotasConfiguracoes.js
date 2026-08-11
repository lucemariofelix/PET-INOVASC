const logController = require('../controllers/logController');
const { verificarPermissao } = require("../middlewares/authMiddleware");

// A função empacota as rotas e recebe a instância do fastify
async function rotasConfiguracoes(fastify, options) {
  const controller = options?.logController || logController;
  const verificar = options?.verificarPermissao || verificarPermissao;
  const soAdmin = { preHandler: [verificar(["ADMIN"])] };

  fastify.get('/logs', {
    ...soAdmin,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          pagina: { type: 'integer', minimum: 1, default: 1 },
          limite: { type: 'integer', minimum: 1, maximum: 50, default: 5 },
        },
        additionalProperties: false,
      },
    },
  }, controller.listar);

}

// Exporta a função para que o server.js consiga registrá-la
module.exports = rotasConfiguracoes;
