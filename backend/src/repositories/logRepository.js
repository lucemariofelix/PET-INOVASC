const { supabaseAdmin } = require('../config/supabase');

class LogRepository {
  // Função para gravar (você vai espalhar isso pelos seus controllers depois)
  async registrar(usuario_id, acao, detalhes = '') {
    const { error } = await supabaseAdmin
      .from('logs_atividades')
      .insert([{ usuario_id, acao, detalhes }]);
      
    if (error) console.error("Erro ao gravar log de auditoria:", error.message);
  }

  // Função para o ADMIN visualizar na tela de configurações
  async listarUltimos() {
    const { data, error } = await supabaseAdmin
      .from('logs_atividades')
      // O Supabase faz o JOIN automático e traz o nome e função do usuário
      .select(`
        id,
        acao,
        detalhes,
        created_at,
        perfis_usuarios (nome, funcao)
      `)
      .order('created_at', { ascending: false })
      .limit(100); // Traz as últimas 100 ações para não pesar a tela

    if (error) throw error;
    return data;
  }
}

module.exports = new LogRepository();
