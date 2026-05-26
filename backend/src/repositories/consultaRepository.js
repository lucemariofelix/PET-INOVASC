const { getSupabaseUsuario, supabase } = require('../config/supabase');

class ConsultaRepository {
  
  // Lista todas as consultas com o cliente contextualizado e o histórico do paciente
  async listarTodas(authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from('consultas')
      .select(`
        id,  
        tipo_profissional,
        data_ultima_consulta,
        data_proxima_consulta,
        status_consulta,
        historico_mensagens (
          data_envio,
          status
        ),
        pacientes (
          id,
          nome_completo,
          acs,
          condicao,
          status_telefone,
          consentimento_msg,
          telefone
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Busca consultas atrasadas incluindo o histórico de mensagens do paciente
  async buscarAtrasadas(dataFormatada, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);
    
    const { data, error } = await supabaseClient
      .from('consultas')
      .select(`
        tipo_profissional,
        data_ultima_consulta,
        data_proxima_consulta,
        status_consulta,
        pacientes (
          id,
          nome_completo,
          acs,
          condicao,
          status_telefone,
          consentimento_msg,
          telefone,
          historico_mensagens (
            data_envio,
            status
          )
        )
      `)
      .lte('data_ultima_consulta', dataFormatada);

    if (error) throw error;
    return data;
  }

  // Cria uma nova consulta utilizando as credenciais seguras do usuário logado
  async criar(dadosConsulta, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from('consultas')
      .insert([dadosConsulta])
      .select();

    if (error) throw error;
    return data[0];
  }
}

module.exports = new ConsultaRepository();
