const { supabaseAdmin } = require('../config/supabase');

class NotificacaoRepository {
  
  // Salva o registro da mensagem enviada no histórico do paciente
  async registrarEnvio(pacienteId, mensagem, status = 'ENVIADO') {
    const { data, error } = await supabaseAdmin
      .from('historico_mensagens')
      .insert([{
        paciente_id: pacienteId,
        mensagem: mensagem,
        status: status,
        data_envio: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error(`Erro ao gravar histórico para o paciente ${pacienteId}:`, error.message);
      throw error;
    }
    
    return data[0];
  }
}

module.exports = new NotificacaoRepository();
