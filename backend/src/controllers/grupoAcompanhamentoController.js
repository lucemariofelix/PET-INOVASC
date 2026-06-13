const grupoAcompanhamentoService = require("../services/grupoAcompanhamentoService");

class GrupoAcompanhamentoController {
  async listar(request, reply) {
    try {
      const authHeader = request.headers.authorization;
      const grupos = await grupoAcompanhamentoService.listarGrupos(authHeader);

      return reply.send({ total: grupos.length, grupos });
    } catch (error) {
      request.log.error(error);
      return reply
        .status(500)
        .send({ erro: "Falha ao buscar grupos de acompanhamento." });
    }
  }

  async criar(request, reply) {
    try {
      const authHeader = request.headers.authorization;
      const grupo = await grupoAcompanhamentoService.criarGrupo(
        request.body,
        authHeader,
      );

      return reply.status(201).send({
        mensagem: "Grupo de acompanhamento criado com sucesso!",
        grupo,
      });
    } catch (error) {
      request.log.error(error);

      if (
        error.code === "23505" ||
        error.message?.includes("grupos_acompanhamento_nome_key")
      ) {
        return reply
          .status(400)
          .send({
            erro: "Já existe um grupo de acompanhamento com este nome.",
          });
      }

      const statusCode = error.message?.includes("nome do grupo") ? 400 : 500;
      return reply.status(statusCode).send({ erro: error.message });
    }
  }

  async disparar(request, reply) {
    try {
      const authHeader = request.headers.authorization;
      const resultado = await grupoAcompanhamentoService.dispararMensagens(
        request.params.id,
        request.body.mensagem,
        request.user?.id || null,
        authHeader,
      );

      return reply.send(resultado);
    } catch (error) {
      request.log.error(error);

      if (error.message === "WHATSAPP_DESCONECTADO") {
        return reply.status(503).send({
          erro: "Falha: O WhatsApp do sistema está desconectado. Conecte o aparelho antes de iniciar o disparo.",
        });
      }

      const erroCliente =
        error.message?.includes("Informe") ||
        error.message?.includes("Nenhum paciente");

      return reply.status(erroCliente ? 400 : 500).send({ erro: error.message });
    }
  }
}

module.exports = new GrupoAcompanhamentoController();
