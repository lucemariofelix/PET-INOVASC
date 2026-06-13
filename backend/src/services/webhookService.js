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
    // Log do payload completo (Pode comentar/remover quando for para produção)
    console.log("=== JSON BRUTO DA V2.3.7 ===");
    console.log(JSON.stringify(payload, null, 2));

    try {
      const eventoNormalizado = String(payload.event || "")
        .toUpperCase()
        .replace(/\./g, "_");

      if (eventoNormalizado === "MESSAGES_UPSERT") {
        this.processarMessagesUpsert(payload);
        return;
      }

      if (eventoNormalizado !== "MESSAGES_UPDATE") {
        console.log(`[WEBHOOK] Evento ignorado: "${payload.event}"`);
        return;
      }

      const itensArray = Array.isArray(payload.data)
        ? payload.data
        : [payload.data];

      for (const data of itensArray) {
        const messageId = data?.keyId;

        const statusBruto = data?.update?.status ?? data?.status;

        console.log(
          "[WEBHOOK_DIAG]",
          JSON.stringify({
            eventoOriginal: payload.event,
            eventoNormalizado,
            messageId: messageId ?? null,
            statusBruto: statusBruto ?? null,
            isFromMe: data?.fromMe ?? data?.key?.fromMe ?? null,
          }),
        );

        const statusFormatado = this.mapearStatusMensagem(statusBruto);

        if (!messageId) {
          console.warn("[WEBHOOK] Ignorado: keyId ausente", {
            statusBruto,
          });
          continue;
        }

        if (!statusFormatado) {
          console.warn("[WEBHOOK] Ignorado: status não reconhecido", {
            messageId,
            statusBruto,
          });
          continue;
        }

        console.log(`🔍 Atualizando: ${messageId} → ${statusFormatado}`);

        // Grava no Supabase
        await retry(() =>
          webhookRepository.atualizarStatusMensagem(messageId, statusFormatado),
        );
      }
    } catch (error) {
      console.error("❌ Erro no webhookService:", error);
      throw error;
    }
  }

  processarMessagesUpsert(payload) {
    const itensArray = Array.isArray(payload.data) ? payload.data : [payload.data];

    for (const data of itensArray) {
      const fromMe = data?.fromMe ?? data?.key?.fromMe ?? true;

      if (fromMe === false) {
        console.log(`[WEBHOOK] Ignorado: Mensagem recebida (fromMe: false)`);
      }
    }
  }

  mapearStatusMensagem(statusBruto) {
    const statusComparacao = String(statusBruto).toUpperCase();

    if (
      statusComparacao === "DELIVERED" ||
      statusComparacao === "SERVER_ACK" ||
      statusComparacao === "DELIVERY_ACK" ||
      statusComparacao === "RECEIVED" ||
      statusComparacao === "2" ||
      statusComparacao === "3"
    ) {
      return "ENTREGUE";
    }

    if (
      statusComparacao === "READ" ||
      statusComparacao === "VIEWED" ||
      statusComparacao === "PLAYED" ||
      statusComparacao === "4" ||
      statusComparacao === "5"
    ) {
      return "LIDO";
    }

    return null;
  }
}

module.exports = new WebhookService();
