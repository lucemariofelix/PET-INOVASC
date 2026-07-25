const mensagemController = require("../controllers/mensagemController");
const { verificarPermissao } = require("../middlewares/authMiddleware");

async function rotasMensagens(fastify, options) {
  const controller = options.mensagemController || mensagemController;
  const verificar = options.verificarPermissao || verificarPermissao;
  const todosAutenticados = {
    preHandler: [verificar(["ADMIN", "RECEPCAO", "ACS"])],
  };

  // Rota para o React solicitar o disparo da notificação via Evolution API
  fastify.post(
    "/mensagens/enviar",
    todosAutenticados,
    controller.enviarMensagem,
  );

  fastify.get(
    "/mensagens/status",
    {
      ...todosAutenticados,
      schema: {
        querystring: {
          type: "object",
          required: ["consulta_ids"],
          properties: {
            consulta_ids: { type: "string", minLength: 36, maxLength: 739 },
          },
          additionalProperties: false,
        },
      },
    },
    controller.listarStatusMensagens,
  );

  // CORREÇÃO: Removido o '/api' para bater exatamente com o que o frontend está pedindo
  fastify.get(
    "/whatsapp/status",
    todosAutenticados,
    controller.checarStatusWhatsApp,
  );
}

module.exports = rotasMensagens;
