const { getSupabaseUsuario } = require('../config/supabase');

class PacienteRepository {
  
  // Função que insere no banco
  async criar(dadosPaciente) {
    const { data, error } = await supabase
      .from('pacientes')
      .insert([dadosPaciente])
      .select(); // Pede para o Supabase devolver a linha inserida (com ID, created_at, etc)

    if (error) throw error;
    
    return data[0]; 
  }

  // Função que busca todos
  async listarTodos(authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from('pacientes')
      .select('*')
      .order('nome_completo', { ascending: true }); // Já traz os mais recentes primeiro

    if (error) throw error;
    
    return data;
  }
}

module.exports = new PacienteRepository();