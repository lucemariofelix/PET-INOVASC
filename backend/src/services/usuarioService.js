const usuarioRepository = require("../repositories/usuarioRepository");
// const bcrypt = require('bcryptjs'); // Descomente se for usar criptografia de senha

class UsuarioService {
  async listar(authHeader) {
    return await usuarioRepository.listarTodos(authHeader);
  }

  async criarUsuario(dados, authHeader) {
    if (!dados.nome || !dados.email || !dados.senha || !dados.funcao) {
      throw new Error(
        "Todos os campos são obrigatórios para criar um usuário.",
      );
    }

    const payload = {
      nome: dados.nome,
      email: dados.email.toLowerCase(),
      funcao: dados.funcao,
      senha: dados.senha, // Se usar bcrypt, troque por: await bcrypt.hash(dados.senha, 10)
    };

    return await usuarioRepository.criar(payload, authHeader);
  }

  async atualizarUsuario(id, dados, authHeader) {
    if (!id) throw new Error("ID do usuário é obrigatório.");

    const payload = {
      nome: dados.nome,
      email: dados.email?.toLowerCase(),
      funcao: dados.funcao,
    };

    // Só atualiza a senha se o admin digitou uma senha nova no modal
    if (dados.senha && dados.senha.trim() !== "") {
      payload.senha = dados.senha; // Se usar bcrypt: await bcrypt.hash(dados.senha, 10)
    }

    return await usuarioRepository.atualizar(id, payload, authHeader);
  }

  async excluirUsuario(id, authHeader) {
    if (!id) throw new Error("ID do usuário é obrigatório para exclusão.");
    return await usuarioRepository.excluir(id, authHeader);
  }
}

module.exports = new UsuarioService();
