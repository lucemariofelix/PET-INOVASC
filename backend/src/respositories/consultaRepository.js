const { getSupabaseUsuario, supabase } = require('../config/supabase');

class ConsultaRepository {
  
  // Lista todas as consultas com o cliente contextualizado
  async listarTodas(authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from('consultas')
      .select(`
        tipo_profissional,
        data_ultima_consulta,
        data_proxima_consulta,
        status_consulta,
        pacientes (
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

  // Busca consultas atrasadas utilizando o cliente contextualizado
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
          nome_completo,
          acs,
          condicao,
          status_telefone,
          consentimento_msg,
          telefone
        )
      `)
      .lte('data_ultima_consulta', dataFormatada);

    if (error) throw error;
    return data;
  }

  // Cria uma nova consulta utilizando as credenciais seguras do usuário logado
  async criar(dadosConsulta, authHeader) {
    // CORREÇÃO: Substituído o cliente "supabase" global anônimo pelo cliente dinâmico autenticado
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
