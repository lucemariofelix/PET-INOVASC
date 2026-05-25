const { getSupabaseUsuario } = require('../config/supabase');

class MensagemRepository {
  
  // O authHeader é obrigatório para o Supabase (RLS) saber quem está salvando
  async salvarHistorico(dadosHistorico, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from('historico_mensagens')
      .insert([dadosHistorico])
      .select(); 

    if (error) {
      console.error('Erro ao salvar histórico de mensagem no Supabase:', error);
      throw error;
    }
    
    return data[0]; 
  }

}

module.exports = new MensagemRepository();
