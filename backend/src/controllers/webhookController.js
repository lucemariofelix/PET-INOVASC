const { supabaseAdmin } = require("../config/supabase");

class WebhookController {
  async receberStatusEvolution(request, reply) {
    try {
      // =================================================================
      // CAMADA 3: SEGURANÇA DO WEBHOOK (O Cadeado da Porta dos Fundos)
      // =================================================================
      // O Fastify converte automaticamente os headers para minúsculas
      const webhookSecret = request.headers["x-evolution-secret"];

      if (webhookSecret !== process.env.EVOLUTION_WEBHOOK_SECRET) {
        console.warn(
          "⚠️ [SEGURANÇA] Tentativa de acesso não autorizado ao Webhook bloqueada.",
        );
        // Retornamos 403 (Forbidden) para barrar o invasor
        return reply.code(403).send({ erro: "Acesso negado" });
      }
      // =================================================================

      const payload = request.body;

      // Log para auditoria no Render
      console.log("🔔 [WEBHOOK] Evento recebido da Evolution:", payload.event);

      if (
        payload.event === "messages.update" ||
        payload.event === "MESSAGES_UPDATE"
      ) {
        // A Evolution pode mandar em formato de objeto único ou array, essa lógica cobre os dois
        const data = Array.isArray(payload.data)
          ? payload.data[0]
          : payload.data;

        // CORREÇÃO 1: Cobre as duas formas como a Evolution v1 e v2 enviam o ID do WhatsApp
        const remoteJid = data?.key?.remoteJid || data?.remoteJid;
        const telefone = remoteJid
          ? remoteJid.replace("@s.whatsapp.net", "")
          : null;

        // CORREÇÃO 2: Cobre as duas formas como a Evolution pode enviar o Status
        const statusBruto = data?.update?.status || data?.status;

        // O LOG ESPIÃO: Vai nos mostrar exatamente o que a AWS está enviando
        console.log(
          `[DEBUG] Telefone: ${telefone} | Status recebido: ${statusBruto}`,
        );

        if (telefone && statusBruto) {
          let statusFormatado = null;

          // CORREÇÃO 3: Compatibilidade Universal (Números da v1 e Textos da v2)
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
            // Atualiza o histórico de mensagens desse paciente que ainda estava como "ENVIADO" ou "ENTREGUE"
            // Retiramos o 55 e o DDD para garantir a busca parcial do número
            const numeroLimpo = telefone.substring(2);

            const { error } = await supabaseAdmin
              .from("historico_mensagens")
              .update({ status: statusFormatado })
              .like("telefone_destino", `%${numeroLimpo}%`)
              .in("status", ["ENVIADO", "ENTREGUE", "SIMULADO"]); // Adicionado SIMULADO por segurança nos testes

            if (error) {
              console.error(
                "[WEBHOOK ERRO] Falha ao atualizar Supabase:",
                error.message,
              );
            } else {
              console.log(
                `✅ [WEBHOOK] Status atualizado para ${statusFormatado} (Tel: ${telefone})`,
              );
            }
          }
        }
      }

      // Regra de Ouro: Devolver 200 OK imediatamente para a Evolution não bloquear a fila
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
