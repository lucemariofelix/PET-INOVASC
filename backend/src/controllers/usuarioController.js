const usuarioService = require("../services/usuarioService");
const logRepository = require("../repositories/logRepository"); // <-- IMPORTADO

class UsuarioController {
  async listar(request, reply) {
    try {
      const authHeader = request.headers.authorization;
      const usuarios = await usuarioService.listar(authHeader);
      return reply.send({ usuarios });
    } catch (error) {
      request.log.error(error);
      if (error.code === "42501")
        return reply.status(401).send({ erro: "Sem permissão." });
      return reply.status(500).send({ erro: "Falha ao buscar equipe." });
    }
  }

  async criar(request, reply) {
    try {
      const authHeader = request.headers.authorization;
      const usuario = await usuarioService.criarUsuario(
        request.body,
        authHeader,
      );

      // REGISTO DE AUDITORIA
      await logRepository.registrar(
        null, 
        'CRIOU_USUARIO', 
        `Cadastrou membro da equipa: ${request.body.nome} (${request.body.funcao})`
      );

      return reply.status(201).send({ mensagem: "Usuário criado!", usuario });
    } catch (error) {
      request.log.error(error);
      if (error.code === "23505") {
        return reply
          .status(400)
          .send({ erro: "Este email já está cadastrado no sistema." });
      }
      return reply.status(400).send({ erro: error.message });
    }
  }

  async atualizar(request, reply) {
    try {
      const { id } = request.params;
      const authHeader = request.headers.authorization;
      const usuario = await usuarioService.atualizarUsuario(
        id,
        request.body,
        authHeader,
      );

      // REGISTO DE AUDITORIA
      await logRepository.registrar(
        null, 
        'ATUALIZOU_USUARIO', 
        `Alterou acessos/dados do utilizador ID: ${id}`
      );

      return reply.send({ mensagem: "Usuário atualizado!", usuario });
    } catch (error) {
      request.log.error(error);
      if (error.code === "23505")
        return reply.status(400).send({ erro: "Email já em uso." });
      return reply.status(500).send({ erro: error.message });
    }
  }

  async excluir(request, reply) {
    try {
      const { id } = request.params;
      const authHeader = request.headers.authorization;
      await usuarioService.excluirUsuario(id, authHeader);

      // REGISTO DE AUDITORIA
      await logRepository.registrar(
        null, 
        'EXCLUIU_USUARIO', 
        `Removeu permanentemente o utilizador ID: ${id}`
      );

      return reply.send({ mensagem: "Usuário removido com sucesso." });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ erro: "Falha ao excluir usuário." });
    }
  }
}

module.exports = new UsuarioController();
