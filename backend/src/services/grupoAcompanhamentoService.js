const grupoAcompanhamentoRepository = require("../repositories/grupoAcompanhamentoRepository");

class GrupoAcompanhamentoService {
  async listarGrupos(authHeader) {
    return await grupoAcompanhamentoRepository.listarTodos(authHeader);
  }

  async criarGrupo(dados, authHeader) {
    const nome = dados.nome?.trim();

    if (!nome || nome.length < 2) {
      throw new Error("O nome do grupo deve ter pelo menos 2 caracteres.");
    }

    const payload = {
      nome,
      descricao: dados.descricao?.trim() || null,
    };

    return await grupoAcompanhamentoRepository.criar(payload, authHeader);
  }
}

module.exports = new GrupoAcompanhamentoService();
