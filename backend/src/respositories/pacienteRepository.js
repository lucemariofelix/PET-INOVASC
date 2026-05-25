const { getSupabaseUsuario, supabase } = require('../config/supabase');

class PacienteRepository {
  
  // MODIFICADO: Agora recebe o authHeader como segundo parâmetro
  async criar(dadosPaciente, authHeader) {
    // OBTÉM o cliente do Supabase contextualizado com o usuário logado
    const supabaseClient = getSupabaseUsuario(authHeader);

    // ALTERADO: Utiliza "supabaseClient" em vez do "supabase" global anônimo
    const { data, error } = await supabaseClient
      .from('pacientes')
      .insert([dadosPaciente])
      .select(); // Pede para o Supabase devolver a linha inserida (com ID, created_at, etc)

    if (error) throw error;
    
    return data[0]; 
  }

  // Função que busca todos (mantida igual, pois já estava correta)
  async listarTodos(authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from('pacientes')
      .select('*')
      .order('nome_completo', { ascending: true });

    if (error) throw error;
    
    return data;
  }
}

module.exports = new PacienteRepository();
