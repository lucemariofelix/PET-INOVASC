const usuarioController = require("../controllers/usuarioController");

async function rotasUsuarios(fastify, options) {
  fastify.get("/usuarios", usuarioController.listar);
  fastify.post("/usuarios", usuarioController.criar);
  fastify.put("/usuarios/:id", usuarioController.atualizar);
  fastify.delete("/usuarios/:id", usuarioController.excluir);
}

module.exports = rotasUsuarios;
