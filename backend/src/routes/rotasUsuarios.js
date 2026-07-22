const usuarioController = require("../controllers/usuarioController");
const { verificarPermissao } = require("../middlewares/authMiddleware");

async function rotasUsuarios(fastify, options = {}) {
  const controller = options.usuarioController || usuarioController;
  const criarVerificacao = options.verificarPermissao || verificarPermissao;
  // Apenas ADMIN tem permissão para gerenciar a equipe
  const soAdmin = { preHandler: [criarVerificacao(["ADMIN"])] };
  const todosAutenticados = {
    preHandler: [criarVerificacao(["ADMIN", "RECEPCAO", "ACS"])],
  };

  fastify.get("/usuarios/acs", todosAutenticados, controller.listarACS);
  fastify.get("/usuarios", soAdmin, controller.listar);
  fastify.post("/usuarios", soAdmin, controller.criar);
  fastify.put("/usuarios/:id", soAdmin, controller.atualizar);
  fastify.delete("/usuarios/:id", soAdmin, controller.excluir);
}

module.exports = rotasUsuarios;
