const webhookRepository = require("../repositories/webhookRepository");

class WebhookService {
  async processarEvento(payload) {
    if (payload.event === "messages.update" || payload.event === "MESSAGES_UPDATE") {
      const data = Array.isArray(payload.data) ? payload.data[0] : payload.data;

      const messageId = data?.keyId || data?.key?.id || data?.update?.key?.id;
      const statusBruto = data?.update?.status || data?.status;

      if (messageId && statusBruto) {
        // O NOSSO ESPIÃO: Vai imprimir no Render exatamente o que chega da Evolution
        console.log(`🔍 [WEBHOOK DEBUG] ID: ${messageId} | Status Bruto Recebido:`, statusBruto);

        let statusFormatado = null;
        // Transforma em string maiúscula para garantir que não falha por causa de letras minúsculas
        const statusComparacao = String(statusBruto).toUpperCase();

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

        if (statusFormatado) {
          const linhasAlteradas = await webhookRepository.atualizarStatusMensagem(messageId, statusFormatado);

          if (!linhasAlteradas || linhasAlteradas.length === 0) {
            console.warn(`⚠️ [WEBHOOK AVISO] Mensagem ID ${messageId} não encontrada ou já atualizada.`);
          } else {
            console.log(`✅ [WEBHOOK] Mensagem atualizada com sucesso para: ${statusFormatado}`);
          }
        }
      }
    }
  }
}

module.exports = new WebhookService();
