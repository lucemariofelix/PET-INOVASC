const { supabaseAdmin } = require("../config/supabase");

// Hierarquia de status: um status só pode avançar, nunca regredir.
// ENVIADO(1) → ENTREGUE(2) → LIDO(3)
const STATUS_ORDEM = {
  ENVIADO: 1,
  ENTREGUE: 2,
  LIDO: 3,
};

class WebhookRepository {
  async atualizarStatusMensagem(messageId, statusFormatado) {
    const ordemNovoStatus = STATUS_ORDEM[statusFormatado];

    if (!ordemNovoStatus) {
      console.warn(`⚠️ Status desconhecido recebido: ${statusFormatado}`);
      return null;
    }

    // CORREÇÃO 2: Regra monotônica correta.
    // A query anterior estava invertida: só bloqueava regressão quando
    // o novo status NÃO era LIDO, permitindo que ENTREGUE sobrescrevesse LIDO.
    // Agora: só atualiza se o status atual no banco for de ordem menor
    // que o novo status, garantindo que o status sempre avance.
    let query = supabaseAdmin
      .from("historico_mensagens")
      .update({ status: statusFormatado })
      .eq("mensagem_id", messageId)
      .lt("status_ordem", ordemNovoStatus); // status_ordem < ordem do novo status

    const { data, error } = await query.select();

    if (error) {
      console.error("❌ Supabase erro:", error.message);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn(
        `⚠️ Nenhuma linha atualizada para ${messageId} → ${statusFormatado} ` +
        `(provável regressão bloqueada ou ID não encontrado)`,
      );
    } else {
      console.log(`✅ Atualizado para: ${statusFormatado}`);
    }

    return data;
  }
}

module.exports = new WebhookRepository();
