const { supabaseAdmin } = require("../config/supabase");

class WebhookRepository {
  async atualizarStatusMensagem(messageId, statusFormatado) {
    let query = supabaseAdmin
      .from("historico_mensagens")
      .update({ status: statusFormatado })
      .eq("mensagem_id", messageId);

    // 🔥 REGRA MONOTÔNICA
    if (statusFormatado !== "LIDO") {
      query = query.neq("status", "LIDO");
    }

    const { data, error } = await query.select();

    if (error) {
      console.error("❌ Supabase erro:", error.message);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn(`⚠️ Nenhuma linha atualizada (${messageId})`);
    } else {
      console.log(`✅ Atualizado para: ${statusFormatado}`);
    }

    return data;
  }
}

module.exports = new WebhookRepository();
