const { supabaseAdmin } = require("../config/supabase");

const STATUS_ORDEM = {
  ENVIADO: 1,
  SIMULADO: 1,
  ERRO: 1,
  ENTREGUE: 2,
  LIDO: 3,
};

class WebhookRepository {
  async atualizarStatusMensagem(messageId, statusFormatado) {
    const ordemNovoStatus = STATUS_ORDEM[statusFormatado];

    if (!ordemNovoStatus) {
      console.warn(`[WEBHOOK] Status desconhecido: "${statusFormatado}"`);
      return null;
    }

    // BUG E CORRIGIDO: A lógica anterior estava invertida.
    // O filtro ".neq('status', 'LIDO')" só era aplicado quando o novo
    // status NÃO era LIDO — ou seja, permitia ENTREGUE sobrescrever LIDO.
    //
    // Agora usamos a coluna numérica `status_ordem` para garantir que
    // o status só avança: só atualiza se o valor atual for MENOR
    // que o novo valor (ex: ENVIADO=1 < ENTREGUE=2 ✅, LIDO=3 < ENTREGUE=2 ❌).
    const { data, error } = await supabaseAdmin
      .from("historico_mensagens")
      .update({
        status: statusFormatado,
        status_ordem: ordemNovoStatus,
      })
      .eq("mensagem_id", messageId)
      .lt("status_ordem", ordemNovoStatus) // só avança, nunca regride
      .select();

    if (error) {
      console.error("❌ Supabase erro:", error.message);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn(
        `[WEBHOOK] Nenhuma linha atualizada para mensagem_id="${messageId}" → "${statusFormatado}". ` +
        `Provável regressão de status bloqueada, ID não encontrado, ou mensagem_id null.`,
      );
    } else {
      console.log(`✅ Status atualizado: "${messageId}" → "${statusFormatado}"`);
    }

    return data;
  }
}

module.exports = new WebhookRepository();
