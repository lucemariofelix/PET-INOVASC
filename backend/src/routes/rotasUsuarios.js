const usuarioController = require("../controllers/usuarioController");
const { verificarPermissao } = require("../middlewares/authMiddleware");

async function rotasUsuarios(fastify, options) {
  // Apenas ADMIN tem permissão para gerenciar a equipe
  const soAdmin = { preHandler: [verificarPermissao(["ADMIN"])] };
  const todosAutenticados = {
    preHandler: [verificarPermissao(["ADMIN", "RECEPCAO", "ACS"])],
  };

  fastify.get("/usuarios/acs", todosAutenticados, usuarioController.listarACS);
  fastify.get("/usuarios", soAdmin, usuarioController.listar);
  fastify.post("/usuarios", soAdmin, usuarioController.criar);
  fastify.put("/usuarios/:id", soAdmin, usuarioController.atualizar);
  fastify.delete("/usuarios/:id", soAdmin, usuarioController.excluir);
}

module.exports = rotasUsuarios;
