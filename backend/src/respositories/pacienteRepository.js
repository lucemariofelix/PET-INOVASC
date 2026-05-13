const supabase = require('../config/supabase');

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
  async listarTodos() {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .order('created_at', { ascending: false }); // Já traz os mais recentes primeiro

    if (error) throw error;
    
    return data;
  }
}

module.exports = new PacienteRepository();