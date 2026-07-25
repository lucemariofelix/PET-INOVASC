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
        respondido_em: dataEvento,
        resposta_confirmacao: "1",
      })
      .eq("botao_id", botaoId)
      .eq("confirmacao_status", "PENDENTE")
      .select(
        "id, mensagem_id, confirmacao_status, confirmado_em, respondido_em, resposta_confirmacao",
      );

    if (error) {
      console.error("❌ Supabase erro ao registrar confirmação:", error.message);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn(`[WEBHOOK] Confirmação não alterada (${botaoId})`);
    }

    return data;
  }

  async listarConfirmacoesPendentesPorTelefone(telefone, dataEvento) {
    const { data, error } = await supabaseAdmin
      .from("historico_mensagens")
      .select(
        "id, mensagem_id, consulta_id, paciente_id, telefone_destino, confirmacao_status, confirmacao_expira_em, data_envio",
      )
      .eq("telefone_destino", telefone)
      .eq("confirmacao_status", "PENDENTE")
      .gt("confirmacao_expira_em", dataEvento)
      .lte("data_envio", dataEvento)
      .order("data_envio", { ascending: false });

    if (error) {
      console.error(
        "❌ Supabase erro ao buscar confirmações pendentes:",
        error.message,
      );
      throw error;
    }

    return data || [];
  }

  async registrarRespostaConfirmacao({
    historicoId,
    resposta,
    confirmacaoStatus,
    dataEvento,
  }) {
    const dadosAtualizacao = {
      confirmacao_status: confirmacaoStatus,
      respondido_em: dataEvento,
      resposta_confirmacao: resposta,
    };

    if (confirmacaoStatus === "CONFIRMADO") {
      dadosAtualizacao.confirmado_em = dataEvento;
    }

    const { data, error } = await supabaseAdmin
      .from("historico_mensagens")
      .update(dadosAtualizacao)
      .eq("id", historicoId)
      .eq("confirmacao_status", "PENDENTE")
      .gt("confirmacao_expira_em", dataEvento)
      .select(
        "id, mensagem_id, consulta_id, paciente_id, telefone_destino, confirmacao_status, confirmado_em, respondido_em, resposta_confirmacao",
      );

    if (error) {
      console.error(
        "❌ Supabase erro ao registrar resposta da confirmação:",
        error.message,
      );
      throw error;
    }

    return data || [];
  }
}

module.exports = new WebhookRepository();
