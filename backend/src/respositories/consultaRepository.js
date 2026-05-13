const supabase = require('../config/supabase');

class ConsultaRepository {
  
  async buscarAtrasadas(dataFormatada) {
    const { data, error } = await supabase
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
          consentimento_msg
        )
      `)
      .lte('data_ultima_consulta', dataFormatada); // Mais antigo ou igual à data limite

    if (error) throw error;
    return data;
  }

  async criar(dadosConsulta) {
    const { data, error } = await supabase
      .from('consultas')
      .insert([dadosConsulta])
      .select();

    if (error) throw error;
    return data[0];
  }

}

module.exports = new ConsultaRepository();