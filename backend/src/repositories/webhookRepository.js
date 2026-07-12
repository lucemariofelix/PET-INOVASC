const { supabaseAdmin } = require("../config/supabase"); // [cite: 7]

class WebhookRepository {
  async atualizarStatusMensagem(messageId, statusFormatado) {
    let query = supabaseAdmin
      .from("historico_mensagens")
      .update({ status: statusFormatado })
      .eq("mensagem_id", messageId);

    // 🔥 REGRA MONOTÔNICA
    if (statusFormatado !== "LIDO") {
      // [cite: 8]
      query = query.neq("status", "LIDO");
    }

    const { data, error } = await query.select(); // [cite: 9]

    if (error) {
      console.error("❌ Supabase erro:", error.message);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn(`⚠️ Nenhuma linha atualizada (${messageId})`); // [cite: 11]
    } else {
      console.log(`✅ Atualizado para: ${statusFormatado}`); // [cite: 12]
    }

    return data;
  }

  async registrarConfirmacaoMensagem(botaoId) {
    const { data, error } = await supabaseAdmin
      .from("historico_mensagens")
      .update({
        confirmacao_status: "CONFIRMADO",
        confirmado_em: new Date().toISOString(),
      })
      .eq("botao_id", botaoId)
      .select();

    if (error) {
      console.error("❌ Supabase erro ao registrar confirmação:", error.message);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn(`⚠️ Nenhuma confirmação atualizada (${botaoId})`);
    }

    return data;
  }
}

module.exports = new WebhookRepository();
