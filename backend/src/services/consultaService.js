const consultaRepository = require('../respositories/consultaRepository');

class ConsultaService {
  
  async obterConsultasAtrasadas(authHeader) {
    // 1. Regra de Negócio: Calcula a data exata de 150 dias atrás
    const diasAtraso = 150;
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasAtraso);
    const dataFormatada = dataLimite.toISOString();

    // 2. Manda o repositório buscar no banco usando a data calculada e o token de autenticação
    const consultas = await consultaRepository.buscarAtrasadas(dataFormatada, authHeader);

    // 3. Devolve os dados brutos e o contexto para o Controller
    return {
      dias_regra: diasAtraso,
      corte_de_data: dataFormatada,
      dados: consultas
    };
  }

  async agendarConsulta(dados, authHeader) {
    // 1. Validações Críticas
    if (!dados.paciente_id) {
      throw new Error('O ID do paciente é obrigatório para agendar uma consulta.');
    }
    
    if (!dados.tipo_profissional) {
      throw new Error('O tipo de profissional (Médico, Enfermeiro, Dentista...) é obrigatório.');
    }

    if (!dados.data_proxima_consulta) {
      throw new Error('A data da consulta é obrigatória.');
    }

    // 2. Formatação dos dados para o Banco
    const consultaParaSalvar = {
      paciente_id: dados.paciente_id,
      tipo_profissional: dados.tipo_profissional,
      data_proxima_consulta: dados.data_proxima_consulta,
      // Se mandar a data da última, salva. Se não mandar, fica nulo.
      data_ultima_consulta: dados.data_ultima_consulta || null, 
      // Status padrão inicial.
      status_consulta: dados.status_consulta || 'AGENDADA' 
    };

    // 3. Envia para o Repositório passando o token de autenticação para validar o RLS
    return await consultaRepository.criar(consultaParaSalvar, authHeader);
  }

  // Busca todas sem aplicar regra de atraso
  async obterTodasConsultas(authHeader) {
    return await consultaRepository.listarTodas(authHeader);
  }

}

module.exports = new ConsultaService();
