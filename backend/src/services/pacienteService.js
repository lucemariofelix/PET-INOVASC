const pacienteRepository = require("../repositories/pacienteRepository");

class PacienteService {
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
      condicao: dados.condicao ? dados.condicao.toUpperCase() : null,
      status_telefone: dados.status_telefone || "VALIDO",
      consentimento_msg:
        dados.consentimento_msg !== undefined ? dados.consentimento_msg : true,
    };

    const pacienteSalvo = await pacienteRepository.criar(
      pacienteParaSalvar,
      authHeader,
    );
    return pacienteSalvo;
  }

  // LISTAR
  async listarPacientes(authHeader) {
    return await pacienteRepository.listarTodos(authHeader);
  }

  // ATUALIZAR (NOVO)
  async atualizarPaciente(id, dados, authHeader) {
    if (!id) {
      throw new Error(
        "O identificador (ID) do paciente é obrigatório para atualização.",
      );
    }

    // Como já formatamos os dados no front-end, repassamos a carga validada
    return await pacienteRepository.atualizar(id, dados, authHeader);
  }
}

module.exports = new PacienteService();
