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
      const evento = payload.event;

      console.log("[WEBHOOK_DIAG] Evento recebido:", evento);

      // Correção 3: Tratamento de eventos irrelevantes
      if (
        evento !== "messages.update" &&
        evento !== "MESSAGES_UPDATE"
      ) {
        console.warn("[WEBHOOK_DIAG] Evento ignorado: tipo não monitorado", {
          event: evento,
        });
        return;
      }

      const dataComoArray = Array.isArray(payload.data);
      const tipoData = dataComoArray
        ? "array"
        : payload.data && typeof payload.data === "object"
          ? "object"
          : typeof payload.data;

      console.log("[WEBHOOK_DIAG] Formato de data recebido:", tipoData);

      const data = Array.isArray(payload.data) ? payload.data[0] : payload.data; // [cite: 18, 19]

      const messageId = data?.key?.id; // [cite: 20]
      const statusBruto = data?.update?.status || data?.status; // [cite: 22]

      console.log("[WEBHOOK_DIAG] messageId extraído do payload:", {
        messageId: messageId || null,
      });

      console.log("[WEBHOOK_DIAG] Campos extraídos:", {
        messageId: messageId || null,
        statusBruto: statusBruto ?? null,
      });

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

      console.log("[WEBHOOK_DIAG] Status processado:", {
        statusBruto: statusBruto ?? null,
        statusNormalizado: statusComparacao,
        statusMapeado: statusFormatado,
      });

      // Correção 1: Envio de undefined ou null evitado
      if (!messageId) {
        console.warn("[WEBHOOK_DIAG] Webhook ignorado: messageId ausente", {
          statusBruto: statusBruto ?? null,
          statusNormalizado: statusComparacao,
        });
        return;
      }

      if (!statusFormatado) {
        console.warn("[WEBHOOK_DIAG] Webhook ignorado: status não reconhecido", {
          messageId,
          statusBruto: statusBruto ?? null,
          statusNormalizado: statusComparacao,
        });
        return;
      }

      console.log(`🔍 ${messageId} → ${statusFormatado}`); // [cite: 25]
      console.log("[WEBHOOK_DIAG] Chamando atualizarStatusMensagem:", {
        messageId,
        statusFormatado,
      });

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
