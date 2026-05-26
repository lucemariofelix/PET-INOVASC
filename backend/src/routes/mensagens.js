const mensagemController = require("../controllers/mensagemController");

async function rotasMensagens(fastify, options) {
  // Rota para o React solicitar o disparo da notificação via Evolution API
  fastify.post("/mensagens/enviar", mensagemController.enviarMensagem);

  // CORREÇÃO: Removido o '/api' para bater exatamente com o que o frontend está pedindo
  fastify.get("/whatsapp/status", mensagemController.checarStatusWhatsApp);
}

module.exports = rotasMensagens;
