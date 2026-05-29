const logController = require('../controllers/logController');

// A função empacota as rotas e recebe a instância do fastify
async function rotasConfiguracoes(fastify, options) {
  
  // Se você tiver um middleware de autenticação, pode adicioná-lo aqui (ex: { preHandler: [seuMiddleware] })
  fastify.get('/logs', logController.listar);

}

// Exporta a função para que o server.js consiga registrá-la
module.exports = rotasConfiguracoes;
