const { getSupabaseUsuario } = require("../config/supabase");

const CAMPOS_STATUS_MENSAGEM = `
  id,
  mensagem_id,
  consulta_id,
  paciente_id,
  status,
  status_ordem,
  data_envio,
  status_atualizado_em,
  entregue_em,
  lido_em,
  confirmacao_status,
  confirmado_em,
  confirmacao_expira_em,
  respondido_em,
  resposta_confirmacao,
  botao_id,
  tipo_mensagem
`;

class MensagemRepository {
  // O authHeader é obrigatório para o Supabase (RLS) saber quem está salvando
  async salvarHistorico(dadosHistorico, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from("historico_mensagens")
      .insert([dadosHistorico])
      .select(CAMPOS_STATUS_MENSAGEM)
      .single();

    if (error) {
      console.error("Erro ao salvar histórico de mensagem no Supabase:", error);
      throw error;
    }

    return data;
  }

  async listarUltimasPorConsultas(consultaIds, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from("historico_mensagens")
      .select(CAMPOS_STATUS_MENSAGEM)
      .in("consulta_id", consultaIds)
      .order("data_envio", { ascending: false });

    if (error) throw error;

    const consultasEncontradas = new Set();
    return (data || []).filter((mensagem) => {
      if (consultasEncontradas.has(mensagem.consulta_id)) return false;
      consultasEncontradas.add(mensagem.consulta_id);
      return true;
    });
  }
}

module.exports = new MensagemRepository();
module.exports.CAMPOS_STATUS_MENSAGEM = CAMPOS_STATUS_MENSAGEM;
