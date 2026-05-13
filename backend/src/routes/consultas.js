const consultaController = require('../controllers/consultaController');

async function rotasConsultas(fastify, options) {
  
  // O garçom apenas anota o pedido e manda para a cozinha
  fastify.get('/consultas/atrasadas', consultaController.listarAtrasadas);
  // ROTA POST (NOVA): Agendar consulta
  fastify.post('/consultas', consultaController.criar);

}

module.exports = rotasConsultas;