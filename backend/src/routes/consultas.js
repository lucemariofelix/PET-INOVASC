const consultaController = require('../controllers/consultaController');

async function rotasConsultas(fastify, options) {
  
  // O garçom apenas anota o pedido e manda para a cozinha
  fastify.get('/consultas/atrasadas', consultaController.listarAtrasadas);
  
  // ROTA GET (NOVA): Traz todas as consultas
  fastify.get('/consultas', consultaController.listarTodas);
  
  // ROTA POST: Agendar consulta
  fastify.post('/consultas', consultaController.criar);

}

module.exports = rotasConsultas;