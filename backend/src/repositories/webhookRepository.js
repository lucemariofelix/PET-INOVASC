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
      console.error("❌ Supabase erro:", error.message); // [cite: 10]
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn("[WEBHOOK_DIAG] Nenhuma linha atualizada para messageId", {
        messageId,
        coluna_busca: "mensagem_id",
        statusFormatado,
      }); // [cite: 11]
    } else {
      console.log(`✅ Atualizado para: ${statusFormatado}`); // [cite: 12]
    }

    return data; // [cite: 13]
  }
}

module.exports = new WebhookRepository();
