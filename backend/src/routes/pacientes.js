const pacienteController = require("../controllers/pacienteController");
const { verificarPermissao } = require("../middlewares/authMiddleware");

async function rotasPacientes(fastify, options) {
  // ADMIN e RECEPCAO têm permissão para criar e editar pacientes
  const adminERecepcao = {
    preHandler: [verificarPermissao(["ADMIN", "RECEPCAO"])],
  };

  // Leitura aberta para todos os usuários autenticados (incluindo ACS)
  fastify.get("/pacientes", pacienteController.listar);

  // Escrita e atualização trancadas
  fastify.post("/pacientes", adminERecepcao, pacienteController.criar);
  fastify.put("/pacientes/:id", adminERecepcao, pacienteController.atualizar);
}

module.exports = rotasPacientes;
