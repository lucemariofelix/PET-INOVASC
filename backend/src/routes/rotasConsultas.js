const consultaController = require('../controllers/consultaController');
const { verificarPermissao } = require("../middlewares/authMiddleware");

async function rotasConsultas(fastify, options) {
  const todosAutenticados = {
    preHandler: [verificarPermissao(["ADMIN", "RECEPCAO", "ACS"])],
  };

  const adminERecepcao = {
    preHandler: [verificarPermissao(["ADMIN", "RECEPCAO"])],
  };

  // O garçom apenas anota o pedido e manda para a cozinha
  fastify.get('/consultas/atrasadas', todosAutenticados, consultaController.listarAtrasadas);

  // ROTA GET (NOVA): Traz todas as consultas
  fastify.get('/consultas', todosAutenticados, consultaController.listarTodas);

  // ROTA POST: Agendar consulta
  fastify.post('/consultas', adminERecepcao, consultaController.criar);

}

module.exports = rotasConsultas;
