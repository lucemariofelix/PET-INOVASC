const grupoAcompanhamentoService = require("../services/grupoAcompanhamentoService");
const { executarController } = require("./controllerExecutor");

class GrupoAcompanhamentoController {
  async listar(request, reply) {
    const authHeader = request.headers.authorization;
    return executarController(request, reply, {
      executar: () => grupoAcompanhamentoService.listarGrupos(authHeader),
      responder: (grupos) => reply.send({ total: grupos.length, grupos }),
    });
  }

  async criar(request, reply) {
    const authHeader = request.headers.authorization;
    return executarController(request, reply, {
      executar: () => grupoAcompanhamentoService.criarGrupo(
        request.body,
        authHeader,
      ),
      responder: (grupo) => reply.status(201).send({
        mensagem: "Grupo de acompanhamento criado com sucesso!",
        grupo,
      }),
    });
  }

  async excluir(request, reply) {
    const authHeader = request.headers.authorization;
    return executarController(request, reply, {
      executar: () => grupoAcompanhamentoService.excluirGrupo(
        request.params.id,
        authHeader,
      ),
      auditoria: ({ resultado }) => ({
        acao: "EXCLUIU_GRUPO_ACOMPANHAMENTO",
        detalhes: `Excluiu o grupo de acompanhamento: ${resultado.nome} (${resultado.id})`,
      }),
      responder: (grupo) => reply.status(200).send({
        mensagem: "Grupo de acompanhamento excluído com sucesso!",
        grupo,
      }),
    });
  }

  async disparar(request, reply) {
    const authHeader = request.headers.authorization;
    return executarController(request, reply, {
      executar: () => grupoAcompanhamentoService.dispararMensagens(
        request.params.id,
        request.body.mensagem,
        request.user?.id || null,
        authHeader,
      ),
      responder: (resultado) => reply.send(resultado),
    });
  }
}

module.exports = new GrupoAcompanhamentoController();
