const pacienteRepository = require("../repositories/pacienteRepository");

const temPropriedade = (objeto, propriedade) =>
  Object.prototype.hasOwnProperty.call(objeto, propriedade);

class PacienteService {
  normalizarGruposIds(dados) {
    if (!temPropriedade(dados, "grupos_ids")) {
      return undefined;
    }

    if (!Array.isArray(dados.grupos_ids)) {
      throw new Error("O campo grupos_ids deve ser uma lista de IDs.");
    }

    return [...new Set(dados.grupos_ids.filter(Boolean))];
  }

  async validarAgenteSeInformado(agenteId, authHeader) {
    if (!agenteId) return;

    const agente = await pacienteRepository.buscarAgenteACSPorId(
      agenteId,
      authHeader,
    );

    if (!agente) {
      throw new Error("Agente de saúde não encontrado ou não possui função ACS.");
    }
  }

  // CADASTRAR
  async cadastrarPaciente(dados, authHeader) {
    if (!dados.nome_completo) {
      throw new Error("O nome completo do paciente é obrigatório.");
    }

    if (!dados.cpf_cns) {
      throw new Error("O CPF ou Cartão do SUS (cpf_cns) é obrigatório.");
    }

    const pacienteParaSalvar = {
      nome_completo: dados.nome_completo,
      cpf_cns: dados.cpf_cns,
      data_nascimento: dados.data_nascimento,
      telefone: dados.telefone || null,
      endereco: dados.endereco || null,
      acs: dados.acs || null,
      agente_id: dados.agente_id || null,
      condicao: dados.condicao ? dados.condicao.toUpperCase() : null,
      status_telefone: dados.status_telefone || "VALIDO",
      consentimento_msg:
        dados.consentimento_msg !== undefined ? dados.consentimento_msg : true,
    };

    const gruposIds = this.normalizarGruposIds(dados);
    await this.validarAgenteSeInformado(pacienteParaSalvar.agente_id, authHeader);

    const pacienteSalvo = await pacienteRepository.criar(
      pacienteParaSalvar,
      gruposIds,
      authHeader,
    );
    return pacienteSalvo;
  }

  // LISTAR
  async listarPacientes(authHeader) {
    return await pacienteRepository.listarTodos(authHeader);
  }

  async filtrarPacientes(filtros, authHeader) {
    return await pacienteRepository.filtrar(filtros || {}, authHeader);
  }

  // ATUALIZAR (NOVO)
  async atualizarPaciente(id, dados, authHeader) {
    if (!id) {
      throw new Error(
        "O identificador (ID) do paciente é obrigatório para atualização.",
      );
    }

    const pacienteParaAtualizar = {};

    if (temPropriedade(dados, "nome_completo")) {
      pacienteParaAtualizar.nome_completo = dados.nome_completo;
    }

    if (temPropriedade(dados, "cpf_cns")) {
      pacienteParaAtualizar.cpf_cns = dados.cpf_cns;
    }

    if (temPropriedade(dados, "data_nascimento")) {
      pacienteParaAtualizar.data_nascimento = dados.data_nascimento;
    }

    if (temPropriedade(dados, "telefone")) {
      pacienteParaAtualizar.telefone = dados.telefone || null;
    }

    if (temPropriedade(dados, "endereco")) {
      pacienteParaAtualizar.endereco = dados.endereco || null;
    }

    if (temPropriedade(dados, "acs")) {
      pacienteParaAtualizar.acs = dados.acs || null;
    }

    if (temPropriedade(dados, "condicao")) {
      pacienteParaAtualizar.condicao = dados.condicao
        ? dados.condicao.toUpperCase()
        : null;
    }

    if (temPropriedade(dados, "agente_id")) {
      pacienteParaAtualizar.agente_id = dados.agente_id || null;
      await this.validarAgenteSeInformado(dados.agente_id, authHeader);
    }

    const gruposIds = this.normalizarGruposIds(dados);

    return await pacienteRepository.atualizar(
      id,
      pacienteParaAtualizar,
      gruposIds,
      authHeader,
    );
  }
}

module.exports = new PacienteService();
