const mensagemController = require("../controllers/mensagemController");
const { verificarPermissao } = require("../middlewares/authMiddleware");

async function rotasMensagens(fastify, options) {
  const todosAutenticados = {
    preHandler: [verificarPermissao(["ADMIN", "RECEPCAO", "ACS"])],
  };

  // Rota para o React solicitar o disparo da notificação via Evolution API
  fastify.post("/mensagens/enviar", todosAutenticados, mensagemController.enviarMensagem);

  // CORREÇÃO: Removido o '/api' para bater exatamente com o que o frontend está pedindo
  fastify.get("/whatsapp/status", todosAutenticados, mensagemController.checarStatusWhatsApp);
}

module.exports = rotasMensagens;
