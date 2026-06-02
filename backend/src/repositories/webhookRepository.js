const { supabaseAdmin } = require("../config/supabase");

class WebhookRepository {
  async atualizarStatusMensagem(messageId, statusFormatado) {
    const { data: linhasAlteradas, error } = await supabaseAdmin
      .from("historico_mensagens")
      .update({ status: statusFormatado })
      .eq("mensagem_id", messageId)
      .in("status", ["ENVIADO", "ENTREGUE", "SIMULADO"])
      .select();

    if (error) {
      console.error("❌ [WEBHOOK ERRO] Falha Supabase:", error.message);
      throw error;
    }

    return linhasAlteradas;
  }
}

module.exports = new WebhookRepository();
