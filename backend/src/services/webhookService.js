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
      // BUG D CORRIGIDO: Normaliza o evento para maiúsculas e substitui "." por "_"
      const eventoNormalizado = String(payload.event || "")
        .toUpperCase()
        .replace(/\./g, "_");

      if (eventoNormalizado !== "MESSAGES_UPDATE") {
        console.log(`[WEBHOOK] Evento ignorado: "${payload.event}"`);
        return;
      }

      // O PULO DO GATO: Garantimos que iteramos sobre todos os itens agrupados pela AWS
      const itensArray = Array.isArray(payload.data)
        ? payload.data
        : [payload.data];

      for (const data of itensArray) {
        // IGNORA ECOS/RECEBIDAS: Mensagens de pacientes não precisam de status de leitura no envio
        const fromMe = data?.fromMe ?? data?.key?.fromMe ?? true;
        if (fromMe === false) {
          console.log(`[WEBHOOK] Ignorado: Mensagem recebida (fromMe: false)`);
          continue; // Pula para a próxima iteração do loop sem travar o restante
        }

        // A extração do ID à prova de balas para a v2.3.7 (messageId da Evolution no final)
        const messageId =
          data?.keyId ||
          data?.key?.id ||
          data?.id ||
          data?.message?.key?.id ||
          data?.message?.id ||
          data?.messageId;

        const statusBruto = data?.update?.status ?? data?.status;

        // Log de diagnóstico individual por item processado
        console.log(
          "[WEBHOOK_DIAG]",
          JSON.stringify({
            eventoOriginal: payload.event,
            eventoNormalizado,
            messageId: messageId ?? null,
            statusBruto: statusBruto ?? null,
            isFromMe: fromMe,
          }),
        );

        const statusComparacao = String(statusBruto).toUpperCase();
        let statusFormatado = null;

        // Adicionado SERVER_ACK e o número 3 para cobrir todas as variações de "Entregue"
        if (
          statusComparacao === "SERVER_ACK" ||
          statusComparacao === "DELIVERY_ACK" ||
          statusComparacao === "RECEIVED" ||
          statusComparacao === "2" ||
          statusComparacao === "3"
        ) {
          statusFormatado = "ENTREGUE";
        } else if (
          statusComparacao === "READ" ||
          statusComparacao === "PLAYED" ||
          statusComparacao === "4" ||
          statusComparacao === "5"
        ) {
          statusFormatado = "LIDO";
        }

        if (!messageId) {
          console.warn("[WEBHOOK] Ignorado: messageId ausente", {
            statusBruto,
          });
          continue; // Usa continue para não matar o array inteiro
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
}

module.exports = new WebhookService();
