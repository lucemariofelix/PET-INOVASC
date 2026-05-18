// IMPORTANTE: Agora importamos a função getSupabaseUsuario
const { getSupabaseUsuario } = require('../config/supabase');

class ConsultaRepository {
  
  // Modificado: Agora recebe o authHeader
  async listarTodas(authHeader) {
    // Obtém o cliente do Supabase contextualizado com o usuário logado
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

  // Faça o mesmo para a função buscarAtrasadas se o Dashboard mobile/filtros usar ela
  async buscarAtrasadas(dataFormatada, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);
    const { data, error } = await supabaseClient
      .from('consultas')
      .select(`...`) // seu select existente
      .lte('data_ultima_consulta', dataFormatada);

    if (error) throw error;
    return data;
  }

  async criar(dadosConsulta) {
    // Rotas de inserção/POST também podem usar o mesmo padrão se o RLS exigir para INSERT
    const { data, error } = await supabase
      .from('consultas')
      .insert([dadosConsulta])
      .select();

    if (error) throw error;
    return data[0];
  }
}

module.exports = new ConsultaRepository();