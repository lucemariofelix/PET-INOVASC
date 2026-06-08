const webhookRepository = require("../repositories/webhookRepository");

// 🔁 Retry simples para falhas transitórias
async function retry(fn, tentativas = 3) {
  try {
    return await fn();
  } catch (err) {
    if (tentativas <= 1) throw err;

    console.warn(`⚠️ Retry... (${tentativas - 1} restantes)`);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return retry(fn, tentativas - 1);
  }
}

class WebhookService {
  async processarEvento(payload) {
    try {
      // CORREÇÃO 1: Normaliza o evento para maiúsculas antes de comparar,
      // evitando falhas com variações como "messages.update", "MESSAGES.UPDATE",
      // "MESSAGES_UPDATE" etc. enviadas pela Evolution API.
      const evento = String(payload.event || "").toUpperCase().replace(".", "_");

      if (evento !== "MESSAGES_UPDATE") {
        return;
      }

      const data = Array.isArray(payload.data) ? payload.data[0] : payload.data;

      const messageId = data?.key?.id;
      const statusBruto = data?.update?.status ?? data?.status;

      // LOG DE DIAGNÓSTICO — remover após confirmar funcionamento em produção
      console.log("[WEBHOOK_DIAG]", JSON.stringify({
        eventoOriginal: payload.event,
        eventoNormalizado: evento,
        messageId,
        statusBruto,
        dataIsArray: Array.isArray(payload.data),
        temKeyId: !!data?.key?.id,
        temUpdateStatus: !!data?.update?.status,
        temStatusRaiz: !!data?.status,
      }));

      const statusComparacao = String(statusBruto).toUpperCase();
      let statusFormatado = null;

      if (
        statusComparacao === "2" ||
        statusComparacao === "DELIVERY_ACK" ||
        statusComparacao === "RECEIVED"
      ) {
        statusFormatado = "ENTREGUE";
      } else if (
        statusComparacao === "3" ||
        statusComparacao === "4" ||
        statusComparacao === "READ" ||
        statusComparacao === "PLAYED"
      ) {
        statusFormatado = "LIDO";
      }

      if (!messageId || !statusFormatado) {
        console.log(
          `Ignorando webhook. ID: ${messageId}, Status Bruto: ${statusBruto}`,
        );
        return;
      }

      console.log(`🔍 ${messageId} → ${statusFormatado}`);

      await retry(() =>
        webhookRepository.atualizarStatusMensagem(messageId, statusFormatado),
      );
    } catch (error) {
      console.error("❌ Erro no service:", error);
      throw error;
    }
  }
}

module.exports = new WebhookService();
