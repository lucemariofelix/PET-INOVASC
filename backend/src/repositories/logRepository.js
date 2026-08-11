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
  async listarUltimos(pagina = 1, limite = 5) {
    const inicio = (pagina - 1) * limite;
    const fim = inicio + limite - 1;
    const { data, error, count } = await supabaseAdmin
      .from('logs_atividades')
      // O Supabase faz o JOIN automático e traz o nome e função do usuário
      .select(`
        id,
        acao,
        detalhes,
        created_at,
        perfis_usuarios (nome, funcao)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(inicio, fim);

    if (error) throw error;
    const total = count || 0;
    return {
      logs: data || [],
      paginacao: {
        pagina,
        limite,
        total,
        total_paginas: Math.ceil(total / limite),
      },
    };
  }
}

module.exports = new LogRepository();
