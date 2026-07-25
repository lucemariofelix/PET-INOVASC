const { supabaseAdmin } = require("../config/supabase"); // [cite: 7]

class WebhookRepository {
  async atualizarStatusMensagem(messageId, atualizacao) {
    const dadosAtualizacao = {
      status: atualizacao.status,
      status_ordem: atualizacao.ordem,
      status_atualizado_em: atualizacao.dataEvento,
    };

    if (atualizacao.status === "ENTREGUE") {
      dadosAtualizacao.entregue_em = atualizacao.dataEvento;
    }

    if (atualizacao.status === "LIDO") {
      dadosAtualizacao.lido_em = atualizacao.dataEvento;
    }

    const query = supabaseAdmin
      .from("historico_mensagens")
      .update(dadosAtualizacao)
      .eq("mensagem_id", messageId)
      .lt("status_ordem", atualizacao.ordem);

    const { data, error } = await query.select("id, mensagem_id, status");

    if (error) {
      console.error("❌ Supabase erro:", error.message);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn(`[WEBHOOK] Status não alterado (${messageId})`);
    } else {
      console.log(`[WEBHOOK] Status atualizado para ${atualizacao.status}`);
    }

    return data;
  }

  async registrarConfirmacaoMensagem(botaoId, dataEvento) {
    const { data, error } = await supabaseAdmin
      .from("historico_mensagens")
      .update({
        confirmacao_status: "CONFIRMADO",
        confirmado_em: dataEvento,
      })
      .eq("botao_id", botaoId)
      .eq("confirmacao_status", "PENDENTE")
      .select("id, mensagem_id, confirmacao_status, confirmado_em");

    if (error) {
      console.error("❌ Supabase erro ao registrar confirmação:", error.message);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn(`[WEBHOOK] Confirmação não alterada (${botaoId})`);
    }

    return data;
  }
}

module.exports = new WebhookRepository();
