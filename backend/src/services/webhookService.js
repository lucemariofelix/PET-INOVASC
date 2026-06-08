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
      // BUG D CORRIGIDO: Normaliza o evento para maiúsculas e substitui "."
      // por "_" antes de comparar, cobrindo todas as variações que a
      // Evolution API pode enviar: "messages.update", "MESSAGES.UPDATE",
      // "MESSAGES_UPDATE", etc.
      const eventoNormalizado = String(payload.event || "")
        .toUpperCase()
        .replace(/\./g, "_");

      if (eventoNormalizado !== "MESSAGES_UPDATE") {
        console.log(`[WEBHOOK] Evento ignorado: "${payload.event}"`);
        return;
      }

      const data = Array.isArray(payload.data) ? payload.data[0] : payload.data;

      const messageId = data?.key?.id;
      const statusBruto = data?.update?.status ?? data?.status;

      // Log de diagnóstico — remover após confirmar funcionamento em produção
      console.log("[WEBHOOK_DIAG]", JSON.stringify({
        eventoOriginal: payload.event,
        eventoNormalizado,
        messageId: messageId ?? null,
        statusBruto: statusBruto ?? null,
        dataIsArray: Array.isArray(payload.data),
        temKeyId: !!data?.key?.id,
        temUpdateStatus: !!data?.update?.status,
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

      if (!messageId) {
        console.warn("[WEBHOOK] Ignorado: messageId ausente", { statusBruto });
        return;
      }

      if (!statusFormatado) {
        console.warn("[WEBHOOK] Ignorado: status não reconhecido", {
          messageId,
          statusBruto,
        });
        return;
      }

      console.log(`🔍 ${messageId} → ${statusFormatado}`);

      await retry(() =>
        webhookRepository.atualizarStatusMensagem(messageId, statusFormatado),
      );
    } catch (error) {
      console.error("❌ Erro no webhookService:", error);
      throw error;
    }
  }
}

module.exports = new WebhookService();
