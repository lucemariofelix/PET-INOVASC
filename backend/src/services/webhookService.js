const webhookRepository = require("../repositories/webhookRepository"); // [cite: 14]

// 🔁 Retry simples para falhas transitórias
async function retry(fn, tentativas = 3) {
  try {
    return await fn();
  } catch (err) {
    // [cite: 15]
    if (tentativas <= 1) throw err;

    console.warn(`⚠️ Retry... (${tentativas - 1} restantes)`);
    await new Promise((resolve) => setTimeout(resolve, 300)); // [cite: 16]
    return retry(fn, tentativas - 1);
  }
}

class WebhookService {
  async processarEvento(payload) {
    try {
      // Correção 3: Tratamento de eventos irrelevantes
      if (
        payload.event !== "messages.update" &&
        payload.event !== "MESSAGES_UPDATE"
      ) {
        return;
      }

      const data = Array.isArray(payload.data) ? payload.data[0] : payload.data; // [cite: 18, 19]

      const messageId = data?.key?.id; // [cite: 20]
      const statusBruto = data?.update?.status || data?.status; // [cite: 22]

      const statusComparacao = String(statusBruto).toUpperCase();
      let statusFormatado = null; // [cite: 23]

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
        statusFormatado = "LIDO"; // [cite: 24]
      }

      // Correção 1: Envio de undefined ou null evitado
      if (!messageId || !statusFormatado) {
        console.log(
          `Ignorando webhook. ID: ${messageId}, Status Bruto: ${statusBruto}`,
        );
        return;
      }

      console.log(`🔍 ${messageId} → ${statusFormatado}`); // [cite: 25]

      await retry(() =>
        webhookRepository.atualizarStatusMensagem(messageId, statusFormatado),
      ); // [cite: 26]
    } catch (error) {
      console.error("❌ Erro no service:", error); // [cite: 27]
      throw error; // [cite: 28]
    }
  }
}

module.exports = new WebhookService();
