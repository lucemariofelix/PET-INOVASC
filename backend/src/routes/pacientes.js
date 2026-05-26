const pacienteController = require("../controllers/pacienteController");

async function rotasPacientes(fastify, options) {
  // Suas rotas existentes...
  fastify.get("/pacientes", pacienteController.listar);
  fastify.post("/pacientes", pacienteController.criar);

  // NOVA ROTA: Captura o ID diretamente da URL (/pacientes/123-abc...)
  fastify.put("/pacientes/:id", pacienteController.atualizarPaciente);
}

module.exports = rotasPacientes;
