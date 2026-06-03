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
      if (
        payload.event !== "messages.update" &&
        payload.event !== "MESSAGES_UPDATE"
      ) return;

      const data = Array.isArray(payload.data)
        ? payload.data[0]
        : payload.data;

      // 🔥 PADRÃO CONFIÁVEL
      const messageId = data?.key?.id;

      if (!messageId) {
        console.warn("⚠️ messageId não encontrado");
        return;
      }

      const statusBruto = data?.update?.status || data?.status;

      if (!statusBruto) return;

      const statusComparacao = String(statusBruto).toUpperCase();

      let statusFormatado = null;

      if (
        statusComparacao === "2" ||
        statusComparacao === "DELIVERY_ACK" ||
        statusComparacao === "RECEIVED"
      ) {
        statusFormatado = "ENTREGUE";
      }

      if (
        statusComparacao === "3" ||
        statusComparacao === "4" ||
        statusComparacao === "READ" ||
        statusComparacao === "PLAYED"
      ) {
        statusFormatado = "LIDO";
      }

      if (!statusFormatado) return;

      console.log(`🔍 ${messageId} → ${statusFormatado}`);

      // 🔥 Retry aplicado aqui
      await retry(() =>
        webhookRepository.atualizarStatusMensagem(
          messageId,
          statusFormatado
        )
      );

    } catch (error) {
      console.error("❌ Erro no service:", error);
      throw error;
    }
  }
}

module.exports = new WebhookService();
