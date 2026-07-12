const usuarioService = require("../services/usuarioService");
const { executarController } = require("./controllerExecutor");

class UsuarioController {
  async listar(request, reply) {
    const authHeader = request.headers.authorization;
    return executarController(request, reply, {
      executar: () => usuarioService.listar(authHeader),
      responder: (usuarios) => reply.send({ usuarios }),
    });
  }

  async listarACS(request, reply) {
    const authHeader = request.headers.authorization;
    return executarController(request, reply, {
      executar: () => usuarioService.listarACS(authHeader),
      responder: (usuarios) => reply.send({ usuarios }),
    });
  }

  async criar(request, reply) {
    const authHeader = request.headers.authorization;
    return executarController(request, reply, {
      executar: () => usuarioService.criarUsuario(request.body, authHeader),
      auditoria: () => ({
        acao: "CRIOU_USUARIO",
        detalhes: `Cadastrou membro da equipa: ${request.body.nome} (${request.body.funcao})`,
      }),
      responder: (usuario) =>
        reply.status(201).send({ mensagem: "Usuário criado!", usuario }),
    });
  }

  async atualizar(request, reply) {
    const { id } = request.params;
    const authHeader = request.headers.authorization;
    return executarController(request, reply, {
      executar: () =>
        usuarioService.atualizarUsuario(id, request.body, authHeader),
      auditoria: () => ({
        acao: "ATUALIZOU_USUARIO",
        detalhes: `Alterou acessos/dados do utilizador ID: ${id}`,
      }),
      responder: (usuario) => reply.send({ mensagem: "Usuário atualizado!", usuario }),
    });
  }

  async excluir(request, reply) {
    const { id } = request.params;
    const authHeader = request.headers.authorization;
    return executarController(request, reply, {
      executar: () => usuarioService.excluirUsuario(id, authHeader),
      auditoria: () => ({
        acao: "EXCLUIU_USUARIO",
        detalhes: `Removeu permanentemente o utilizador ID: ${id}`,
      }),
      responder: () => reply.send({ mensagem: "Usuário removido com sucesso." }),
    });
  }
}

module.exports = new UsuarioController();
