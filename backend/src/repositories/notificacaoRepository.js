const { supabaseAdmin } = require('../config/supabase');

class NotificacaoRepository {
  
  // Salva o registro da mensagem com a nova estrutura da tabela
  async registrarEnvio(dadosRegistro) {
    // Como a tabela tem o campo data_envio, vamos injetar a data atual
    const payload = {
      ...dadosRegistro,
      data_envio: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('historico_mensagens')
      .insert([payload])
      .select();

    if (error) {
      console.error(`Erro ao gravar histórico para o paciente ${dadosRegistro.paciente_id}:`, error.message);
      throw error; // Não estouramos o erro geral para não parar a fila, tratamos no Service
    }
    
    return data[0];
  }
}

module.exports = new NotificacaoRepository();
