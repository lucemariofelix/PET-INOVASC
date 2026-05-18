// CORREÇÃO: O caminho da pasta "repositories" estava com um 's' a mais (respositories)
const pacienteRepository = require('../respositories/pacienteRepository');

class PacienteService {
  
  async cadastrarPaciente(dados) {
    // 1. Regras de Negócio / Validações
    if (!dados.nome_completo) {
      throw new Error('O nome completo do paciente é obrigatório.');
    }
    
    // NOVA VALIDAÇÃO: Bloqueia no backend se não mandar o documento
    if (!dados.cpf_cns) {
      throw new Error('O CPF ou Cartão do SUS (cpf_cns) é obrigatório.');
    }

    // 2. Formatação dos dados
    const pacienteParaSalvar = {
      nome_completo: dados.nome_completo,
      cpf_cns: dados.cpf_cns,
      data_nascimento: dados.data_nascimento,
      telefone: dados.telefone || null, // <--- O TELEFONE FOI INCLUÍDO AQUI
      endereco: dados.endereco || null,
      acs: dados.acs || null,
      condicao: dados.condicao ? dados.condicao.toUpperCase() : null, 
      status_telefone: dados.status_telefone || 'VALIDO', 
      consentimento_msg: dados.consentimento_msg !== undefined ? dados.consentimento_msg : true 
    };

    // 3. Manda para o repositório
    const pacienteSalvo = await pacienteRepository.criar(pacienteParaSalvar);
    return pacienteSalvo;
  }

  async listarPacientes() {
    return await pacienteRepository.listarTodos();
  }
}

module.exports = new PacienteService();