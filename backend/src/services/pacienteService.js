// CORREÇÃO APLICADA: Caminho ajustado para 'repositories'
const pacienteRepository = require("../repositories/pacienteRepository");

class PacienteService {
  // Recebe o authHeader
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

    // Repassa o authHeader para o repositório
    const pacienteSalvo = await pacienteRepository.criar(
      pacienteParaSalvar,
      authHeader,
    );
    return pacienteSalvo;
  }

  // Recebe e repassa o authHeader
  async listarPacientes(authHeader) {
    return await pacienteRepository.listarTodos(authHeader);
  }
}

module.exports = new PacienteService();
