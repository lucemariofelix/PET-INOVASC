const { supabaseAdmin } = require("../config/supabase");

class WebhookController {
  async receberStatusEvolution(request, reply) {
    try {
      // =================================================================
      // CAMADA 3: SEGURANÇA DO WEBHOOK (O Cadeado da Porta dos Fundos)
      // =================================================================
      const webhookSecret = request.headers["x-evolution-secret"];

      if (webhookSecret !== process.env.EVOLUTION_WEBHOOK_SECRET) {
        console.warn(
          "⚠️ [SEGURANÇA] Tentativa de acesso não autorizado ao Webhook bloqueada.",
        );
        return reply.code(403).send({ erro: "Acesso negado" });
      }
      // =================================================================

      const payload = request.body;

      if (
        payload.event === "messages.update" ||
        payload.event === "MESSAGES_UPDATE"
      ) {
        const data = Array.isArray(payload.data)
          ? payload.data[0]
          : payload.data;

        // ESPIÃO SUPREMO: Imprime o pacote cru para vermos exatamente onde o ID está escondido!
        console.log("🕵️ [RAW DATA]:", JSON.stringify(data));

        // TÉCNICA DE OURO APRIMORADA: Rede que apanha o ID em qualquer versão da Evolution API
        const messageId =
          data?.key?.id || data?.id || data?.messageId || data?.update?.key?.id;
        const statusBruto = data?.update?.status || data?.status;

        console.log(`[DEBUG] MsgID: ${messageId} | Status: ${statusBruto}`);

        if (messageId && statusBruto) {
          let statusFormatado = null;

          if (
            statusBruto === 2 ||
            statusBruto === "DELIVERY_ACK" ||
            statusBruto === "RECEIVED"
          ) {
            statusFormatado = "ENTREGUE";
          }
          if (
            statusBruto === 3 ||
            statusBruto === 4 ||
            statusBruto === "READ" ||
            statusBruto === "PLAYED"
          ) {
            statusFormatado = "LIDO";
          }

          if (statusFormatado) {
            const { data: linhasAlteradas, error } = await supabaseAdmin
              .from("historico_mensagens")
              .update({ status: statusFormatado })
              .eq("mensagem_id", messageId)
              .in("status", ["ENVIADO", "ENTREGUE", "SIMULADO"])
              .select();

            if (error) {
              console.error("❌ [WEBHOOK ERRO] Falha Supabase:", error.message);
            } else if (!linhasAlteradas || linhasAlteradas.length === 0) {
              console.warn(
                `⚠️ [WEBHOOK AVISO] Mensagem ID ${messageId} não encontrada na BD.`,
              );
            } else {
              console.log(
                `✅ [WEBHOOK] Mensagem ${messageId} atualizada com sucesso para: ${statusFormatado}`,
              );
            }
          }
        }
      }

      // Regra de Ouro: Devolver 200 OK imediatamente para a Evolution
      return reply.code(200).send({ recebido: true });
    } catch (error) {
      request.log.error(error);
      return reply
        .code(500)
        .send({ erro: "Falha interna no processamento do webhook" });
    }
  }
}

module.exports = new WebhookController();
