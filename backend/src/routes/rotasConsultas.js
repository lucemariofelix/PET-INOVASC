const consultaController = require('../controllers/consultaController');
const { verificarPermissao } = require("../middlewares/authMiddleware");

async function rotasConsultas(fastify, options) {
  const controller = options.consultaController || consultaController;
  const verificar = options.verificarPermissao || verificarPermissao;
  const todosAutenticados = {
    preHandler: [verificar(["ADMIN", "RECEPCAO", "ACS"])],
  };

  const adminERecepcao = {
    preHandler: [verificar(["ADMIN", "RECEPCAO"])],
  };

  // O garçom apenas anota o pedido e manda para a cozinha
  fastify.get('/consultas/atrasadas', todosAutenticados, controller.listarAtrasadas);

  // ROTA GET (NOVA): Traz todas as consultas
  fastify.get('/consultas', todosAutenticados, controller.listarTodas);

  // ROTA POST: Agendar consulta
  fastify.post('/consultas', adminERecepcao, controller.criar);

  fastify.patch(
    '/consultas/:id/cancelamento',
    todosAutenticados,
    controller.efetivarCancelamento,
  );

  fastify.patch(
    '/consultas/:id/desfecho',
    adminERecepcao,
    controller.registrarDesfecho,
  );

}

module.exports = rotasConsultas;
